import os
import json
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from confluent_kafka import Consumer, KafkaError
from deltalake.writer import write_deltalake

# Load environment variables
load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_CLICKSTREAM", "user-clicks")
LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
BRONZE_STREAM_PATH = os.path.join(LAKEHOUSE_PATH, "bronze", "clickstream")

# Consumer configuration
conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'group.id': 'bronze-streaming-consumer',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False
}

def main():
    print(f"Starting Bronze Streaming Pipeline...")
    print(f"Reading from topic '{KAFKA_TOPIC}'...")
    print(f"Writing Delta table to '{BRONZE_STREAM_PATH}'...")
    
    # Ensure directory exists (deltalake will create it, but good practice)
    os.makedirs(os.path.dirname(BRONZE_STREAM_PATH), exist_ok=True)
    
    try:
        consumer = Consumer(conf)
        consumer.subscribe([KAFKA_TOPIC])
    except Exception as e:
        print(f"Failed to create consumer: {e}")
        return

    batch_size = 100
    batch_timeout = 2.0  # seconds
    
    buffer = []
    last_flush = datetime.now()
    
    try:
        while True:
            # Poll for a single message
            msg = consumer.poll(1.0)
            
            if msg is not None:
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # End of partition event
                        pass
                    else:
                        print(f"Kafka error: {msg.error()}")
                else:
                    # Successfully received a message
                    try:
                        event_data = json.loads(msg.value().decode('utf-8'))
                        buffer.append(event_data)
                    except Exception as e:
                        print(f"Failed to parse JSON: {e}")
            
            # Check if we should flush buffer to Delta Lake
            time_since_last_flush = (datetime.now() - last_flush).total_seconds()
            if len(buffer) >= batch_size or (len(buffer) > 0 and time_since_last_flush >= batch_timeout):
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Writing {len(buffer)} records to Bronze Delta table...")
                
                try:
                    # Convert to pandas DataFrame
                    df = pd.DataFrame(buffer)
                    
                    # Ensure correct schemas/types if needed
                    df["timestamp"] = pd.to_datetime(df["timestamp"])
                    df["dwell_time_seconds"] = df["dwell_time_seconds"].astype(float)
                    df["user_id"] = df["user_id"].astype(int)
                    
                    # Write to Delta Table using deltalake (Append mode)
                    write_deltalake(BRONZE_STREAM_PATH, df, mode="append")
                    
                    # Commit offsets manually after successful write
                    consumer.commit(asynchronous=False)
                    
                    # Clear buffer and update flush timestamp
                    buffer.clear()
                    last_flush = datetime.now()
                    
                except Exception as e:
                    print(f"Error writing to Delta table or committing offsets: {e}")
                    # In a production system, we would retry or send to a Dead Letter Queue (DLQ).
                    # Here we print and try again on next loop.
                    
    except KeyboardInterrupt:
        print("\nStopping streaming pipeline...")
    finally:
        consumer.close()
        print("Consumer closed. Pipeline stopped.")

if __name__ == "__main__":
    main()
