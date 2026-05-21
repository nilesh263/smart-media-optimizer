"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoFile {
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
  duration?:    string;
  thumbnail?:   string;
  error?:       string;
}

type VideoTool = "compress" | "audio";
type Quality   = "high" | "medium" | "web";

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2,"0")}`;
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

async function getVideoThumbnail(file: File): Promise<{ thumbnail: string; duration: string }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1); };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 180;
      canvas.getContext("2d")!.drawImage(video, 0, 0, 320, 180);
      resolve({ thumbnail: canvas.toDataURL("image/jpeg", 0.8), duration: formatDuration(video.duration) });
    };
    video.onerror = () => resolve({ thumbnail: "", duration: "0:00" });
  });
}

const API = "http://localhost:4000";

const QUALITIES: { id: Quality; label: string; desc: string; crf: string; saving: string; color: string }[] = [
  { id:"high",   label:"💎 High Quality",    desc:"CRF 18 — near lossless, maximum fidelity",   crf:"CRF 18", saving:"20-40% smaller",  color:"#00D4FF" },
  { id:"medium", label:"⭐ Balanced",         desc:"CRF 23 — excellent quality, recommended",     crf:"CRF 23", saving:"40-60% smaller",  color:"#00E5A0" },
  { id:"web",    label:"🚀 Web Optimized",    desc:"CRF 26 — great quality, smallest web file",   crf:"CRF 26", saving:"50-70% smaller",  color:"#FF6B35" },
];

export default function VideoPage() {
  const [files,    setFiles]   = useState<VideoFile[]>([]);
  const [dragging, setDragging]= useState(false);
  const [tool,     setTool]    = useState<VideoTool>("compress");
  const [quality,  setQuality] = useState<Quality>("medium");
  const [running,  setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (incoming: File[]) => {
    const valid = incoming.filter(f => f.type.startsWith("video/") || f.name.match(/\.(mp4|mov|avi|webm|mkv|flv)$/i));
    if (!valid.length) return;
    const items: VideoFile[] = await Promise.all(valid.map(async f => {
      const { thumbnail, duration } = await getVideoThumbnail(f);
      return { id: crypto.randomUUID(), name: f.name, originalSize: f.size, file: f, status: "ready" as const, progress: 0, thumbnail, duration };
    }));
    setFiles(prev => [...prev, ...items]);
  }, []);

  const onDrop     = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave= () => setDragging(false);

  const runProcess = async () => {
    const ready = files.filter(f => f.status === "ready");
    if (!ready.length) return;
    setRunning(true);

    for (const item of ready) {
      setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"processing", progress:10} : f));
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        if (tool === "compress") formData.append("quality", quality);

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.id === item.id && f.progress < 85) {
              return {...f, progress: Math.min(85, f.progress + Math.random() * 8 + 2)};
            }
            return f;
          }));
        }, 1000);

        const endpoint = tool === "compress" ? "/api/video/compress" : "/api/video/extract-audio";
        const res  = await fetch(API + endpoint, { method: "POST", body: formData });
        clearInterval(progressInterval);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Processing failed");

        setFiles(prev => prev.map(f => f.id===item.id ? {
          ...f, status:"done", progress:100,
          outputSize:      data.compressedSize || 0,
          savings:         data.savings || 0,
          downloadUrl:     data.downloadUrl,
          downloadFilename:data.downloadFilename,
        } : f));

      } catch (err) {
        setFiles(prev => prev.map(f => f.id===item.id ? {
          ...f, status:"error", progress:0,
          error: err instanceof Error ? err.message : "Processing failed",
        } : f));
      }
    }
    setRunning(false);
  };

  const doneFiles  = files.filter(f => f.status === "done");
  const readyFiles = files.filter(f => f.status === "ready");
  const totalSaved = doneFiles.reduce((a,f) => a + f.originalSize - (f.outputSize||0), 0);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dz { transition: all .2s; cursor: pointer; }
        .dz:hover { border-color: rgba(255,107,53,.6) !important; background: rgba(255,107,53,.08) !important; }
        .db { transition: all .15s; cursor: pointer; border: none; }
        .db:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .mc { transition: all .15s; cursor: pointer; }
        .mc:hover { border-color: rgba(255,255,255,.2) !important; }
      `}</style>

      <div style={{ padding:24, fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column", gap:20, maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4 }}>Video Tools</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:0 }}>
              FFmpeg-powered — real compression, zero visible quality loss
            </p>
          </div>
          {totalSaved > 0 && (
            <div style={{ background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.25)", borderRadius:12, padding:"10px 20px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#FF6B35", lineHeight:1 }}>{formatBytes(totalSaved)}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>Total saved</div>
            </div>
          )}
        </div>

        {/* FFmpeg badge */}
        <div style={{ background:"linear-gradient(135deg,rgba(0,229,160,.08),rgba(0,212,255,.06))", border:"1px solid rgba(0,229,160,.2)", borderRadius:12, padding:"12px 18px", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#00E5A0" }}>Powered by FFmpeg — Professional Grade Compression</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>
              Same engine used by YouTube, Netflix, and HandBrake. H.264 encoding with CRF quality control — visually lossless output.
            </div>
          </div>
        </div>

        {/* Tool tabs */}
        <div style={{ display:"flex", gap:10 }}>
          {([
            { id:"compress" as VideoTool, icon:"🎞", label:"Compress Video", desc:"H.264 FFmpeg compression" },
            { id:"audio"    as VideoTool, icon:"🎵", label:"Extract Audio",  desc:"Save MP3 from video"     },
          ]).map(t => (
            <button key={t.id} className="mc"
              onClick={() => { setTool(t.id); setFiles([]); }}
              style={{ flex:1, padding:"16px", borderRadius:14, textAlign:"center", color:"white",
                background: tool===t.id?"rgba(255,107,53,.15)":"rgba(255,255,255,.03)",
                border:`2px solid ${tool===t.id?"rgba(255,107,53,.5)":"rgba(255,255,255,.07)"}`,
              }}>
              <div style={{ fontSize:26, marginBottom:6 }}>{t.icon}</div>
              <div style={{ fontSize:14, fontWeight:700 }}>{t.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Quality modes */}
        {tool === "compress" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:1 }}>
              Compression Quality — all modes are visually lossless
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {QUALITIES.map(q => (
                <button key={q.id} className="mc"
                  onClick={() => setQuality(q.id)}
                  style={{ padding:"16px", borderRadius:14, textAlign:"left", color:"white", position:"relative",
                    background: quality===q.id?`${q.color}18`:"rgba(255,255,255,.03)",
                    border:`2px solid ${quality===q.id?q.color+"60":"rgba(255,255,255,.07)"}`,
                  }}>
                  {quality===q.id && <div style={{ position:"absolute", top:10, right:10, width:8, height:8, borderRadius:"50%", background:q.color }}/>}
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{q.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginBottom:4 }}>{q.desc}</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:q.color, background:`${q.color}18`, padding:"2px 8px", borderRadius:6 }}>{q.crf}</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>{q.saving}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drop zone */}
        <div className="dz"
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?"rgba(255,107,53,.8)":"rgba(255,107,53,.3)"}`, background:dragging?"rgba(255,107,53,.12)":"rgba(255,107,53,.04)", borderRadius:20, padding:"44px 24px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{dragging?"📥":"🎞"}</div>
          <div style={{ fontSize:18, fontWeight:700, color:"white", marginBottom:8 }}>
            {dragging?"Release to add video":"Drop video files here"}
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginBottom:16 }}>
            or <span style={{ color:"#FF6B35", textDecoration:"underline" }}>click to browse</span> — MP4, MOV, AVI, WebM supported
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
            {["MP4","MOV","AVI","WebM","MKV","FLV"].map(f => (
              <span key={f} style={{ background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:6 }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Files */}
        {files.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Action button */}
            {readyFiles.length > 0 && (
              <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="db"
                onClick={runProcess} disabled={running}
                style={{ background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", color:"white", borderRadius:14, padding:"16px", fontSize:15, fontWeight:700, boxShadow:"0 4px 24px rgba(255,107,53,.4)", opacity:running?.7:1 }}>
                {running
                  ? "⏳ Processing with FFmpeg… please wait"
                  : tool==="compress"
                  ? `🎞 Compress ${readyFiles.length} video${readyFiles.length>1?"s":""} · ${QUALITIES.find(q=>q.id===quality)?.crf}`
                  : `🎵 Extract audio from ${readyFiles.length} video${readyFiles.length>1?"s":""}`
                }
              </motion.button>
            )}

            {/* Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              <AnimatePresence>
                {files.map(f => (
                  <motion.div key={f.id}
                    initial={{opacity:0,scale:.94,y:10}}
                    animate={{opacity:1,scale:1,y:0}}
                    exit={{opacity:0,scale:.9}}
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, overflow:"hidden" }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position:"relative", height:150, background:"rgba(0,0,0,.5)", overflow:"hidden" }}>
                      {f.thumbnail
                        ? <img src={f.thumbnail} alt={f.name} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:f.status==="processing"?.5:1, transition:"opacity .3s" }}/>
                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🎞</div>
                      }
                      {f.status==="processing" && (
                        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.7)", gap:10 }}>
                          <div style={{ width:36, height:36, border:"3px solid rgba(255,107,53,.3)", borderTop:"3px solid #FF6B35", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
                          <div style={{ fontSize:12, color:"#FF6B35", fontWeight:600 }}>{Math.round(f.progress)}%</div>
                        </div>
                      )}
                      {f.duration && (
                        <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,.75)", color:"white", fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:6 }}>{f.duration}</div>
                      )}
                      {f.status==="done" && f.savings !== undefined && f.savings > 0 && (
                        <div style={{ position:"absolute", top:8, right:8, background:"rgba(0,200,120,.9)", color:"white", fontSize:12, fontWeight:800, padding:"3px 8px", borderRadius:8 }}>
                          -{f.savings}%
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {f.status==="processing" && (
                      <div style={{ height:3, background:"rgba(255,255,255,.08)" }}>
                        <div style={{ height:"100%", width:`${f.progress}%`, background:"linear-gradient(90deg,#FF6B35,#FF8C5A)", transition:"width .5s" }}/>
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ padding:"12px 14px" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:5 }}>{f.name}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:10 }}>
                        <span>{formatBytes(f.originalSize)}</span>
                        {f.status==="done" && f.outputSize && f.outputSize > 0 && (
                          <span style={{ color:"#00E5A0", fontWeight:700 }}>{formatBytes(f.outputSize)}</span>
                        )}
                      </div>

                      {f.status==="ready" && (
                        <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,.3)", padding:"6px", border:"1px dashed rgba(255,255,255,.1)", borderRadius:8 }}>
                          Ready to {tool==="audio"?"extract audio":"compress"}
                        </div>
                      )}
                      {f.status==="processing" && (
                        <div style={{ textAlign:"center", fontSize:12, color:"#FF6B35" }}>FFmpeg processing… {Math.round(f.progress)}%</div>
                      )}
                      {f.status==="done" && f.downloadUrl && f.downloadFilename && (
                        <button className="db"
                          onClick={() => downloadFile(f.downloadUrl!, f.downloadFilename!)}
                          style={{ width:"100%", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", color:"white", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          ⬇️ Download {tool==="audio" ? "MP3" : "MP4"}
                        </button>
                      )}
                      {f.status==="error" && (
                        <div style={{ textAlign:"center", fontSize:11, color:"#FF4B8A", padding:4 }}>{f.error}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add more */}
              <div className="dz"
                onClick={() => inputRef.current?.click()}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                style={{ border:"2px dashed rgba(255,255,255,.08)", borderRadius:16, minHeight:240, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                <div style={{ fontSize:32 }}>➕</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.3)", fontWeight:500 }}>Add more videos</div>
              </div>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" multiple accept="video/*" style={{ display:"none" }}
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value=""; }}
        />
      </div>
    </>
  );
}
