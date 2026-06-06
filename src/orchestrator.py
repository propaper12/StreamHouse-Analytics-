import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv

# Import pipeline run functions
from src.pipelines import bronze_batch
from src.pipelines import silver_enrichment
from src.pipelines import gold_analytics
from src.pipelines import gold_vector_sync
from src.quality import data_quality

load_dotenv(override=True)
LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
STATUS_FILE = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "orchestrator_status.json")

def write_status(status, current_step=None, steps_status=None):
    data = {
        "status": status,
        "last_run": datetime.now().isoformat() + "Z",
        "current_step": current_step,
        "steps": steps_status or {}
    }
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)
    with open(STATUS_FILE, "w") as f:
        json.dump(data, f, indent=4)

def run_pipeline():
    print("==================================================")
    print(f"Starting Orchestrator Run at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("==================================================")
    
    steps = [
        {"name": "Bronze Ingestion", "module": bronze_batch},
        {"name": "Silver AI Enrichment", "module": silver_enrichment},
        {"name": "Gold SQL Analytics", "module": gold_analytics},
        {"name": "pgvector Database Sync", "module": gold_vector_sync},
        {"name": "Data Quality Checks", "module": data_quality}
    ]
    
    steps_status = {step["name"]: {"status": "Pending", "duration": 0} for step in steps}
    write_status("Running", current_step=steps[0]["name"], steps_status=steps_status)
    
    overall_success = True
    
    for step in steps:
        name = step["name"]
        module = step["module"]
        
        print(f"\n>>> Executing Step: {name}...")
        steps_status[name]["status"] = "Running"
        write_status("Running", current_step=name, steps_status=steps_status)
        
        start_time = time.time()
        try:
            # Special case for modules that have run() or run_checks()
            if name == "Data Quality Checks":
                module.run_checks()
            else:
                module.run()
                
            duration = round(time.time() - start_time, 2)
            steps_status[name]["status"] = "Success"
            steps_status[name]["duration"] = duration
            print(f"[SUCCESS] Step {name} completed in {duration} seconds.")
            
        except Exception as e:
            duration = round(time.time() - start_time, 2)
            steps_status[name]["status"] = "Failed"
            steps_status[name]["duration"] = duration
            steps_status[name]["error"] = str(e)
            overall_success = False
            print(f"[FAILED] Step {name} failed after {duration} seconds: {e}")
            break # Stop pipeline on error
            
        write_status("Running", current_step=name, steps_status=steps_status)
        
    if overall_success:
        write_status("Success", current_step=None, steps_status=steps_status)
        print("\n==================================================")
        print("[SUCCESS] Pipeline finished successfully!")
        print("==================================================")
    else:
        write_status("Failed", current_step=None, steps_status=steps_status)
        print("\n==================================================")
        print("[FAILED] Pipeline failed! Check logs above.")
        print("==================================================")

if __name__ == "__main__":
    run_pipeline()
