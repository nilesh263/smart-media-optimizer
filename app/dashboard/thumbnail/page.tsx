"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThumbResult {
  quality:     string;
  label:       string;
  size:        string;
  url:         string;
  working:     boolean;
  recommended: boolean;
  blackBars:   boolean;
}

function getVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getThumbnails(videoId: string): ThumbResult[] {
  return [
    { quality:"maxresdefault", label:"Max Resolution",  size:"1280×720", url:`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, working:true, recommended:true,  blackBars:false },
    { quality:"sddefault",     label:"Standard",        size:"640×480",  url:`https://img.youtube.com/vi/${videoId}/sddefault.jpg`,     working:true, recommended:false, blackBars:true  },
    { quality:"hqdefault",     label:"High Quality",    size:"480×360",  url:`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,     working:true, recommended:false, blackBars:true  },
    { quality:"mqdefault",     label:"Medium Quality",  size:"320×180",  url:`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,     working:true, recommended:true,  blackBars:false },
    { quality:"default",       label:"Default",         size:"120×90",   url:`https://img.youtube.com/vi/${videoId}/default.jpg`,       working:true, recommended:false, blackBars:true  },
  ];
}

function downloadThumbnail(url: string, filename: string) {
  // Use backend proxy to bypass YouTube CORS restrictions
  const proxyUrl = `http://localhost:4000/api/proxy/thumbnail?url=${encodeURIComponent(url)}`;
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ThumbnailPage() {
  const [url,        setUrl]       = useState("");
  const [videoId,    setVideoId]   = useState<string | null>(null);
  const [thumbs,     setThumbs]    = useState<ThumbResult[]>([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const [videoTitle, setVideoTitle]= useState("");
  const [history,    setHistory]   = useState<{id:string;url:string;title:string}[]>([]);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setError("");
    setLoading(true);
    setThumbs([]);
    setVideoTitle("");

    const id = getVideoId(url.trim());
    if (!id) {
      setError("❌ Invalid YouTube URL. Please enter a valid YouTube video link.");
      setLoading(false);
      return;
    }

    setVideoId(id);
    const results = getThumbnails(id);

    // Check which thumbnails actually exist
    const checked = await Promise.all(results.map(async t => {
      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(t.url)}`, { method:"HEAD" });
        return { ...t, working: res.ok };
      } catch {
        return { ...t, working: true }; // assume working if check fails
      }
    }));

    setThumbs(checked);
    setHistory(prev => {
      const exists = prev.find(h => h.id === id);
      if (exists) return prev;
      return [{ id, url: url.trim(), title: `Video ${id}` }, ...prev.slice(0,4)];
    });
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFetch();
  };

  const downloadAll = async () => {
    for (const t of thumbs.filter(t => t.working)) {
      downloadThumbnail(t.url, `thumbnail-${videoId}-${t.quality}.jpg`);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  return (
    <>
      <style>{`
        .db { transition: all .15s; cursor: pointer; border: none; }
        .db:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .thumb-card { transition: all .2s; }
        .thumb-card:hover { border-color: rgba(255,75,99,.4) !important; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.4); }
        .input-field:focus { outline: none; border-color: rgba(255,75,99,.5) !important; }
      `}</style>

      <div style={{ padding:24, fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column", gap:24, maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4 }}>YouTube Thumbnail Downloader</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:0 }}>
            Download any YouTube video thumbnail in all available resolutions — free & instant
          </p>
        </div>

        {/* Search box */}
        <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:18, padding:20 }}>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"12px 16px" }}>
              <span style={{ fontSize:20 }}>📺</span>
              <input
                className="input-field"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste YouTube URL here… e.g. https://youtube.com/watch?v=dQw4w9WgXcQ"
                style={{ flex:1, background:"none", border:"1px solid transparent", color:"white", fontSize:14, fontFamily:"inherit" }}
              />
              {url && (
                <button onClick={() => { setUrl(""); setThumbs([]); setVideoId(null); setError(""); }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:18, padding:"0 4px" }}>✕</button>
              )}
            </div>
            <button className="db"
              onClick={handleFetch} disabled={loading}
              style={{ background:"linear-gradient(135deg,#FF4B63,#FF6B35)", color:"white", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, boxShadow:"0 4px 20px rgba(255,75,99,.4)", opacity:loading?.7:1, whiteSpace:"nowrap" }}>
              {loading ? "⏳ Loading…" : "🔍 Get Thumbnails"}
            </button>
          </div>

          {/* Supported formats */}
          <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
            {[
              "youtube.com/watch?v=...",
              "youtu.be/...",
              "youtube.com/shorts/...",
              "youtube.com/embed/...",
            ].map(f => (
              <span key={f} style={{ background:"rgba(255,75,99,.08)", border:"1px solid rgba(255,75,99,.15)", color:"rgba(255,255,255,.4)", fontSize:11, padding:"3px 10px", borderRadius:20 }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(255,75,99,.08)", border:"1px solid rgba(255,75,99,.25)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#FF4B63" }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ width:48, height:48, border:"4px solid rgba(255,75,99,.2)", borderTop:"4px solid #FF4B63", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }}/>
            <div style={{ color:"rgba(255,255,255,.5)", fontSize:14 }}>Fetching thumbnails…</div>
          </div>
        )}

        {/* Results */}
        {thumbs.length > 0 && videoId && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Video info bar */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ background:"rgba(255,75,99,.12)", border:"1px solid rgba(255,75,99,.25)", borderRadius:10, padding:"6px 14px" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#FF4B63" }}>Video ID: {videoId}</span>
                </div>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>{thumbs.filter(t=>t.working).length} thumbnails found</span>
              </div>
              <button className="db"
                onClick={downloadAll}
                style={{ background:"rgba(255,75,99,.12)", border:"1px solid rgba(255,75,99,.25)", color:"#FF4B63", borderRadius:10, padding:"8px 18px", fontSize:13, fontWeight:700 }}>
                ⬇️ Download All Sizes
              </button>
            </div>

            {/* Thumbnail grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              <AnimatePresence>
                {thumbs.map((t, i) => (
                  <motion.div key={t.quality} className="thumb-card"
                    initial={{opacity:0,scale:.94,y:10}}
                    animate={{opacity:1,scale:1,y:0}}
                    transition={{delay:i*0.05}}
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, overflow:"hidden" }}
                  >
                    {/* Thumbnail image */}
                    <div style={{ position:"relative", background:"rgba(0,0,0,.5)", aspectRatio:"16/9", overflow:"hidden" }}>
                      <img
                        src={t.url}
                        alt={t.label}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { (e.target as HTMLImageElement).style.display="none"; }}
                      />
                      {/* Recommended badge */}
                      {t.recommended && (
                        <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,200,100,.9)", color:"white", fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:6, backdropFilter:"blur(4px)" }}>
                          ⭐ Recommended
                        </div>
                      )}
                      {/* Black bars warning */}
                      {t.blackBars && (
                        <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.75)", color:"rgba(255,255,255,.7)", fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:6, backdropFilter:"blur(4px)" }}>
                          ⚠️ May have black bars
                        </div>
                      )}
                      {/* Size badge */}
                      <div style={{ position:"absolute", top:8, right:8, background:"rgba(255,75,99,.85)", color:"white", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6 }}>
                        {t.size}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"white", marginBottom:2 }}>{t.label}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>{t.size} · JPG</div>
                      </div>
                      <button className="db"
                        onClick={() => downloadThumbnail(t.url, `thumbnail-${videoId}-${t.quality}.jpg`)}
                        style={{ background:"linear-gradient(135deg,#FF4B63,#FF6B35)", color:"white", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                        ⬇️ Download
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Direct URL copy */}
            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"14px 18px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.4)", marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>
                Direct Thumbnail URLs
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {thumbs.slice(0,3).map(t => (
                  <div key={t.quality} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", minWidth:80 }}>{t.label}</span>
                    <code style={{ flex:1, fontSize:11, color:"rgba(255,255,255,.5)", background:"rgba(255,255,255,.04)", padding:"4px 10px", borderRadius:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.url}</code>
                    <button className="db"
                      onClick={() => navigator.clipboard.writeText(t.url)}
                      style={{ background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.5)", borderRadius:7, padding:"4px 10px", fontSize:11, fontWeight:600 }}>
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && !thumbs.length && (
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Recent</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {history.map(h => (
                <button key={h.id} className="db"
                  onClick={() => { setUrl(h.url); }}
                  style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.5)", borderRadius:10, padding:"7px 14px", fontSize:12 }}>
                  📺 {h.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* How to use */}
        {!thumbs.length && !loading && (
          <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:16, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🖼️</div>
            <div style={{ fontSize:16, fontWeight:700, color:"white", marginBottom:8 }}>How to use</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, maxWidth:500, margin:"0 auto", marginTop:16 }}>
              {[
                { step:"1", icon:"📋", text:"Copy any YouTube video URL" },
                { step:"2", icon:"🔍", text:"Paste it above and click Get Thumbnails" },
                { step:"3", icon:"⬇️", text:"Download in any resolution you need" },
              ].map(s => (
                <div key={s.step} style={{ background:"rgba(255,255,255,.03)", borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
