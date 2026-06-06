import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Database, 
  Activity, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  PlusCircle,
  HelpCircle,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

function App() {
  // Stats & Metrics
  const [metrics, setMetrics] = useState({
    clickstream_total_events: 0,
    tickets_total_count: 0,
    sentiment_ratios: [],
    category_counts: [],
    friction_levels: []
  });
  
  // Data lists
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Semantic Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Platform Status & Reports
  const [pipelineStatus, setPipelineStatus] = useState({ status: 'Idle', steps: {} });
  const [qualityReport, setQualityReport] = useState({ status: 'Missing', tables: {} });
  const [apiConnected, setApiConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  
  // Clickstream & Friction Insights
  const [clicks, setClicks] = useState([]);
  const [frictionInsights, setFrictionInsights] = useState([]);
  
  const pollInterval = useRef(null);

  // Fetch clicks details
  const fetchClicks = async () => {
    try {
      const res = await fetch(`${API_BASE}/clicks?limit=25`);
      if (res.ok) {
        const data = await res.json();
        setClicks(data.clicks || []);
      }
    } catch (err) {
      console.error("Failed to fetch clicks:", err);
    }
  };

  // Fetch Gold user friction reports
  const fetchFrictionInsights = async () => {
    try {
      const res = await fetch(`${API_BASE}/friction-insights?limit=15`);
      if (res.ok) {
        const data = await res.json();
        setFrictionInsights(data.insights || []);
      }
    } catch (err) {
      console.error("Failed to fetch friction insights:", err);
    }
  };

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const statusRes = await fetch(`${API_BASE}/pipeline-status`);
      if (statusRes.ok) {
        setApiConnected(true);
        const statusData = await statusRes.json();
        setPipelineStatus(statusData);
      }
      
      const metricsRes = await fetch(`${API_BASE}/metrics`);
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
      
      const reportRes = await fetch(`${API_BASE}/quality-report`);
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setQualityReport(reportData);
      }
      
      fetchClicks();
      fetchFrictionInsights();
    } catch (err) {
      console.error("Failed to connect to API backend:", err);
      setApiConnected(false);
    }
  };

  // Fetch paginated tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets?page=${page}&limit=5&category=${selectedCategory}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setTotalTickets(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchData();
    fetchTickets();
    
    // Live clickstream poll (refresh every 3s)
    const clickInterval = setInterval(() => {
      fetchClicks();
    }, 3000);

    const interval = setInterval(() => {
      if (pipelineStatus.status !== 'Running') {
        fetchData();
      }
    }, 10000);
    
    return () => {
      clearInterval(clickInterval);
      clearInterval(interval);
    };
  }, []);

  // Fetch tickets when page or category changes
  useEffect(() => {
    fetchTickets();
  }, [page, selectedCategory]);

  // Polling during active pipeline run
  useEffect(() => {
    if (pipelineStatus.status === 'Running') {
      if (!pollInterval.current) {
        addLog("Veri ambarı işleme hattı (Medallion Pipeline) tetiklendi...");
        pollInterval.current = setInterval(async () => {
          try {
            const res = await fetch(`${API_BASE}/pipeline-status`);
            if (res.ok) {
              const data = await res.json();
              setPipelineStatus(data);
              
              if (data.current_step) {
                addLog(`Yürütülüyor: ${data.current_step}...`);
              }
              
              if (data.status !== 'Running') {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
                addLog(data.status === 'Success' ? "[SUCCESS] Pipeline başarıyla tamamlandı!" : "[FAILED] Pipeline yürütülürken hata oluştu.");
                fetchData();
                fetchTickets();
              }
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }, 1500);
      }
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    }
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [pipelineStatus.status]);

  const addLog = (msg) => {
    setLogMessages(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  const triggerPipeline = async () => {
    try {
      addLog("Pipeline tetikleme isteği gönderiliyor...");
      const res = await fetch(`${API_BASE}/trigger-pipeline`, { method: 'POST' });
      if (res.ok) {
        setPipelineStatus(prev => ({ ...prev, status: 'Running' }));
      }
    } catch (err) {
      addLog(`Hata: ${err.message}`);
    }
  };

  const generateRawTickets = async () => {
    setIsGenerating(true);
    addLog("Sahte ham veriler (CSV) üretiliyor...");
    try {
      const res = await fetch(`${API_BASE}/generate-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 })
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`[SUCCESS] ${data.message} (${data.file})`);
        fetchData();
      }
    } catch (err) {
      addLog(`Ham veri üretilirken hata oluştu: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const useSampleQuery = (q) => {
    setSearchQuery(q);
    setIsSearching(true);
    fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, limit: 5 })
    })
    .then(res => res.json())
    .then(data => {
      setSearchResults(data.results || []);
      setIsSearching(false);
    })
    .catch(err => {
      console.error(err);
      setIsSearching(false);
    });
  };

  return (
    <div className="dashboard-container">
      
      {/* HEADER SECTION */}
      <header className="header">
        <div>
          <h1>
            <Layers style={{ color: 'var(--accent)' }} size={32} />
            AI-Enhanced Medallion Lakehouse Dashboard
          </h1>
          <p>Real-time Streaming & Batch Processing zenginleştirilmiş veri analitiği kontrol paneli</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary" 
            style={{ fontSize: '0.85rem', color: 'var(--accent)', borderColor: 'var(--accent-glow)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ShoppingBag size={16} /> 🛒 E-Ticaret Mağazasını Aç <ExternalLink size={14} />
          </a>

          {apiConnected ? (
            <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem' }}>
              <Activity className="pulse-indicator" size={14} style={{ marginRight: '4px' }} /> API CONNECTED
            </span>
          ) : (
            <span className="badge badge-error" style={{ padding: '0.4rem 0.8rem' }}>
              <AlertCircle size={14} style={{ marginRight: '4px' }} /> BACKEND OFFLINE
            </span>
          )}
          
          <button onClick={fetchData} className="btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* METRICS STATS BAR */}
      <section className="stats-grid">
        <div className="panel stat-card">
          <div className="stat-icon accent">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p>Clickstream Raw Events (Bronze)</p>
            <h2>{metrics.clickstream_total_events.toLocaleString()}</h2>
          </div>
        </div>

        <div className="panel stat-card">
          <div className="stat-icon primary">
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <p>AI-Enriched Tickets (Silver)</p>
            <h2>{metrics.tickets_total_count.toLocaleString()}</h2>
          </div>
        </div>

        <div className="panel stat-card">
          <div className="stat-icon success">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <p>Data Quality Status</p>
            <h2 style={{ color: qualityReport.status === 'Success' ? 'var(--success)' : qualityReport.status === 'Failed' ? 'var(--error)' : 'var(--text-secondary)' }}>
              {qualityReport.status === 'Success' ? 'PASSED' : qualityReport.status === 'Failed' ? 'FAILED' : 'WAITING'}
            </h2>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <div className="main-grid">
        
        {/* LEFT COLUMN: PIPELINE STAGES & LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <Database size={20} style={{ color: 'var(--accent)' }} />
                  Medallion Pipeline Control Room
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Göl evi (Lakehouse) katmanlarını ve AI zenginleştirmesini yönetin</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={triggerPipeline} 
                  disabled={pipelineStatus.status === 'Running' || !apiConnected}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  {pipelineStatus.status === 'Running' ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" /> Pipeline Çalışıyor
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Pipeline Başlat
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PIPELINE VISUAL CARD */}
            <div className="pipeline-list">
              {[
                { key: "Bronze Ingestion", desc: "Ham bilet CSV verilerini okur ve Bronze Delta tablolarına aktarır." },
                { key: "Silver AI Enrichment", desc: "Bronze metinlerini Gemini 2.5 Flash ile zenginleştirip Silver Delta'ya yazar." },
                { key: "Gold SQL Analytics", desc: "Klik ve şikayetleri dbt/DuckDB SQL ile birleştirip kullanıcı analizleri üretir." },
                { key: "pgvector Database Sync", desc: "Zenginleştirilmiş verileri PostgreSQL pgvector'e yükler." },
                { key: "Data Quality Checks", desc: "Göl evi katmanlarının veri tutarlılığını test eder." }
              ].map((step, idx) => {
                const stepState = pipelineStatus.steps?.[step.key] || { status: 'Pending', duration: 0 };
                return (
                  <div key={idx} className={`pipeline-step ${stepState.status.toLowerCase()}`}>
                    <div className="step-left">
                      <div className="step-number-circle">
                        {stepState.status === 'Success' ? <CheckCircle2 size={18} /> : 
                         stepState.status === 'Running' ? <RefreshCw className="spin-icon" size={16} /> : idx + 1}
                      </div>
                      <div className="step-details">
                        <h4>{step.key}</h4>
                        <p>{step.desc}</p>
                      </div>
                    </div>
                    <div>
                      {stepState.status === 'Success' && (
                        <span className="badge badge-success">{stepState.duration}s</span>
                      )}
                      {stepState.status === 'Running' && (
                        <span className="badge badge-warning" style={{ animation: 'pulse-glow 1.5s infinite' }}>YÜRÜTÜLÜYOR</span>
                      )}
                      {stepState.status === 'Pending' && (
                        <span className="badge badge-neutral">BEKLİYOR</span>
                      )}
                      {stepState.status === 'Failed' && (
                        <span className="badge badge-error">HATA</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LIVE CONSOLE LOGS */}
            <div style={{ marginTop: '1.75rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Konsol Çıktısı</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pipelineStatus.status === 'Running' ? 'var(--warning)' : 'var(--success)' }}></div>
              </div>
              <div style={{ 
                height: '115px', 
                overflowY: 'auto', 
                fontFamily: 'monospace', 
                fontSize: '0.8rem', 
                color: '#38bdf8', 
                lineHeight: '1.5',
                display: 'flex',
                flexDirection: 'column-reverse'
              }}>
                {logMessages.length > 0 ? (
                  logMessages.map((log, index) => <div key={index}>{log}</div>)
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>Konsol kaydı bulunmuyor. E-Ticaret sitesinde hareket ürettikten sonra Pipeline'ı tetikleyebilirsiniz.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI SEMANTIC SEARCH */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            AI Semantic Search Engine
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            PostgreSQL <code style={{ color: 'var(--accent)' }}>pgvector</code> üzerinde metin embedding benzerliği ile doğal dilde arama yapın
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Örn: kargom kırık geldi..." 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  background: '#f8fafc', 
                  border: '1px solid var(--panel-border)', 
                  borderRadius: '8px', 
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <button type="submit" disabled={isSearching} className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              {isSearching ? <RefreshCw className="spin-icon" size={18} /> : 'Ara'}
            </button>
          </form>

          {/* SUGGESTED QUERIES */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Öneriler:</span>
            {[
              "para çekildi ama ürün yok",
              "uygulama açılmıyor",
              "ürün kalitesini beğenmedim",
              "teslimat gecikti"
            ].map((q, idx) => (
              <button 
                key={idx} 
                onClick={() => useSampleQuery(q)}
                style={{ 
                  fontSize: '0.75rem', 
                  background: '#f1f5f9', 
                  border: '1px solid var(--panel-border)', 
                  borderRadius: '4px', 
                  padding: '0.2rem 0.5rem', 
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                "{q}"
              </button>
            ))}
          </div>

          {/* SEARCH RESULTS */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: '320px', maxHeight: '420px', paddingRight: '4px' }}>
            {isSearching ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '0.5rem', color: 'var(--accent)' }} />
                <span>Vektör benzerlikleri aranıyor...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <div key={idx} className="search-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.subject}</h4>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent)', borderColor: 'rgba(14, 165, 233, 0.2)' }}>
                      %{(res.similarity * 100).toFixed(1)} Eşleşme
                    </span>
                  </div>
                  
                  <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ width: `${res.similarity * 100}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), var(--accent))' }}></div>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {res.description}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Müşteri ID: {res.user_id}</span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <span className={`badge ${res.sentiment === 'Positive' ? 'badge-success' : res.sentiment === 'Negative' ? 'badge-error' : 'badge-neutral'}`} style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                        {res.sentiment}
                      </span>
                      <span className="badge badge-neutral" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>{res.category}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', border: '1px dashed var(--panel-border)', borderRadius: '12px', padding: '2rem' }}>
                <HelpCircle size={32} style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>Doğal dille şikayet araması yapın. Benzerlik skorlarına göre listelenecektir.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION: FRICTION REPORT & RAW CLICKS */}
      <div className="main-grid" style={{ gridTemplateColumns: '7fr 5fr', gap: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>
        
        {/* GOLD USER FRICTION REPORT */}
        <div className="panel" style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Database size={20} style={{ color: 'var(--primary)' }} />
            Gold Friction & Ticket Audit Report
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Clickstream verileri ile zenginleştirilmiş biletlerin DuckDB SQL birleşimi (Gold Layer)
          </p>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
            {frictionInsights.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Kullanıcı</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Konu</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Kategori</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Hata Sayısı</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Avg Dwell</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Friction Seviyesi</th>
                  </tr>
                </thead>
                <tbody>
                  {frictionInsights.map((insight, idx) => {
                    let badgeClass = 'badge-neutral';
                    if (insight.friction_level === 'Critical Friction') badgeClass = 'badge-error';
                    else if (insight.friction_level === 'Medium Friction') badgeClass = 'badge-warning';
                    else if (insight.friction_level === 'High Priority Ticket') badgeClass = 'badge-primary';

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--panel-border)', transition: 'background 0.2s' }} className="hover-row">
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>User #{insight.user_id}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {insight.subject}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{insight.category}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 'bold', color: insight.error_count > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                          {insight.error_count}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {insight.avg_dwell_time}s
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                            {insight.friction_level === 'Critical Friction' ? '🔥 KRİTİK' : 
                             insight.friction_level === 'Medium Friction' ? '⚠️ ORTA' : 
                             insight.friction_level === 'High Priority Ticket' ? '⚡ YÜKSEK' : '🟢 STANDART'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)', border: '1px dashed var(--panel-border)', borderRadius: '12px' }}>
                <Database size={32} style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.85rem' }}>Gold analitik raporu bulunamadı. E-Ticaret sitesinde hareket ürettikten sonra Pipeline'ı çalıştırın.</span>
              </div>
            )}
          </div>
        </div>

        {/* BRONZE LIVE CLICKSTREAM MONITOR */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Activity size={20} style={{ color: 'var(--accent)' }} />
            Bronze Clickstream Live Feed
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            E-ticaret sitesinden canlı klik verisi akışı (Bronze Delta Layer)
          </p>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', paddingRight: '4px' }}>
            {clicks.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '0.5rem' }}>Kullanıcı</th>
                    <th style={{ padding: '0.5rem' }}>Sayfa</th>
                    <th style={{ padding: '0.5rem' }}>Aksiyon</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Dwell Time</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.slice(0, 15).map((click, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>User #{click.user_id}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{click.page_url}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span className={`badge ${click.action.includes('error') ? 'badge-error' : click.action.includes('add') ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {click.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>{click.dwell_time_seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', border: '1px dashed var(--panel-border)', borderRadius: '12px', padding: '2rem' }}>
                <Activity size={32} style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>Canlı tıklama verisi akışı yok. Mağazada gezinerek hareket üretin.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION GRID */}
      <div className="bottom-grid">
        
        {/* LEFT BOTTOM: DATA QUALITY */}
        <div className="panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
            Data Quality Audit Reports (Validator)
          </h3>
          
          {qualityReport.tables && Object.keys(qualityReport.tables).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(qualityReport.tables).map(([tableName, report]) => (
                <div key={tableName} style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '1.15rem', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tableName === 'bronze_clickstream' ? 'Bronze Klik Logları Tablosu' : 'Silver AI Enriched Biletler Tablosu'}
                    </span>
                    <span className={`badge ${report.success ? 'badge-success' : 'badge-error'}`}>
                      {report.success ? 'Hatasız' : 'Başarısız'}
                    </span>
                  </div>
                  
                  {report.error ? (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem' }}>Hata: {report.error}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>Kontrol Edilen Satır Sayısı:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{report.row_count}</span>
                      </div>
                      
                      <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {Object.entries(report.checks || {}).map(([checkName, checkVal]) => (
                          <div key={checkName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.25rem 0', background: 'rgba(255,255,255,0.005)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{checkName}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {checkVal.success ? (
                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle2 size={12} /> Geçti</span>
                              ) : (
                                <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '2px' }}><AlertTriangle size={12} /> {checkVal.unexpected_count} Hatalı Değer</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)', border: '1px dashed var(--panel-border)', borderRadius: '12px' }}>
              <ShieldCheck size={32} style={{ marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.85rem' }}>Veri kalitesi denetim raporu bulunamadı. Pipeline'ı çalıştırın.</span>
            </div>
          )}
        </div>

        {/* RIGHT BOTTOM: ENRICHED TICKETS FEED */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              Live Silver Tickets Feed (Gemini Enriched)
            </h3>
            
            <select 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              style={{ 
                background: '#ffffff', 
                border: '1px solid var(--panel-border)', 
                borderRadius: '6px', 
                color: 'var(--text-primary)', 
                padding: '0.25rem 0.5rem', 
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">Tüm Kategoriler</option>
              <option value="Billing">Billing (Ödeme)</option>
              <option value="Technical">Technical (Teknik)</option>
              <option value="Delivery">Delivery (Teslimat)</option>
              <option value="Product Feedback">Product Feedback (Geri Bildirim)</option>
            </select>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
            {tickets.length > 0 ? (
              tickets.map((t, idx) => (
                <div key={idx} className="feed-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{t.subject}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(t.timestamp).toLocaleTimeString()}</span>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    {t.description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--primary-glow)', borderRadius: '6px', border: '1px dashed rgba(15, 98, 254, 0.15)', marginBottom: '0.5rem' }}>
                    <Sparkles size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong>AI Özet:</strong> {t.summary}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Müşteri: {t.user_id}</span>
                      <span>•</span>
                      <span>Kategori: <strong style={{ color: 'var(--text-primary)' }}>{t.category}</strong></span>
                    </div>
                    
                    <span className={`badge ${t.sentiment === 'Positive' ? 'badge-success' : t.sentiment === 'Negative' ? 'badge-error' : 'badge-neutral'}`} style={{ transform: 'scale(0.85)' }}>
                      {t.sentiment}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', border: '1px dashed var(--panel-border)', borderRadius: '12px', padding: '2rem', minHeight: '200px' }}>
                <FileText size={32} style={{ marginBottom: '0.5rem' }} />
                <span>Bu kategoriye ait zenginleştirilmiş bilet bulunamadı.</span>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalTickets > 5 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                Geri
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sayfa {page} / {Math.ceil(totalTickets / 5)}</span>
              <button 
                onClick={() => setPage(p => (p * 5 < totalTickets ? p + 1 : p))} 
                disabled={page * 5 >= totalTickets}
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                İleri
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default App;
