import os
import glob
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from deltalake.writer import write_deltalake

# Load environment variables
load_dotenv()

LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
RAW_TICKETS_DIR = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "raw", "tickets")
BRONZE_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "bronze", "tickets")
CHECKPOINT_FILE = os.path.join(LAKEHOUSE_PATH, "bronze", "_checkpoints", "ingested_tickets.txt")

def load_checkpoint():
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r") as f:
            return set(line.strip() for line in f.readlines())
    return set()

def save_checkpoint(new_files):
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    with open(CHECKPOINT_FILE, "a") as f:
        for file in new_files:
            f.write(f"{file}\n")

def run():
    print("Starting Bronze Batch Pipeline (Tickets Ingestion)...")
    print(f"Scanning raw folder: {RAW_TICKETS_DIR}")
    
    # Get all csv files in raw folder
    csv_files = glob.glob(os.path.join(RAW_TICKETS_DIR, "*.csv"))
    if not csv_files:
        print("No CSV files found in raw tickets directory.")
        return
        
    ingested_files = load_checkpoint()
    files_to_process = [f for f in csv_files if os.path.basename(f) not in ingested_files]
    
    if not files_to_process:
        print("All raw ticket files have already been ingested. Nothing to process.")
        return
        
    print(f"Found {len(files_to_process)} new files to ingest.")
    
    dfs = []
    for file in files_to_process:
        print(f"Reading file: {os.path.basename(file)}")
        try:
            df = pd.read_csv(file)
            dfs.append(df)
        except Exception as e:
            print(f"Error reading {file}: {e}")
            
    if not dfs:
        return
        
    # Combine all DataFrames
    combined_df = pd.concat(dfs, ignore_index=True)
    
    # Format datetimes
    combined_df["timestamp"] = pd.to_datetime(combined_df["timestamp"])
    combined_df["user_id"] = combined_df["user_id"].astype(int)
    
    # Write to Bronze Delta Lake
    print(f"Appending {len(combined_df)} records to Bronze tickets Delta table at '{BRONZE_TICKETS_PATH}'...")
    try:
        write_deltalake(BRONZE_TICKETS_PATH, combined_df, mode="append")
        
        # Save checkpoints
        save_checkpoint([os.path.basename(f) for f in files_to_process])
        print("Bronze Batch Ingestion completed successfully.")
    except Exception as e:
        print(f"Failed to write Delta table: {e}")

if __name__ == "__main__":
    run()
