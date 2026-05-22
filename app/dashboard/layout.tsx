"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { label: "Dashboard",  href: "/dashboard",           icon: "🏠" },
  { label: "Images",     href: "/dashboard/upload",    icon: "🖼",  badge: "14" },
  { label: "Videos",     href: "/dashboard/videos",    icon: "🎞" },
  { label: "PDFs",       href: "/dashboard/pdfs",      icon: "📄" },
  { label: "GIFs",       href: "/dashboard/gifs",      icon: "🎬" },
  { label: "Converter",  href: "/dashboard/converter", icon: "🔄" },
  { label: "Thumbnail",  href: "/dashboard/thumbnail", icon: "🖼️" },
  { label: "Downloader", href: "/dashboard/downloader",icon: "⬇️" },
  { label: "AI Tools",   href: "/dashboard/ai",        icon: "✨" },
  { label: "Analytics",  href: "/dashboard/analytics", icon: "📊" },
  { label: "Settings",   href: "/dashboard/settings",  icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const path = usePathname();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08090F; color: #F0F2FF; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; }
        .syne { font-family: 'Syne', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.15s; color: rgba(255,255,255,0.4); }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active { background: rgba(108,99,255,0.15); color: #A89DFF; }
        .content-scroll { overflow-y: auto; height: calc(100vh - 64px); }
        .content-scroll::-webkit-scrollbar { width: 4px; }
        .content-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#08090F", overflow: "hidden" }}>

        {/* SIDEBAR */}
        <aside style={{
          width: collapsed ? 64 : 220,
          minWidth: collapsed ? 64 : 220,
          background: "#0A0D14",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s ease, min-width 0.25s ease",
          overflow: "hidden",
        }}>

          {/* Logo */}
          <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: "linear-gradient(135deg,#6C63FF,#00D4FF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" fill="white" viewBox="0 0 20 20"><path d="M10 2L3 7v6l7 5 7-5V7L10 2zm0 2.5l5 3.5-5 3.5L5 8l5-3.5z"/></svg>
            </div>
            {!collapsed && (
              <span className="syne" style={{ fontSize: 13, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden" }}>
                MediaOptimizer <span style={{ color: "#6C63FF" }}>AI</span>
              </span>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>

            {/* Main tools section */}
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.2)", textTransform: "uppercase", letterSpacing: 1, padding: "6px 12px 4px" }}>Tools</div>}

            {NAV.slice(0, 6).map(item => {
              const active = path === item.href || path.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}
                  style={{ marginBottom: 2, justifyContent: collapsed ? "center" : "flex-start" }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: 18, minWidth: 20, textAlign: "center" }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span style={{ background: "#6C63FF", color: "white", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>{item.badge}</span>
                  )}
                </Link>
              );
            })}

            {/* Utilities section */}
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.2)", textTransform: "uppercase", letterSpacing: 1, padding: "10px 12px 4px", marginTop: 4 }}>Utilities</div>}

            {NAV.slice(6, 9).map(item => {
              const active = path === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}
                  style={{ marginBottom: 2, justifyContent: collapsed ? "center" : "flex-start" }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: 18, minWidth: 20, textAlign: "center" }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>}
                  {item.href === "/dashboard/downloader" && !collapsed && (
                    <span style={{ background: "rgba(0,229,160,.2)", color: "#00E5A0", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>NEW</span>
                  )}
                </Link>
              );
            })}

            {/* Settings */}
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.2)", textTransform: "uppercase", letterSpacing: 1, padding: "10px 12px 4px", marginTop: 4 }}>System</div>}

            {NAV.slice(9).map(item => {
              const active = path === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}
                  style={{ marginBottom: 2, justifyContent: collapsed ? "center" : "flex-start" }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: 18, minWidth: 20, textAlign: "center" }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Plan card */}
          {!collapsed && (
            <div style={{ margin: "0 8px 12px", background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#A89DFF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Pro Plan</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>167 / 250 GB used</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                <div style={{ height: "100%", width: "67%", background: "linear-gradient(90deg,#6C63FF,#00D4FF)", borderRadius: 4 }}/>
              </div>
            </div>
          )}

          {/* Collapse button */}
          <button onClick={() => setCollapsed(v => !v)}
            style={{ height: 44, background: "none", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            {collapsed ? "→" : "←"}
          </button>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top bar */}
          <header style={{ height: 64, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", maxWidth: 280 }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>🔍</span>
              <input type="text" placeholder="Search files, jobs…" style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "rgba(255,255,255,0.6)", width: "100%" }}/>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15 }}>🔔</div>
                <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#FF4B8A", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#FF4B8A,#FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>RB</div>
            </div>
          </header>

          {/* Page content */}
          <div className="content-scroll" style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
