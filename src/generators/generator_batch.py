import os
import csv
import random
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

LAKEHOUSE_PATH = os.getenv("LAKEHOUSE_PATH", "c:/Users/omerc/OneDrive/Masaüstü/deneme/data/lakehouse")
RAW_TICKETS_DIR = os.path.join(os.path.dirname(LAKEHOUSE_PATH), "raw", "tickets")

# Template customer ticket data (Turkish complaints and positive reviews)
TICKET_TEMPLATES = [
    # Technical Issues
    {"subject": "Uygulama Sürekli Çöküyor", "description": "Mobil uygulamanız son güncellemeden sonra sürekli çöküyor. Giriş yap ekranında donup kalıyor.", "category_hint": "Technical", "priority": "High"},
    {"subject": "Şifre Sıfırlama Hatası", "description": "Şifremi unuttum butonuna basıyorum ancak e-posta adresime sıfırlama linki gelmiyor. Lütfen kontrol edin.", "category_hint": "Technical", "priority": "Medium"},
    {"subject": "Sepete Ürün Eklenmiyor", "description": "Web sitenizden alışveriş yaparken sepete ekle butonuna tıklıyorum ama sepet boş görünüyor. Ödeme sayfasına geçemiyorum.", "category_hint": "Technical", "priority": "High"},
    # Billing & Refund Issues
    {"subject": "Mükerrer Çekim Yapıldı", "description": "Hesap hareketlerimde gördüm ki aynı sipariş için kartımdan iki kez 1500 TL çekilmiş. İadesini talep ediyorum.", "category_hint": "Billing", "priority": "Urgent"},
    {"subject": "İade Tutarı Hesaba Yatmadı", "description": "3 gün önce iptal ettiğim siparişin ücret iadesi yapıldı dendi ama banka hesabımda hala görünmüyor.", "category_hint": "Billing", "priority": "Medium"},
    {"subject": "Fatura Bilgisi Yanlış", "description": "Şirket adına kestiğiniz faturadaki vergi numarası hatalı yazılmış. Lütfen faturayı iptal edip yeniden düzenleyin.", "category_hint": "Billing", "priority": "Low"},
    # Delivery & Logistics
    {"subject": "Kargo Gecikmesi", "description": "Siparişimi 5 gün önce vermeme rağmen kargo hala yola çıkmadı. Hızlı teslimat seçeneği için ekstra ücret ödemiştim.", "category_hint": "Delivery", "priority": "High"},
    {"subject": "Eksik Ürün Teslimatı", "description": "Kargom bugün ulaştı fakat sipariş ettiğim 3 üründen sadece 2 tanesi kutudan çıktı. Kalan ürünüm nerede?", "category_hint": "Delivery", "priority": "Urgent"},
    {"subject": "Kırık Ürün Geldi", "description": "Satın aldığım porselen yemek takımı kargoda kırılmış. Kutunun içi paramparçaydı. Değişim veya iade istiyorum.", "category_hint": "Delivery", "priority": "High"},
    # Product Feedback & Reviews
    {"subject": "Harika Ürün Teşekkürler", "description": "Aldığım kablosuz kulaklığın ses kalitesi ve şarj süresi mükemmel. Çok memnun kaldım, teşekkürler.", "category_hint": "Product Feedback", "priority": "Low"},
    {"subject": "Beden Ölçüsü Uymadı", "description": "M beden sipariş ettiğim mont kalıbı çok dar olduğu için olmadı. L beden ile değişim yapmak istiyorum.", "category_hint": "Product Feedback", "priority": "Medium"},
    {"subject": "Ürün Kalitesi Beklentinin Altında", "description": "Görsellerdeki ürünle gelen ürünün kumaş kalitesi çok farklı. Bu fiyata değecek bir ürün değil maalesef.", "category_hint": "Product Feedback", "priority": "Low"}
]

def generate_batch_tickets(num_tickets=20):
    os.makedirs(RAW_TICKETS_DIR, exist_ok=True)
    
    filename = f"tickets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    filepath = os.path.join(RAW_TICKETS_DIR, filename)
    
    # Generate tickets
    tickets = []
    base_time = datetime.utcnow()
    
    for i in range(num_tickets):
        template = random.choice(TICKET_TEMPLATES)
        # Shift times slightly for realism
        ticket_time = base_time - timedelta(minutes=random.randint(5, 1200))
        
        ticket = {
            "ticket_id": str(uuid.uuid4()),
            "user_id": random.randint(10000, 99999), # Matches user_id range in stream generator
            "timestamp": ticket_time.isoformat() + "Z",
            "subject": template["subject"],
            "description": template["description"],
            "priority": template["priority"],
            "status": random.choice(["Open", "Open", "Pending"]) # Mostly open or pending
        }
        tickets.append(ticket)
        
    # Write to CSV
    with open(filepath, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=tickets[0].keys())
        writer.writeheader()
        writer.writerows(tickets)
        
    print(f"Generated {num_tickets} support tickets in '{filepath}'")
    return filepath

if __name__ == "__main__":
    generate_batch_tickets()
