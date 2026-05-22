"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoInfo {
  title:     string;
  thumbnail: string;
  duration:  number;
  uploader:  string;
  platform:  string;
  formats:   { id: string; label: string; desc: string }[];
}

const API = "http://localhost:4000";

function formatDuration(s: number) {
  if (!s) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
  return `${m}:${sec.toString().padStart(2,"0")}`;
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const SUPPORTED = [
  { icon:"▶️", name:"YouTube",   color:"#FF0000" },
  { icon:"📸", name:"Instagram", color:"#E1306C" },
  { icon:"🐦", name:"Twitter/X", color:"#1DA1F2" },
  { icon:"👍", name:"Facebook",  color:"#1877F2" },
  { icon:"🎵", name:"TikTok",    color:"#010101" },
  { icon:"📌", name:"Pinterest", color:"#E60023" },
];

export default function DownloaderPage() {
  const [url,        setUrl]       = useState("");
  const [info,       setInfo]      = useState<VideoInfo | null>(null);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const [format,     setFormat]    = useState("best");
  const [downloading,setDownloading]= useState(false);
  const [dlError,    setDlError]   = useState("");
  const [dlDone,     setDlDone]    = useState(false);

  const fetchInfo = async () => {
    if (!url.trim()) return;
    setError(""); setInfo(null); setDlDone(false); setDlError("");
    setLoading(true);
    try {
      const res  = await fetch(API + "/api/downloader/info", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInfo(data);
    } catch(err) {
      setError(err instanceof Error ? err.message : "Failed to fetch video info");
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!info) return;
    setDlError(""); setDlDone(false);
    setDownloading(true);
    try {
      const res  = await fetch(API + "/api/downloader/download", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ url: url.trim(), format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");
      downloadFile(data.downloadUrl, data.downloadFilename);
      setDlDone(true);
    } catch(err) {
      setDlError(err instanceof Error ? err.message : "Download failed");
    }
    setDownloading(false);
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        .db { transition: all .15s; cursor: pointer; border: none; }
        .db:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .input-box:focus { outline: none; border-color: rgba(108,99,255,.5) !important; }
      `}</style>

      <div style={{ padding:24, fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column", gap:24, maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4 }}>Video Downloader</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:0 }}>
            Download videos from YouTube, Instagram, Twitter, Facebook, TikTok and more
          </p>
        </div>

        {/* Supported platforms */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {SUPPORTED.map(s => (
            <div key={s.name} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"6px 12px" }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.5)" }}>{s.name}</span>
            </div>
          ))}
        </div>

        {/* URL Input */}
        <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:18, padding:20 }}>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"12px 16px" }}>
              <span style={{ fontSize:20 }}>🔗</span>
              <input className="input-box" type="text" value={url}
                onChange={e => { setUrl(e.target.value); setInfo(null); setDlDone(false); setError(""); }}
                onKeyDown={e => e.key==="Enter" && fetchInfo()}
                placeholder="Paste video URL here… YouTube, Instagram, Twitter, TikTok…"
                style={{ flex:1, background:"none", border:"1px solid transparent", color:"white", fontSize:14, fontFamily:"inherit" }}
              />
              {url && (
                <button onClick={() => { setUrl(""); setInfo(null); setError(""); }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:18 }}>✕</button>
              )}
            </div>
            <button className="db" onClick={fetchInfo} disabled={loading}
              style={{ background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, boxShadow:"0 4px 20px rgba(108,99,255,.4)", opacity:loading?.7:1, whiteSpace:"nowrap" }}>
              {loading ? "⏳ Fetching…" : "🔍 Fetch Video"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(255,75,138,.08)", border:"1px solid rgba(255,75,138,.25)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#FF4B8A" }}>
            ❌ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ width:48, height:48, border:"4px solid rgba(108,99,255,.2)", borderTop:"4px solid #6C63FF", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }}/>
            <div style={{ color:"rgba(255,255,255,.5)", fontSize:14 }}>Fetching video info…</div>
          </div>
        )}

        {/* Video info */}
        <AnimatePresence>
          {info && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:18, overflow:"hidden" }}>

                {/* Video preview */}
                <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:0 }}>
                  <div style={{ position:"relative", background:"rgba(0,0,0,.5)" }}>
                    {info.thumbnail && (
                      <img src={info.thumbnail} alt={info.title}
                        style={{ width:"100%", height:"100%", objectFit:"cover", minHeight:157 }}/>
                    )}
                    <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,.8)", color:"white", fontSize:12, fontWeight:700, padding:"3px 8px", borderRadius:6 }}>
                      {formatDuration(info.duration)}
                    </div>
                  </div>

                  <div style={{ padding:"20px 24px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#6C63FF", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                      {info.platform}
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, color:"white", marginBottom:6, lineHeight:1.4 }}>
                      {info.title}
                    </div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginBottom:20 }}>
                      by {info.uploader}
                    </div>

                    {/* Format selector */}
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
                        Select Format
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {info.formats.map(f => (
                          <button key={f.id} className="db"
                            onClick={() => setFormat(f.id)}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, textAlign:"left",
                              background: format===f.id?"rgba(108,99,255,.15)":"rgba(255,255,255,.04)",
                              border:`1px solid ${format===f.id?"rgba(108,99,255,.4)":"rgba(255,255,255,.08)"}`,
                              color:"white",
                            }}>
                            <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${format===f.id?"#6C63FF":"rgba(255,255,255,.3)"}`, background:format===f.id?"#6C63FF":"transparent", flexShrink:0 }}/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600 }}>{f.label}</div>
                              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>{f.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Download button */}
                    {!dlDone ? (
                      <button className="db" onClick={handleDownload} disabled={downloading}
                        style={{ width:"100%", background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, boxShadow:"0 4px 20px rgba(108,99,255,.4)", opacity:downloading?.7:1 }}>
                        {downloading
                          ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                              <span style={{ width:20, height:20, border:"3px solid rgba(255,255,255,.3)", borderTop:"3px solid white", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }}/>
                              Downloading — please wait…
                            </span>
                          : "⬇️ Download Video"}
                      </button>
                    ) : (
                      <div style={{ background:"rgba(0,229,160,.12)", border:"1px solid rgba(0,229,160,.3)", borderRadius:12, padding:"14px", textAlign:"center", fontSize:14, fontWeight:700, color:"#00E5A0" }}>
                        ✅ Download complete! Check your downloads folder.
                      </div>
                    )}

                    {dlError && (
                      <div style={{ marginTop:10, background:"rgba(255,75,138,.08)", border:"1px solid rgba(255,75,138,.25)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#FF4B8A" }}>
                        ❌ {dlError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div style={{ background:"rgba(255,165,0,.06)", border:"1px solid rgba(255,165,0,.15)", borderRadius:12, padding:"12px 16px", fontSize:12, color:"rgba(255,255,255,.4)", marginTop:12 }}>
                ⚠️ <strong style={{ color:"rgba(255,165,0,.8)" }}>Note:</strong> Only download videos you have permission to download. Respect copyright laws and platform terms of service.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How to use */}
        {!info && !loading && (
          <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:16, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⬇️</div>
            <div style={{ fontSize:16, fontWeight:700, color:"white", marginBottom:16 }}>How to download</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, maxWidth:500, margin:"0 auto" }}>
              {[
                { step:"1", icon:"📋", text:"Copy any video URL from YouTube, Instagram, Twitter etc." },
                { step:"2", icon:"🔍", text:"Paste it above and click Fetch Video" },
                { step:"3", icon:"⬇️", text:"Choose format and click Download" },
              ].map(s => (
                <div key={s.step} style={{ background:"rgba(255,255,255,.03)", borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
