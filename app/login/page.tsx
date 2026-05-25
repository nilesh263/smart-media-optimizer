"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [mode,     setMode]     = useState<"login" | "signup">("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        name,
        isSignup: mode === "signup" ? "true" : "false",
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        if (mode === "signup") {
          // After signup — switch to login tab with success message
          setMode("login");
          setPassword("");
          setError("");
          setEmail(email);
          setSuccess("Account created! Please sign in.");
        } else {
          // After login — go to dashboard
          router.push("/dashboard");
        }
      }
    } catch(err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08090F; font-family: system-ui, sans-serif; }
        .input-field { transition: border-color .15s; }
        .input-field:focus { outline: none; border-color: rgba(108,99,255,.6) !important; box-shadow: 0 0 0 3px rgba(108,99,255,.1); }
        .btn-primary { transition: all .15s; cursor: pointer; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .tab-btn { transition: all .15s; cursor: pointer; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#08090F", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>

        {/* Background glow */}
        <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, background:"radial-gradient(circle,rgba(108,99,255,.08) 0%,transparent 70%)", pointerEvents:"none" }}/>

        <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1 }}>

          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#6C63FF,#00D4FF)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="24" height="24" fill="white" viewBox="0 0 20 20"><path d="M10 2L3 7v6l7 5 7-5V7L10 2zm0 2.5l5 3.5-5 3.5L5 8l5-3.5z"/></svg>
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"white", fontFamily:"system-ui,sans-serif" }}>
              MediaOptimizer <span style={{ color:"#6C63FF" }}>AI</span>
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginTop:4 }}>
              {mode === "login" ? "Welcome back!" : "Create your free account"}
            </p>
          </div>

          {/* Card */}
          <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:32, backdropFilter:"blur(20px)" }}>

            {/* Tabs */}
            <div style={{ display:"flex", background:"rgba(255,255,255,.05)", borderRadius:12, padding:4, marginBottom:24 }}>
              {(["login","signup"] as const).map(m => (
                <button key={m} className="tab-btn"
                  onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{ flex:1, padding:"9px", borderRadius:9, fontSize:13, fontWeight:600, border:"none",
                    background: mode===m?"white":"transparent",
                    color: mode===m?"#0A0D14":"rgba(255,255,255,.4)",
                  }}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {mode === "signup" && (
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.5)", display:"block", marginBottom:6 }}>Full Name</label>
                  <input className="input-field" type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="John Doe" required={mode==="signup"}
                    style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"11px 14px", color:"white", fontSize:14, fontFamily:"inherit" }}/>
                </div>
              )}

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.5)", display:"block", marginBottom:6 }}>Email Address</label>
                <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"11px 14px", color:"white", fontSize:14, fontFamily:"inherit" }}/>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.5)", display:"block", marginBottom:6 }}>Password</label>
                <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode==="signup"?"Min 6 characters":"Enter your password"} required
                  style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"11px 14px", color:"white", fontSize:14, fontFamily:"inherit" }}/>
              </div>

              {/* Success */}
              {success && (
                <div style={{ background:"rgba(0,229,160,.08)", border:"1px solid rgba(0,229,160,.25)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#00E5A0" }}>
                  ✅ {success}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background:"rgba(255,75,138,.08)", border:"1px solid rgba(255,75,138,.25)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#FF4B8A" }}>
                  ❌ {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ background:"linear-gradient(135deg,#6C63FF,#8B83FF)", color:"white", border:"none", borderRadius:12, padding:"13px", fontSize:15, fontWeight:700, boxShadow:"0 4px 20px rgba(108,99,255,.4)", opacity:loading?.7:1, marginTop:4 }}>
                {loading ? "⏳ Please wait…" : mode==="login" ? "Sign In →" : "Create Account →"}
              </button>

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:12, margin:"4px 0" }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,.08)" }}/>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.3)" }}>or</span>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,.08)" }}/>
              </div>

              {/* Continue without login */}
              <Link href="/dashboard"
                style={{ display:"block", textAlign:"center", padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.5)", fontSize:13, textDecoration:"none", transition:"all .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,.05)")}
                onMouseLeave={e => (e.currentTarget.style.background="transparent")}
              >
                Continue as Guest →
              </Link>
            </form>
          </div>

          {/* Footer */}
          <p style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,.25)", marginTop:20 }}>
            By signing up you agree to our Terms of Service
          </p>
        </div>
      </div>
    </>
  );
}
