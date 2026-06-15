"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// Every entry links to a real, existing tool page.
const TOOLS = [
  { icon:"🖼",  name:"Images",     desc:"Compress & optimize images",      href:"/dashboard/upload",     color:"#6C63FF" },
  { icon:"🎞",  name:"Videos",     desc:"Compress video, extract audio",   href:"/dashboard/videos",     color:"#FF6B35" },
  { icon:"📄",  name:"PDFs",       desc:"Compress, merge & split PDFs",     href:"/dashboard/pdfs",       color:"#FF4B8A" },
  { icon:"🎬",  name:"GIFs",       desc:"Compress, resize, video → GIF",    href:"/dashboard/gifs",       color:"#F5A623" },
  { icon:"🔄",  name:"Converter",  desc:"Convert formats, PDF ↔ images",    href:"/dashboard/converter",  color:"#00D4FF" },
  { icon:"🖼️", name:"Thumbnail",  desc:"Grab video thumbnails",            href:"/dashboard/thumbnail",  color:"#00E5A0" },
  { icon:"⬇️",  name:"Downloader", desc:"Download from social platforms",   href:"/dashboard/downloader", color:"#A89DFF" },
];

export default function DashboardPage() {
  return (
    <div style={{ padding:24, fontFamily:"'DM Sans',system-ui,sans-serif", maxWidth:1100, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 className="syne" style={{ fontSize:24, fontWeight:800, color:"white", marginBottom:6 }}>
          MediaOptimizer <span style={{ color:"#6C63FF" }}>AI</span>
        </h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)" }}>
          Pick a tool to get started — compress, convert and download media right in your browser.
        </p>
      </div>

      {/* Tool grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
        {TOOLS.map((t, i) => (
          <motion.div key={t.name} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
            <Link href={t.href} style={{
              display:"block", textDecoration:"none", height:"100%",
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:16, padding:20, transition:"all .15s",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${t.color}14`; el.style.borderColor = `${t.color}55`; el.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.03)"; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.transform = "translateY(0)"; }}
            >
              <div style={{ width:46, height:46, borderRadius:12, background:`${t.color}1F`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14 }}>
                {t.icon}
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:"white", marginBottom:4 }}>{t.name}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>{t.desc}</div>
              <div style={{ fontSize:13, color:t.color, fontWeight:600, marginTop:14 }}>Open →</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
