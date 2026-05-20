"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const TOOLS = [
  { icon: "🖼", name: "Image Compression",  desc: "WebP / AVIF / MozJPEG with SSIM quality guard",      tag: "AI",  color: "#6C63FF" },
  { icon: "✨", name: "AI Upscale",          desc: "4× upscaling via ESRGAN — zero detail loss",          tag: "AI",  color: "#00D4FF" },
  { icon: "🪄", name: "Background Remover",  desc: "U2-Net segmentation — one click, perfect edges",     tag: "AI",  color: "#FF4B8A" },
  { icon: "🎞", name: "Video Compression",   desc: "FFmpeg H.265 CRF — up to 80% smaller files",         tag: "",    color: "#FF6B35" },
  { icon: "📄", name: "PDF Compress + OCR",  desc: "Ghostscript + Tesseract — searchable small PDFs",    tag: "",    color: "#00E5A0" },
  { icon: "🎬", name: "GIF Optimizer",       desc: "Gifsicle + palette re-optimisation",                 tag: "",    color: "#F5A623" },
  { icon: "🔄", name: "Format Converter",    desc: "PNG · JPG · WebP · AVIF · MP4 · MOV · WebM",        tag: "",    color: "#6C63FF" },
  { icon: "📦", name: "Batch Processing",    desc: "100+ files simultaneously with priority queue",       tag: "Pro", color: "#A89DFF" },
];

const STATS = [
  { value: "68%",  label: "Avg size reduction",    color: "#6C63FF" },
  { value: "50M+", label: "Files optimized",        color: "#00D4FF" },
  { value: "0.97", label: "Avg SSIM quality score", color: "#00E5A0" },
  { value: "2.4s", label: "Avg processing time",    color: "#FF6B35" },
];

const PLANS = [
  {
    name: "Starter", price: "$12", period: "/mo", highlight: false,
    features: ["500 files / month","Max 500 MB per file","All image + PDF tools","Video compression","10-file batch processing"],
    cta: "Start Free Trial",
  },
  {
    name: "Pro", price: "$49", period: "/mo", highlight: true,
    features: ["Unlimited files","Max 5 GB per file","All tools + AI features","AI upscale & BG remover","100-file batch processing","API access + webhooks","Priority queue","99.9% SLA"],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise", price: "Custom", period: "", highlight: false,
    features: ["Unlimited everything","Max 50 GB per file","Dedicated GPU workers","Custom domain CDN","SSO + team workspaces","White-label option","99.99% SLA","Dedicated support"],
    cta: "Contact Sales",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled]     = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const simulate = () => {
    if (compressing) return;
    if (done) { setDone(false); setProgress(0); return; }
    setCompressing(true);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) { clearInterval(t); setProgress(100); setDone(true); setCompressing(false); return; }
      setProgress(Math.min(p, 99));
    }, 100);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#08090F;color:#F0F2FF;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        .syne{font-family:'Syne',system-ui,sans-serif}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px}
        ::selection{background:rgba(108,99,255,0.4);color:white}
        .nav-a{color:rgba(255,255,255,0.45);text-decoration:none;font-size:14px;transition:color .2s}
        .nav-a:hover{color:white}
        .foot-a{color:rgba(255,255,255,0.3);text-decoration:none;font-size:13px;transition:color .2s}
        .foot-a:hover{color:rgba(255,255,255,0.7)}
        .tool-card{transition:transform .2s,border-color .2s}
        .tool-card:hover{transform:translateY(-4px)}
        .plan-btn{display:block;text-align:center;padding:13px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;transition:filter .2s}
        .plan-btn:hover{filter:brightness(1.1)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .pulse{animation:pulse 2s infinite}
        .grid-bg{background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:80px 80px}
      `}</style>

      <div style={{background:"#08090F",minHeight:"100vh"}}>

        {/* NAV */}
        <header style={{position:"fixed",top:0,left:0,right:0,zIndex:50,height:64,background:scrolled?"rgba(8,9,15,.88)":"transparent",backdropFilter:scrolled?"blur(20px)":"none",borderBottom:scrolled?"1px solid rgba(255,255,255,.06)":"none",transition:"all .3s",display:"flex",alignItems:"center"}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#6C63FF,#00D4FF)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="16" height="16" fill="white" viewBox="0 0 20 20"><path d="M10 2L3 7v6l7 5 7-5V7L10 2zm0 2.5l5 3.5-5 3.5L5 8l5-3.5z"/></svg>
              </div>
              <span className="syne" style={{fontSize:15,fontWeight:700,color:"white"}}>MediaOptimizer <span style={{color:"#6C63FF"}}>AI</span></span>
            </div>
            <nav style={{display:"flex",gap:28}}>
              {["Tools","Pricing","API","Blog"].map(l=><a key={l} href={`#${l.toLowerCase()}`} className="nav-a">{l}</a>)}
            </nav>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <a href="#" className="nav-a">Sign in</a>
              <a href="#" style={{background:"linear-gradient(135deg,#6C63FF,#8B83FF)",color:"white",borderRadius:10,padding:"8px 20px",fontSize:14,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 20px rgba(108,99,255,.35)"}}>Start Free</a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="grid-bg" style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",paddingTop:80,paddingBottom:80}}>
          <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"#6C63FF",opacity:.09,filter:"blur(120px)",left:"15%",top:"25%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"#00D4FF",opacity:.07,filter:"blur(120px)",right:"10%",top:"60%",pointerEvents:"none"}}/>
          <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"#FF4B8A",opacity:.06,filter:"blur(100px)",left:"50%",bottom:"0%",pointerEvents:"none"}}/>

          <div style={{position:"relative",zIndex:10,maxWidth:900,margin:"0 auto",padding:"0 24px",textAlign:"center"}}>

            {/* badge */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.5}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(108,99,255,.12)",border:"1px solid rgba(108,99,255,.3)",borderRadius:100,padding:"6px 18px",marginBottom:32}}>
                <span className="pulse" style={{width:6,height:6,borderRadius:"50%",background:"#6C63FF",display:"inline-block"}}/>
                <span style={{fontSize:12,color:"#A89DFF",fontWeight:500}}>AI-Powered Media Optimization — Now in Public Beta</span>
              </div>
            </motion.div>

            {/* headline */}
            <motion.h1 className="syne" initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.1}} style={{fontSize:"clamp(52px,8vw,92px)",fontWeight:800,lineHeight:1.04,letterSpacing:"-2px",color:"white",marginBottom:24}}>
              Compress{" "}
              <span style={{background:"linear-gradient(135deg,#6C63FF,#A89DFF,#00D4FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>without</span>
              <br/>the quality loss
            </motion.h1>

            {/* sub */}
            <motion.p initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.22}} style={{fontSize:18,color:"rgba(255,255,255,.5)",lineHeight:1.7,maxWidth:560,margin:"0 auto 40px",fontWeight:300}}>
              AI-driven compression for images, videos, PDFs, and GIFs. Up to 80% smaller files — SSIM quality scores above 0.97.
            </motion.p>

            {/* buttons */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.5,delay:.32}} style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginBottom:64}}>
              <a href="#" style={{background:"linear-gradient(135deg,#6C63FF,#8B83FF)",color:"white",borderRadius:12,padding:"15px 34px",fontSize:16,fontWeight:600,textDecoration:"none",boxShadow:"0 8px 32px rgba(108,99,255,.4)"}}>Start optimizing free</a>
              <a href="#tools" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.8)",borderRadius:12,padding:"15px 34px",fontSize:16,fontWeight:600,textDecoration:"none"}}>See all tools →</a>
            </motion.div>

            {/* demo card */}
            <motion.div initial={{opacity:0,y:50,scale:.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.7,delay:.45}} style={{maxWidth:640,margin:"0 auto"}}>
              <div style={{background:"rgba(15,18,25,.9)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:4,boxShadow:"0 40px 80px rgba(0,0,0,.6)",backdropFilter:"blur(20px)"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px"}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:"#FF5F56"}}/>
                  <div style={{width:12,height:12,borderRadius:"50%",background:"#FFBD2E"}}/>
                  <div style={{width:12,height:12,borderRadius:"50%",background:"#27C93F"}}/>
                  <span style={{marginLeft:8,fontSize:11,color:"rgba(255,255,255,.2)"}}>Smart Media Optimizer AI</span>
                </div>
                <div onClick={simulate} style={{margin:"0 8px 8px",borderRadius:14,border:`2px dashed ${done?"rgba(0,229,160,.4)":compressing?"rgba(108,99,255,.5)":"rgba(108,99,255,.3)"}`,background:done?"rgba(0,229,160,.04)":"rgba(108,99,255,.04)",padding:32,textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                  {!compressing && !done && (
                    <>
                      <div style={{fontSize:42,marginBottom:12}}>⬆️</div>
                      <div style={{fontSize:15,fontWeight:600,color:"white",marginBottom:6}}>Click to see AI compression live</div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,.3)"}}>JPG · PNG · WebP · AVIF · MP4 · PDF · GIF</div>
                    </>
                  )}
                  {(compressing||done) && (
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:10}}>
                        <span>hero-banner.png → WebP (AI Enhanced)</span>
                        <span style={{color:done?"#00E5A0":"#A89DFF"}}>{done?"✓ Done":`${Math.floor(progress)}%`}</span>
                      </div>
                      <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#6C63FF,#00D4FF)",borderRadius:4,transition:"width .1s"}}/>
                      </div>
                      {done && (
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24,marginTop:20}}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:2}}>Original</div>
                            <div style={{fontSize:22,fontWeight:700,color:"white"}}>4.2 MB</div>
                          </div>
                          <div style={{fontSize:22,color:"#6C63FF"}}>→</div>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:2}}>Optimized</div>
                            <div style={{fontSize:22,fontWeight:700,color:"#00E5A0"}}>312 KB</div>
                          </div>
                          <div style={{background:"rgba(0,229,160,.12)",borderRadius:10,padding:"10px 18px",textAlign:"center"}}>
                            <div style={{fontSize:24,fontWeight:800,color:"#00E5A0"}}>−93%</div>
                            <div style={{fontSize:10,color:"rgba(0,229,160,.6)"}}>SSIM 0.981</div>
                          </div>
                        </div>
                      )}
                      {done && <div style={{marginTop:10,fontSize:11,color:"rgba(255,255,255,.25)"}}>Click to reset demo</div>}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",padding:"0 16px 12px"}}>
                  {["JPG","PNG","WebP","AVIF","HEIC","MP4","MOV","WebM","PDF","GIF","SVG","TIFF"].map(f=>(
                    <span key={f} style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.35)",fontSize:10,fontWeight:500,padding:"3px 8px",borderRadius:5}}>{f}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* STATS */}
        <section style={{borderTop:"1px solid rgba(255,255,255,.06)",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",padding:"64px 24px"}}>
          <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:24,textAlign:"center"}}>
            {STATS.map((s,i)=>(
              <motion.div key={s.label} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}}>
                <div className="syne" style={{fontSize:44,fontWeight:800,color:"white"}}>{s.value}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.35)",marginTop:4}}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* TOOLS */}
        <section id="tools" style={{padding:"96px 24px"}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:56}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#6C63FF",marginBottom:12}}>Everything you need</div>
              <h2 className="syne" style={{fontSize:"clamp(32px,5vw,54px)",fontWeight:800,color:"white",marginBottom:16}}>40+ tools. One platform.</h2>
              <p style={{fontSize:16,color:"rgba(255,255,255,.4)",maxWidth:500,margin:"0 auto"}}>Every media format, every workflow. Powered by Sharp, FFmpeg, Ghostscript, ESRGAN, U2-Net.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
              {TOOLS.map((t,i)=>(
                <motion.div key={t.name} className="tool-card" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07}} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:22}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                    <span style={{fontSize:30}}>{t.icon}</span>
                    {t.tag&&<span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,background:`${t.color}22`,color:t.color}}>{t.tag}</span>}
                  </div>
                  <div style={{fontSize:15,fontWeight:600,color:"white",marginBottom:6}}>{t.name}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.6}}>{t.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{padding:"96px 24px",background:"rgba(255,255,255,.01)"}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:56}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#FF4B8A",marginBottom:12}}>Pricing</div>
              <h2 className="syne" style={{fontSize:"clamp(32px,5vw,54px)",fontWeight:800,color:"white",marginBottom:12}}>Simple, transparent pricing</h2>
              <p style={{fontSize:16,color:"rgba(255,255,255,.4)"}}>Start free. Upgrade when you scale.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
              {PLANS.map((p,i)=>(
                <motion.div key={p.name} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}} style={{position:"relative",background:p.highlight?"linear-gradient(to bottom,rgba(108,99,255,.12),rgba(108,99,255,.04))":"rgba(255,255,255,.03)",border:`1px solid ${p.highlight?"rgba(108,99,255,.5)":"rgba(255,255,255,.07)"}`,borderRadius:20,padding:28,boxShadow:p.highlight?"0 8px 40px rgba(108,99,255,.15)":"none"}}>
                  {p.highlight&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#6C63FF,#8B83FF)",color:"white",fontSize:11,fontWeight:700,padding:"4px 16px",borderRadius:100}}>Most Popular</div>}
                  <div style={{fontSize:14,color:"rgba(255,255,255,.45)",marginBottom:8}}>{p.name}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:24}}>
                    <span className="syne" style={{fontSize:46,fontWeight:800,color:"white"}}>{p.price}</span>
                    <span style={{fontSize:14,color:"rgba(255,255,255,.3)"}}>{p.period}</span>
                  </div>
                  <ul style={{listStyle:"none",marginBottom:28}}>
                    {p.features.map(f=>(
                      <li key={f} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12,fontSize:14,color:"rgba(255,255,255,.6)"}}>
                        <span style={{color:"#00E5A0",marginTop:1}}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <a href="#" className="plan-btn" style={p.highlight?{background:"linear-gradient(135deg,#6C63FF,#8B83FF)",color:"white",boxShadow:"0 4px 20px rgba(108,99,255,.3)"}:{border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)"}}>{p.cta}</a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{padding:"100px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"#6C63FF",opacity:.08,filter:"blur(100px)",left:"50%",top:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} style={{position:"relative",maxWidth:700,margin:"0 auto"}}>
            <h2 className="syne" style={{fontSize:"clamp(36px,6vw,66px)",fontWeight:800,color:"white",marginBottom:20,lineHeight:1.1}}>
              Ready to stop wasting{" "}
              <span style={{background:"linear-gradient(135deg,#6C63FF,#00D4FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>bandwidth?</span>
            </h2>
            <p style={{fontSize:17,color:"rgba(255,255,255,.4)",marginBottom:36}}>Join 50,000+ developers and teams already shipping faster.</p>
            <a href="#" style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#6C63FF,#8B83FF)",color:"white",borderRadius:14,padding:"16px 40px",fontSize:16,fontWeight:700,textDecoration:"none",boxShadow:"0 8px 40px rgba(108,99,255,.4)"}}>Start optimizing free →</a>
            <div style={{marginTop:14,fontSize:13,color:"rgba(255,255,255,.25)"}}>No credit card required · 50 free files/month</div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"40px 24px"}}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6C63FF,#00D4FF)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path d="M10 2L3 7v6l7 5 7-5V7L10 2zm0 2.5l5 3.5-5 3.5L5 8l5-3.5z"/></svg>
              </div>
              <span style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,.5)"}}>MediaOptimizer AI</span>
            </div>
            <div style={{display:"flex",gap:24}}>
              {["Privacy","Terms","API Docs","Status","Blog"].map(l=><a key={l} href="#" className="foot-a">{l}</a>)}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.2)"}}>© 2025 MediaOptimizer AI</div>
          </div>
        </footer>

      </div>
    </>
  );
}
