import os
import duckdb
import pandas as pd
from dotenv import load_dotenv
from deltalake import DeltaTable
from deltalake.writer import write_deltalake

# Load environment variables
load_dotenv()

LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
BRONZE_CLICKS_PATH = os.path.join(LAKEHOUSE_PATH, "bronze", "clickstream")
SILVER_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "silver", "tickets_enriched")
GOLD_INSIGHTS_PATH = os.path.join(LAKEHOUSE_PATH, "gold", "user_friction_insights")

def run():
    print("Starting Gold Analytics Pipeline (Customer Friction Analysis)...")
    
    # Check if input tables exist
    if not os.path.exists(BRONZE_CLICKS_PATH) or not os.path.exists(SILVER_TICKETS_PATH):
        print("Required Bronze clickstream or Silver tickets tables do not exist. Run upstream pipelines first.")
        return
        
    try:
        # Load tables as PyArrow datasets for zero-copy DuckDB querying
        clicks_dataset = DeltaTable(BRONZE_CLICKS_PATH).to_pyarrow_dataset()
        tickets_dataset = DeltaTable(SILVER_TICKETS_PATH).to_pyarrow_dataset()
        
        # Connect to local in-memory DuckDB
        con = duckdb.connect()
        
        # Register PyArrow datasets as SQL tables
        con.register("clicks", clicks_dataset)
        con.register("tickets", tickets_dataset)
        
        # Analytical SQL Query: User Friction Analysis
        # Combines user click logs (specifically errors or checkout activity) with their subsequent support tickets
        query = """
        WITH user_click_metrics AS (
            SELECT 
                user_id,
                COUNT(CASE WHEN action = 'error_page' THEN 1 END) as error_count,
                COUNT(CASE WHEN page_url = '/checkout' THEN 1 END) as checkout_visits,
                COUNT(*) as total_clicks,
                AVG(dwell_time_seconds) as avg_dwell_time
            FROM clicks
            GROUP BY user_id
        ),
        user_tickets AS (
            SELECT 
                user_id,
                ticket_id,
                subject,
                inferred_category as category,
                sentiment,
                priority,
                status,
                timestamp as ticket_time
            FROM tickets
        )
        SELECT 
            t.ticket_id,
            t.user_id,
            t.subject,
            t.category,
            t.sentiment,
            t.priority,
            t.status,
            c.error_count,
            c.checkout_visits,
            c.total_clicks,
            ROUND(c.avg_dwell_time, 2) as avg_dwell_time,
            CASE 
                WHEN c.error_count > 0 AND t.priority IN ('High', 'Urgent') THEN 'Critical Friction'
                WHEN c.error_count > 0 THEN 'Medium Friction'
                WHEN t.priority IN ('High', 'Urgent') THEN 'High Priority Ticket'
                ELSE 'Standard Ticket'
            END as friction_level,
            CURRENT_TIMESTAMP as analyzed_at
        FROM user_tickets t
        LEFT JOIN user_click_metrics c ON t.user_id = c.user_id
        """
        
        print("Running SQL aggregation using DuckDB...")
        insights_df = con.execute(query).df()
        
        if insights_df.empty:
            print("No insights generated (empty tables).")
            return
            
        print(f"Generated {len(insights_df)} user friction insights.")
        
        # Write to Gold Delta Table (Overwrite mode so it refreshes with latest aggregations)
        print(f"Writing insights to Gold Delta Table at '{GOLD_INSIGHTS_PATH}'...")
        write_deltalake(GOLD_INSIGHTS_PATH, insights_df, mode="overwrite")
        print("Gold Analytics completed successfully.")
        
    except Exception as e:
        print(f"Failed to run Gold analytics: {e}")

if __name__ == "__main__":
    run()
