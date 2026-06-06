import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Send, 
  AlertTriangle, 
  Activity,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Search,
  Check,
  ChevronRight,
  User,
  Heart,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';
const generateId = () => Math.random().toString(36).substring(2, 11);

// 5 Categories, 10 Products each with premium meta details (Total 50 Products)
const PRODUCTS = {
  "Elektronik": [
    { name: "iPhone 15 Pro Max 256GB", price: 72999, originalPrice: 76999, desc: "Titanyum kasa, A17 Pro çip, gelişmiş kamera sistemi.", id: "el-1", rating: 4.9, reviews: 1204, badge: "En Çok Satan", gradient: "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)", emoji: "📱" },
    { name: "Macbook Air M3 13.6\"", price: 45999, originalPrice: 49999, desc: "M3 işlemci, 8GB RAM, 256GB SSD, sessiz tasarım.", id: "el-2", rating: 4.8, reviews: 812, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)", emoji: "💻" },
    { name: "Kablosuz ANC Kulaklık", price: 2499, originalPrice: 2999, desc: "Aktif gürültü engelleme, 40 saat pil ömrü, mikrofonlu.", id: "el-3", rating: 4.7, reviews: 450, badge: "Fırsat Ürünü", gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", emoji: "🎧" },
    { name: "Akıllı Saat Pro GPS", price: 4999, originalPrice: 5499, desc: "AMOLED ekran, kalp ritmi takibi, uyku analizi.", id: "el-4", rating: 4.6, reviews: 312, badge: "Popüler", gradient: "linear-gradient(135deg, #ec4899 0%, #d946ef 100%)", emoji: "⌚" },
    { name: "Android Tablet 11\" IPS", price: 5499, originalPrice: 5999, desc: "8GB RAM, 128GB depolama, 8000 mAh batarya.", id: "el-5", rating: 4.5, reviews: 154, badge: null, gradient: "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)", emoji: "📟" },
    { name: "4K OLED Smart TV 55\"", price: 28999, originalPrice: 30999, desc: "Yapay zeka işlemcili, HDR10+, dahili uydu alıcılı.", id: "el-6", rating: 4.8, reviews: 290, badge: "Süper Fiyat", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", emoji: "📺" },
    { name: "20.000 mAh Hızlı Şarj Powerbank", price: 799, originalPrice: 999, desc: "Type-C girişli, 22.5W hızlı şarj desteği.", id: "el-7", rating: 4.6, reviews: 940, badge: null, gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)", emoji: "🔋" },
    { name: "Bluetooth Hoparlör 20W", price: 1299, originalPrice: 1599, desc: "Suya dayanıklı IPX7, 12 saat kesintisiz müzik.", id: "el-8", rating: 4.7, reviews: 520, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)", emoji: "🔊" },
    { name: "144Hz Oyuncu Monitörü 24\"", price: 6499, originalPrice: 6999, desc: "1ms tepki süresi, IPS panel, FreeSync/G-Sync.", id: "el-9", rating: 4.8, reviews: 180, badge: "Çok Satan", gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", emoji: "🖥️" },
    { name: "Kablosuz Oyuncu Faresi", price: 1199, originalPrice: 1499, desc: "16.000 DPI, RGB aydınlatma, ultra hafif gövde.", id: "el-10", rating: 4.5, reviews: 310, badge: null, gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)", emoji: "🖱️" }
  ],
  "Moda & Giyim": [
    { name: "Kışlık Şişme Mont", price: 2499, originalPrice: 2999, desc: "Su geçirmez kumaş, rüzgar korumalı, termal dolgulu.", id: "md-1", rating: 4.7, reviews: 104, badge: "Çok Satan", gradient: "linear-gradient(135deg, #475569 0%, #1e293b 100%)", emoji: "🧥" },
    { name: "Hafif Koşu Ayakkabısı", price: 1899, originalPrice: 2199, desc: "Nefes alabilen file yüzey, ortopedik taban.", id: "md-2", rating: 4.8, reviews: 320, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)", emoji: "👟" },
    { name: "Oversize Kapüşonlu Sweatshirt", price: 699, originalPrice: 899, desc: "%100 pamuklu, içi şardonlu kalın kumaş.", id: "md-3", rating: 4.6, reviews: 812, badge: "En Popüler", gradient: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)", emoji: "👕" },
    { name: "Slim Fit Kot Pantolon", price: 799, originalPrice: 999, desc: "Likralı esnek kumaş, rahat kalıp kot pantolon.", id: "md-4", rating: 4.4, reviews: 540, badge: null, gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", emoji: "👖" },
    { name: "Pamuklu Basic Tişört 3lü Paket", price: 299, originalPrice: 399, desc: "Siyah, beyaz, gri basic o yaka tişört set.", id: "md-5", rating: 4.5, reviews: 928, badge: "Fırsat Ürünü", gradient: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)", emoji: "👕" },
    { name: "Hakiki Deri Ceket", price: 4999, originalPrice: 5499, desc: "Yumuşak kuzu derisi, astarlı, şık tasarım.", id: "md-6", rating: 4.9, reviews: 88, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", emoji: "🧥" },
    { name: "Polarize Spor Güneş Gözlüğü", price: 899, originalPrice: 1199, desc: "UV400 korumalı, kırılmaz çerçeve filtre.", id: "md-7", rating: 4.6, reviews: 140, badge: null, gradient: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)", emoji: "🕶️" },
    { name: "Su Geçirmez Sırt Çantası", price: 1199, originalPrice: 1399, desc: "Laptop korumalı bölme, ergonomik omuz askısı.", id: "md-8", rating: 4.7, reviews: 420, badge: "Çok Satan", gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)", emoji: "🎒" },
    { name: "Klasik Çelik Kol Saati", price: 3499, originalPrice: 3899, desc: "Su geçirmez çelik kordon, takvim göstergesi.", id: "md-9", rating: 4.8, reviews: 115, badge: "Özel Serisi", gradient: "linear-gradient(135deg, #cbd5e1 0%, #475569 100%)", emoji: "⌚" },
    { name: "Örgü Bere & Atkı Seti", price: 399, originalPrice: 499, desc: "Yumuşak akrilik iplik, soğuk geçirmez çift kat.", id: "md-10", rating: 4.5, reviews: 215, badge: null, gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)", emoji: "🧣" }
  ],
  "Ev & Yaşam": [
    { name: "Filtre Kahve Makinesi", price: 1999, originalPrice: 2499, desc: "Zaman ayarlı, 1.25L cam sürahili otomatik kapanma.", id: "ev-1", rating: 4.8, reviews: 320, badge: "Çok Satan", gradient: "linear-gradient(135deg, #78350f 0%, #d97706 100%)", emoji: "☕" },
    { name: "Ahşap Çalışma Masası", price: 2899, originalPrice: 3299, desc: "Metal iskelet, meşe kaplama çalışma masası.", id: "ev-2", rating: 4.7, reviews: 95, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)", emoji: "🪵" },
    { name: "Ortopedik Çalışma Koltuğu", price: 3499, originalPrice: 3999, desc: "Fileli sırt desteği, ayarlanabilir boyun ve kolçak.", id: "ev-3", rating: 4.6, reviews: 180, badge: "Ergonomik", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", emoji: "🪑" },
    { name: "Çift Cidarlı Çelik Termos 1L", price: 699, originalPrice: 899, desc: "24 saat soğuk, 12 saat sıcak tutma kapasitesi.", id: "ev-4", rating: 4.7, reviews: 540, badge: "Popüler", gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", emoji: "🥤" },
    { name: "Ranforce Nevresim Takımı", price: 1299, originalPrice: 1599, desc: "%100 pamuk, solmayan renk garantili nevresim.", id: "ev-5", rating: 4.5, reviews: 290, badge: null, gradient: "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)", emoji: "🛏️" },
    { name: "Dokunmatik Masa Lambası", price: 499, originalPrice: 599, desc: "3 kademeli ışık ayarı, şarj edilebilir pilli.", id: "ev-6", rating: 4.5, reviews: 142, badge: null, gradient: "linear-gradient(135deg, #eab308 0%, #fef08a 100%)", emoji: "💡" },
    { name: "3 Katlı Metal Bitki Standı", price: 649, originalPrice: 749, desc: "Fırın boyalı metal gövde, saksı standı.", id: "ev-7", rating: 4.4, reviews: 88, badge: null, gradient: "linear-gradient(135deg, #10b981 0%, #a7f3d0 100%)", emoji: "🪴" },
    { name: "El Yapımı Seramik Kupa", price: 249, originalPrice: 299, desc: "Özel tasarım el yapımı porselen çay/kahve bardağı.", id: "ev-8", rating: 4.8, reviews: 312, badge: "Tasarım", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", emoji: "🍵" },
    { name: "Granit Döküm Tava 28cm", price: 799, originalPrice: 999, desc: "Yapışmaz iç kaplama döküm tava, dayanıklı gövde.", id: "ev-9", rating: 4.6, reviews: 215, badge: "Mutfak", gradient: "linear-gradient(135deg, #475569 0%, #334155 100%)", emoji: "🍳" },
    { name: "Premium Oda Kokusu", price: 349, originalPrice: 449, desc: "Lavanta ve yasemin esanslı uzun ömürlü koku.", id: "ev-10", rating: 4.7, reviews: 680, badge: "Çok Satan", gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)", emoji: "🪔" }
  ],
  "Kozmetik & Bakım": [
    { name: "Erkek Parfüm EDP 100ml", price: 2499, originalPrice: 2899, desc: "Odunsu ve baharatlı kalıcı kokulu lüks parfüm.", id: "kz-1", rating: 4.8, reviews: 540, badge: "İmza Koku", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", emoji: "🧴" },
    { name: "Yüz Temizleme Jeli 200ml", price: 349, originalPrice: 449, desc: "Gözenek sıkılaştırıcı, akne karşıtı arındırıcı.", id: "kz-2", rating: 4.6, reviews: 810, badge: "Çok Satan", gradient: "linear-gradient(135deg, #10b981 0%, #a7f3d0 100%)", emoji: "🧼" },
    { name: "SPF 50+ Güneş Kremi", price: 429, originalPrice: 499, desc: "Yüksek korumalı, yağsız hafif formüllü krem.", id: "kz-3", rating: 4.7, reviews: 1024, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #f59e0b 0%, #fef08a 100%)", emoji: "☀️" },
    { name: "Saç Şekillendirici Seti", price: 3899, originalPrice: 4299, desc: "Farklı başlıklar içeren üflemeli saç düzleştirici.", id: "kz-4", rating: 4.8, reviews: 195, badge: "Premium", gradient: "linear-gradient(135deg, #ec4899 0%, #c084fc 100%)", emoji: "💇‍♀️" },
    { name: "Yoğun Nemlendirici 50ml", price: 289, originalPrice: 349, desc: "Hiyalüronik asit içeren kuru ciltler için krem.", id: "kz-5", rating: 4.5, reviews: 490, badge: null, gradient: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)", emoji: "🧴" },
    { name: "Şarjlı Tıraş Makinesi", price: 1499, originalPrice: 1799, desc: "Esnek tıraş başlıkları, hassas düzeltici makine.", id: "kz-6", rating: 4.6, reviews: 312, badge: "Çok Satan", gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)", emoji: "🪒" },
    { name: "Akıllı Diş Fırçası", price: 1199, originalPrice: 1399, desc: "3 farklı temizleme modu, zamanlayıcılı şarjlı fırça.", id: "kz-7", rating: 4.7, reviews: 260, badge: "Yeni Ürün", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", emoji: "🪥" },
    { name: "Doğal Dudak Balmı Seti 3lü", price: 149, originalPrice: 199, desc: "Çilek, nane ve şeftali aromalı dudak koruyucu.", id: "kz-8", rating: 4.5, reviews: 710, badge: null, gradient: "linear-gradient(135deg, #f43f5e 0%, #f472b6 100%)", emoji: "💄" },
    { name: "Kolajen Yüz Maskesi Seti 10lu", price: 229, originalPrice: 299, desc: "Cilde elastikiyet kazandıran kağıt maske kiti.", id: "kz-9", rating: 4.8, reviews: 380, badge: "Fırsat Ürünü", gradient: "linear-gradient(135deg, #a855f7 0%, #e879f9 100%)", emoji: "🎭" },
    { name: "Limon Kolonyası 400ml", price: 89, originalPrice: 119, desc: "80 derece limon esanslı ferahlatıcı kolonya.", id: "kz-10", rating: 4.7, reviews: 1120, badge: null, gradient: "linear-gradient(135deg, #fbbf24 0%, #fef08a 100%)", emoji: "🍋" }
  ],
  "Anne & Bebek": [
    { name: "Bebek Arabası Katlanabilir", price: 8499, originalPrice: 9499, desc: "Tek elle katlanan, hafif alüminyum gövdeli araba.", id: "be-1", rating: 4.9, reviews: 154, badge: "Kargo Bedava", gradient: "linear-gradient(135deg, #475569 0%, #0f172a 100%)", emoji: "👶" },
    { name: "Bebek Bezi 120li Paket", price: 549, originalPrice: 649, desc: "Sızdırmaz bariyerli, hassas ciltler için bebek bezi.", id: "be-2", rating: 4.8, reviews: 2040, badge: "Çok Satan", gradient: "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)", emoji: "🧷" },
    { name: "Peluş Oyuncak Ayı 80cm", price: 499, originalPrice: 599, desc: "Antialerjik kumaş, yumuşacık dolgulu büyük ayı.", id: "be-3", rating: 4.7, reviews: 680, badge: "Hediye", gradient: "linear-gradient(135deg, #f59e0b 0%, #ffedd5 100%)", emoji: "🧸" },
    { name: "Ayarlanabilir Mama Sandalyesi", price: 1299, originalPrice: 1499, desc: "Emniyet kemerli, yıkanabilir tepsili mama koltuğu.", id: "be-4", rating: 4.6, reviews: 290, badge: "Güvenli", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", emoji: "🪑" },
    { name: "Bebek Masaj Yağı 200ml", price: 189, originalPrice: 249, desc: "Doğal zeytinyağı ve papatya özlü bebek yağı.", id: "be-5", rating: 4.7, reviews: 412, badge: null, gradient: "linear-gradient(135deg, #fbbf24 0%, #ffedd5 100%)", emoji: "🧴" },
    { name: "Biberon Cam Seti Antikolik", price: 389, originalPrice: 449, desc: "Gaz yapmayan özel emzik tasarımlı cam biberon.", id: "be-6", rating: 4.8, reviews: 560, badge: "En İyi Seçim", gradient: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)", emoji: "🍼" },
    { name: "Örgü Bebek Patiği 2li", price: 149, originalPrice: 199, desc: "Yumuşak pamuklu iplikten örülmüş bebek patiği.", id: "be-7", rating: 4.5, reviews: 180, badge: null, gradient: "linear-gradient(135deg, #f43f5e 0%, #fda4af 100%)", emoji: "🧦" },
    { name: "Silikon Emzik 2li Set", price: 179, originalPrice: 229, desc: "Ortodontik damak kurumalı silikon emzik takımı.", id: "be-8", rating: 4.6, reviews: 840, badge: "BPA Yok", gradient: "linear-gradient(135deg, #a855f7 0%, #e879f9 100%)", emoji: "👶" },
    { name: "Islak Mendil Hassas 12li", price: 299, originalPrice: 399, desc: "%99 saf su içeren alkolsüz ıslak mendil seti.", id: "be-9", rating: 4.8, reviews: 1940, badge: "Çok Satan", gradient: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)", emoji: "🧻" },
    { name: "Göz Yakmayan Şampuan 500ml", price: 119, originalPrice: 159, desc: "Papatya özlü, paraben içermeyen bebek şampuanı.", id: "be-10", rating: 4.7, reviews: 1205, badge: null, gradient: "linear-gradient(135deg, #f59e0b 0%, #fde047 100%)", emoji: "🧴" }
  ]
};

const CATEGORY_ICONS = {
  "Elektronik": "💻",
  "Moda & Giyim": "👕",
  "Ev & Yaşam": "☕",
  "Kozmetik & Bakım": "🧴",
  "Anne & Bebek": "👶"
};

function App() {
  // Session tracking
  const [currentUserId] = useState(() => Math.floor(10000 + Math.random() * 90000));
  const [sessionId] = useState(generateId);
  const [lastDwellStart, setLastDwellStart] = useState(Date.now());
  const [apiConnected, setApiConnected] = useState(false);

  // Shopping site state
  const [activeCategory, setActiveCategory] = useState("Elektronik");
  const [cart, setCart] = useState([]);
  const [storePage, setStorePage] = useState('home'); // 'home', 'cart', 'checkout', 'error', 'support'
  const [userClicksHistory, setUserClicksHistory] = useState([]);
  const [loggerOpen, setLoggerOpen] = useState(true);
  const [checklist, setChecklist] = useState({
    dwell: false,
    cart: false,
    error: false,
    ticket: false,
    pipeline: false
  });

  // Micro-animations: Tracking item addition state (product.id -> boolean)
  const [addingProduct, setAddingProduct] = useState({});

  // Forms
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Technical');

  // Product details modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOpenTime, setProductOpenTime] = useState(null);

  // Interactive Credit Card simulator states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Check backend connectivity and poll pipeline status on mount
  useEffect(() => {
    fetch(`${API_BASE}/pipeline-status`)
      .then(() => {
        setApiConnected(true);
        setTimeout(() => logClick('/store/home', 'view'), 500);
      })
      .catch((err) => {
        console.error("FastAPI Backend Offline on mount:", err);
        setApiConnected(false);
        setTimeout(() => logClick('/store/home', 'view'), 500);
      });

    // Poll pipeline status for checklist
    const checkPipelineStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/pipeline-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'Running' || data.status === 'Success') {
            setChecklist(prev => ({ ...prev, pipeline: true }));
          }
        }
      } catch (err) {
        console.error("Error fetching pipeline status for checklist:", err);
      }
    };

    const interval = setInterval(checkPipelineStatus, 3000);
    checkPipelineStatus();
    return () => clearInterval(interval);
  }, []);

  const addLocalLog = (msg) => {
    setUserClicksHistory(prev => [msg, ...prev].slice(0, 15));
  };

  // Log click event to backend API (FastAPI -> Kafka)
  const logClick = async (pageUrl, action) => {
    const now = Date.now();
    const dwellTime = ((now - lastDwellStart) / 1000).toFixed(2);
    setLastDwellStart(now);

    const eventData = {
      user_id: currentUserId,
      session_id: sessionId,
      page_url: pageUrl,
      action: action,
      device: 'desktop',
      dwell_time_seconds: parseFloat(dwellTime) > 0 ? parseFloat(dwellTime) : 1.0
    };

    // Format logger terminal messages nicely
    let formattedText = '';
    if (action.includes('add_to_cart')) {
      formattedText = `[API] User #${currentUserId} added item: ${action.split(':')[1]} to cart.`;
    } else if (action.includes('dwell_on_product')) {
      formattedText = `[KAFKA] User #${currentUserId} dwelt ${dwellTime}s on product: ${action.split(':')[1]}`;
    } else if (action === 'error_page') {
      formattedText = `[API] HTTP 500 Error registered at checkout redirect.`;
    } else if (action === 'purchase') {
      formattedText = `[KAFKA] Transaction complete. Order logged in database.`;
    } else if (action === 'submit_ticket') {
      formattedText = `[API] Customer ticket submitted successfully to support queue.`;
    } else {
      formattedText = `[INFO] ${action.toUpperCase()} -> ${pageUrl}`;
    }

    addLocalLog(formattedText);

    try {
      const res = await fetch(`${API_BASE}/log-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        setApiConnected(true);
      } else {
        setApiConnected(false);
      }
    } catch (err) {
      console.error("Failed to log event:", err);
      setApiConnected(false);
    }
  };

  const browseTo = (page) => {
    logClick(`/store/${storePage}`, 'scroll');
    setStorePage(page);
    logClick(`/store/${page}`, 'view');
  };

  const handleCategoryChange = (category) => {
    logClick(`/store/home?category=${activeCategory}`, 'scroll');
    setActiveCategory(category);
    logClick(`/store/home?category=${category}`, 'view');
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    
    // Trigger button success animation
    setAddingProduct(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddingProduct(prev => ({ ...prev, [product.id]: false }));
    }, 1500);

    logClick(`/store/home`, `add_to_cart:${product.name}`);
    setChecklist(prev => ({ ...prev, cart: true }));
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
    logClick(`/store/cart`, `update_qty_id:${id}`);
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setProductOpenTime(Date.now());
    logClick(`/store/product/${product.id}`, `view_details:${product.name}`);
  };

  const closeProductDetails = () => {
    if (selectedProduct && productOpenTime) {
      const duration = ((Date.now() - productOpenTime) / 1000).toFixed(2);
      logClick(`/store/product/${selectedProduct.id}`, `close_details:${selectedProduct.name}`);
      
      const eventData = {
        user_id: currentUserId,
        session_id: sessionId,
        page_url: `/store/product/${selectedProduct.id}`,
        action: `dwell_on_product:${selectedProduct.name}`,
        device: 'desktop',
        dwell_time_seconds: parseFloat(duration) > 0 ? parseFloat(duration) : 1.0
      };
      
      if (apiConnected) {
        fetch(`${API_BASE}/log-click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        }).catch(err => console.error("Dwell log error:", err));
      }
      addLocalLog(`[KAFKA] User #${currentUserId} dwelt ${duration}s on product: ${selectedProduct.name}`);
      
      if (parseFloat(duration) >= 5) {
        setChecklist(prev => ({ ...prev, dwell: true }));
      }
    }
    setSelectedProduct(null);
    setProductOpenTime(null);
  };

  const triggerMockError = () => {
    setStorePage('error');
    logClick('/store/checkout', 'error_page');
    setChecklist(prev => ({ ...prev, error: true }));
  };

  const completePurchase = () => {
    setCart([]);
    logClick('/store/checkout', 'purchase');
    alert("Siparişiniz Simülasyon Ortamında Başarıyla Alındı.");
    setStorePage('home');
  };

  const submitSupportTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDescription) return;

    try {
      const res = await fetch(`${API_BASE}/submit-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          subject: ticketSubject,
          description: ticketDescription
        })
      });

      if (res.ok) {
        setTicketSubject('');
        setTicketDescription('');
        alert("Destek talebiniz iletildi. Lakehouse üzerinden biletinizi inceleyebilirsiniz!");
        logClick('/store/support', 'submit_ticket');
        setChecklist(prev => ({ ...prev, ticket: true }));
        browseTo('home');
      }
    } catch (err) {
      console.error(err);
      alert("API bağlantı hatası oluştu.");
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isShippingFree = cartSubtotal >= 500;
  const shippingFee = cartSubtotal > 0 && !isShippingFree ? 29.90 : 0;
  const cartTotal = cartSubtotal + shippingFee;
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= fullStars ? '#f59e0b' : '#cbd5e1', fontSize: '1rem', marginRight: '1px' }}>★</span>
      );
    }
    return <div style={{ display: 'flex' }}>{stars}</div>;
  };

  // Colored logger outputs
  const formatLogMessage = (msg) => {
    if (msg.includes('[API]')) {
      const parts = msg.split('[API]');
      return (
        <span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>[API GATEWAY]</span> 
          <span style={{ color: '#e2e8f0' }}>{parts[1]}</span>
        </span>
      );
    }
    if (msg.includes('[KAFKA]')) {
      const parts = msg.split('[KAFKA]');
      return (
        <span>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>[REDPANDA KAFKA]</span> 
          <span style={{ color: '#a7f3d0' }}>{parts[1]}</span>
        </span>
      );
    }
    if (msg.includes('[INFO]')) {
      const parts = msg.split('[INFO]');
      return (
        <span>
          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>[TELEMETRY]</span> 
          <span style={{ color: '#94a3b8' }}>{parts[1]}</span>
        </span>
      );
    }
    return <span style={{ color: '#94a3b8' }}>{msg}</span>;
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* GLASSMORPHIC HEADER SECTION */}
      <header className="glass-header">
        
        {/* Top bar info */}
        <div style={{ background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid rgba(226, 232, 240, 0.4)', padding: '0.45rem 2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="pulse-indicator" style={{ display: 'inline-block', width: '6px', height: '6px', transform: 'translateY(-1px)' }}></span>
              SANDBOX SIMÜLATÖRÜ
            </span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span>Kampanyalar</span>
            <span>Müşteri Hizmetleri</span>
          </div>
          
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <span>Aktif Müşteri ID: <strong style={{ color: 'var(--text-primary)' }}>User #{currentUserId}</strong></span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <a 
              href="http://localhost:5173" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              📊 Analiz Paneli (Dashboard) <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Main Navbar */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
          
          {/* Logo with hover glow */}
          <div onClick={() => browseTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)' }}>
              <ShoppingBag size={20} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Shop<span style={{ color: 'var(--primary)' }}>Sandbox</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', marginLeft: '6px', verticalAlign: 'middle', border: '1.5px solid rgba(225,29,72,0.25)', padding: '1px 8px', borderRadius: '20px', background: 'var(--primary-glow)' }}>METRIC HUD</span>
            </span>
          </div>

          {/* Elegant Search Bar */}
          <div style={{ flex: 1, position: 'relative', maxWidth: '500px' }}>
            <input 
              type="text" 
              placeholder="Ürün veya kategori arayın (tıklamalar kaydedilir)..." 
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                border: '1.5px solid #cbd5e1', 
                borderRadius: '30px', 
                outline: 'none', 
                fontSize: '0.85rem', 
                color: 'var(--text-primary)',
                background: '#ffffff',
                transition: 'all 0.25s'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }} onClick={() => browseTo('support')}>
              <User size={18} />
              <span>Destek Merkezi</span>
            </div>
            
            <div 
              onClick={() => browseTo('cart')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer', 
                color: cartItemsCount > 0 ? 'var(--primary)' : 'var(--text-primary)', 
                fontSize: '0.85rem', 
                fontWeight: '800', 
                position: 'relative',
                background: cartItemsCount > 0 ? 'var(--primary-glow)' : 'transparent',
                padding: '0.55rem 1.15rem',
                borderRadius: '24px',
                border: cartItemsCount > 0 ? '1px solid rgba(225, 29, 72, 0.2)' : '1px solid rgba(226, 232, 240, 0.8)',
                transition: 'all 0.25s'
              }}
            >
              <ShoppingCart size={18} />
              <span>Sepetim</span>
              {cartItemsCount > 0 && (
                <span style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  fontSize: '0.7rem', 
                  fontWeight: '800',
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(225,29,72,0.35)'
                }}>
                  {cartItemsCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* BODY MAIN */}
      <main style={{ maxWidth: '1400px', margin: '2rem auto 0', padding: '0 2rem', paddingBottom: '4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: loggerOpen ? '1fr 380px' : '1fr',
          gap: '2.5rem',
          alignItems: 'start',
          transition: 'all 0.35s ease'
        }}>
          
          {/* Active Store View (Left Column) */}
          <div style={{ minWidth: 0, width: '100%' }}>
            
            {/* VIEW 1: HOME PAGE */}
        {storePage === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* PRODUCT BROWSER */}
            <div style={{ width: '100%' }}>
              {/* Premium Editorial Hero Banner */}
              <div style={{ 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #881337 100%)', 
                borderRadius: '24px', 
                padding: '2.5rem 3rem', 
                color: 'white', 
                marginBottom: '2rem', 
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 40px -10px rgba(15, 23, 42, 0.15)'
              }}>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '9rem', opacity: 0.08, userSelect: 'none' }}>📦</div>
                <div style={{ maxWidth: '75%', position: 'relative', zIndex: 2 }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.08)', 
                    border: '1.5px solid rgba(255,255,255,0.15)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '0.35rem 0.95rem', 
                    borderRadius: '30px', 
                    fontSize: '0.7rem', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.07em', 
                    marginBottom: '1.15rem' 
                  }}>
                    <Sparkles size={12} color="#fbbf24" style={{ animation: 'spin-icon 4s linear infinite' }} /> KAFKA STREAM & DELTA LAKE TESTBED
                  </div>
                  <h2 style={{ fontSize: '2.3rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '0.85rem', fontFamily: 'var(--font-heading)' }}>Gerçek Zamanlı Müşteri Sürtünme Raporu Simülatörü</h2>
                  <p style={{ opacity: 0.85, fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Sitedeki gezintiniz, sepet güncellemeleriniz ve açacağınız destek talepleri anlık olarak zenginleştirilir. DuckDB SQL birleşimi ile analiz kontrol paneline yansır.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => browseTo('support')} className="btn-primary" style={{ background: '#ffffff', color: 'var(--text-primary)', border: 'none', boxShadow: 'none' }}>
                      Şikayet Raporu Oluştur <ArrowRight size={14} />
                    </button>
                    <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '0.8rem 1.25rem' }}>
                      Panel Kontrol Odası <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Modern Category Selector */}
              <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {Object.keys(PRODUCTS).map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => handleCategoryChange(cat)}
                    className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{CATEGORY_ICONS[cat]}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* Custom Products Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {PRODUCTS[activeCategory].map((prod) => {
                  const discount = prod.originalPrice ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) : 0;
                  return (
                    <div key={prod.id} className="product-card" onClick={() => openProductDetails(prod)}>
                      
                      {/* Top Badges / Wishlist */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: '1.25rem', left: '1.25rem', right: '1.25rem', zIndex: 5 }}>
                        {prod.badge ? (
                          <span className="badge badge-primary" style={{ fontSize: '0.65rem', background: '#ffffff', color: 'var(--primary)', fontWeight: 800, padding: '0.2rem 0.6rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                            {prod.badge}
                          </span>
                        ) : <div></div>}
                        <button 
                          onClick={(e) => { e.stopPropagation(); alert('Simüle beğeni kaydedildi!'); }}
                          style={{ border: 'none', background: 'rgba(255, 255, 255, 0.9)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                          <Heart size={13} />
                        </button>
                      </div>

                      {/* Image Gradient Wrapper */}
                      <div className="product-image-container">
                        <div className="product-image-gradient-overlay" style={{ background: prod.gradient }}></div>
                        <span className="product-emoji">{prod.emoji}</span>
                        <button className="quick-view-btn">
                          <Sparkles size={12} /> İncele (Dwell)
                        </button>
                      </div>

                      {/* Meta Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.25rem 0' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeCategory}</span>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '20px', fontWeight: 700 }}>
                          {prod.name}
                        </h4>
                        
                        {/* Star Rating Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                          {renderStars(prod.rating)}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{prod.rating}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({prod.reviews} yorum)</span>
                        </div>
                        
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px', lineHeight: 1.45, marginTop: '0.2rem' }}>
                          {prod.desc}
                        </p>
                      </div>

                      {/* Price and Cart Action */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.25rem' }}>
                            {prod.price.toLocaleString('tr-TR')} TL
                          </span>
                          {prod.originalPrice && (
                            <>
                              <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '0.75rem' }}>
                                {prod.originalPrice.toLocaleString('tr-TR')} TL
                              </span>
                              <span className="discount-pill">%{discount}</span>
                            </>
                          )}
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                          className={`btn-primary ${addingProduct[prod.id] ? 'btn-success' : ''}`} 
                          style={{ width: '100%', padding: '0.7rem', fontSize: '0.8rem', gap: '6px', borderRadius: '10px' }}
                        >
                          {addingProduct[prod.id] ? (
                            <>
                              <Check size={14} /> Sepete Eklendi
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={14} /> Sepete Ekle
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modern Trust Footer Badges */}
              <div className="footer-badge-grid">
                <div className="footer-badge-card">
                  <div className="footer-badge-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>🛡️</div>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 700 }}>Güvenli Ödeme Arayüzü</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>256-bit şifrelenmiş bankacılık simülasyonu</p>
                  </div>
                </div>
                <div className="footer-badge-card">
                  <div className="footer-badge-icon" style={{ background: 'rgba(225, 29, 72, 0.08)', color: 'var(--primary)' }}>🔄</div>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 700 }}>Koşulsuz İade Desteği</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>Simüle edilen siparişlerde 14 gün test imkanı</p>
                  </div>
                </div>
                <div className="footer-badge-card">
                  <div className="footer-badge-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>⚡</div>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 700 }}>Anlık Veri Akışı</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>Saniyeler içinde Kafka & Delta Lake işleme</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CART PAGE */}
        {storePage === 'cart' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={24} style={{ color: 'var(--primary)' }} />
              Alışveriş Sepeti
            </h3>
            
            {cart.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '7fr 4fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Cart Items List */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        
                        {/* Mini product thumbnail with gradient */}
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '12px', 
                          background: item.gradient, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '1.8rem',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                        }}>
                          {item.emoji}
                        </div>
                        
                        <div>
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>{item.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tekil Fiyat: {item.price.toLocaleString('tr-TR')} TL</span>
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '32px' }}>
                          <button onClick={() => updateCartQty(item.id, -1)} style={{ padding: '0 0.6rem', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '0 0.75rem', fontSize: '0.85rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} style={{ padding: '0 0.6rem', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        <span style={{ fontWeight: '800', minWidth: '95px', textAlign: 'right', fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {(item.price * item.qty).toLocaleString('tr-TR')} TL
                        </span>

                        <button 
                          onClick={() => updateCartQty(item.id, -item.qty)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={() => browseTo('home')} className="btn-secondary" style={{ width: 'fit-content', border: 'none', color: 'var(--primary)', fontWeight: 700, paddingLeft: 0 }}>
                    ← Alışverişe Geri Dön
                  </button>
                </div>

                {/* Sticky Order Summary Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Sipariş Özeti</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Ara Toplam:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cartSubtotal.toLocaleString('tr-TR')} TL</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Kargo Ücreti:</span>
                      <span>
                        {isShippingFree ? (
                          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Bedava</span>
                        ) : (
                          `${shippingFee.toLocaleString('tr-TR')} TL`
                        )}
                      </span>
                    </div>
                    {isShippingFree && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--success)', background: 'var(--success-glow)', padding: '0.45rem 0.65rem', borderRadius: '8px' }}>
                        <span>500 TL Üzeri Ücretsiz Kargo Kampanyası:</span>
                        <span>-29,90 TL</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Toplam Tutar:</span>
                    <span style={{ color: 'var(--primary)', fontSize: '1.6rem', fontWeight: 800 }}>{cartTotal.toLocaleString('tr-TR')} TL</span>
                  </div>

                  <button 
                    onClick={() => browseTo('checkout')} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', fontSize: '0.95rem' }}
                  >
                    Ödeme Ekranına İlerle <ArrowRight size={16} />
                  </button>
                </div>

              </div>
            ) : (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={36} />
                </div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sepetiniz Boş Görünüyor</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Mağazamızda yer alan ürünleri inceleyip sepete ekleyerek test verileri üretebilirsiniz.</p>
                <button onClick={() => browseTo('home')} className="btn-primary">Alışverişe Başla</button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CHECKOUT PAGE */}
        {storePage === 'checkout' && (
          <div style={{ maxWidth: '950px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Güvenli Ödeme Noktası</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Checkout billing details & Credit card input (LEFT) */}
              <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Kart Bilgileri</h4>
                
                {/* HOLOGRAPHIC LUXURY CREDIT CARD */}
                <div className="holo-card">
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="card-chip"></div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, fontStyle: 'italic', fontFamily: 'var(--font-heading)' }}>ShopSandbox Pay</span>
                  </div>

                  <div style={{ fontSize: '1.4rem', margin: '1.25rem 0 0.5rem', textAlign: 'center', letterSpacing: '2.5px' }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.7, letterSpacing: 'normal', marginBottom: '2px' }}>KART SAHİBİ</span>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{cardName.toUpperCase() || 'AD SOYAD'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.7, letterSpacing: 'normal', marginBottom: '2px' }}>S.K.T</span>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{cardExpiry || 'AA/YY'}</span>
                    </div>
                    
                    {/* Mastercard dual-circles simulator */}
                    <div style={{ display: 'flex', position: 'relative', width: '38px', height: '24px' }}>
                      <div style={{ background: '#eb001b', width: '22px', height: '22px', borderRadius: '50%', position: 'absolute', left: 0 }}></div>
                      <div style={{ background: '#ff5f00', width: '22px', height: '22px', borderRadius: '50%', position: 'absolute', right: 0, opacity: 0.85 }}></div>
                    </div>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); completePurchase(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Kart Üzerindeki İsim</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ahmet Yılmaz" 
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label">Kart Numarası</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="4355 9233 4110 5622" 
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        // Simple formatting auto-space
                        let val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      required 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Son Kullanma Tarihi</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="MM/YY" 
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.length === 2 && !val.includes('/')) {
                            val += '/';
                          }
                          setCardExpiry(val);
                        }}
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label">Güvenlik Kodu (CVC)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="***" 
                        maxLength={3}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.9rem', borderRadius: '12px' }}>
                      Güvenli Ödeme Yap: {cartTotal.toLocaleString('tr-TR')} TL
                    </button>
                    <button 
                      type="button" 
                      onClick={triggerMockError} 
                      className="btn-secondary" 
                      style={{ 
                        width: '100%', 
                        padding: '0.9rem', 
                        borderColor: 'var(--primary)', 
                        color: 'var(--primary)', 
                        background: 'var(--primary-glow)',
                        borderRadius: '12px'
                      }}
                    >
                      ⚠️ Ödemeyi Hata Verterek Simüle Et (Hata Sayfasına Atar)
                    </button>
                    <button type="button" onClick={() => browseTo('cart')} className="btn-secondary" style={{ width: '100%', border: 'none' }}>
                      Sepete Geri Dön
                    </button>
                  </div>
                </form>
              </div>

              {/* Order items summary column (RIGHT) */}
              <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Siparişiniz</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '4px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                        {item.name} <strong style={{ color: 'var(--text-primary)' }}>x{item.qty}</strong>
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(item.price * item.qty).toLocaleString('tr-TR')} TL</span>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sepetiniz boş.</div>
                  )}
                </div>

                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Kargo Toplamı:</span>
                    <span>{isShippingFree ? 'Bedava' : `${shippingFee.toLocaleString('tr-TR')} TL`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                    <span>Toplam Ödeme:</span>
                    <span style={{ color: 'var(--primary)', fontSize: '1.35rem', fontWeight: 800 }}>{cartTotal.toLocaleString('tr-TR')} TL</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: ERROR PAGE */}
        {storePage === 'error' && (
          <div className="glass-panel error-pulse" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '3.5rem 2.5rem', borderRadius: '24px' }}>
            <div style={{ 
              width: '76px', 
              height: '76px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              color: 'var(--error)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 20px rgba(239,68,68,0.25)'
            }}>
              <AlertTriangle size={38} />
            </div>
            
            <span className="badge badge-error" style={{ marginBottom: '0.5rem' }}>HTTP STATUS 500</span>
            <h3 style={{ fontSize: '1.45rem', color: 'var(--error)', marginBottom: '0.75rem', fontWeight: 800 }}>Ödeme Ağ Geçidi Bağlantı Hatası</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.65' }}>
              Banka sunucuları ile kurulan SSL bağlantısı zaman aşımına uğradı. Çekim denemesi başarısız oldu. Sipariş onaylanmadı fakat provizyon iptal edilmemiş olabilir. Lütfen destek formu ile durumu bildirin.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => browseTo('support')} className="btn-primary" style={{ background: 'var(--error)', border: 'none', boxShadow: 'none' }}>
                Müşteri Şikayet Raporu İlet
              </button>
              <button onClick={() => browseTo('home')} className="btn-secondary">
                Alışverişe Geri Dön
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: SUPPORT PORTAL */}
        {storePage === 'support' && (
          <div className="glass-panel" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2.2rem' }}>💬</span>
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>Müşteri Destek & Çözüm Merkezi</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Açtığınız biletler ile son tıklama hareketleriniz Gold veri katmanında DuckDB ile birleştirilir.
                </p>
              </div>
            </div>

            <form onSubmit={submitSupportTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Kategori Seçimi</label>
                <select 
                  className="form-input" 
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Technical">Teknik Sorunlar (Sistem Hatası / 500 Hataları)</option>
                  <option value="Billing">Ödeme ve Faturalandırma Sorunları (Para Çekilmesi)</option>
                  <option value="Delivery">Kargo & Teslimat Sorunları</option>
                  <option value="Product Feedback">Ürün Geri Bildirimi & Şikayet</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Bilet Konusu</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Örn: Ödeme yaparken hata aldım" 
                  required 
                />
              </div>
              
              <div>
                <label className="form-label">Şikayet Detayı</label>
                <textarea 
                  className="form-input" 
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows={6}
                  placeholder="Yaşadığınız sorunu detaylıca buraya yazın (Örn: Ödeme yaparken 500 hatası aldım ama hesabımdan para çekildi. Siparişimin onaylanmasını veya iadesini talep ediyorum)." 
                  style={{ resize: 'none', lineHeight: 1.5 }}
                  required 
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Şikayeti Yetkililere Gönder <Send size={14} />
                </button>
                <button type="button" onClick={() => browseTo('home')} className="btn-secondary" style={{ flex: 1 }}>
                  İptal Et
                </button>
              </div>
            </form>
          </div>
        )}

          </div>

          {/* Sticky Simulation Control Sidebar (Right Column) */}
          {loggerOpen && (
            <aside className="sim-sidebar">
              {/* Warning Stripes Simulation Indicator */}
              <div className="sim-indicator-banner" style={{ margin: '-1.25rem -1.25rem 0.5rem -1.25rem', borderRadius: '24px 24px 0 0' }}>
                ⚠️ SİMÜLASYON KONTROL PANELİ
              </div>

              {/* Sidebar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#e11d48', boxShadow: '0 0 8px #e11d48', animation: 'pulse-glow 1.5s infinite' }}></span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.02em' }}>
                    CANLI TELEMETRİ VERİ AKIŞI
                  </span>
                </div>
                <button 
                  onClick={() => setLoggerOpen(false)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.04)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'}
                >
                  ×
                </button>
              </div>

              {/* Sidebar Content (Checklist + Terminal logs) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
                
                {/* Checklist Section */}
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.05em' }}>
                      🎯 SİMÜLASYON ADIMLARI
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {Object.values(checklist).filter(Boolean).length} / 5
                    </span>
                  </div>

                  {/* Checklist container */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    
                    {/* Step 1 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: checklist.dwell ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                      border: checklist.dwell ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      transition: 'all 0.25s ease'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: checklist.dwell ? 'none' : '2px solid var(--text-muted)',
                        background: checklist.dwell ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {checklist.dwell ? '✓' : '1'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: checklist.dwell ? '#065f46' : 'var(--text-primary)', fontWeight: 700, textDecoration: checklist.dwell ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Ürün İnceleme (5+ sn dwell)
                        </div>
                        <div style={{ fontSize: '0.6rem', color: checklist.dwell ? '#047857' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {checklist.dwell ? 'Başarıyla tamamlandı!' : 'Detayı açıp 5 saniyeden fazla bekleyin.'}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: checklist.cart ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                      border: checklist.cart ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      transition: 'all 0.25s ease'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: checklist.cart ? 'none' : '2px solid var(--text-muted)',
                        background: checklist.cart ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {checklist.cart ? '✓' : '2'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: checklist.cart ? '#065f46' : 'var(--text-primary)', fontWeight: 700, textDecoration: checklist.cart ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Sepete Ürün Ekleme
                        </div>
                        <div style={{ fontSize: '0.6rem', color: checklist.cart ? '#047857' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {checklist.cart ? 'Başarıyla tamamlandı!' : 'Sepetinize en az bir ürün ekleyin.'}
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: checklist.error ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                      border: checklist.error ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      transition: 'all 0.25s ease'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: checklist.error ? 'none' : '2px solid var(--text-muted)',
                        background: checklist.error ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {checklist.error ? '✓' : '3'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: checklist.error ? '#065f46' : 'var(--text-primary)', fontWeight: 700, textDecoration: checklist.error ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Hata Simülasyonu Tetikleme
                        </div>
                        <div style={{ fontSize: '0.6rem', color: checklist.error ? '#047857' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {checklist.error ? 'Başarıyla tamamlandı!' : 'Ödeme sayfasında "Hata Simüle Et"e basın.'}
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: checklist.ticket ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                      border: checklist.ticket ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      transition: 'all 0.25s ease'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: checklist.ticket ? 'none' : '2px solid var(--text-muted)',
                        background: checklist.ticket ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {checklist.ticket ? '✓' : '4'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: checklist.ticket ? '#065f46' : 'var(--text-primary)', fontWeight: 700, textDecoration: checklist.ticket ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Şikayet Gönderme
                        </div>
                        <div style={{ fontSize: '0.6rem', color: checklist.ticket ? '#047857' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {checklist.ticket ? 'Başarıyla tamamlandı!' : 'Destek Formundan şikayet gönderin.'}
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: checklist.pipeline ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                      border: checklist.pipeline ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      transition: 'all 0.25s ease'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: checklist.pipeline ? 'none' : '2px solid var(--text-muted)',
                        background: checklist.pipeline ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {checklist.pipeline ? '✓' : '5'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: checklist.pipeline ? '#065f46' : 'var(--text-primary)', fontWeight: 700, textDecoration: checklist.pipeline ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Pipeline'ı Başlatma
                        </div>
                        <div style={{ fontSize: '0.6rem', color: checklist.pipeline ? '#047857' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {checklist.pipeline ? 'Başarıyla tamamlandı!' : 'Dashboard\'a gidip Pipeline\'ı Başlatın.'}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Live logs terminal section */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '160px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 800 }}>
                      $ tail -f clickstream-consumer.sh
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: apiConnected ? '#10b981' : '#ef4444' }}></span>
                      {apiConnected ? 'API Bağlı' : 'Çevrimdışı'}
                    </span>
                  </div>
                  
                  <div style={{
                    flex: 1,
                    background: '#090d16',
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.95rem',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: '4px',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                    color: '#e2e8f0'
                  }}>
                    {userClicksHistory.map((msg, idx) => (
                      <div key={idx} style={{ lineHeight: 1.35 }}>
                        {formatLogMessage(msg)}
                      </div>
                    ))}
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      [API] Simülasyon kanalı aktif. Canlı loglar...
                    </div>
                  </div>
                </div>

              </div>
            </aside>
          )}

        </div>
      </main>

      {/* Floating Simulation Panel Toggle Trigger */}
      {!loggerOpen && (
        <button 
          onClick={() => setLoggerOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            padding: '0.75rem 1.35rem',
            fontWeight: 800,
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
            boxShadow: '0 8px 24px rgba(225, 29, 72, 0.35)',
            cursor: 'pointer',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--primary-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--primary)'; }}
        >
          <Activity size={15} /> Simülasyon Panelini Göster
        </button>
      )}

      {/* PRODUCT DETAILS MODAL (WITH BLUR ACCENTS) */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel modal-enter" style={{
            maxWidth: '520px',
            width: '90%',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Close Button */}
            <button 
              onClick={closeProductDetails}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              ×
            </button>

            {/* Modal Product Image */}
            <div style={{
              height: '190px',
              background: selectedProduct.gradient,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 20px -5px rgba(0,0,0,0.1)'
            }}>
              {selectedProduct.emoji}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                {activeCategory}
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                STOKTA VAR
              </span>
            </div>

            <h3 style={{ fontSize: '1.35rem', margin: '0.5rem 0', color: 'var(--text-primary)', fontWeight: 800 }}>
              {selectedProduct.name}
            </h3>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
              {renderStars(selectedProduct.rating)}
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{selectedProduct.rating}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({selectedProduct.reviews} Müşteri Değerlendirmesi)</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              {selectedProduct.desc} Bu simüle edilmiş ürün, real-time clickstream verileri (dwell-time) takibi için tasarlanmıştır. Bu pencerede durarak bilet analizindeki bekleme süresi ortalamanızı değiştirebilirsiniz.
            </p>

            {/* Footer details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TAVSİYE EDİLEN FİYAT</span>
                <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.45rem' }}>
                  {selectedProduct.price.toLocaleString('tr-TR')} TL
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => { addToCart(selectedProduct); closeProductDetails(); }}
                  className={`btn-primary ${addingProduct[selectedProduct.id] ? 'btn-success' : ''}`}
                  style={{ padding: '0.7rem 1.5rem', borderRadius: '10px' }}
                >
                  {addingProduct[selectedProduct.id] ? (
                    <>
                      <Check size={14} /> Eklendi
                    </>
                  ) : (
                    <>
                      Sepete Ekle
                    </>
                  )}
                </button>
                <button 
                  onClick={closeProductDetails}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.25rem', borderRadius: '10px' }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
