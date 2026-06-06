import os
import json
import threading
import psycopg2
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import duckdb
from deltalake import DeltaTable

# Import pipeline/generator scripts
from src import orchestrator
from src.generators import generator_batch
from src.pipelines.gold_vector_sync import get_embedding, EMBEDDING_DIM
from google import genai

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://lakehouse_user:lakehouse_password@localhost:5432/lakehouse_db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
BRONZE_CLICKS_PATH = os.path.join(LAKEHOUSE_PATH, "bronze", "clickstream")
SILVER_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "silver", "tickets_enriched")
GOLD_INSIGHTS_PATH = os.path.join(LAKEHOUSE_PATH, "gold", "user_friction_insights")

STATUS_FILE = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "orchestrator_status.json")
REPORT_FILE = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "quality_reports", "latest_report.json")

app = FastAPI(title="AI-Enhanced Lakehouse Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5

class GenerateTicketsRequest(BaseModel):
    count: Optional[int] = 10

# Helper to check if a delta table exists and is not empty
def table_exists(path: str) -> bool:
    try:
        if os.path.exists(path):
            dt = DeltaTable(path)
            return len(dt.file_uris()) > 0
        return False
    except Exception:
        return False

@app.get("/api/pipeline-status")
def get_pipeline_status():
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"status": "Error", "message": str(e)}
    return {"status": "Idle", "message": "Pipeline has not been executed yet."}

@app.get("/api/quality-report")
def get_quality_report():
    if os.path.exists(REPORT_FILE):
        try:
            with open(REPORT_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"status": "Error", "message": str(e)}
    return {"status": "Missing", "message": "No quality checks run yet."}

@app.post("/api/trigger-pipeline")
def trigger_pipeline(background_tasks: BackgroundTasks):
    status = get_pipeline_status()
    if status.get("status") == "Running":
        return {"message": "Pipeline is already running."}
    
    background_tasks.add_task(orchestrator.run_pipeline)
    return {"message": "Pipeline run triggered in background."}

@app.post("/api/generate-tickets")
def generate_tickets(req: GenerateTicketsRequest):
    try:
        filepath = generator_batch.generate_batch_tickets(num_tickets=req.count)
        return {
            "status": "Success",
            "message": f"Generated {req.count} new raw tickets.",
            "file": os.path.basename(filepath)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics")
def get_metrics():
    # Use DuckDB to query Delta tables for metrics
    metrics = {
        "clickstream_total_events": 0,
        "tickets_total_count": 0,
        "sentiment_ratios": [],
        "category_counts": [],
        "friction_levels": []
    }
    
    con = duckdb.connect()
    
    # 1. Clickstream metrics
    if table_exists(BRONZE_CLICKS_PATH):
        try:
            clicks_dataset = DeltaTable(BRONZE_CLICKS_PATH).to_pyarrow_dataset()
            con.register("clicks", clicks_dataset)
            res = con.execute("SELECT COUNT(*) FROM clicks").fetchone()
            metrics["clickstream_total_events"] = res[0] if res else 0
        except Exception as e:
            print(f"Error querying clicks metrics: {e}")

    # 2. Tickets & Sentiment metrics
    if table_exists(SILVER_TICKETS_PATH):
        try:
            tickets_dataset = DeltaTable(SILVER_TICKETS_PATH).to_pyarrow_dataset()
            con.register("tickets", tickets_dataset)
            
            # Total count
            res = con.execute("SELECT COUNT(*) FROM tickets").fetchone()
            metrics["tickets_total_count"] = res[0] if res else 0
            
            # Sentiment counts
            sentiments = con.execute("""
                SELECT sentiment, COUNT(*) as cnt, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets), 1) as pct
                FROM tickets
                GROUP BY sentiment
            """).fetchall()
            metrics["sentiment_ratios"] = [
                {"sentiment": row[0], "count": row[1], "percentage": row[2]} for row in sentiments
            ]
            
            # Category counts
            categories = con.execute("""
                SELECT inferred_category, COUNT(*) as cnt
                FROM tickets
                GROUP BY inferred_category
                ORDER BY cnt DESC
            """).fetchall()
            metrics["category_counts"] = [
                {"category": row[0], "count": row[1]} for row in categories
            ]
        except Exception as e:
            print(f"Error querying tickets metrics: {e}")

    # 3. User Friction metrics
    if table_exists(GOLD_INSIGHTS_PATH):
        try:
            insights_dataset = DeltaTable(GOLD_INSIGHTS_PATH).to_pyarrow_dataset()
            con.register("insights", insights_dataset)
            
            friction = con.execute("""
                SELECT friction_level, COUNT(*) as cnt
                FROM insights
                GROUP BY friction_level
            """).fetchall()
            metrics["friction_levels"] = [
                {"level": row[0], "count": row[1]} for row in friction
            ]
        except Exception as e:
            print(f"Error querying insights metrics: {e}")
            
    return metrics

@app.get("/api/tickets")
def get_tickets(page: int = 1, limit: int = 10, category: Optional[str] = None):
    if not table_exists(SILVER_TICKETS_PATH):
        return {"tickets": [], "total": 0}
        
    con = duckdb.connect()
    try:
        tickets_dataset = DeltaTable(SILVER_TICKETS_PATH).to_pyarrow_dataset()
        con.register("tickets", tickets_dataset)
        
        where_clause = ""
        params = []
        if category and category != "All":
            where_clause = "WHERE inferred_category = ?"
            params.append(category)
            
        # Total count
        total = con.execute(f"SELECT COUNT(*) FROM tickets {where_clause}", params).fetchone()[0]
        
        # Paginated tickets
        offset = (page - 1) * limit
        query = f"""
            SELECT ticket_id, user_id, subject, description, inferred_category, sentiment, summary_tr, extracted_entities, timestamp
            FROM tickets
            {where_clause}
            ORDER BY timestamp DESC
            LIMIT {limit} OFFSET {offset}
        """
        rows = con.execute(query, params).fetchall()
        
        tickets = []
        for r in rows:
            tickets.append({
                "ticket_id": r[0],
                "user_id": r[1],
                "subject": r[2],
                "description": r[3],
                "category": r[4],
                "sentiment": r[5],
                "summary": r[6],
                "entities": json.loads(r[7]) if r[7] else [],
                "timestamp": r[8]
            })
            
        return {"tickets": tickets, "total": total, "page": page, "limit": limit}
    except Exception as e:
        print(f"Error getting tickets: {e}")
        return {"tickets": [], "total": 0, "error": str(e)}

@app.post("/api/search")
def search_tickets(req: SearchQuery):
    print(f"Executing semantic search for query: '{req.query}'")
    
    # 1. Connect to Gemini to get embedding (or get mock vector)
    client = None
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    
    query_vector = get_embedding(client, req.query)
    
    # 2. Query Postgres pgvector
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Cosine distance operator (<=>). Smaller means closer.
        # We calculate similarity as 1 - cosine_distance.
        cur.execute(f"""
            SELECT 
                ticket_id, 
                user_id, 
                subject, 
                description, 
                category, 
                sentiment,
                (1 - (embedding <=> %s::vector)) as similarity
            FROM enriched_tickets_vectors
            ORDER BY embedding <=> %s::vector ASC
            LIMIT %s;
        """, (query_vector, query_vector, req.limit))
        
        rows = cur.fetchall()
        
        results = []
        for r in rows:
            results.append({
                "ticket_id": r[0],
                "user_id": r[1],
                "subject": r[2],
                "description": r[3],
                "category": r[4],
                "sentiment": r[5],
                "similarity": round(float(r[6]), 4) if r[6] is not None else 0.0
            })
            
        return {"results": results, "query": req.query}
        
    except Exception as e:
        print(f"Database error during search: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@app.get("/api/clicks")
def get_clicks(limit: int = 50):
    if not table_exists(BRONZE_CLICKS_PATH):
        return {"clicks": []}
    con = duckdb.connect()
    try:
        clicks_dataset = DeltaTable(BRONZE_CLICKS_PATH).to_pyarrow_dataset()
        con.register("clicks", clicks_dataset)
        query = f"""
            SELECT user_id, session_id, page_url, action, device, dwell_time_seconds, timestamp
            FROM clicks
            ORDER BY timestamp DESC
            LIMIT {limit}
        """
        rows = con.execute(query).fetchall()
        clicks = []
        for r in rows:
            clicks.append({
                "user_id": r[0],
                "session_id": r[1],
                "page_url": r[2],
                "action": r[3],
                "device": r[4],
                "dwell_time_seconds": r[5],
                "timestamp": r[6]
            })
        return {"clicks": clicks}
    except Exception as e:
        print(f"Error getting clicks: {e}")
        return {"clicks": [], "error": str(e)}

@app.get("/api/friction-insights")
def get_friction_insights(limit: int = 20):
    if not table_exists(GOLD_INSIGHTS_PATH):
        return {"insights": []}
    con = duckdb.connect()
    try:
        insights_dataset = DeltaTable(GOLD_INSIGHTS_PATH).to_pyarrow_dataset()
        con.register("insights", insights_dataset)
        query = f"""
            SELECT ticket_id, user_id, subject, category, sentiment, priority, status, 
                   error_count, checkout_visits, total_clicks, avg_dwell_time, friction_level, analyzed_at
            FROM insights
            ORDER BY analyzed_at DESC, error_count DESC
            LIMIT {limit}
        """
        rows = con.execute(query).fetchall()
        insights = []
        for r in rows:
            insights.append({
                "ticket_id": r[0],
                "user_id": r[1],
                "subject": r[2],
                "category": r[3],
                "sentiment": r[4],
                "priority": r[5],
                "status": r[6],
                "error_count": r[7] if r[7] is not None else 0,
                "checkout_visits": r[8] if r[8] is not None else 0,
                "total_clicks": r[9] if r[9] is not None else 0,
                "avg_dwell_time": r[10] if r[10] is not None else 0.0,
                "friction_level": r[11],
                "analyzed_at": r[12]
            })
        return {"insights": insights}
    except Exception as e:
        print(f"Error getting friction insights: {e}")
        return {"insights": [], "error": str(e)}

class ClickLog(BaseModel):
    user_id: int
    session_id: str
    page_url: str
    action: str
    device: str
    dwell_time_seconds: float

class UserTicket(BaseModel):
    user_id: int
    subject: str
    description: str

_producer = None

def get_kafka_producer():
    global _producer
    if _producer is None:
        from confluent_kafka import Producer
        KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
        _producer = Producer({
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'client.id': 'api-gateway-producer'
        })
    return _producer

@app.post("/api/log-click")
def log_click(event: ClickLog):
    try:
        import uuid
        from datetime import datetime
        
        producer = get_kafka_producer()
        KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_CLICKSTREAM", "user-clicks")
        
        event_dict = event.dict()
        event_dict["event_id"] = str(uuid.uuid4())
        event_dict["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        producer.produce(
            KAFKA_TOPIC,
            key=str(event.user_id),
            value=json.dumps(event_dict).encode('utf-8')
        )
        producer.poll(0)
        producer.flush(1.0)
        return {"status": "Success", "message": "Event sent to Kafka."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit-ticket")
def submit_ticket(ticket: UserTicket):
    try:
        import csv
        import uuid
        from datetime import datetime
        
        RAW_TICKETS_DIR = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "raw", "tickets")
        os.makedirs(RAW_TICKETS_DIR, exist_ok=True)
        
        filename = f"ticket_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.csv"
        filepath = os.path.join(RAW_TICKETS_DIR, filename)
        
        desc_lower = ticket.description.lower()
        priority = "Medium"
        if any(word in desc_lower for word in ["hata", "çök", "hızlı", "acil", "kırık", "iki kez"]):
            priority = "High"
            
        ticket_data = {
            "ticket_id": str(uuid.uuid4()),
            "user_id": ticket.user_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "subject": ticket.subject,
            "description": ticket.description,
            "priority": priority,
            "status": "Open"
        }
        
        with open(filepath, mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=ticket_data.keys())
            writer.writeheader()
            writer.writerows([ticket_data])
            
        return {"status": "Success", "message": "Ticket submitted successfully.", "file": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
