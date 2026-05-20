"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const STATS = [
  { label: "Files Processed",    value: "12,847", change: "+18%",  up: true,  accent: "#6C63FF", icon: "📁" },
  { label: "Storage Saved",      value: "48.3 GB", change: "+71%", up: true,  accent: "#00E5A0", icon: "💾" },
  { label: "Avg Compression",    value: "68.4%",   change: "+2.1%",up: true,  accent: "#FF6B35", icon: "📉" },
  { label: "API Calls",          value: "94.2K",   change: "−4%",  up: false, accent: "#00D4FF", icon: "⚡" },
];

const JOBS = [
  { id:1, name:"hero-banner.png",      type:"🖼", status:"done",       original:"4.2 MB",  output:"312 KB",  savings:"−93%", progress:100, time:"2m ago"   },
  { id:2, name:"product-demo.mp4",     type:"🎞", status:"processing", original:"284 MB",  output:"~89 MB",  savings:"−69%", progress:31,  time:"just now" },
  { id:3, name:"catalogue-2025.pdf",   type:"📄", status:"done",       original:"8.4 MB",  output:"2.4 MB",  savings:"−71%", progress:100, time:"5m ago"   },
  { id:4, name:"loader.gif",           type:"🎬", status:"done",       original:"1.8 MB",  output:"340 KB",  savings:"−81%", progress:100, time:"12m ago"  },
  { id:5, name:"batch-images.zip (48)",type:"📦", status:"queued",     original:"320 MB",  output:"—",       savings:"—",    progress:0,   time:"queue"    },
];

const TOOLS = [
  { icon:"🖼", name:"Compress Image",  href:"/dashboard/images",  color:"#6C63FF" },
  { icon:"✨", name:"AI Upscale",      href:"/dashboard/images",  color:"#00D4FF" },
  { icon:"🪄", name:"Remove BG",       href:"/dashboard/images",  color:"#FF4B8A" },
  { icon:"🎞", name:"Compress Video",  href:"/dashboard/videos",  color:"#FF6B35" },
  { icon:"📄", name:"Compress PDF",    href:"/dashboard/pdfs",    color:"#00E5A0" },
  { icon:"🎬", name:"Optimize GIF",    href:"/dashboard/gifs",    color:"#F5A623" },
  { icon:"🔄", name:"Convert Format",  href:"/dashboard/images",  color:"#A89DFF" },
  { icon:"📦", name:"Batch Process",   href:"/dashboard/batch",   color:"#6C63FF" },
  { icon:"🔑", name:"API Access",      href:"/dashboard/settings",color:"#00D4FF" },
];

const CHART = [42, 68, 35, 89, 57, 24, 19];
const DAYS  = ["M","T","W","T","F","S","S"];
const MAX   = Math.max(...CHART);

const AI_INSIGHTS = [
  { icon:"🔄", title:"Convert 143 PNGs to AVIF", desc:"Expected ~82% total savings", color:"#6C63FF" },
  { icon:"📊", title:"Video bitrate too high",    desc:"CRF 26 safe for product-demo.mp4", color:"#FF6B35" },
  { icon:"🔬", title:"3 low-res images found",    desc:"AI upscale before export", color:"#00D4FF" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; text: string }> = {
    done:       { bg:"rgba(0,229,160,0.12)",  color:"#00E5A0", text:"Done"       },
    processing: { bg:"rgba(108,99,255,0.12)", color:"#A89DFF", text:"Processing" },
    queued:     { bg:"rgba(255,255,255,0.07)",color:"#6B7280", text:"Queued"     },
    failed:     { bg:"rgba(255,75,138,0.12)", color:"#FF4B8A", text:"Failed"     },
  };
  const s = map[status] || map.queued;
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{s.text}</span>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"jobs"|"insights">("jobs");

  return (
    <div style={{ padding:24, fontFamily:"'DM Sans',system-ui,sans-serif", display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 className="syne" style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:4 }}>Good morning 👋</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>You&apos;ve saved 48.3 GB this month — 68× your free tier.</p>
        </div>
        <Link href="/dashboard/upload" style={{ background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:12, padding:"10px 22px", fontSize:14, fontWeight:600, textDecoration:"none", boxShadow:"0 4px 20px rgba(108,99,255,0.3)", display:"flex", alignItems:"center", gap:8 }}>
          ⬆️ New Upload
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {STATS.map((s,i) => (
          <motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
            style={{ position:"relative", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:18, overflow:"hidden" }}
          >
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${s.accent},${s.accent}00)` }}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1 }}>{s.label}</span>
              <span style={{ fontSize:18 }}>{s.icon}</span>
            </div>
            <div className="syne" style={{ fontSize:28, fontWeight:800, color:"white", marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color: s.up ? "#00E5A0" : "#FF4B8A", display:"flex", alignItems:"center", gap:4 }}>
              {s.up ? "↑" : "↓"} {s.change} this month
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>

        {/* Left — chart + jobs */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Chart */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"white" }}>Compression volume</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Files processed this week</div>
              </div>
              <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.05)", borderRadius:8, padding:3 }}>
                {["7d","30d","All"].map(t => (
                  <button key={t} style={{ padding:"4px 12px", borderRadius:6, border:"none", background: t==="7d"?"#6C63FF":"transparent", color: t==="7d"?"white":"rgba(255,255,255,0.35)", fontSize:12, fontWeight:600, cursor:"pointer" }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:72 }}>
              {CHART.map((v,i) => (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <motion.div initial={{scaleY:0}} animate={{scaleY:1}} transition={{delay:0.3+i*0.06,duration:0.4}} style={{
                    width:"100%", borderRadius:"4px 4px 0 0", transformOrigin:"bottom",
                    height: `${(v/MAX)*56}px`,
                    background: v===MAX ? "linear-gradient(to top,#6C63FF,#00D4FF)" : "rgba(108,99,255,0.35)",
                  }}/>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Jobs table */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.05)", borderRadius:8, padding:3 }}>
                {(["jobs","insights"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{ padding:"5px 14px", borderRadius:6, border:"none", background: activeTab===t?"#6C63FF":"transparent", color: activeTab===t?"white":"rgba(255,255,255,0.35)", fontSize:12, fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
                ))}
              </div>
              <a href="#" style={{ fontSize:12, color:"#6C63FF", textDecoration:"none" }}>View all →</a>
            </div>

            {activeTab === "jobs" && JOBS.map((job,i) => (
              <motion.div key={job.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)", transition:"background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{job.type}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.name}</span>
                    <StatusPill status={job.status}/>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", display:"flex", gap:8 }}>
                    <span>{job.original}</span>
                    {job.status==="done" && <><span>→</span><span style={{color:"#00E5A0"}}>{job.output}</span></>}
                    {job.status==="processing" && <span style={{color:"#A89DFF"}}>{job.progress}% complete</span>}
                  </div>
                  {job.status==="processing" && (
                    <div style={{ height:2, background:"rgba(255,255,255,0.08)", borderRadius:2, marginTop:6, width:120 }}>
                      <motion.div style={{ height:"100%", background:"linear-gradient(90deg,#6C63FF,#00D4FF)", borderRadius:2 }} initial={{width:0}} animate={{width:`${job.progress}%`}} transition={{ease:"easeOut"}}/>
                    </div>
                  )}
                </div>
                {job.savings !== "—" && (
                  <span style={{ background:"rgba(0,229,160,0.12)", color:"#00E5A0", fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:8, flexShrink:0 }}>{job.savings}</span>
                )}
              </motion.div>
            ))}

            {activeTab === "insights" && (
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                {AI_INSIGHTS.map(ins => (
                  <div key={ins.title} style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:14 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:20 }}>{ins.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"white", marginBottom:3 }}>{ins.title}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{ins.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Quick tools */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"white", marginBottom:12 }}>Quick Tools</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {TOOLS.map(t => (
                <Link key={t.name} href={t.href} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                  padding:"10px 4px", borderRadius:10,
                  background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                  textDecoration:"none", transition:"all .15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textAlign:"center", lineHeight:1.3 }}>{t.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* AI panel */}
          <div style={{ background:"linear-gradient(to bottom,rgba(0,212,255,0.06),rgba(108,99,255,0.04))", border:"1px solid rgba(0,212,255,0.18)", borderRadius:16, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#00D4FF", display:"inline-block", animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:13, fontWeight:600, color:"#00D4FF" }}>AI Optimizer Active</span>
            </div>
            {AI_INSIGHTS.map(ins => (
              <div key={ins.title} style={{ display:"flex", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:14 }}>{ins.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"white", marginBottom:2 }}>{ins.title}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{ins.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Plan usage */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"white" }}>Plan Usage</span>
              <span style={{ background:"rgba(108,99,255,0.15)", color:"#A89DFF", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>PRO</span>
            </div>
            {[
              { label:"Storage", used:167, max:250, unit:"GB", color:"#6C63FF" },
              { label:"Files",   used:12847, max:null, unit:"this month", color:"#00E5A0" },
            ].map(item => (
              <div key={item.label} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                  <span style={{ color:"rgba(255,255,255,0.4)" }}>{item.label}</span>
                  <span style={{ color:"rgba(255,255,255,0.6)" }}>{item.max ? `${item.used} / ${item.max} ${item.unit}` : `${item.used.toLocaleString()} ${item.unit}`}</span>
                </div>
                {item.max && (
                  <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:4 }}>
                    <motion.div style={{ height:"100%", background:item.color, borderRadius:4 }} initial={{width:0}} animate={{width:`${(item.used/item.max)*100}%`}} transition={{delay:0.5,duration:0.8}}/>
                  </div>
                )}
              </div>
            ))}
            <a href="#" style={{ display:"block", textAlign:"center", padding:"9px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, fontSize:12, color:"rgba(255,255,255,0.5)", textDecoration:"none", marginTop:4, transition:"all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
            >Manage Plan</a>
          </div>
        </div>
      </div>
    </div>
  );
}
