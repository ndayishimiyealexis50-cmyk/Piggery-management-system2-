import { useState, useRef, useEffect } from "react";
// TODO (step 5 - App.jsx): import { _auth, _googleProvider, ensureUserProfile, isAdminEmail } from "../firebase";
// TODO (step 7 - Components): import ForgotPasswordModal from "../components/ForgotPasswordModal";

/**
 * LoginPage — extracted from FarmIQ index.html (Login function)
 * Props:
 *   setUser          — fn called after successful auth
 *   pendingApproval  — bool: show "pending approval" message
 *   setPendingApproval — fn
 */
export default function LoginPage({ setUser, pendingApproval, setPendingApproval }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [err, setErr] = useState(
    pendingApproval
      ? "Your account is pending admin approval. Please wait."
      : window.__workerRemoved
      ? "Your account has been removed. Please contact the farm admin."
      : ""
  );
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const emailRef = useRef(null);
  const pwdRef = useRef(null);
  const namRef = useRef(null);

  // Inline styles
  const inp2 = {
    background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#1e293b",
    borderRadius: 10, padding: "11px 14px", width: "100%", fontSize: 13.5,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color .2s, box-shadow .2s",
  };
  const lbl2 = {
    fontSize: 11, color: "#64748b", display: "block", marginBottom: 5,
    letterSpacing: 0.5, fontWeight: 600, textTransform: "uppercase",
  };
  const focusIn = (e) => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,.1)"; };
  const focusOut = (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; };

  // Listen for auth blocked events
  useEffect(() => {
    function onBlocked(e) {
      setLoading(false); setGLoading(false);
      const reason = e.detail?.reason;
      if (reason === "removed") setErr("Your account has been removed. Please contact the farm admin.");
      else if (reason === "pending") setErr("Your account is pending admin approval. Please wait.");
      else setErr("Sign in was not completed. Please try again.");
    }
    window.addEventListener("farmiq_auth_blocked", onBlocked);
    return () => window.removeEventListener("farmiq_auth_blocked", onBlocked);
  }, []);

  async function handleFirebaseUser(fbUser, extraName) {
    const profile = await ensureUserProfile(fbUser, extraName ? { name: extraName } : {});
    if (!profile) {
      await _auth.signOut();
      setErr("Could not load your account. Check your internet and try again.");
      setLoading(false); setGLoading(false);
      return;
    }
    const forceAdmin = isAdminEmail(fbUser.email);
    if (!forceAdmin && profile.removed) {
      await _auth.signOut();
      window.__workerRemoved = true;
      setErr("Your account has been removed. Please contact the farm admin.");
      setLoading(false); setGLoading(false);
      return;
    }
    if (!profile.approved && !forceAdmin) {
      await _auth.signOut();
      setErr("Your account is pending admin approval. Please wait.");
      setLoading(false); setGLoading(false);
      return;
    }
    // onAuthStateChanged in App.jsx handles setUser
  }

  async function login() {
    setErr(""); setOk("");
    if (!form.email || !form.password) return setErr("Please enter your email and password.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    setLoading(true);
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      setErr("Sign in is taking too long. Check your internet connection and try again.");
    }, 12000);
    try {
      await _auth.signInWithEmailAndPassword(form.email.trim(), form.password);
      clearTimeout(loginTimeout);
      return;
    } catch (e) {
      clearTimeout(loginTimeout);
      const msg =
        e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
          ? "Incorrect email or password. Please try again."
          : e.code === "auth/invalid-email" ? "Invalid email address."
          : e.code === "auth/too-many-requests" ? "Too many attempts. Please wait a few minutes and try again."
          : e.code === "auth/network-request-failed" ? "No internet connection. Check your network and try again."
          : "Sign in failed: " + e.message;
      setErr(msg);
    }
    setLoading(false);
  }

  async function reg() {
    setErr(""); setOk("");
    window.__workerRemoved = false;
    if (!form.name.trim()) return setErr("Please enter your full name.");
    if (!form.email.trim()) return setErr("Please enter your email address.");
    if (!form.password) return setErr("Please enter a password.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setErr("Passwords do not match. Please re-enter them.");
    setLoading(true);
    try {
      const cred = await _auth.createUserWithEmailAndPassword(form.email.trim(), form.password);
      await ensureUserProfile(cred.user, { name: form.name.trim() });
      await _auth.signOut();
      const isAdmin = isAdminEmail(form.email.trim());
      setOk(isAdmin
        ? "Admin account created! You can now sign in."
        : "Account created! An admin must approve your access before you can sign in.");
      setTab("login");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (e) {
      const msg =
        e.code === "auth/email-already-in-use" ? "An account with that email already exists."
        : e.code === "auth/invalid-email" ? "Invalid email address."
        : "Registration failed: " + e.message;
      setErr(msg);
    }
    setLoading(false);
  }

  async function googleSignIn() {
    setErr(""); setGLoading(true);
    try {
      await _auth.signInWithRedirect(_googleProvider);
      // Page navigates away — result handled by getRedirectResult() in App.jsx
    } catch (e) {
      const msg =
        e.code === "auth/unauthorized-domain" ? "This domain is not authorized. Add it in Firebase → Authentication → Authorized Domains."
        : e.code === "auth/network-request-failed" ? "No internet connection. Try email/password sign-in instead."
        : e.code === "auth/too-many-requests" ? "Too many attempts. Please wait and try again."
        : "Google sign-in failed: " + e.message;
      if (msg) setErr(msg);
      setGLoading(false);
    }
  }

  return (
    <>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(150deg,#eef5ee 0%,#f0fdf4 50%,#e8f5e9 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
      }}>
        {/* Background orbs */}
        <div style={{ position: "fixed", top: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(22,163,74,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{
          width: 440, background: "#fff", borderRadius: 22,
          boxShadow: "0 28px 70px rgba(0,0,0,.10),0 6px 20px rgba(22,163,74,.09),0 1px 3px rgba(0,0,0,.06)",
          overflow: "hidden", border: "1px solid rgba(22,163,74,.12)",
        }} className="login-enter fade-in">

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#071410 0%,#0f2316 55%,#0a1f12 100%)",
            padding: "32px 36px 28px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(74,222,128,.06)", border: "1px solid rgba(74,222,128,.12)" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(74,222,128,.04)" }} />

            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🐷</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>FarmIQ</div>
                <div style={{ fontSize: 9.5, color: "rgba(74,222,128,.8)", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 2, fontWeight: 600 }}>AI Pig Farm · Rwanda</div>
              </div>
            </div>

            <div style={{ position: "relative", marginTop: 18, fontSize: 13, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>
              {tab === "login" ? "Welcome back! Sign in to manage your farm." : "Create your account to get started."}
            </div>

            {/* Online indicator */}
            <div style={{
              position: "absolute", top: 16, right: 16, padding: "4px 10px", borderRadius: 20,
              background: navigator.onLine ? "rgba(74,222,128,.18)" : "rgba(239,68,68,.18)",
              border: "1px solid " + (navigator.onLine ? "rgba(74,222,128,.35)" : "rgba(239,68,68,.4)"),
              fontSize: 10, color: navigator.onLine ? "#4ade80" : "#f87171", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: navigator.onLine ? "#4ade80" : "#f87171", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              {navigator.onLine ? "ONLINE" : "OFFLINE"}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "28px 36px 32px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 11, padding: 3, marginBottom: 24, gap: 2 }}>
              {[["login", "🔐 Sign In"], ["register", "✏️ Register"]].map(([t, l]) => (
                <button key={t}
                  onClick={() => { setTab(t); setErr(""); setOk(""); setShowPwd(false); setShowConfirmPwd(false); }}
                  style={{
                    flex: 1, padding: "9px 6px", border: "none", borderRadius: 9,
                    background: tab === t ? "#fff" : "transparent",
                    color: tab === t ? "#1e293b" : "#64748b",
                    fontWeight: tab === t ? 700 : 500, fontSize: 13, cursor: "pointer",
                    fontFamily: "inherit", transition: "all .2s",
                    boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,.08)" : "none",
                  }}>{l}</button>
              ))}
            </div>

            {/* Google Sign-in */}
            <button onClick={googleSignIn} disabled={gLoading || loading} style={{
              width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0",
              background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13.5,
              cursor: (gLoading || loading) ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 18, transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,.06)",
              opacity: (gLoading || loading) ? 0.7 : 1,
            }}>
              {gLoading
                ? <span className="spin" style={{ width: 16, height: 16, border: "2px solid #e2e8f0", borderTop: "2px solid #4285f4", borderRadius: "50%", display: "inline-block" }} />
                : <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.5 2.7 13.6l7.8 6C12.4 13.2 17.8 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z" />
                    <path fill="#FBBC05" d="M10.5 28.4A14.8 14.8 0 0 1 9.5 24c0-1.5.3-3 .7-4.4l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.3z" />
                    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.2 1.5-5 2.3-8.4 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.7 42.5 14.7 48 24 48z" />
                  </svg>
              }
              {gLoading ? "Signing in with Google…" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.5 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tab === "register" && (
                <div>
                  <label style={lbl2}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input ref={namRef} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && emailRef.current?.focus()}
                    placeholder="e.g. Jean Pierre Habimana" style={inp2}
                    onFocus={focusIn} onBlur={focusOut} autoComplete="name" />
                </div>
              )}
              <div>
                <label style={lbl2}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input ref={emailRef} type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && pwdRef.current?.focus()}
                  placeholder="you@example.com" style={inp2}
                  autoCapitalize="none" autoCorrect="off" autoComplete="email"
                  onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div>
                <label style={lbl2}>Password <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input ref={pwdRef} type={showPwd ? "text" : "password"} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && (tab === "login" ? login() : null)}
                    placeholder="••••••••" style={{ ...inp2, paddingRight: 44 }}
                    onFocus={focusIn} onBlur={focusOut}
                    autoComplete={tab === "login" ? "current-password" : "new-password"} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 2, lineHeight: 1 }} tabIndex={-1}>
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
                {tab === "login" && (
                  <div style={{ textAlign: "right", marginTop: 6 }}>
                    <button onClick={() => setShowForgot(true)} style={{ background: "none", border: "none", color: "#16a34a", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
              {tab === "register" && (
                <div>
                  <label style={lbl2}>Confirm Password <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input type={showConfirmPwd ? "text" : "password"} value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && reg()}
                      placeholder="••••••••"
                      style={{ ...inp2, paddingRight: 44, borderColor: form.confirmPassword && form.confirmPassword !== form.password ? "#fca5a5" : undefined }}
                      onFocus={focusIn} onBlur={focusOut} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 2, lineHeight: 1 }} tabIndex={-1}>
                      {showConfirmPwd ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {form.confirmPassword && form.confirmPassword !== form.password && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>⚠️ Passwords don't match yet</div>}
                  {form.confirmPassword && form.confirmPassword === form.password && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>✅ Passwords match</div>}
                </div>
              )}
            </div>

            {/* Messages */}
            {err && <div style={{ marginTop: 16, padding: "11px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, color: "#b91c1c", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}><span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span><span>{err}</span></div>}
            {ok && <div style={{ marginTop: 16, padding: "11px 14px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, color: "#15803d", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}><span style={{ flexShrink: 0, marginTop: 1 }}>✅</span><span>{ok}</span></div>}

            {/* Submit */}
            <button onClick={tab === "login" ? login : reg} disabled={loading || gLoading} style={{
              marginTop: 20, width: "100%", padding: "13px", borderRadius: 11, border: "none",
              background: (loading || gLoading) ? "#86efac" : "linear-gradient(135deg,#16a34a,#15803d)",
              color: "#fff", fontWeight: 700, fontSize: 14.5,
              cursor: (loading || gLoading) ? "not-allowed" : "pointer",
              fontFamily: "inherit", boxShadow: (loading || gLoading) ? "none" : "0 4px 18px rgba(22,163,74,.35)",
              transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading
                ? <><span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" }} />Processing…</>
                : tab === "login" ? "Sign In →" : "Create Account →"}
            </button>

            {tab === "register" && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.15)", borderRadius: 9, fontSize: 12, color: "#3b82f6", lineHeight: 1.6 }}>
                ℹ️ New accounts require <strong>admin approval</strong> before you can log in. The farm admin will be notified.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TODO (step 7): replace with imported ForgotPasswordModal component */}
      {showForgot && <ForgotPasswordModal initialEmail={form.email} onClose={() => setShowForgot(false)} />}
    </>
  );
}
