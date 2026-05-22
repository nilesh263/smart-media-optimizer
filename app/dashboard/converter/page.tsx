"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConvertFile {
  id:            string;
  name:          string;
  originalSize:  number;
  file:          File;
  status:        "ready" | "processing" | "done" | "error";
  results?:      { name: string; blob: Blob; url: string; size: number }[];
  error?:        string;
}

type ConvertMode =
  | "img2pdf"   | "pdf2img"
  | "img2jpg"   | "img2png"  | "img2webp"
  | "img2avif"  | "img2gif"  | "img2bmp";

function formatBytes(b: number) {
  if (!b) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Load PDF-lib ──────────────────────────────────────────
async function loadPDFLib() {
  if ((window as any).PDFLib) return (window as any).PDFLib;
  await new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
    s.onload = () => res(); s.onerror = rej;
    document.head.appendChild(s);
  });
  return (window as any).PDFLib;
}

// ── Load PDF.js ───────────────────────────────────────────
async function loadPDFJS() {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  await new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => res(); s.onerror = rej;
    document.head.appendChild(s);
  });
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return (window as any).pdfjsLib;
}

// ── Image → Canvas ────────────────────────────────────────
function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      res(c);
    };
    img.onerror = () => rej(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// ── Single image → PDF ────────────────────────────────────
async function singleImageToPDF(file: File): Promise<Blob> {
  const PDFLib = await loadPDFLib();
  const canvas = await imageToCanvas(file);
  const jpgData = canvas.toDataURL("image/jpeg", 0.92);
  const jpgBytes = Uint8Array.from(atob(jpgData.split(",")[1]), c => c.charCodeAt(0));
  const doc  = await PDFLib.PDFDocument.create();
  const img  = await doc.embedJpg(jpgBytes);
  const page = doc.addPage([canvas.width, canvas.height]);
  page.drawImage(img, { x:0, y:0, width:canvas.width, height:canvas.height });
  return new Blob([await doc.save()], { type:"application/pdf" });
}

// ── Multiple images → single PDF ─────────────────────────
async function multiImagesToPDF(files: File[]): Promise<Blob> {
  const PDFLib = await loadPDFLib();
  const doc    = await PDFLib.PDFDocument.create();
  for (const file of files) {
    const canvas   = await imageToCanvas(file);
    const jpgData  = canvas.toDataURL("image/jpeg", 0.92);
    const jpgBytes = Uint8Array.from(atob(jpgData.split(",")[1]), c => c.charCodeAt(0));
    const img      = await doc.embedJpg(jpgBytes);
    const page     = doc.addPage([canvas.width, canvas.height]);
    page.drawImage(img, { x:0, y:0, width:canvas.width, height:canvas.height });
  }
  return new Blob([await doc.save()], { type:"application/pdf" });
}

// ── PDF → Images ──────────────────────────────────────────
async function pdfToImages(
  file: File, fmt: string, scale: number
): Promise<{ name: string; blob: Blob; url: string; size: number }[]> {
  const pdfjsLib = await loadPDFJS();
  const buf      = await file.arrayBuffer();
  const pdf      = await pdfjsLib.getDocument({ data: buf }).promise;
  const results: { name: string; blob: Blob; url: string; size: number }[] = [];
  const base     = file.name.replace(/\.pdf$/i, "");

  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const vp      = page.getViewport({ scale });
    const canvas  = document.createElement("canvas");
    canvas.width  = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    const mime    = fmt === "jpg" ? "image/jpeg" : "image/png";
    const blob    = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error("Failed")), mime, 0.92)
    );
    results.push({
      name: `${base}-page-${i}.${fmt}`,
      blob, size: blob.size,
      url: URL.createObjectURL(blob),
    });
  }
  return results;
}

// ── Image format conversion ───────────────────────────────
async function convertImageFormat(file: File, fmt: string, quality: number): Promise<Blob> {
  const canvas = await imageToCanvas(file);
  const mime   = fmt === "jpg" ? "image/jpeg" : fmt === "png" ? "image/png" : `image/${fmt}`;
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error("Failed")), mime, quality/100)
  );
}

// ── Mode definitions ──────────────────────────────────────
const MODES: {
  id: ConvertMode; icon: string; label: string; from: string; to: string;
  color: string; accepts: string; desc: string;
}[] = [
  // → PDF
  { id:"img2pdf",  icon:"📄", label:"Image → PDF",   from:"Any Image",  to:"PDF",  color:"#FF4B8A", accepts:"image/*",        desc:"Convert JPG/PNG/WebP to PDF document" },
  // PDF →
  { id:"pdf2img",  icon:"🖼", label:"PDF → Images",  from:"PDF",        to:"JPG/PNG", color:"#6C63FF", accepts:".pdf,application/pdf", desc:"Extract every PDF page as image" },
  // Image formats
  { id:"img2webp", icon:"🌐", label:"→ WebP",        from:"Any Image",  to:"WebP", color:"#00D4FF", accepts:"image/*",        desc:"Best web format · 25-35% smaller" },
  { id:"img2jpg",  icon:"📷", label:"→ JPG",         from:"Any Image",  to:"JPG",  color:"#00E5A0", accepts:"image/*",        desc:"Universal format · works everywhere" },
  { id:"img2png",  icon:"🎨", label:"→ PNG",         from:"Any Image",  to:"PNG",  color:"#A89DFF", accepts:"image/*",        desc:"Lossless · supports transparency" },
  { id:"img2avif", icon:"⚡", label:"→ AVIF",        from:"Any Image",  to:"AVIF", color:"#FF6B35", accepts:"image/*",        desc:"Next-gen · smallest file size" },
  { id:"img2gif",  icon:"🎬", label:"→ GIF",         from:"Any Image",  to:"GIF",  color:"#F5A623", accepts:"image/*",        desc:"Animated-capable web format" },
  { id:"img2bmp",  icon:"🗃", label:"→ BMP",         from:"Any Image",  to:"BMP",  color:"#FF9F43", accepts:"image/*",        desc:"Uncompressed Windows bitmap" },
];

export default function ConverterPage() {
  const [files,    setFiles]    = useState<ConvertFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [mode,     setMode]     = useState<ConvertMode>("img2pdf");
  const [quality,  setQuality]  = useState(92);
  const [pdfFmt,   setPdfFmt]   = useState<"jpg"|"png">("jpg");
  const [pdfScale, setPdfScale] = useState(1.5);
  const [mergeAll, setMergeAll] = useState(false);
  const [running,  setRunning]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentMode = MODES.find(m => m.id === mode)!;

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter(f => {
      if (mode === "pdf2img") return f.type === "application/pdf" || f.name.endsWith(".pdf");
      return f.type.startsWith("image/");
    });
    if (!valid.length) return;
    setFiles(prev => [...prev, ...valid.map(f => ({
      id: crypto.randomUUID(), name: f.name,
      originalSize: f.size, file: f, status: "ready" as const,
    }))]);
  }, [mode]);

  const onDrop     = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave= () => setDragging(false);

  const runConvert = async () => {
    const ready = files.filter(f => f.status === "ready");
    if (!ready.length) return;
    setRunning(true);

    // Special case: merge all images into one PDF
    if (mode === "img2pdf" && mergeAll && ready.length > 1) {
      ready.forEach(item => setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"processing"} : f)));
      try {
        const blob = await multiImagesToPDF(ready.map(r => r.file));
        const result = [{ name:"merged-document.pdf", blob, url:URL.createObjectURL(blob), size:blob.size }];
        ready.forEach(item => setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"done", results:result} : f)));
      } catch(err) {
        ready.forEach(item => setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"error", error:String(err)} : f)));
      }
      setRunning(false);
      return;
    }

    for (const item of ready) {
      setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"processing"} : f));
      try {
        const base = item.name.replace(/\.[^.]+$/, "");
        let results: { name: string; blob: Blob; url: string; size: number }[] = [];

        if (mode === "img2pdf") {
          const blob = await singleImageToPDF(item.file);
          results = [{ name:`${base}.pdf`, blob, url:URL.createObjectURL(blob), size:blob.size }];
        } else if (mode === "pdf2img") {
          results = await pdfToImages(item.file, pdfFmt, pdfScale);
        } else {
          const fmtMap: Record<ConvertMode, string> = {
            img2jpg:"jpg", img2png:"png", img2webp:"webp",
            img2avif:"avif", img2gif:"gif", img2bmp:"bmp",
            img2pdf:"pdf", pdf2img:"jpg",
          };
          const fmt  = fmtMap[mode];
          const blob = await convertImageFormat(item.file, fmt, quality);
          results = [{ name:`${base}.${fmt}`, blob, url:URL.createObjectURL(blob), size:blob.size }];
        }

        setFiles(prev => prev.map(f => f.id===item.id ? {...f, status:"done", results} : f));
      } catch(err) {
        setFiles(prev => prev.map(f => f.id===item.id ? {
          ...f, status:"error", error:err instanceof Error ? err.message : "Failed",
        } : f));
      }
    }
    setRunning(false);
  };

  const doneFiles  = files.filter(f => f.status === "done");
  const readyFiles = files.filter(f => f.status === "ready");

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dz { transition: all .2s; cursor: pointer; }
        .dz:hover { border-color: rgba(108,99,255,.6) !important; background: rgba(108,99,255,.08) !important; }
        .db { transition: all .15s; cursor: pointer; border: none; }
        .db:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .mc { transition: all .15s; cursor: pointer; }
        .mc:hover { opacity: .85; }
      `}</style>

      <div style={{ padding:24, fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column", gap:20, maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4 }}>File Converter</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:0 }}>
            Convert between image formats, images to PDF, and PDF to images — browser-based 🔒
          </p>
        </div>

        {/* Mode selector */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* → PDF section */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
              Convert to PDF
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {MODES.filter(m => m.to === "PDF" || m.to === "JPG/PNG").map(m => (
                <button key={m.id} className="mc"
                  onClick={() => { setMode(m.id); setFiles([]); }}
                  style={{ padding:"12px 16px", borderRadius:12, textAlign:"left", color:"white", minWidth:160,
                    background: mode===m.id?`${m.color}18`:"rgba(255,255,255,.03)",
                    border:`2px solid ${mode===m.id?m.color+"70":"rgba(255,255,255,.07)"}`,
                  }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image format section */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
              Convert Image Format
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {MODES.filter(m => !["PDF","JPG/PNG"].includes(m.to)).map(m => (
                <button key={m.id} className="mc"
                  onClick={() => { setMode(m.id); setFiles([]); }}
                  style={{ padding:"12px 16px", borderRadius:12, textAlign:"left", color:"white", minWidth:130,
                    background: mode===m.id?`${m.color}18`:"rgba(255,255,255,.03)",
                    border:`2px solid ${mode===m.id?m.color+"70":"rgba(255,255,255,.07)"}`,
                  }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:"14px 20px", display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>

          {/* Quality for lossy formats */}
          {["img2jpg","img2webp","img2avif"].includes(mode) && (
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Quality</span>
              <input type="range" min={1} max={100} value={quality} onChange={e => setQuality(+e.target.value)}
                style={{ width:120, accentColor:"#6C63FF" }}/>
              <span style={{ fontSize:13, fontWeight:800, color:quality>=80?"#00E5A0":quality>=60?"#6C63FF":"#FF6B35",
                background:"rgba(255,255,255,.06)", padding:"3px 10px", borderRadius:8 }}>
                {quality}%
              </span>
            </div>
          )}

          {/* PDF to image options */}
          {mode === "pdf2img" && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Output Format</span>
                {(["jpg","png"] as const).map(f => (
                  <button key={f} className="db"
                    onClick={() => setPdfFmt(f)}
                    style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600,
                      background: pdfFmt===f?"#6C63FF":"rgba(255,255,255,.07)",
                      color: pdfFmt===f?"white":"rgba(255,255,255,.4)" }}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Resolution</span>
                {[{l:"Normal",v:1},{l:"High",v:1.5},{l:"Ultra",v:2}].map(r => (
                  <button key={r.v} className="db"
                    onClick={() => setPdfScale(r.v)}
                    style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600,
                      background: pdfScale===r.v?"#6C63FF":"rgba(255,255,255,.07)",
                      color: pdfScale===r.v?"white":"rgba(255,255,255,.4)" }}>
                    {r.l}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Merge option for img2pdf */}
          {mode === "img2pdf" && (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div onClick={() => setMergeAll(v=>!v)} style={{ width:36, height:20, borderRadius:10, background:mergeAll?"#6C63FF":"rgba(255,255,255,.1)", position:"relative", transition:"background .2s", cursor:"pointer" }}>
                <div style={{ position:"absolute", top:2, left:mergeAll?18:2, width:16, height:16, borderRadius:"50%", background:"white", transition:"left .2s" }}/>
              </div>
              <span style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Merge all images into one PDF</span>
            </div>
          )}

          {/* Info */}
          <div style={{ marginLeft:"auto", fontSize:12, color:"rgba(255,255,255,.3)" }}>
            Converting: <span style={{ color: currentMode.color, fontWeight:700 }}>{currentMode.from} → {currentMode.to}</span>
          </div>
        </div>

        {/* Drop zone */}
        <div className="dz"
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?"rgba(108,99,255,.8)":"rgba(108,99,255,.3)"}`, background:dragging?"rgba(108,99,255,.12)":"rgba(108,99,255,.04)", borderRadius:20, padding:"44px 24px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{dragging?"📥":"🔄"}</div>
          <div style={{ fontSize:18, fontWeight:700, color:"white", marginBottom:8 }}>
            {dragging?"Release to add files":`Drop ${mode==="pdf2img"?"PDF":"image"} files here`}
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>
            or <span style={{ color:"#6C63FF", textDecoration:"underline" }}>click to browse</span>
            {" · "}{mode==="pdf2img"?"PDF files only":"JPG · PNG · WebP · AVIF · GIF · BMP"}
          </div>
        </div>

        {/* Files */}
        {files.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {readyFiles.length > 0 && (
              <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="db"
                onClick={runConvert} disabled={running}
                style={{ background:`linear-gradient(135deg,${currentMode.color},${currentMode.color}BB)`, color:"white", borderRadius:14, padding:"16px", fontSize:15, fontWeight:700, boxShadow:`0 4px 24px ${currentMode.color}40`, opacity:running?.7:1 }}>
                {running ? "⏳ Converting…" : `🔄 Convert ${readyFiles.length} file${readyFiles.length>1?"s":""} · ${currentMode.from} → ${currentMode.to}`}
              </motion.button>
            )}

            {/* File list */}
            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:16, overflow:"hidden" }}>
              {files.map((f, idx) => (
                <div key={f.id} style={{ padding:"14px 20px", borderBottom:idx<files.length-1?"1px solid rgba(255,255,255,.04)":"none", position:"relative" }}>
                  {f.status==="done" && <div style={{ position:"absolute", inset:0, background:"rgba(0,229,160,.03)", pointerEvents:"none" }}/>}

                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:f.results && f.results.length>1?10:0 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:"rgba(108,99,255,.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, zIndex:1 }}>
                      {mode==="pdf2img"?"📄":"🖼"}
                    </div>
                    <div style={{ flex:1, minWidth:0, zIndex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:260 }}>{f.name}</span>
                        {f.status==="ready"      && <span style={{ background:"rgba(245,166,35,.12)",  color:"#F5A623", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Ready</span>}
                        {f.status==="done"       && <span style={{ background:"rgba(0,229,160,.12)",   color:"#00E5A0", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20 }}>✓ Done</span>}
                        {f.status==="processing" && <span style={{ background:"rgba(108,99,255,.12)", color:"#A89DFF", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Converting…</span>}
                        {f.status==="error"      && <span style={{ background:"rgba(255,75,138,.12)",  color:"#FF4B8A", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Error</span>}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>
                        {formatBytes(f.originalSize)}
                        {f.status==="error" && <span style={{ color:"#FF4B8A", marginLeft:8 }}>{f.error}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, zIndex:1 }}>
                      {f.status==="processing" && <div style={{ width:22, height:22, border:"3px solid rgba(108,99,255,.3)", borderTop:"3px solid #6C63FF", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>}
                      {f.status==="done" && f.results && f.results.length===1 && (
                        <button className="db"
                          onClick={() => downloadBlob(f.results![0].blob, f.results![0].name)}
                          style={{ background:`linear-gradient(135deg,${currentMode.color},${currentMode.color}BB)`, color:"white", borderRadius:10, padding:"8px 18px", fontSize:13, fontWeight:700 }}>
                          ⬇️ Download
                        </button>
                      )}
                      {f.status==="done" && f.results && f.results.length>1 && (
                        <button className="db"
                          onClick={() => f.results!.forEach(r => downloadBlob(r.blob, r.name))}
                          style={{ background:`linear-gradient(135deg,${currentMode.color},${currentMode.color}BB)`, color:"white", borderRadius:10, padding:"8px 18px", fontSize:13, fontWeight:700 }}>
                          ⬇️ Download All ({f.results.length})
                        </button>
                      )}
                      <button onClick={() => setFiles(prev => prev.filter(x => x.id!==f.id))}
                        style={{ background:"none", border:"none", color:"rgba(255,255,255,.2)", cursor:"pointer", fontSize:20, padding:"4px 6px" }}>✕</button>
                    </div>
                  </div>

                  {/* PDF to image results grid */}
                  {f.status==="done" && f.results && f.results.length > 1 && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8, paddingLeft:54, zIndex:1, position:"relative" }}>
                      {f.results.map((r,i) => (
                        <div key={i} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, overflow:"hidden" }}>
                          <img src={r.url} alt={r.name} style={{ width:"100%", height:80, objectFit:"cover" }}/>
                          <div style={{ padding:"6px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>Page {i+1}</span>
                            <button className="db" onClick={() => downloadBlob(r.blob, r.name)}
                              style={{ background:"rgba(108,99,255,.2)", color:"#A89DFF", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700 }}>
                              ⬇️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="dz" onClick={() => inputRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              style={{ border:"2px dashed rgba(255,255,255,.08)", borderRadius:12, padding:14, textAlign:"center", fontSize:13, color:"rgba(255,255,255,.25)" }}>
              + Drop more files here
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" multiple accept={currentMode.accepts} style={{ display:"none" }}
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value=""; }}
        />
      </div>
    </>
  );
}
