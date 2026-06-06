import os
import json
import random
import psycopg2
from dotenv import load_dotenv
from deltalake import DeltaTable
from google import genai

# Load environment variables
load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://lakehouse_user:lakehouse_password@localhost:5432/lakehouse_db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip('/')
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL")
LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
SILVER_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "silver", "tickets_enriched")

EMBEDDING_DIM = 768  # Standard size for Gemini's text-embedding-004 model

def get_embedding(client, text: str) -> list[float]:
    # 1. Try local Ollama if configured
    if OLLAMA_EMBED_MODEL:
        try:
            import httpx
            # Query Ollama embeddings API (/api/embeddings)
            response = httpx.post(
                f"{OLLAMA_HOST}/api/embeddings",
                json={
                    "model": OLLAMA_EMBED_MODEL,
                    "prompt": text
                },
                timeout=10.0
            )
            if response.status_code == 200:
                vector = response.json().get("embedding")
                if vector:
                    # Pad or truncate to match expected EMBEDDING_DIM (768)
                    if len(vector) < EMBEDDING_DIM:
                        vector = vector + [0.0] * (EMBEDDING_DIM - len(vector))
                    elif len(vector) > EMBEDDING_DIM:
                        vector = vector[:EMBEDDING_DIM]
                    return vector
            else:
                # Try fallback /api/embed (newer Ollama API endpoint)
                response = httpx.post(
                    f"{OLLAMA_HOST}/api/embed",
                    json={
                        "model": OLLAMA_EMBED_MODEL,
                        "input": text
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    vectors = response.json().get("embeddings")
                    if vectors and len(vectors) > 0:
                        vector = vectors[0]
                        if len(vector) < EMBEDDING_DIM:
                            vector = vector + [0.0] * (EMBEDDING_DIM - len(vector))
                        elif len(vector) > EMBEDDING_DIM:
                            vector = vector[:EMBEDDING_DIM]
                        return vector
        except Exception as e:
            print(f"Error generating embedding via Ollama: {e}. Falling back to other providers.")

    # 2. Try Gemini API
    if client and GEMINI_API_KEY:
        try:
            # Generate embedding using Gemini API
            response = client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"Error generating embedding via Gemini API: {e}. Falling back to mock embedding.")
            
    # 3. Mock embedding fallback (random float array of size 768)
    # Using a deterministic seed based on text length + first chars to keep it slightly stable
    random.seed(len(text) + sum(ord(c) for c in text[:10]))
    return [random.uniform(-1.0, 1.0) for _ in range(EMBEDDING_DIM)]

def run():
    print("Starting Gold Vector Sync Pipeline (pgvector synchronization)...")
    
    # 1. Check if Silver Table exists
    if not os.path.exists(SILVER_TICKETS_PATH):
        print("Silver tickets table does not exist. Run Silver Enrichment first.")
        return
        
    silver_table = DeltaTable(SILVER_TICKETS_PATH)
    silver_df = silver_table.to_pandas()
    
    if silver_df.empty:
        print("Silver table is empty. Nothing to sync.")
        return

    # Initialize Gemini client if API key is present
    client = None
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        print("No GEMINI_API_KEY found. Generating mock vectors for local testing...")

    # 2. Connect to PostgreSQL
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 3. Enable pgvector extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()
        
        # 4. Create vector table if not exists
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS enriched_tickets_vectors (
                ticket_id VARCHAR(50) PRIMARY KEY,
                user_id INT,
                subject VARCHAR(255),
                description TEXT,
                category VARCHAR(50),
                sentiment VARCHAR(50),
                embedding vector({EMBEDDING_DIM}),
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        
        print("PostgreSQL tables and pgvector extension initialized.")
        
        # 5. Fetch already synced ticket IDs to avoid duplicate API calls and inserts
        cur.execute("SELECT ticket_id FROM enriched_tickets_vectors;")
        synced_ids = set(row[0] for row in cur.fetchall())
        
        tickets_to_sync = silver_df[~silver_df["ticket_id"].isin(synced_ids)]
        
        if tickets_to_sync.empty:
            print("No new tickets to sync to Vector Database.")
            return
            
        print(f"Syncing {len(tickets_to_sync)} new tickets to pgvector database...")
        
        for _, row in tickets_to_sync.iterrows():
            ticket_id = row["ticket_id"]
            user_id = int(row["user_id"])
            subject = row["subject"]
            description = row["description"]
            category = row["inferred_category"]
            sentiment = row["sentiment"]
            
            # Combine subject and description for embedding representation
            text_to_embed = f"Subject: {subject}\nDescription: {description}"
            
            # Generate embedding
            embedding = get_embedding(client, text_to_embed)
            
            # Upsert into PostgreSQL
            cur.execute("""
                INSERT INTO enriched_tickets_vectors 
                (ticket_id, user_id, subject, description, category, sentiment, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ticket_id) 
                DO UPDATE SET 
                    category = EXCLUDED.category,
                    sentiment = EXCLUDED.sentiment,
                    embedding = EXCLUDED.embedding,
                    synced_at = CURRENT_TIMESTAMP;
            """, (ticket_id, user_id, subject, description, category, sentiment, embedding))
            
        conn.commit()
        print(f"Successfully synced {len(tickets_to_sync)} vectors.")
        
    except Exception as e:
        print(f"Error during pgvector sync: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run()
