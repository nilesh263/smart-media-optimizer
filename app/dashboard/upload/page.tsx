"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileItem {
  id: string;
  name: string;
  originalSize: number;
  originalUrl: string;
  compressedUrl?: string;
  compressedSize?: number;
  compressedBlob?: Blob;
  savings?: number;
  status: "processing" | "done" | "error";
  error?: string;
}

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024;
  const s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
}

const QUALITY_OPTIONS = [100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,15,10];

async function compressImage(file: File, quality: number, scale: number, fmt: string) {
  return new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mime = fmt === "jpg" ? "image/jpeg" : ("image/" + fmt);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Conversion failed"));
          resolve({ blob, url: URL.createObjectURL(blob) });
        },
        mime,
        quality / 100
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadAllAsZip(files: FileItem[], fmt: string) {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  document.head.appendChild(script);
  await new Promise((r) => { script.onload = r; });
  const JSZip = (window as any).JSZip;
  const zip = new JSZip();
  files.forEach((f) => {
    if (f.compressedBlob) {
      const base = f.name.replace(/\.[^.]+$/, "");
      zip.file(base + "-compressed." + fmt, f.compressedBlob);
    }
  });
  const content = await zip.generateAsync({ type: "blob" });
  downloadBlob(content, "compressed-images.zip");
}

export default function UploadPage() {
  const [files,    setFiles]   = useState<FileItem[]>([]);
  const [dragging, setDragging]= useState(false);
  const [quality,  setQuality] = useState(80);
  const [scale,    setScale]   = useState(1);
  const [format,   setFormat]  = useState("webp");
  const [preview,  setPreview] = useState<FileItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File, q: number, sc: number, fmt: string): Promise<FileItem> => {
    const id = crypto.randomUUID();
    const originalUrl = URL.createObjectURL(file);
    try {
      const { blob, url } = await compressImage(file, q, sc, fmt);
      const savings = parseFloat(((file.size - blob.size) / file.size * 100).toFixed(1));
      return { id, name: file.name, originalSize: file.size, originalUrl, compressedUrl: url, compressedSize: blob.size, compressedBlob: blob, savings, status: "done" };
    } catch (err) {
      return { id, name: file.name, originalSize: file.size, originalUrl, status: "error", error: String(err) };
    }
  }, []);

  const addAndProcess = useCallback(async (incoming: File[]) => {
    const valid = incoming.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    const placeholders: FileItem[] = valid.map((f) => ({
      id: crypto.randomUUID(), name: f.name, originalSize: f.size,
      originalUrl: URL.createObjectURL(f), status: "processing" as const,
    }));
    setFiles((prev) => [...prev, ...placeholders]);
    const results = await Promise.all(
      valid.map((f, i) => processFile(f, quality, scale, format).then((r) => ({ ...r, id: placeholders[i].id })))
    );
    setFiles((prev) => prev.map((p) => results.find((r) => r.id === p.id) || p));
  }, [quality, scale, format, processFile]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addAndProcess(Array.from(e.dataTransfer.files)); };
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const doneFiles  = files.filter((f) => f.status === "done");
  const totalSaved = doneFiles.reduce((a, f) => a + f.originalSize - (f.compressedSize || 0), 0);
  const avgSavings = doneFiles.length ? Math.round(doneFiles.reduce((a, f) => a + (f.savings || 0), 0) / doneFiles.length) : 0;

  const qColor = quality >= 80 ? "#00E5A0" : quality >= 60 ? "#6C63FF" : quality >= 40 ? "#FF6B35" : "#FF4B8A";
  const qLabel = quality >= 80 ? "Near lossless" : quality >= 60 ? "Balanced" : quality >= 40 ? "Aggressive" : "Extreme";

  return (
    <>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .dz  { transition: all .2s; cursor: pointer; }
        .dz:hover { border-color: rgba(108,99,255,.6) !important; background: rgba(108,99,255,.1) !important; }
        .fc  { transition: all .2s; }
        .fc:hover { border-color: rgba(255,255,255,.14) !important; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
        .db  { transition: all .15s; cursor: pointer; border: none; }
        .db:hover { filter: brightness(1.15); transform: translateY(-1px); }
        select { appearance: none; cursor: pointer; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.88); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#08090F", color:"#F0F2FF", padding:24, fontFamily:"system-ui,sans-serif" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4, fontFamily:"system-ui,sans-serif" }}>Image Optimizer</h1>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:0 }}>Browser-based — files never leave your device 🔒</p>
            </div>
            {doneFiles.length > 0 && (
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ background:"rgba(0,229,160,.08)", border:"1px solid rgba(0,229,160,.2)", borderRadius:12, padding:"10px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#00E5A0", lineHeight:1 }}>{avgSavings}%</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>Avg saved</div>
                </div>
                <div style={{ background:"rgba(108,99,255,.08)", border:"1px solid rgba(108,99,255,.2)", borderRadius:12, padding:"10px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#A89DFF", lineHeight:1 }}>{formatBytes(totalSaved)}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>Total saved</div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"16px 20px", display:"flex", flexWrap:"wrap", gap:20, alignItems:"center" }}>

            {/* Quality */}
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:1 }}>Quality</label>
              <select value={quality} onChange={(e) => setQuality(+e.target.value)}
                style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"8px 12px", fontSize:14, fontWeight:600, color:"white", minWidth:100 }}>
                {QUALITY_OPTIONS.map((q) => (
                  <option key={q} value={q} style={{ background:"#0F1219" }}>{q}%</option>
                ))}
              </select>
            </div>

            <div style={{ width:1, height:40, background:"rgba(255,255,255,.08)" }}/>

            {/* Size */}
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:1 }}>Size</label>
              <select value={scale} onChange={(e) => setScale(+e.target.value)}
                style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"8px 12px", fontSize:14, fontWeight:600, color:"white", minWidth:130 }}>
                {[{l:"x1 Original",v:1},{l:"x2 Double",v:2},{l:"90%",v:0.9},{l:"80%",v:0.8},{l:"70%",v:0.7},{l:"50%",v:0.5},{l:"30%",v:0.3}].map((s) => (
                  <option key={s.v} value={s.v} style={{ background:"#0F1219" }}>{s.l}</option>
                ))}
              </select>
            </div>

            <div style={{ width:1, height:40, background:"rgba(255,255,255,.08)" }}/>

            {/* Format */}
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:1 }}>Format</label>
              <div style={{ display:"flex", gap:6 }}>
                {["webp","jpg","png","avif"].map((f) => (
                  <button key={f} onClick={() => setFormat(f)} style={{ padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:600, border:"none", cursor:"pointer", background:format===f?"#6C63FF":"rgba(255,255,255,.07)", color:format===f?"white":"rgba(255,255,255,.45)", transition:"all .15s" }}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality indicator */}
            <div style={{ marginLeft:"auto", textAlign:"center" }}>
              <div style={{ fontSize:30, fontWeight:800, color:qColor, lineHeight:1 }}>{quality}%</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>{qLabel}</div>
            </div>
          </div>

          {/* Drop zone */}
          <div className="dz"
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{ border:"2px dashed " + (dragging?"rgba(108,99,255,.8)":"rgba(108,99,255,.3)"), background:dragging?"rgba(108,99,255,.12)":"rgba(108,99,255,.04)", borderRadius:20, padding:"48px 24px", textAlign:"center" }}
          >
            <div style={{ fontSize:50, marginBottom:12 }}>{dragging ? "📥" : "🖼"}</div>
            <div style={{ fontSize:20, fontWeight:700, color:"white", marginBottom:8 }}>{dragging ? "Release to compress!" : "Drop images here"}</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,.4)", marginBottom:16 }}>
              or <span style={{ color:"#6C63FF", textDecoration:"underline" }}>click to browse</span> — compressed instantly in your browser
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6 }}>
              {["JPG","PNG","WebP","AVIF","GIF","BMP","TIFF"].map((f) => (
                <span key={f} style={{ background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:6 }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Files */}
          {files.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Toolbar */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>{doneFiles.length}/{files.length} done</span>
                  {totalSaved > 0 && (
                    <span style={{ background:"rgba(0,229,160,.15)", color:"#00E5A0", fontSize:13, fontWeight:700, padding:"4px 14px", borderRadius:20 }}>
                      💾 {formatBytes(totalSaved)} saved
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {doneFiles.length > 1 && (
                    <button className="db"
                      onClick={() => downloadAllAsZip(doneFiles, format)}
                      style={{ background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:10, padding:"9px 20px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, boxShadow:"0 2px 16px rgba(108,99,255,.4)" }}>
                      ⬇️ Download All ({doneFiles.length}) as ZIP
                    </button>
                  )}
                  <button onClick={() => setFiles([])} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.5)", borderRadius:10, padding:"9px 16px", fontSize:13, cursor:"pointer" }}>
                    Clear all
                  </button>
                </div>
              </div>

              {/* Card grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
                <AnimatePresence>
                  {files.map((f) => (
                    <motion.div key={f.id} className="fc"
                      initial={{ opacity:0, scale:.94, y:10 }}
                      animate={{ opacity:1, scale:1,    y:0  }}
                      exit={{    opacity:0, scale:.9,    y:-10 }}
                      style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, overflow:"hidden" }}
                    >
                      {/* Thumbnail */}
                      <div style={{ position:"relative", height:140, background:"rgba(0,0,0,.3)", overflow:"hidden" }}>
                        {f.status==="done" && f.compressedUrl
                          ? <img src={f.compressedUrl} alt={f.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          : <img src={f.originalUrl}   alt={f.name} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"blur(3px)", opacity:.4 }}/>
                        }
                        {f.status==="processing" && (
                          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.6)" }}>
                            <div style={{ width:32, height:32, border:"3px solid rgba(108,99,255,.3)", borderTop:"3px solid #6C63FF", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
                          </div>
                        )}
                        {f.status==="done" && f.savings !== undefined && (
                          <div style={{ position:"absolute", top:8, right:8, background:f.savings>0?"rgba(0,200,120,.9)":"rgba(255,107,53,.9)", color:"white", fontSize:12, fontWeight:800, padding:"3px 8px", borderRadius:8 }}>
                            {f.savings > 0 ? "-" + f.savings + "%" : "No change"}
                          </div>
                        )}
                        {f.status==="done" && (
                          <button onClick={() => setPreview(f)} style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.65)", border:"1px solid rgba(255,255,255,.2)", color:"white", borderRadius:6, padding:"3px 8px", fontSize:11, cursor:"pointer" }}>
                            🔍 Preview
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding:"12px 14px" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:6 }}>{f.name}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:10 }}>
                          <span>{formatBytes(f.originalSize)}</span>
                          {f.status==="done" && f.compressedSize && (
                            <span style={{ color:"#00E5A0", fontWeight:700 }}>{formatBytes(f.compressedSize)}</span>
                          )}
                        </div>
                        {f.status==="done" && f.compressedBlob && (
                          <button className="db"
                            onClick={() => { const b = f.name.replace(/\.[^.]+$/, ""); downloadBlob(f.compressedBlob!, b + "-compressed." + format); }}
                            style={{ width:"100%", background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 2px 12px rgba(108,99,255,.3)" }}>
                            ⬇️ Download
                          </button>
                        )}
                        {f.status==="processing" && (
                          <div style={{ textAlign:"center", fontSize:12, color:"#A89DFF", animation:"pulse 1.5s infinite" }}>Compressing…</div>
                        )}
                        {f.status==="error" && (
                          <div style={{ textAlign:"center", fontSize:11, color:"#FF4B8A" }}>{f.error}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add more */}
                <div className="dz"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  style={{ border:"2px dashed rgba(255,255,255,.08)", borderRadius:16, minHeight:220, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}
                >
                  <div style={{ fontSize:32 }}>➕</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.3)", fontWeight:500 }}>Add more</div>
                </div>
              </div>
            </div>
          )}

          <input ref={inputRef} type="file" multiple accept="image/*" style={{ display:"none" }}
            onChange={(e) => { if (e.target.files) addAndProcess(Array.from(e.target.files)); e.target.value = ""; }}
          />
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div className="modal-bg" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setPreview(null)}
          >
            <motion.div initial={{ scale:.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background:"#0F1219", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, maxWidth:880, width:"100%", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }}
            >
              {/* Modal header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"white" }}>{preview.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>
                    {formatBytes(preview.originalSize)} → <span style={{ color:"#00E5A0" }}>{formatBytes(preview.compressedSize || 0)}</span>
                    <span style={{ marginLeft:8, color:"#00E5A0", fontWeight:700 }}>-{preview.savings}% saved</span>
                  </div>
                </div>
                <button onClick={() => setPreview(null)} style={{ background:"rgba(255,255,255,.08)", border:"none", color:"white", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
              </div>

              {/* Before / After */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", flex:1, overflow:"auto" }}>
                <div style={{ padding:16, borderRight:"1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                    Original — {formatBytes(preview.originalSize)}
                  </div>
                  <img src={preview.originalUrl} alt="Original" style={{ width:"100%", borderRadius:10, maxHeight:360, objectFit:"contain" }}/>
                </div>
                <div style={{ padding:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#00E5A0", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                    Compressed — {formatBytes(preview.compressedSize || 0)} (-{preview.savings}%)
                  </div>
                  <img src={preview.compressedUrl} alt="Compressed" style={{ width:"100%", borderRadius:10, maxHeight:360, objectFit:"contain" }}/>
                </div>
              </div>

              {/* Modal footer */}
              <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,.08)", display:"flex", justifyContent:"flex-end", gap:10 }}>
                <button onClick={() => setPreview(null)} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.6)", borderRadius:10, padding:"9px 20px", fontSize:13, cursor:"pointer" }}>Close</button>
                <button className="db"
                  onClick={() => { const b = preview.name.replace(/\.[^.]+$/, ""); downloadBlob(preview.compressedBlob!, b + "-compressed." + format); }}
                  style={{ background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:10, padding:"9px 20px", fontSize:13, fontWeight:700 }}>
                  ⬇️ Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
