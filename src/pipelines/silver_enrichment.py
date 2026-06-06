import os
import json
import asyncio
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from deltalake import DeltaTable
from deltalake.writer import write_deltalake
from google import genai
from google.genai import types

# Load environment variables
load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip('/')
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL")
LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
BRONZE_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "bronze", "tickets")
SILVER_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "silver", "tickets_enriched")

# Define structured output schema for Gemini
class TicketAnalysis(BaseModel):
    sentiment: str = Field(description="Sentiment of the text. Must be one of: Positive, Negative, Neutral")
    category: str = Field(description="Primary category of the issue. Must be one of: Billing, Technical, Product Feedback, Delivery, Unknown")
    language: str = Field(description="Language of the customer ticket (e.g., Turkish, English)")
    summary_tr: str = Field(description="A concise 1-sentence summary of the user issue in Turkish")
    extracted_entities: list[str] = Field(description="Extracted key entities like order numbers, refund amounts, specific product names, error names, etc.")

# Fallback Mock LLM Analyzer when no API key is present
def mock_analyze_ticket(description: str) -> dict:
    desc_lower = description.lower()
    
    # Simple rule-based heuristics to simulate AI
    if any(word in desc_lower for word in ["iade", "para", "çekim", "fatura", "ücret"]):
        category = "Billing"
        sentiment = "Negative"
        entities = ["Refund Request"]
    elif any(word in desc_lower for word in ["çöküyor", "hata", "ekran", "şifre", "giriş", "buton"]):
        category = "Technical"
        sentiment = "Negative"
        entities = ["App Bug"]
    elif any(word in desc_lower for word in ["kargo", "gecikme", "kutu", "paket", "teslim"]):
        category = "Delivery"
        sentiment = "Negative"
        entities = ["Delivery Delay"]
    elif any(word in desc_lower for word in ["harika", "memnun", "güzel", "teşekkür"]):
        category = "Product Feedback"
        sentiment = "Positive"
        entities = ["Satisfied Customer"]
    else:
        category = "Unknown"
        sentiment = "Neutral"
        entities = []
        
    if "sipariş no:" in desc_lower:
        # Extract a mock order number
        idx = desc_lower.find("sipariş no:")
        order_num = description[idx + 11:idx + 17].strip()
        entities.append(f"Order #{order_num}")

    return {
        "sentiment": sentiment,
        "category": category,
        "language": "Turkish",
        "summary_tr": f"Müşteri şikayeti/geribildirimi: {description[:50]}...",
        "extracted_entities": entities
    }

async def analyze_ticket_with_gemini(client, description: str, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        prompt = f"""
        Analyze the following customer support ticket and extract structured information.
        
        Ticket Description:
        "{description}"
        """
        try:
            # Call Gemini 2.5 Flash Async API with Structured Output schema
            response = await client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=TicketAnalysis,
                    temperature=0.1
                ),
            )
            # Parse the JSON response
            return json.loads(response.text)
        except Exception as e:
            print(f"Error calling Gemini API: {e}. Falling back to mock analyzer.")
            return mock_analyze_ticket(description)

async def analyze_ticket_with_ollama(description: str, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        prompt = f"""
        Analyze the following customer support ticket and extract structured information.
        
        Ticket Description:
        "{description}"
        """
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_HOST}/api/chat",
                    json={
                        "model": OLLAMA_LLM_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False,
                        "format": {
                            "type": "object",
                            "properties": {
                                "sentiment": {"type": "string", "enum": ["Positive", "Negative", "Neutral"]},
                                "category": {"type": "string", "enum": ["Billing", "Technical", "Product Feedback", "Delivery", "Unknown"]},
                                "language": {"type": "string"},
                                "summary_tr": {"type": "string"},
                                "extracted_entities": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            },
                            "required": ["sentiment", "category", "language", "summary_tr", "extracted_entities"]
                        }
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    res_data = response.json()
                    content = res_data["message"]["content"]
                    
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        import re
                        match = re.search(r"\{.*\}", content, re.DOTALL)
                        if match:
                            return json.loads(match.group(0))
                        raise
                else:
                    raise Exception(f"Ollama API returned status code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error calling Ollama API: {e}. Falling back to mock analyzer.")
            return mock_analyze_ticket(description)

async def enrich_batch(tickets_to_enrich, api_key):
    # Concurrency limit (Semaphore)
    sem = asyncio.Semaphore(5)
    
    if OLLAMA_LLM_MODEL:
        print(f"Using local Ollama Model '{OLLAMA_LLM_MODEL}' at {OLLAMA_HOST} for enrichment...")
        tasks = [
            analyze_ticket_with_ollama(row["description"], sem)
            for _, row in tickets_to_enrich.iterrows()
        ]
        results = await asyncio.gather(*tasks)
    elif api_key:
        print("Using Google Gemini 2.5 Flash API for enrichment...")
        client = genai.Client(api_key=api_key)
        tasks = [
            analyze_ticket_with_gemini(client, row["description"], sem)
            for _, row in tickets_to_enrich.iterrows()
        ]
        results = await asyncio.gather(*tasks)
    else:
        print("Neither Ollama LLM nor Gemini API Key configured. Running in Mock LLM Mode...")
        results = [mock_analyze_ticket(row["description"]) for _, row in tickets_to_enrich.iterrows()]
        
    return results

def run():
    print("Starting Silver Enrichment Pipeline...")
    
    # 1. Read Bronze Tickets Delta Table
    if not os.path.exists(BRONZE_TICKETS_PATH):
        print("Bronze tickets table does not exist. Run Bronze ingestion first.")
        return
        
    bronze_table = DeltaTable(BRONZE_TICKETS_PATH)
    bronze_df = bronze_table.to_pandas()
    
    if bronze_df.empty:
        print("Bronze tickets table is empty.")
        return
        
    # 2. Read Silver Tickets Delta Table (if it exists) to find new tickets
    processed_ids = set()
    if os.path.exists(SILVER_TICKETS_PATH):
        try:
            silver_table = DeltaTable(SILVER_TICKETS_PATH)
            silver_df = silver_table.to_pandas()
            if not silver_df.empty:
                processed_ids = set(silver_df["ticket_id"].tolist())
        except Exception as e:
            print(f"Silver table exists but could not be read (might be empty): {e}")

    # Filter out already processed tickets
    tickets_to_process = bronze_df[~bronze_df["ticket_id"].isin(processed_ids)]
    
    if tickets_to_process.empty:
        print("No new tickets to enrich. Silver layer is up-to-date.")
        return
        
    print(f"Processing {len(tickets_to_process)} new tickets for Silver layer zenginleştirme...")
    
    # Run async enrichment
    try:
        enrichment_results = asyncio.run(enrich_batch(tickets_to_process, GEMINI_API_KEY))
    except RuntimeError:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        enrichment_results = loop.run_until_complete(enrich_batch(tickets_to_process, GEMINI_API_KEY))
    
    # Create zenginleştirilmiş columns
    enriched_df = tickets_to_process.copy()
    
    enriched_df["sentiment"] = [r["sentiment"] for r in enrichment_results]
    enriched_df["inferred_category"] = [r["category"] for r in enrichment_results]
    enriched_df["language"] = [r["language"] for r in enrichment_results]
    enriched_df["summary_tr"] = [r["summary_tr"] for r in enrichment_results]
    # Store entities list as JSON string to support Delta format writing easily
    enriched_df["extracted_entities"] = [json.dumps(r["extracted_entities"]) for r in enrichment_results]
    
    enriched_df["enriched_at"] = datetime.utcnow()
    
    # Write to Silver Delta Lake
    print(f"Writing {len(enriched_df)} enriched tickets to Silver Delta Table at '{SILVER_TICKETS_PATH}'...")
    try:
        write_deltalake(SILVER_TICKETS_PATH, enriched_df, mode="append")
        print("Silver Enrichment completed successfully.")
    except Exception as e:
        print(f"Failed to write Silver Delta table: {e}")

if __name__ == "__main__":
    run()
