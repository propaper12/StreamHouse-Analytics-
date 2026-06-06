import os
import json
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from deltalake import DeltaTable

# Load environment variables
load_dotenv()

LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
BRONZE_CLICKS_PATH = os.path.join(LAKEHOUSE_PATH, "bronze", "clickstream")
SILVER_TICKETS_PATH = os.path.join(LAKEHOUSE_PATH, "silver", "tickets_enriched")
REPORTS_DIR = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "quality_reports")

# A lightweight custom validation class that mimics Great Expectations
class SimpleDatasetValidator:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.row_count = len(df)
        
    def expect_column_values_to_not_be_null(self, column: str):
        if column not in self.df.columns:
            return type('Result', (), {'success': False, 'result': {'unexpected_count': self.row_count}})()
        null_count = self.df[column].isnull().sum()
        success = null_count == 0
        return type('Result', (), {'success': bool(success), 'result': {'unexpected_count': int(null_count)}})()

    def expect_column_values_to_be_in_set(self, column: str, allowed_set: list):
        if column not in self.df.columns:
            return type('Result', (), {'success': False, 'result': {'unexpected_count': self.row_count}})()
        unexpected = self.df[~self.df[column].isin(allowed_set)]
        unexpected_count = len(unexpected)
        success = unexpected_count == 0
        return type('Result', (), {'success': bool(success), 'result': {'unexpected_count': int(unexpected_count)}})()

    def expect_column_values_to_match_prefixes(self, column: str, prefixes: list):
        if column not in self.df.columns:
            return type('Result', (), {'success': False, 'result': {'unexpected_count': self.row_count}})()
        def matches_any(val):
            if not isinstance(val, str):
                return False
            return any(val.startswith(p) for p in prefixes)
        matching = self.df[column].apply(matches_any)
        unexpected_count = len(self.df) - matching.sum()
        success = unexpected_count == 0
        return type('Result', (), {'success': bool(success), 'result': {'unexpected_count': int(unexpected_count)}})()

def run_checks():
    print("Starting Data Quality Validation using SimpleDatasetValidator...")
    
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    results = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "Success",
        "tables": {}
    }
    
    overall_success = True

    # 1. Validate Bronze Clickstream Table
    if os.path.exists(BRONZE_CLICKS_PATH):
        try:
            print("Validating Bronze Clickstream Table...")
            clicks_df = DeltaTable(BRONZE_CLICKS_PATH).to_pandas()
            validator = SimpleDatasetValidator(clicks_df)
            
            check_id = validator.expect_column_values_to_not_be_null("event_id")
            check_user = validator.expect_column_values_to_not_be_null("user_id")
            check_actions = validator.expect_column_values_to_match_prefixes(
                "action", [
                    "view", "click", "add_to_cart", "purchase", "scroll",
                    "error_page", "dwell_on_product", "view_details",
                    "close_details", "update_qty_id", "submit_ticket"
                ]
            )
            
            table_success = check_id.success and check_user.success and check_actions.success
            if not table_success:
                overall_success = False
                
            results["tables"]["bronze_clickstream"] = {
                "success": bool(table_success),
                "row_count": len(clicks_df),
                "checks": {
                    "event_id_not_null": {"success": bool(check_id.success), "unexpected_count": check_id.result.get("unexpected_count", 0)},
                    "user_id_not_null": {"success": bool(check_user.success), "unexpected_count": check_user.result.get("unexpected_count", 0)},
                    "valid_actions": {"success": bool(check_actions.success), "unexpected_count": check_actions.result.get("unexpected_count", 0)}
                }
            }
        except Exception as e:
            print(f"Error checking Bronze clicks: {e}")
            results["tables"]["bronze_clickstream"] = {"success": False, "error": str(e)}
            overall_success = False
    else:
        results["tables"]["bronze_clickstream"] = {"success": False, "error": "Table does not exist"}

    # 2. Validate Silver Enriched Tickets Table
    if os.path.exists(SILVER_TICKETS_PATH):
        try:
            print("Validating Silver Enriched Tickets Table...")
            tickets_df = DeltaTable(SILVER_TICKETS_PATH).to_pandas()
            validator = SimpleDatasetValidator(tickets_df)
            
            check_id = validator.expect_column_values_to_not_be_null("ticket_id")
            check_sentiment = validator.expect_column_values_to_be_in_set(
                "sentiment", ["Positive", "Negative", "Neutral"]
            )
            check_category = validator.expect_column_values_to_be_in_set(
                "inferred_category", ["Billing", "Technical", "Product Feedback", "Delivery", "Unknown"]
            )
            
            table_success = check_id.success and check_sentiment.success and check_category.success
            if not table_success:
                overall_success = False
                
            results["tables"]["silver_tickets"] = {
                "success": bool(table_success),
                "row_count": len(tickets_df),
                "checks": {
                    "ticket_id_not_null": {"success": bool(check_id.success), "unexpected_count": check_id.result.get("unexpected_count", 0)},
                    "valid_sentiment": {"success": bool(check_sentiment.success), "unexpected_count": check_sentiment.result.get("unexpected_count", 0)},
                    "valid_category": {"success": bool(check_category.success), "unexpected_count": check_category.result.get("unexpected_count", 0)}
                }
            }
        except Exception as e:
            print(f"Error checking Silver tickets: {e}")
            results["tables"]["silver_tickets"] = {"success": False, "error": str(e)}
            overall_success = False
    else:
        results["tables"]["silver_tickets"] = {"success": False, "error": "Table does not exist"}

    # Set overall status
    results["status"] = "Success" if overall_success else "Failed"
    
    # Save report to JSON file
    report_path = os.path.join(REPORTS_DIR, "latest_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
        
    print(f"Data quality report saved to: {report_path}")
    print(f"Overall status: {results['status']}")
    
    return results

if __name__ == "__main__":
    run_checks()
