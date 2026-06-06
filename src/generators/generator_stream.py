import os
import json
import time
import random
import uuid
from datetime import datetime
from dotenv import load_dotenv
from confluent_kafka import Producer

# Load environment variables
load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_CLICKSTREAM", "user-clicks")

# Producer configuration
conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'client.id': 'clickstream-generator'
}

# Delivery callback helper
def delivery_report(err, msg):
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        # Don't print every message to avoid cluttering stdout at scale
        pass

def generate_click_event():
    pages = ["/home", "/products", "/products/electronics", "/products/fashion", "/cart", "/checkout", "/support", "/pricing"]
    actions = ["view", "click", "add_to_cart", "purchase", "scroll", "error_page"]
    devices = ["desktop", "mobile", "tablet", "mobile_app"]
    
    user_id = random.randint(10000, 99999)
    session_id = str(uuid.uuid4())
    
    return {
        "event_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "page_url": random.choice(pages),
        "action": random.choice(actions),
        "ip_address": f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
        "device": random.choice(devices),
        "dwell_time_seconds": round(random.uniform(0.5, 300.0), 2)
    }

def main():
    print(f"Starting stream generator... Publishing to topic '{KAFKA_TOPIC}' on {KAFKA_BOOTSTRAP_SERVERS}")
    
    # Try connecting and producing
    try:
        producer = Producer(conf)
    except Exception as e:
        print(f"Failed to create producer: {e}")
        return

    count = 0
    try:
        while True:
            event = generate_click_event()
            producer.produce(
                KAFKA_TOPIC, 
                key=str(event["user_id"]), 
                value=json.dumps(event).encode('utf-8'), 
                callback=delivery_report
            )
            producer.poll(0)
            
            count += 1
            if count % 100 == 0:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent {count} events...")
                producer.flush()
                
            # Sleep dynamically to simulate realistic click stream
            time.sleep(random.uniform(0.05, 0.5))
            
    except KeyboardInterrupt:
        print("\nStopping generator...")
    finally:
        print("Flushing pending messages...")
        producer.flush()
        print("Generator stopped.")

if __name__ == "__main__":
    main()
