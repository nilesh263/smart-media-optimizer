"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type NavItem = { label:string; href:string; icon:string; badge?:string; soon?:boolean };

const NAV: NavItem[] = [
  { label:"Dashboard",   href:"/dashboard",            icon:"🏠" },
  { label:"Images",      href:"/dashboard/upload",     icon:"🖼",  badge:"14" },
  { label:"Videos",      href:"/dashboard/videos",     icon:"🎞" },
  { label:"PDFs",        href:"/dashboard/pdfs",       icon:"📄" },
  { label:"GIFs",        href:"/dashboard/gifs",       icon:"🎬" },
  { label:"Converter",   href:"/dashboard/converter",  icon:"🔄" },
  { label:"Thumbnail",   href:"/dashboard/thumbnail",  icon:"🖼️" },
  { label:"Downloader",  href:"/dashboard/downloader", icon:"⬇️" },
  { label:"AI Tools",    href:"/dashboard/ai",         icon:"✨", soon:true },
  // Analytics & Settings hidden for now — re-add here to restore them.
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,     setCollapsed]     = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [showHeaderMenu,setShowHeaderMenu]= useState(false);

  // Backend is reached through an ngrok tunnel, whose free tier shows a browser
  // "warning" HTML page unless the request carries this header. Patch fetch once
  // so every API/download call to the backend skips that interstitial.
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    if (typeof window === "undefined" || !API || (window as any).__apiFetchPatched) return;
    (window as any).__apiFetchPatched = true;
    const orig = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const u = typeof input === "string" ? input : (input as any).url || String(input);
        if (u && u.startsWith(API)) {
          init = { ...(init || {}) };
          init.headers = { ...(init.headers as any), "ngrok-skip-browser-warning": "true" };
        }
      } catch (e) {}
      return orig(input, init);
    };
  }, []);
  const path   = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n:string) => n[0]).join("").toUpperCase().slice(0,2)
    : session?.user?.email?.[0]?.toUpperCase() || "G";

  const userName  = session?.user?.name  || "Guest";
  const userEmail = session?.user?.email || "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08090F; color: #F0F2FF; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.15s; color: rgba(255,255,255,0.4); }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active { background: rgba(108,99,255,0.15); color: #A89DFF; }
        .content-scroll { overflow-y: auto; height: calc(100vh - 64px); }
        .content-scroll::-webkit-scrollbar { width: 4px; }
        .content-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .user-menu { position: absolute; bottom: 60px; left: 8px; right: 8px; background: #0F1219; border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 8px; z-index: 100; }
        .menu-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; font-size: 13px; color: rgba(255,255,255,.5); cursor: pointer; transition: all .15s; text-decoration: none; }
        .menu-item:hover { background: rgba(255,255,255,.06); color: white; }
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:"#08090F", overflow:"hidden" }}>

        {/* SIDEBAR */}
        <aside style={{ width:collapsed?64:220, minWidth:collapsed?64:220, background:"#0A0D14", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", transition:"width 0.25s ease, min-width 0.25s ease", overflow:"hidden", position:"relative" }}>

          {/* Logo */}
          <div style={{ height:64, display:"flex", alignItems:"center", padding:"0 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", gap:10, flexShrink:0 }}>
            <div style={{ width:32, height:32, minWidth:32, borderRadius:8, background:"linear-gradient(135deg,#6C63FF,#00D4FF)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" fill="white" viewBox="0 0 20 20"><path d="M10 2L3 7v6l7 5 7-5V7L10 2zm0 2.5l5 3.5-5 3.5L5 8l5-3.5z"/></svg>
            </div>
            {!collapsed && <span style={{ fontSize:13, fontWeight:700, color:"white", whiteSpace:"nowrap", fontFamily:"'Syne',system-ui,sans-serif" }}>MediaOptimizer <span style={{ color:"#6C63FF" }}>AI</span></span>}
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto", overflowX:"hidden" }}>
            {!collapsed && <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.2)", textTransform:"uppercase", letterSpacing:1, padding:"6px 12px 4px" }}>Tools</div>}
            {NAV.slice(0,6).map(item => {
              const active = path === item.href || path.startsWith(item.href+"/");
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active?"active":""}`}
                  style={{ marginBottom:2, justifyContent:collapsed?"center":"flex-start" }}
                  title={collapsed?item.label:undefined}>
                  <span style={{ fontSize:18, minWidth:20, textAlign:"center" }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex:1, whiteSpace:"nowrap" }}>{item.label}</span>}
                  {!collapsed && item.badge && <span style={{ background:"#6C63FF", color:"white", fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:10 }}>{item.badge}</span>}
                </Link>
              );
            })}

            {!collapsed && <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.2)", textTransform:"uppercase", letterSpacing:1, padding:"10px 12px 4px", marginTop:4 }}>Utilities</div>}
            {NAV.slice(6,9).map(item => {
              // "Coming soon" items are shown disabled (not links)
              if (item.soon) {
                return (
                  <div key={item.href} className="nav-item"
                    style={{ marginBottom:2, justifyContent:collapsed?"center":"flex-start", cursor:"not-allowed", opacity:.45 }}
                    title={collapsed?`${item.label} — coming soon`:"Coming soon"}>
                    <span style={{ fontSize:18, minWidth:20, textAlign:"center" }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1, whiteSpace:"nowrap" }}>{item.label}</span>}
                    {!collapsed && <span style={{ background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.5)", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:8, textTransform:"uppercase", letterSpacing:.5 }}>Soon</span>}
                  </div>
                );
              }
              const active = path === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active?"active":""}`}
                  style={{ marginBottom:2, justifyContent:collapsed?"center":"flex-start" }}
                  title={collapsed?item.label:undefined}>
                  <span style={{ fontSize:18, minWidth:20, textAlign:"center" }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex:1, whiteSpace:"nowrap" }}>{item.label}</span>}
                  {item.href==="/dashboard/downloader" && !collapsed && <span style={{ background:"rgba(0,229,160,.2)", color:"#00E5A0", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:8 }}>NEW</span>}
                </Link>
              );
            })}
          </nav>

          {/* User menu popup */}
          {showUserMenu && !collapsed && (
            <div className="user-menu">
              <div style={{ padding:"8px 12px 10px", borderBottom:"1px solid rgba(255,255,255,.06)", marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"white" }}>{userName}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>{userEmail || "Guest user"}</div>
              </div>
              {session ? (
                <button className="menu-item" onClick={() => signOut({ callbackUrl:"/login" })}
                  style={{ width:"100%", background:"none", border:"none", textAlign:"left" }}>
                  🚪 Sign Out
                </button>
              ) : (
                <Link href="/login" className="menu-item">🔑 Sign In</Link>
              )}
            </div>
          )}

          {/* User avatar */}
          <div style={{ padding:"8px", borderTop:"1px solid rgba(255,255,255,.06)", flexShrink:0 }}>
            <button onClick={() => setShowUserMenu(v=>!v)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, background:"rgba(255,255,255,.04)", border:"none", cursor:"pointer", transition:"background .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,.08)")}
              onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,.04)")}>
              <div style={{ width:30, height:30, minWidth:30, borderRadius:"50%", background:session?"linear-gradient(135deg,#6C63FF,#8B83FF)":"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"white" }}>
                {userInitials}
              </div>
              {!collapsed && (
                <div style={{ textAlign:"left", overflow:"hidden" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"white", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{userName}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>{session?"Pro Plan":"Guest"}</div>
                </div>
              )}
            </button>
          </div>

          {/* Collapse button */}
          <button onClick={() => setCollapsed(v=>!v)}
            style={{ height:36, background:"none", border:"none", borderTop:"1px solid rgba(255,255,255,.06)", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {collapsed?"→":"←"}
          </button>
        </aside>

        {/* MAIN */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <header style={{ height:64, borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0 }}>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12, position:"relative" }}>
              {session ? (
                <>
                  <button onClick={() => setShowHeaderMenu(v => !v)}
                    style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#6C63FF,#8B83FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"white", cursor:"pointer", border:"none" }}>
                    {userInitials}
                  </button>
                  {showHeaderMenu && (
                    <>
                      <div onClick={() => setShowHeaderMenu(false)} style={{ position:"fixed", inset:0, zIndex:90 }}/>
                      <div style={{ position:"absolute", top:46, right:0, width:210, background:"#0F1219", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:8, zIndex:100, boxShadow:"0 8px 28px rgba(0,0,0,.45)" }}>
                        <div style={{ padding:"8px 12px 10px", borderBottom:"1px solid rgba(255,255,255,.06)", marginBottom:6 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userName}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userEmail || "Guest user"}</div>
                        </div>
                        <button className="menu-item" onClick={() => signOut({ callbackUrl:"/login" })}
                          style={{ width:"100%", background:"none", border:"none", textAlign:"left" }}>
                          🚪 Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link href="/login" style={{ background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", borderRadius:10, padding:"7px 16px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
                  Sign In
                </Link>
              )}
            </div>
          </header>

          <div className="content-scroll" style={{ flex:1 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
