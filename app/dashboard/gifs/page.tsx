"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GifFile {
  id:           string;
  name:         string;
  originalSize: number;
  file:         File;
  status:       "ready" | "processing" | "done" | "error";
  progress:     number;
  outputSize?:  number;
  savings?:     number;
  downloadUrl?: string;
  downloadFilename?: string;
  preview?:     string;
  error?:       string;
}

type GifTool    = "compress" | "resize" | "video2gif";
type GifQuality = "high" | "medium" | "small";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function formatBytes(b: number) {
  if (!b) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
}

function downloadFile(url: string, filename: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
}

const SCALE_MAP: Record<GifQuality, string> = {
  high:   "0.9",
  medium: "0.70",
  small:  "0.50",
};

export default function GIFPage() {
  const [files,    setFiles]   = useState<GifFile[]>([]);
  const [dragging, setDragging]= useState(false);
  const [tool,     setTool]    = useState<GifTool>("compress");
  const [quality,  setQuality] = useState<GifQuality>("medium");
  const [resizeW,  setResizeW] = useState(480);
  const [resizeH,  setResizeH] = useState(270);
  const [gifFps,   setGifFps]  = useState(10);
  const [gifWidth, setGifWidth]= useState(320);
  const [running,  setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = tool === "video2gif" ? "video/*" : "image/gif,.gif";

  const addFiles = useCallback((incoming: File[]) => {
    const valid = tool === "video2gif"
      ? incoming.filter(f => f.type.startsWith("video/"))
      : incoming.filter(f => f.type === "image/gif" || f.name.toLowerCase().endsWith(".gif"));
    if (!valid.length) return;
    setFiles(prev => [...prev, ...valid.map(f => ({
      id: crypto.randomUUID(), name: f.name,
      originalSize: f.size, file: f,
      status: "ready" as const,
      progress: 0,
      preview: URL.createObjectURL(f),
    }))]);
  }, [tool]);

  const onDrop     = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave= () => setDragging(false);

  const runProcess = async () => {
    const ready = files.filter(f => f.status === "ready");
    if (!ready.length) return;
    setRunning(true);

    for (const item of ready) {
      setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"processing", progress:10} : f));

      // Simulate progress while FFmpeg processes (no real % is streamed from the server)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === item.id && f.status === "processing" && f.progress < 90) {
            return {...f, progress: Math.min(90, f.progress + Math.random() * 6 + 2)};
          }
          return f;
        }));
      }, 800);

      try {
        const formData = new FormData();
        formData.append("file", item.file);

        let endpoint = "";
        if (tool === "compress") {
          formData.append("scale", SCALE_MAP[quality]);
          endpoint = "/api/gif/compress";
        } else if (tool === "resize") {
          formData.append("width",  String(resizeW));
          formData.append("height", String(resizeH));
          endpoint = "/api/gif/resize";
        } else {
          formData.append("fps",   String(gifFps));
          formData.append("width", String(gifWidth));
          endpoint = "/api/gif/video2gif";
        }

        const res  = await fetch(API + endpoint, { method:"POST", body:formData });
        clearInterval(progressInterval);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");

        setFiles(prev => prev.map(f => f.id===item.id ? {
          ...f, status:"done", progress:100,
          outputSize:      data.compressedSize || 0,
          savings:         data.savings        || 0,
          downloadUrl:     data.downloadUrl,
          downloadFilename:data.downloadFilename,
        } : f));

      } catch(err) {
        clearInterval(progressInterval);
        setFiles(prev => prev.map(f => f.id===item.id ? {
          ...f, status:"error", progress:0,
          error: err instanceof Error ? err.message : "Failed",
        } : f));
      }
    }
    setRunning(false);
  };

  const doneFiles  = files.filter(f => f.status === "done");
  const readyFiles = files.filter(f => f.status === "ready");
  const totalSaved = doneFiles.reduce((a,f) => a + f.originalSize - (f.outputSize||0), 0);

  const QUALITIES = [
    { id:"high"   as GifQuality, label:"💎 High Quality", desc:"90% size · sharpest colors",   color:"#00D4FF" },
    { id:"medium" as GifQuality, label:"⭐ Balanced",      desc:"70% size · recommended",        color:"#00E5A0" },
    { id:"small"  as GifQuality, label:"🚀 Smallest",     desc:"50% size · maximum savings",    color:"#F5A623" },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dz { transition: all .2s; cursor: pointer; }
        .dz:hover { border-color: rgba(245,166,35,.6) !important; background: rgba(245,166,35,.08) !important; }
        .db { transition: all .15s; cursor: pointer; border: none; }
        .db:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .mc { transition: all .15s; cursor: pointer; }
        .mc:hover { border-color: rgba(255,255,255,.2) !important; }
      `}</style>

      <div style={{ padding:24, fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column", gap:20, maxWidth:1100, margin:"0 auto" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4 }}>GIF Tools</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:0 }}>Compress · Resize · Video to GIF — powered by FFmpeg ⚡</p>
          </div>
          {totalSaved > 0 && (
            <div style={{ background:"rgba(245,166,35,.08)", border:"1px solid rgba(245,166,35,.25)", borderRadius:12, padding:"10px 20px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#F5A623" }}>{formatBytes(totalSaved)}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Total saved</div>
            </div>
          )}
        </div>

        {/* FFmpeg badge */}
        <div style={{ background:"linear-gradient(135deg,rgba(245,166,35,.08),rgba(255,107,53,.06))", border:"1px solid rgba(245,166,35,.2)", borderRadius:12, padding:"12px 18px", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#F5A623" }}>Powered by FFmpeg — Animated GIF Preserved</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>All animation frames are kept. FFmpeg uses palette optimization for smaller size with great quality.</div>
          </div>
        </div>

        {/* Tool tabs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {([
            { id:"compress"  as GifTool, icon:"📦", label:"Compress GIF",  desc:"Reduce size, keep animation" },
            { id:"resize"    as GifTool, icon:"↔️", label:"Resize GIF",    desc:"Change dimensions"           },
            { id:"video2gif" as GifTool, icon:"🎬", label:"Video → GIF",   desc:"Convert MP4/MOV to GIF"      },
          ]).map(t => (
            <button key={t.id} className="mc"
              onClick={() => { setTool(t.id); setFiles([]); }}
              style={{ padding:"14px", borderRadius:14, textAlign:"center", color:"white",
                background: tool===t.id?"rgba(245,166,35,.15)":"rgba(255,255,255,.03)",
                border:`2px solid ${tool===t.id?"rgba(245,166,35,.5)":"rgba(255,255,255,.07)"}`,
              }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{t.icon}</div>
              <div style={{ fontSize:13, fontWeight:700 }}>{t.label}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:2 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {tool === "compress" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {QUALITIES.map(q => (
              <button key={q.id} className="mc" onClick={() => setQuality(q.id)}
                style={{ padding:"14px 16px", borderRadius:14, textAlign:"left", color:"white", position:"relative",
                  background: quality===q.id?`${q.color}18`:"rgba(255,255,255,.03)",
                  border:`2px solid ${quality===q.id?q.color+"60":"rgba(255,255,255,.07)"}`,
                }}>
                {quality===q.id && <div style={{ position:"absolute", top:10, right:10, width:8, height:8, borderRadius:"50%", background:q.color }}/>}
                <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{q.label}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>{q.desc}</div>
              </button>
            ))}
          </div>
        )}

        {tool === "resize" && (
          <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:"16px 20px", display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Width</label>
              <input type="number" value={resizeW} onChange={e => setResizeW(+e.target.value)} min={50} max={1000}
                style={{ width:80, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"6px 10px", color:"white", fontSize:13, fontWeight:600 }}/>
            </div>
            <span style={{ color:"rgba(255,255,255,.3)" }}>×</span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Height</label>
              <input type="number" value={resizeH} onChange={e => setResizeH(+e.target.value)} min={50} max={1000}
                style={{ width:80, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"6px 10px", color:"white", fontSize:13, fontWeight:600 }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[{w:480,h:270},{w:320,h:180},{w:240,h:135}].map(s => (
                <button key={s.w} className="db"
                  onClick={() => { setResizeW(s.w); setResizeH(s.h); }}
                  style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:600, background:"rgba(245,166,35,.15)", color:"#F5A623" }}>
                  {s.w}×{s.h}
                </button>
              ))}
            </div>
          </div>
        )}

        {tool === "video2gif" && (
          <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:"16px 20px", display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>FPS</label>
              <select value={gifFps} onChange={e => setGifFps(+e.target.value)}
                style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"6px 10px", color:"white", fontSize:13 }}>
                {[5,10,15,20].map(f => <option key={f} value={f} style={{background:"#0F1219"}}>{f} fps</option>)}
              </select>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Width</label>
              <select value={gifWidth} onChange={e => setGifWidth(+e.target.value)}
                style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"6px 10px", color:"white", fontSize:13 }}>
                {[240,320,480,640].map(w => <option key={w} value={w} style={{background:"#0F1219"}}>{w}px</option>)}
              </select>
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>⚠️ Max 8 seconds of video</div>
          </div>
        )}

        <div className="dz"
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?"rgba(245,166,35,.8)":"rgba(245,166,35,.3)"}`, background:dragging?"rgba(245,166,35,.1)":"rgba(245,166,35,.04)", borderRadius:20, padding:"44px 24px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{dragging?"📥":"🎬"}</div>
          <div style={{ fontSize:18, fontWeight:700, color:"white", marginBottom:8 }}>{dragging?"Release to add":"Drop files here"}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>
            or <span style={{ color:"#F5A623", textDecoration:"underline" }}>click to browse</span>
            {tool==="video2gif" ? " — MP4, MOV, AVI, WebM" : " — GIF files only"}
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {readyFiles.length > 0 && (
              <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="db"
                onClick={runProcess} disabled={running}
                style={{ background:"linear-gradient(135deg,#F5A623,#FF6B35)", color:"white", borderRadius:14, padding:"16px", fontSize:15, fontWeight:700, boxShadow:"0 4px 24px rgba(245,166,35,.4)", opacity:running?.7:1 }}>
                {running ? "⏳ FFmpeg processing — please wait…"
                  : tool==="compress"  ? `📦 Compress ${readyFiles.length} GIF${readyFiles.length>1?"s":""}`
                  : tool==="resize"    ? `↔️ Resize to ${resizeW}×${resizeH}`
                  : `🎬 Convert to GIF (${gifFps}fps · ${gifWidth}px)`}
              </motion.button>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
              <AnimatePresence>
                {files.map(f => (
                  <motion.div key={f.id}
                    initial={{opacity:0,scale:.94,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.9}}
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, overflow:"hidden" }}
                  >
                    <div style={{ position:"relative", height:150, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                      {f.preview && <img src={f.preview} alt={f.name} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", opacity:f.status==="processing"?.4:1 }}/>}
                      {f.status==="processing" && (
                        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.65)", gap:8 }}>
                          <div style={{ width:36, height:36, border:"3px solid rgba(245,166,35,.3)", borderTop:"3px solid #F5A623", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
                          <div style={{ fontSize:13, color:"#F5A623", fontWeight:700 }}>{Math.round(f.progress)}%</div>
                          <div style={{ fontSize:11, color:"#F5A623" }}>FFmpeg processing…</div>
                        </div>
                      )}
                      {f.status==="done" && f.savings !== undefined && f.savings > 0 && (
                        <div style={{ position:"absolute", top:8, right:8, background:"rgba(0,200,120,.9)", color:"white", fontSize:12, fontWeight:800, padding:"3px 8px", borderRadius:8 }}>-{f.savings}%</div>
                      )}
                    </div>
                    <div style={{ padding:"12px 14px" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:5 }}>{f.name}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:10 }}>
                        <span>{formatBytes(f.originalSize)}</span>
                        {f.status==="done" && f.outputSize && <span style={{ color:"#00E5A0", fontWeight:700 }}>{formatBytes(f.outputSize)}</span>}
                      </div>
                      {f.status==="ready"      && <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,.3)", padding:"6px", border:"1px dashed rgba(255,255,255,.1)", borderRadius:8 }}>Ready</div>}
                      {f.status==="processing" && (
                        <div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#F5A623", marginBottom:6 }}>
                            <span>Processing…</span>
                            <span style={{ fontWeight:700 }}>{Math.round(f.progress)}%</span>
                          </div>
                          <div style={{ height:6, background:"rgba(255,255,255,.1)", borderRadius:4, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${f.progress}%`, background:"linear-gradient(90deg,#F5A623,#FF6B35)", transition:"width .5s" }}/>
                          </div>
                        </div>
                      )}
                      {f.status==="done" && f.downloadUrl && f.downloadFilename && (
                        <button className="db"
                          onClick={() => downloadFile(f.downloadUrl!, f.downloadFilename!)}
                          style={{ width:"100%", background:"linear-gradient(135deg,#F5A623,#FF6B35)", color:"white", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          ⬇️ Download GIF
                        </button>
                      )}
                      {f.status==="error" && <div style={{ textAlign:"center", fontSize:11, color:"#FF4B8A", padding:4 }}>{f.error}</div>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="dz" onClick={() => inputRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                style={{ border:"2px dashed rgba(255,255,255,.08)", borderRadius:16, minHeight:220, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                <div style={{ fontSize:32 }}>➕</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.3)", fontWeight:500 }}>Add more</div>
              </div>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" multiple accept={accept} style={{ display:"none" }}
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value=""; }}
        />
      </div>
    </>
  );
}
