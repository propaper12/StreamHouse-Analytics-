
# AI-Enhanced Medallion Lakehouse Platform 🚀

Bu proje, modern veri mühendisliği standartlarına uygun olarak tasarlanmış, **Yapay Zeka (LLM) zenginleştirmeli uçtan uca bir Lakehouse (Göl Evi) veri platformudur**. 

Sistem iki temel web uygulamasından ve bunları besleyen bir API ile streaming/batch veri hattından (pipeline) oluşur:
1.  **ShopSandbox Prototype (Port 5174)**: Müşteri gibi davranıp gerçek zamanlı tıklamalar (clickstream) ürettiğiniz, ürün detay sayfalarında bekleme süreleri (dwell-time) kaydettiğiniz, sepetinizi yönettiğiniz ve hata/şikayet simüle ettiğiniz e-ticaret mağazası.
2.  **Lakehouse Dashboard (Port 5173)**: Veri mühendislerinin anlık klik telemetrisini izlediği, dbt/DuckDB analizleriyle tespit edilen sıkıntılı (friction) kullanıcıları listelediği, pgvector tabanlı yapay zeka aramasını test ettiği ve veri hattı adımlarını yönettiği kontrol odası.

---

## 🏗️ Platform Mimarisi & Veri Akışı (Medallion Architecture)

Veriler göl evinde **Medallion (Bronze -> Silver -> Gold)** katman yapısına göre işlenir:

```
[Müşteri Mağazası - 5174] ──> Klikler (FastAPI /api/log-click) ──> Redpanda (Kafka Broker) ──> Streaming Consumer ──> Bronze Delta
          │
          └──> Şikayetler (FastAPI /api/submit-ticket) ──> CSV Landing Zone ──> Batch Ingest ──> Bronze Delta
```

*   **Bronze Ingestion (Ham Veri)**: 
    *   *Real-time Clicks*: Mağazadaki tıklama logları FastAPI gateway üzerinden anlık olarak **Redpanda** (Kafka API uyumlu) kuyruğuna akar. Python Streaming Consumer bu kuyruğu dinleyerek verileri Bronze Delta tablosuna yazar.
    *   *Batch Tickets*: Müşteri şikayet formundan gönderilen ham veriler CSV olarak yerel diske kaydedilir.
*   **Silver AI Enrichment (Zenginleştirilmiş Veri)**:
    *   Bronze katmandaki ham bilet verileri, **Google Gemini 2.5 Flash API**'si (async paralel işleme motoru ile) veya Mock LLM motoru üzerinden analiz edilir. Her biletin duygusu (sentiment), kategorisi, Türkçe özeti ve metinden çıkarılan anahtarlar (entities) Silver Delta tablosuna yazılır.
*   **Gold SQL Analytics & Vector Sync (Analitik Veri)**:
    *   **DuckDB SQL** motoru, klik logları ile zenginleştirilmiş biletleri `user_id` üzerinden birleştirip sistem hatalarından olumsuz etkilenen "sürtünmeli" (friction) kullanıcıları bulur ve Gold Delta tablosuna yazar.
    *   Zenginleştirilmiş bilet özetleri Gemini `text-embedding-004` (veya mock) modeliyle vektörleştirilerek **PostgreSQL pgvector** tablosuna yüklenir ve semantik aramaya hazır hale getirilir.
*   **Veri Kalitesi Denetimi (Data Quality Audit)**:
    *   Great Expectations mantığında çalışan custom validator, veri tipleri ile null/boşluk denetimlerini gerçekleştirerek kalite raporu üretir.

---

## 🔑 PostgreSQL & Redpanda Erişim Bilgileri

Sistemde kullanılan Docker tabanlı veritabanı ve kuyruk erişim bilgileri aşağıdaki gibidir:

### 🐘 PostgreSQL (pgvector) Giriş Bilgileri
Semantik arama vektörleri ve kullanıcı sürtünme analitik tabloları bu veritabanında saklanır.
*   **Host/Server**: `localhost` (Kendi bilgisayarınızdan) veya `postgres` (Konteyner içi ağ bağlantıları için)
*   **Port**: `5432`
*   **Database (Veritabanı Adı)**: `lakehouse_db`
*   **Username (Kullanıcı Adı)**: `lakehouse_user`
*   **Password (Şifre)**: `lakehouse_password`

### 🌐 Adminer (SQL Web Arayüzü)
PostgreSQL verilerini tarayıcı üzerinden sorgulamak için:
*   **URL**: [http://localhost:8085/](http://localhost:8085/)
*   *Giriş yaparken System: "PostgreSQL", Server: "postgres", Username: "lakehouse_user", Password: "lakehouse_password", Database: "lakehouse_db" yazmanız gerekmektedir.*

### 🚀 Redpanda (Kafka) & Diğer Port Haritası
*   **Redpanda Broker (Kafka API)**: `localhost:19092`
*   **Redpanda Web Console (Kafka UI)**: [http://localhost:8088/](http://localhost:8088/) *(Kuyrukları, topic durumlarını ve akan ham verileri izleme paneli)*
*   **FastAPI Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs) *(Swagger UI API dokümantasyonu)*
*   **Lakehouse Dashboard (Admin)**: [http://localhost:5173/](http://localhost:5173/)
*   **ShopSandbox Storefront (Müşteri)**: [http://localhost:5174/](http://localhost:5174/)

---

## 🛠️ Kurulum ve Çalıştırma Adımları

### 1. Docker Altyapısını Başlatma
Docker Desktop uygulamanızın çalıştığından emin olun. Kök dizinde terminalden şu komutu vererek konteynerları arka planda ayağa kaldırın:
```bash
docker compose up -d
```

### 2. Python Sanal Ortamını Hazırlama
Projede Python 3.13 kullanılması önerilir.
```bash
# Sanal ortam oluşturma
python -m venv .venv

# Aktifleştirme (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Gerekli kütüphaneleri yükleme
pip install -r requirements.txt
```

### 3. Yapay Zeka (Gemini API) Entegrasyonu
Proje varsayılan olarak **Mock LLM** modunda çalışır. Gerçek Gemini API'sini bağlamak için projenin kök dizinindeki `.env` dosyasını düzenleyin:
```env
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
```
API anahtarı girildiğinde FastAPI API sunucusu otomatik yenilenir ve gerçek zenginleştirme (Gemini 2.5 Flash) ile vektör araması (`text-embedding-004`) aktifleşir.

---

## 🚀 Servisleri ve Canlı Akışı Başlatma

Veri platformunun tamamen canlı çalışması için şu 4 terminal komutunu ayrı pencerelerde çalıştırın:

### A. Canlı Akış Tüketici (Streaming Consumer)
Kafka'daki klik loglarını tüketerek Bronze Delta tablosuna anlık yazar:
```bash
.\.venv\Scripts\python -m src.pipelines.bronze_streaming
```

### B. FastAPI Backend API Sunucusu
Uygulama katmanları ve veritabanı işlemlerini koordine eder:
```bash
.\.venv\Scripts\python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

### C. Lakehouse Dashboard Arayüzü (Admin Panel)
```bash
cd frontend
npm run dev
```

### D. ShopSandbox Storefront Arayüzü (Müşteri Mağazası)
```bash
cd store
npm run dev -- --port 5174
```

> [!NOTE]  
> **Simüle Akış Üretici (`generator_stream.py`)**:  
> Arka planda durmaksızın rastgele sahte klik üretip Kafka'yı dolduran `generator_stream.py` süreci, sistemin sadece **sizin mağazadaki tıklamalarınızı** işleyip simüle etmesi için devre dışı bırakılmıştır. Eğer sisteme rastgele arka plan yükü yüklemek isterseniz şu komutla sahte klik üreticisini çalıştırabilirsiniz:  
> `.\.venv\Scripts\python -m src.generators.generator_stream`

---

## 🔄 Batch Orchestrator Yürütme

Kontrol odasındaki (Dashboard) **"Pipeline Başlat"** butonuna basarak veya terminalden aşağıdaki komutu girerek toplu veri işleme adımlarını (Batch Pipeline) baştan sona tetikleyebilirsiniz:
```bash
.\.venv\Scripts\python -m src.orchestrator
```

**Bu orchestrator sırasıyla:**
1.  Şikayet biletlerinin CSV dosyalarını artımlı olarak okuyarak Bronze Delta tablosuna yükler.
2.  İşlenmemiş biletleri alıp async olarak **Gemini** ile zenginleştirir ve Silver Delta'ya yazar.
3.  **DuckDB SQL** ile klik logları ile biletleri join'leyip hatalardan olumsuz etkilenen kullanıcıları analiz eder ve Gold Delta'ya yazar.
4.  Zenginleşen biletlerin embeddings vektörlerini üretip PostgreSQL `pgvector` tablosuna senkronize eder.
5.  Uçtan uca kalite denetimi (Null, veri tipi kontrolleri) yaparak kalite raporu (`latest_report.json`) üretir.

<img width="2878" height="1546" alt="Ekran görüntüsü 2026-06-06 175437" src="https://github.com/user-attachments/assets/06432504-7b48-4d8b-b819-432b30edb50c" />
<img width="2869" height="1533" alt="Ekran görüntüsü 2026-06-06 175442" src="https://github.com/user-attachments/assets/1c2e85e5-f834-466d-a38a-f5fb3887970e" />
<img width="2871" height="1554" alt="Ekran görüntüsü 2026-06-06 175452" src="https://github.com/user-attachments/assets/bdf5c9a8-881f-48f8-acb8-218e1eb653cc" />
<img width="2862" height="1532" alt="Ekran görüntüsü 2026-06-06 175506" src="https://github.com/user-attachments/assets/164a38b9-3672-4f5c-a3c3-1e5e0afb0c61" />
<img width="2875" height="1549" alt="Ekran görüntüsü 2026-06-06 175517" src="https://github.com/user-attachments/assets/d4b77bc3-cfb1-4d9a-a8a7-7fe04328412a" />
<img width="2872" height="1544" alt="Ekran görüntüsü 2026-06-06 175429" src="https://github.com/user-attachments/assets/905136aa-cbca-466b-86fa-30321b3b5289" />
