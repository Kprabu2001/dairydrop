import React, { useState, useEffect, useCallback } from "react";
import {
  authAPI, productsAPI, cartAPI, ordersAPI,
  reviewsAPI, addressesAPI, notifsAPI, loyaltyAPI, referralsAPI, usersAPI
} from "./api";
import api from "./api";

// ── Theme ────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f7f3ed", phoneBg: "#faf8f4", card: "#ffffff", cardBorder: "#e8f0e8",
  text: "#1b5e20", subtext: "#6b8c6b", muted: "#a0b8a0", input: "#ffffff",
  inputBorder: "#e0ece0", tag: "#e8f5e9", tagText: "#2e7d32",
  navBg: "#ffffff", navBorder: "#e8f0e8", hero: "linear-gradient(135deg,#2e7d32,#43a047)",
  screenBg: "#faf8f4", accent: "#43a047", danger: "#e53935",
};
const DARK = {
  bg: "#0d1f0e", phoneBg: "#0f1f10", card: "#1a2e1b", cardBorder: "#2a3f2b",
  text: "#c8e6c9", subtext: "#7aad7b", muted: "#4a6e4b", input: "#1a2e1b",
  inputBorder: "#2a3f2b", tag: "#1a3a1b", tagText: "#81c784",
  navBg: "#0f1f10", navBorder: "#1a3a1b", hero: "linear-gradient(135deg,#1b5e20,#2e7d32)",
  screenBg: "#0f1f10", accent: "#66bb6a", danger: "#ef5350",
};

const CATEGORIES = ["All", "Milk", "Cheese", "Yogurt", "Cream", "Butter"];

export default function DairyApp() {
  const [screen, setScreen]           = useState("onboarding");
  const [dark, setDark]               = useState(false);
  const [user, setUser]               = useState(null);
  const [products, setProducts]       = useState([]);
  const [cart, setCart]               = useState([]);
  const [orders, setOrders]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loyalty, setLoyalty]         = useState(null);
  const [addresses, setAddresses]     = useState([]);
  const [referral, setReferral]       = useState(null);
  const [category, setCategory]       = useState("All");
  const [search, setSearch]           = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [onboardStep, setOnboardStep] = useState(0);
  const [promoCode, setPromoCode]     = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError]   = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [activeOrderTab, setActiveOrderTab] = useState("current");
  const [subScreen, setSubScreen]     = useState(null);
  const [showInvoice, setShowInvoice] = useState(null);
  const [reviewText, setReviewText]   = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [chatMessages, setChatMessages] = useState([{ from: "bot", text: "Hi! 👋 I'm Daisy. How can I help you today?", time: "Now" }]);
  const [chatInput, setChatInput]     = useState("");
  const [chatTyping, setChatTyping]   = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [referralCopied, setReferralCopied]   = useState(false);
  const [editingName, setEditingName]         = useState(false);
  const [editNameVal, setEditNameVal]         = useState("");
  const [editingPhone, setEditingPhone]       = useState(false);
  const [editPhoneVal, setEditPhoneVal]       = useState("");
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfilePhone, setEditProfilePhone] = useState("");
  const [editProfileSaving, setEditProfileSaving] = useState(false);
  const [editProfileSuccess, setEditProfileSuccess] = useState(false);

  // ── Stripe state ──────────────────────────────────────────
  const [showPayment, setShowPayment]         = useState(false);
  const [paymentLoading, setPaymentLoading]   = useState(false);
  const [paymentError, setPaymentError]       = useState("");
  const [cardNumber, setCardNumber]           = useState("");
  const [cardExpiry, setCardExpiry]           = useState("");
  const [cardCvc, setCardCvc]                 = useState("");
  const [cardName, setCardName]               = useState("");

  // ── Admin state ───────────────────────────────────────────
  const [adminTab, setAdminTab]               = useState("orders");
  const [adminOrders, setAdminOrders]         = useState([]);
  const [adminProducts, setAdminProducts]     = useState([]);
  const [adminLoading, setAdminLoading]       = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct]   = useState(null);
  const [productForm, setProductForm]         = useState({ name:"", description:"", price:"", unit:"", category:"Milk", emoji:"🥛", badge:"", stock:100, calories:"", protein:"", fat:"", carbs:"" });

  const loadAdminOrders = useCallback(async () => {
    try { const { data } = await api.get("/orders/admin/all"); setAdminOrders(data); } catch {}
  }, []);

  const loadAdminProducts = useCallback(async () => {
    try { const { data } = await api.get("/products/admin/all"); setAdminProducts(data); } catch {}
  }, []);

  const T = dark ? DARK : LIGHT;

  // Shared styles
  const S = {
    btn:     { background: T.hero, color: "#fff", border: "none", borderRadius: 18, fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%", padding: "17px" },
    card:    { background: T.card, borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    input:   { width: "100%", padding: "14px 16px", border: `2px solid ${T.inputBorder}`, borderRadius: 14, fontSize: 15, background: T.input, outline: "none", color: T.text, boxSizing: "border-box" },
    backBtn: { background: T.card, border: "none", borderRadius: 12, padding: "8px 12px", fontSize: 18, cursor: "pointer", color: T.text },
    scroll:  { flex: 1, overflowY: "auto", overflowX: "hidden" },
    phone:   { width: 390, height: 844, background: T.phoneBg, borderRadius: 44, boxShadow: "0 32px 80px rgba(0,0,0,0.22)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" },
  };

  const wrap = (children) => (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={S.phone}>{children}</div>
    </div>
  );

  // ── Data loaders ──────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    try {
      const { data } = await productsAPI.list({ category: category !== "All" ? category : undefined, search: search || undefined });
      setProducts(data);
    } catch {}
  }, [category, search]);

  const loadCart = useCallback(async () => {
    try { const { data } = await cartAPI.get(); setCart(data); } catch {}
  }, []);

  const loadOrders = useCallback(async () => {
    try { const { data } = await ordersAPI.list(); setOrders(data); } catch {}
  }, []);

  const loadNotifications = useCallback(async () => {
    try { const { data } = await notifsAPI.list(); setNotifications(data); } catch {}
  }, []);

  const loadLoyalty = useCallback(async () => {
    try { const { data } = await loyaltyAPI.get(); setLoyalty(data); } catch {}
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const { data } = await addressesAPI.list();
      setAddresses(data);
      if (data.length > 0 && !selectedAddress) setSelectedAddress(data.find(a => a.is_default)?.id || data[0].id);
    } catch {}
  }, [selectedAddress]);

  const loadReferral = useCallback(async () => {
    try { const { data } = await referralsAPI.get(); setReferral(data); } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authAPI.me().then(res => {
        setUser(res.data);
        setScreen("login"); // force a screen change
        setTimeout(() => setScreen("home"), 0); // then go home to trigger loadProducts
      }).catch(() => {
        localStorage.clear();
        setScreen("login");
      });
    }
  }, []);
  useEffect(() => { if (screen === "home") loadProducts(); }, [screen, loadProducts]);
  useEffect(() => { if (user) { loadCart(); loadNotifications(); loadLoyalty(); loadAddresses(); } }, [user]);
  useEffect(() => { if (screen === "tracking") loadOrders(); }, [screen, loadOrders]);
  useEffect(() => { if (subScreen === "referral") loadReferral(); }, [subScreen, loadReferral]);

  const cartCount    = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discount     = appliedPromo ? cartSubtotal * appliedPromo.discount_percent / 100 : 0;
  const cartTotal    = cartSubtotal - discount + 1.99 + cartSubtotal * 0.08;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const updateCart = async (productId, quantity) => {
    try { await cartAPI.update(productId, quantity); await loadCart(); } catch {}
  };

  const getQty = (id) => cart.find(i => i.product_id === id)?.quantity || 0;

  // ── LOGIN ──────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName]             = useState("");
  const [regEmail, setRegEmail]           = useState("");
  const [regPassword, setRegPassword]     = useState("");
  const [authTab, setAuthTab]             = useState("signin"); // "signin" | "register" | "admin"
  const [isRegister, setIsRegister]       = useState(false);
  const [adminName, setAdminName]         = useState("");
  const [adminEmail, setAdminEmail]       = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCode, setAdminCode]         = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [regConfirmPassword, setRegConfirmPassword]     = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");

  const doLogin = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await authAPI.login(loginEmail, loginPassword);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await authAPI.me();
      setUser(me.data);
      setScreen("home");
    } catch (e) {
      setError(e.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const doRegister = async () => {
    setLoading(true); setError("");
    if (regPassword !== regConfirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    try {
      const { data } = await authAPI.register({ email: regEmail, full_name: regName, password: regPassword });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await authAPI.me();
      setUser(me.data);
      setScreen("home");
    } catch (e) {
      setError(e.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const doAdminRegister = async () => {
    setLoading(true); setError("");
    if (adminPassword !== adminConfirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    try {
      const { data } = await authAPI.register({ email: adminEmail, full_name: adminName, password: adminPassword, role: "admin", admin_code: adminCode });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await authAPI.me();
      setUser(me.data);
      setScreen("home");
    } catch (e) {
      setError(e.response?.data?.detail || "Admin registration failed");
    } finally { setLoading(false); }};


  if (screen === "onboarding") {
    const slides = [
      { emoji: "🐄", title: "Farm-fresh dairy,\ndelivered to you", sub: "Order premium milk, cheese, butter & more from trusted local farms." },
      { emoji: "🧀", title: "Hundreds of\ndairy products", sub: "Explore artisan cheeses, yogurts, creams and more with full nutrition info." },
      { emoji: "🚚", title: "Fast & reliable\ndelivery", sub: "Get your order in 30 minutes. Earn loyalty points on every order!" },
    ];
    const sl = slides[onboardStep];
    return wrap(
      <div style={{ flex: 1, background: dark ? "linear-gradient(160deg,#0d1f0e,#1a2e1b)" : "linear-gradient(160deg,#e8f5e9,#f1f8e9,#fff8e1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "60px 32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>🥛 DairyDrop</div>
          <button onClick={() => setDark(d => !d)} style={{ background: T.card, border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 16 }}>{dark ? "☀️" : "🌙"}</button>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 100, marginBottom: 24 }}>{sl.emoji}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: T.text, lineHeight: 1.2, whiteSpace: "pre-line", marginBottom: 16 }}>{sl.title}</div>
          <div style={{ fontSize: 15, color: T.subtext, lineHeight: 1.6 }}>{sl.sub}</div>
        </div>
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
            {slides.map((_, i) => <div key={i} style={{ height: 6, borderRadius: 3, background: T.accent, width: i === onboardStep ? 28 : 8, opacity: i === onboardStep ? 1 : 0.25, transition: "all 0.3s" }} />)}
          </div>
          <button onClick={() => onboardStep < 2 ? setOnboardStep(s => s + 1) : setScreen("login")} style={{ ...S.btn, marginBottom: 14 }}>
            {onboardStep < 2 ? "Continue →" : "Get Started"}
          </button>
          {onboardStep < 2 && <div onClick={() => setScreen("login")} style={{ textAlign: "center", color: T.muted, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Skip</div>}
        </div>
      </div>
    );
  }

  // ── LOGIN / REGISTER / ADMIN ───────────────────────────────
  if (screen === "login") return wrap(
    <div style={{ flex: 1, background: T.phoneBg, display: "flex", flexDirection: "column", padding: "0 28px 32px", overflowY: "auto" }}>
      <div style={{ background: T.hero, borderRadius: "0 0 36px 36px", padding: "56px 28px 36px", margin: "0 -28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🥛</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>DairyDrop</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>Fresh from the farm</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setDark(d => !d)} style={{ background: T.card, border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 16 }}>{dark ? "☀️" : "🌙"}</button>
      </div>
      {/* 3-tab toggle */}
      <div style={{ display: "flex", background: T.tag, borderRadius: 14, padding: 4, marginBottom: 24, gap: 2 }}>
        {[["signin", "Sign In"], ["register", "Register"], ["admin", "Admin"]].map(([key, label]) => (
          <button key={key} onClick={() => { setAuthTab(key); setError(""); }} style={{ flex: 1, padding: "10px 4px", background: authTab === key ? T.card : "transparent", border: "none", borderRadius: 11, fontWeight: 800, fontSize: 13, color: authTab === key ? T.text : T.subtext, cursor: "pointer", transition: "all 0.2s" }}>{label}</button>
        ))}
      </div>
      {error && <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{error}</div>}

      {/* ── Sign In ── */}
      {authTab === "signin" && (
        <>
          {[["Email", loginEmail, setLoginEmail, "email"]].map(([label, val, set, type]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <input value={val} onChange={e => set(e.target.value)} type={type} style={S.input} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} type={showPassword ? "text" : "password"} style={{ ...S.input, paddingRight: 48 }} />
              <button onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.muted, padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 28, cursor: "pointer" }}>Forgot password?</div>
          <button onClick={doLogin} disabled={loading} style={{ ...S.btn, marginBottom: 20, opacity: loading ? 0.7 : 1 }}>{loading ? "Signing in..." : "Sign In"}</button>
          <div style={{ textAlign: "center", fontSize: 13, color: T.subtext }}>
            Don't have an account?{" "}
            <span onClick={() => { setAuthTab("register"); setError(""); }} style={{ color: T.accent, fontWeight: 700, cursor: "pointer" }}>Register</span>
          </div>
        </>
      )}

      {/* ── Register ── */}
      {authTab === "register" && (
        <>
          {[["Full Name", regName, setRegName, "text"], ["Email", regEmail, setRegEmail, "email"]].map(([label, val, set, type]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={label} style={S.input} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input value={regPassword} onChange={e => setRegPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Password" style={{ ...S.input, paddingRight: 48 }} />
              <button onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.muted, padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Confirm Password</div>
            <div style={{ position: "relative" }}>
              <input value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Confirm Password" style={{ ...S.input, paddingRight: 48, borderColor: regConfirmPassword && regPassword !== regConfirmPassword ? "#ef5350" : undefined }} />
              <button onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.muted, padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
            </div>
            {regConfirmPassword && regPassword !== regConfirmPassword && (
              <div style={{ fontSize: 12, color: "#ef5350", marginTop: 4, fontWeight: 700 }}>⚠ Passwords do not match</div>
            )}
          </div>
          <button onClick={doRegister} disabled={loading} style={{ ...S.btn, marginTop: 8, marginBottom: 20, opacity: loading ? 0.7 : 1 }}>{loading ? "Creating account..." : "Create Account"}</button>
          <div style={{ textAlign: "center", fontSize: 13, color: T.subtext }}>
            Already have an account?{" "}
            <span onClick={() => { setAuthTab("signin"); setError(""); }} style={{ color: T.accent, fontWeight: 700, cursor: "pointer" }}>Sign In</span>
          </div>
        </>
      )}

      {/* ── Admin Sign Up ── */}
      {authTab === "admin" && (
        <>
          <div style={{ background: T.tag, border: `1.5px solid ${T.accent}`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: T.subtext, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔐</span>
            <span>Admin accounts require an authorisation code from your organisation.</span>
          </div>
          {[["Full Name", adminName, setAdminName, "text"], ["Email", adminEmail, setAdminEmail, "email"]].map(([label, val, set, type]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={label} style={S.input} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Password" style={{ ...S.input, paddingRight: 48 }} />
              <button onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.muted, padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Confirm Password</div>
            <div style={{ position: "relative" }}>
              <input value={adminConfirmPassword} onChange={e => setAdminConfirmPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Confirm Password" style={{ ...S.input, paddingRight: 48, borderColor: adminConfirmPassword && adminPassword !== adminConfirmPassword ? "#ef5350" : undefined }} />
              <button onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.muted, padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
            </div>
            {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
              <div style={{ fontSize: 12, color: "#ef5350", marginTop: 4, fontWeight: 700 }}>⚠ Passwords do not match</div>
            )}
          </div>
          {[["Admin Code", adminCode, setAdminCode, "text"]].map(([label, val, set, type]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={label} style={S.input} />
            </div>
          ))}
          <button onClick={doAdminRegister} disabled={loading} style={{ ...S.btn, marginTop: 8, marginBottom: 20, background: "linear-gradient(135deg,#1565c0,#1976d2)", opacity: loading ? 0.7 : 1 }}>{loading ? "Creating admin..." : "Create Admin Account"}</button>
          <div style={{ textAlign: "center", fontSize: 13, color: T.subtext }}>
            Already have an account?{" "}
            <span onClick={() => { setAuthTab("signin"); setError(""); }} style={{ color: T.accent, fontWeight: 700, cursor: "pointer" }}>Sign In</span>
          </div>
        </>
      )}
    </div>
  );

  // ── PRODUCT DETAIL ─────────────────────────────────────────
  if (screen === "product" && selectedProduct) {
    const p = selectedProduct;
    const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 3);
    return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 90 }}>{p.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 12 }}>{p.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>{p.unit}</div>
          </div>
        </div>
        <div style={{ ...S.scroll, padding: "20px 24px 100px", background: T.screenBg }}>
          <div style={{ ...S.card, padding: "18px 20px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.accent }}>${p.price}</div>
            {getQty(p.id) > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: T.tag, borderRadius: 16, padding: "10px 18px" }}>
                <button onClick={() => updateCart(p.id, getQty(p.id) - 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 22, fontWeight: 900, cursor: "pointer" }}>−</button>
                <span style={{ fontWeight: 900, fontSize: 18, color: T.text }}>{getQty(p.id)}</span>
                <button onClick={() => updateCart(p.id, getQty(p.id) + 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 22, fontWeight: 900, cursor: "pointer" }}>+</button>
              </div>
            ) : (
              <button onClick={() => updateCart(p.id, 1)} style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 16, padding: "12px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Add to Cart</button>
            )}
          </div>
          <div style={{ ...S.card, padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 8 }}>About</div>
            <div style={{ fontSize: 14, color: T.subtext, lineHeight: 1.7 }}>{p.description}</div>
          </div>
          <div style={{ ...S.card, padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 14 }}>🥗 Nutrition <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>(per serving)</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["🔥 Calories", p.calories ? p.calories + " kcal" : "—"], ["💪 Protein", p.protein || "—"], ["🧈 Fat", p.fat || "—"], ["🌾 Carbs", p.carbs || "—"]].map(([l, v]) => (
                <div key={l} style={{ background: T.tag, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: T.subtext }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.text, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {related.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 12 }}>You might also like</div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
                {related.map(r => (
                  <div key={r.id} onClick={() => setSelectedProduct(r)} style={{ ...S.card, padding: "14px", minWidth: 110, textAlign: "center", cursor: "pointer", flexShrink: 0 }}>
                    <div style={{ fontSize: 36 }}>{r.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginTop: 6 }}>{r.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: T.accent, marginTop: 4 }}>${r.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ ...S.card, padding: "18px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 14 }}>⭐ Reviews ({productReviews.length})</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewRating(s)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", opacity: s <= reviewRating ? 1 : 0.3 }}>★</button>)}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your thoughts..." style={{ ...S.input, flex: 1, padding: "10px 14px" }} />
              <button onClick={async () => {
                if (!reviewText.trim()) return;
                try {
                  await reviewsAPI.create({ product_id: p.id, rating: reviewRating, comment: reviewText });
                  setReviewText("");
                  const { data } = await reviewsAPI.forProduct(p.id);
                  setProductReviews(data);
                } catch {}
              }} style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 800, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Post</button>
            </div>
            {productReviews.map((rv, i) => (
              <div key={i} style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 12, marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{rv.user?.full_name || "User"}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{new Date(rv.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ color: "#f59e0b", marginBottom: 4 }}>{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</div>
                <div style={{ fontSize: 13, color: T.subtext }}>{rv.comment}</div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav screen="home" setScreen={setScreen} cartCount={cartCount} T={T} />
      </>
    );
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────
  if (screen === "notifications") return wrap(
    <>
      <div style={{ background: T.hero, padding: "52px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Notifications</div>
          </div>
          <button onClick={async () => { await notifsAPI.markAllRead(); loadNotifications(); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark all read</button>
        </div>
      </div>
      <div style={{ ...S.scroll, padding: "16px 20px 100px", background: T.screenBg }}>
        {notifications.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>No notifications yet</div>}
        {notifications.map(n => (
          <div key={n.id} onClick={async () => { await notifsAPI.markRead(n.id); loadNotifications(); }} style={{ ...S.card, padding: "16px", marginBottom: 10, display: "flex", gap: 14, opacity: n.is_read ? 0.6 : 1, cursor: "pointer", borderLeft: n.is_read ? "none" : `4px solid ${T.accent}` }}>
            <div style={{ fontSize: 28 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{n.title}</div>
              <div style={{ fontSize: 13, color: T.subtext, lineHeight: 1.5 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.is_read && <div style={{ width: 10, height: 10, background: T.accent, borderRadius: "50%", marginTop: 4 }} />}
          </div>
        ))}
      </div>
      <BottomNav screen="home" setScreen={setScreen} cartCount={cartCount} T={T} />
    </>
  );

  // ── CHAT ───────────────────────────────────────────────────
  if (screen === "chat") return wrap(
    <>
      <div style={{ background: T.hero, padding: "52px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐄</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Daisy — Support</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>● Online</div>
          </div>
        </div>
      </div>
      <div style={{ ...S.scroll, padding: "16px 20px 20px", background: T.screenBg, display: "flex", flexDirection: "column", gap: 12 }}>
        {["Order status", "Delivery times", "Return policy", "My points"].map(q => (
          <button key={q} onClick={() => setChatInput(q)} style={{ background: T.tag, border: `1px solid ${T.cardBorder}`, borderRadius: 20, padding: "8px 16px", fontSize: 13, color: T.tagText, cursor: "pointer", fontWeight: 700, alignSelf: "flex-start" }}>{q}</button>
        ))}
        {chatMessages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "78%", background: m.from === "user" ? T.hero : T.card, borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 14, color: m.from === "user" ? "#fff" : T.text, lineHeight: 1.5 }}>{m.text}</div>
            </div>
          </div>
        ))}
        {chatTyping && <div style={{ background: T.card, borderRadius: "18px 18px 18px 4px", padding: "14px 20px", width: "fit-content", color: T.muted }}>Daisy is typing...</div>}
      </div>
      <div style={{ padding: "12px 20px 28px", background: T.navBg, borderTop: `1px solid ${T.navBorder}`, display: "flex", gap: 10 }}>
        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={async e => {
          if (e.key !== "Enter" || !chatInput.trim()) return;
          const msg = chatInput;
          setChatMessages(m => [...m, { from: "user", text: msg }]);
          setChatInput(""); setChatTyping(true);
          await new Promise(r => setTimeout(r, 1200));
          const q = msg.toLowerCase();
          const REPLIES = { order: `Your latest order is ${orders[0]?.status || "being processed"}!`, delivery: "We deliver 7AM–9PM daily. $1.99 fee, free over $30!", return: "Returns accepted within 24 hours — just contact us.", points: `You have ${loyalty?.points || 0} loyalty points!` };
          const reply = Object.entries(REPLIES).find(([k]) => q.includes(k));
          setChatMessages(m => [...m, { from: "bot", text: reply ? reply[1] : "Thanks for reaching out! A human agent will follow up soon. 😊" }]);
          setChatTyping(false);
        }} placeholder="Type a message..." style={{ ...S.input, flex: 1, padding: "12px 16px" }} />
        <button style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 14, padding: "12px 18px", fontSize: 18, cursor: "pointer" }}>➤</button>
      </div>
    </>
  );

  // ── CART ───────────────────────────────────────────────────
  if (screen === "cart") {
    if (orderPlaced) return wrap(
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", background: dark ? "linear-gradient(160deg,#0d1f0e,#1a2e1b)" : "linear-gradient(160deg,#e8f5e9,#f1f8e9)" }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: T.text, marginBottom: 12 }}>Order Placed!</div>
        <div style={{ fontSize: 15, color: T.subtext, lineHeight: 1.6, marginBottom: 20 }}>Your dairy goodies are being packed.<br />ETA: <strong>{orderPlaced.estimated_eta}</strong></div>
        <div style={{ ...S.card, padding: "18px 28px", marginBottom: 20, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: T.muted }}>Points Earned</span>
            <span style={{ fontWeight: 900, color: "#f59e0b" }}>+{orderPlaced.points_earned} ⭐</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.muted }}>Order Total</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.accent }}>${orderPlaced.total.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => { setOrderPlaced(null); setScreen("tracking"); }} style={{ ...S.btn, marginBottom: 14 }}>Track My Order</button>
        <button onClick={() => { setOrderPlaced(null); setScreen("home"); }} style={{ width: "100%", padding: "17px", background: T.card, color: T.text, border: `2px solid ${T.cardBorder}`, borderRadius: 18, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Continue Shopping</button>
      </div>
    );
    return wrap(
      <>
        <div style={{ background: T.phoneBg, padding: "52px 24px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setScreen("home")} style={S.backBtn}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>My Cart</div>
          <div style={{ marginLeft: "auto", background: T.tag, borderRadius: 10, padding: "4px 12px", fontSize: 13, fontWeight: 700, color: T.tagText }}>{cartCount} items</div>
        </div>
        <div style={{ ...S.scroll, padding: "0 24px 130px", background: T.screenBg }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 64 }}>🛒</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 16 }}>Your cart is empty</div>
              <button onClick={() => setScreen("home")} style={{ marginTop: 24, padding: "14px 32px", background: T.hero, color: "#fff", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Browse Products</button>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ ...S.card, padding: "16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 60, height: 60, background: T.tag, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.product.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{item.product.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: T.accent, marginTop: 4 }}>${(item.product.price * item.quantity).toFixed(2)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.tag, borderRadius: 12, padding: "6px 12px" }}>
                    <button onClick={() => updateCart(item.product_id, item.quantity - 1)} style={{ background: "none", border: "none", fontSize: 18, color: T.accent, cursor: "pointer", fontWeight: 800 }}>−</button>
                    <span style={{ fontWeight: 800, fontSize: 15, color: T.text, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => updateCart(item.product_id, item.quantity + 1)} style={{ background: "none", border: "none", fontSize: 18, color: T.accent, cursor: "pointer", fontWeight: 800 }}>+</button>
                  </div>
                </div>
              ))}
              {/* Promo */}
              <div style={{ ...S.card, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 10 }}>🏷️ Promo Code</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Try DAIRY10 or NEWUSER20" style={{ ...S.input, flex: 1, padding: "11px 14px" }} />
                  <button onClick={async () => {
                    try {
                      const { data } = await cartAPI.validatePromo(promoCode, cartSubtotal);
                      if (data.valid) { setAppliedPromo(data); setPromoError(""); }
                      else { setPromoError(data.message); setAppliedPromo(null); }
                    } catch { setPromoError("Failed to validate"); }
                  }} style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 12, padding: "11px 18px", fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Apply</button>
                </div>
                {promoError && <div style={{ fontSize: 12, color: T.danger, marginTop: 8 }}>{promoError}</div>}
                {appliedPromo && <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginTop: 8 }}>✅ {promoCode.toUpperCase()} — {appliedPromo.discount_percent}% off!</div>}
              </div>
              {/* Loyalty */}
              {loyalty && (
                <div style={{ ...S.card, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 28 }}>⭐</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Loyalty Points</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{loyalty.points} pts · Redeem 500 = $5 off</div>
                  </div>
                </div>
              )}
              {/* Address */}
              {addresses.length > 0 && (
                <div style={{ ...S.card, padding: "16px 20px", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 10 }}>📍 Deliver to</div>
                  {addresses.map(a => (
                    <div key={a.id} onClick={() => setSelectedAddress(a.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.cardBorder}`, cursor: "pointer" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {selectedAddress === a.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{a.full_address}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Summary */}
              <div style={{ ...S.card, padding: "20px", marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 14 }}>Order Summary</div>
                {[["Subtotal", `$${cartSubtotal.toFixed(2)}`], ...(appliedPromo ? [[`Discount (${appliedPromo.discount_percent}%)`, `-$${discount.toFixed(2)}`]] : []), ["Delivery fee", "$1.99"], ["Tax (8%)", `$${(cartSubtotal * 0.08).toFixed(2)}`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: l.startsWith("Discount") ? T.accent : T.subtext }}>
                    <span>{l}</span><span style={{ fontWeight: l.startsWith("Discount") ? 800 : 400 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.cardBorder}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 16, color: T.text }}>
                  <span>Total</span><span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
        {cart.length > 0 && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px", background: T.navBg, borderTop: `1px solid ${T.navBorder}` }}>
            {showPayment ? (
              <div style={{ ...S.card, padding: "20px", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  💳 Pay with Card
                  <span style={{ marginLeft: "auto", fontSize: 20 }}>🔒</span>
                </div>
                {[
                  ["Cardholder Name", cardName, setCardName, "text", "John Doe"],
                  ["Card Number", cardNumber, setCardNumber, "text", "4242 4242 4242 4242"],
                  ["Expiry (MM/YY)", cardExpiry, setCardExpiry, "text", "12/26"],
                  ["CVC", cardCvc, setCardCvc, "text", "123"],
                ].map(([label, val, set, type, ph]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                    <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={ph} style={{ ...S.input, padding: "10px 14px", fontSize: 14 }} />
                  </div>
                ))}
                {paymentError && <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{paymentError}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={async () => {
                    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) { setPaymentError("Please fill all card details"); return; }
                    setPaymentLoading(true); setPaymentError("");
                    try {
                      // Step 1: Create payment intent
                      const { data: intent } = await api.post("/orders/create-payment-intent", {
                        address_id: selectedAddress,
                        promo_code: appliedPromo ? promoCode : undefined,
                        redeem_points: 0,
                      });
                      // Step 2: Simulate card charge via Stripe.js (use Stripe Elements in prod)
                      // For test mode we confirm directly
                      const { data: order } = await ordersAPI.place({
                        address_id: selectedAddress,
                        promo_code: appliedPromo ? promoCode : undefined,
                        redeem_points: 0,
                        payment_intent_id: intent.payment_intent_id,
                      });
                      setOrderPlaced(order);
                      setShowPayment(false);
                      setCardNumber(""); setCardExpiry(""); setCardCvc(""); setCardName("");
                      await loadCart(); setAppliedPromo(null); setPromoCode("");
                      await loadLoyalty();
                    } catch (e) {
                      setPaymentError(e.response?.data?.detail || "Payment failed. Please try again.");
                    } finally { setPaymentLoading(false); }
                  }} disabled={paymentLoading} style={{ ...S.btn, flex: 2, opacity: paymentLoading ? 0.7 : 1 }}>
                    {paymentLoading ? "Processing..." : `Pay $${cartTotal.toFixed(2)}`}
                  </button>
                  <button onClick={() => { setShowPayment(false); setPaymentError(""); }} style={{ flex: 1, padding: "17px", background: T.card, color: T.text, border: `2px solid ${T.cardBorder}`, borderRadius: 18, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                </div>
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: T.muted }}>🔒 Secured by Stripe · Test card: 4242 4242 4242 4242</div>
              </div>
            ) : (
              <button onClick={() => {
                if (!selectedAddress) return alert("Please add a delivery address first");
                setShowPayment(true); setPaymentError("");
              }} style={{ ...S.btn, boxShadow: "0 8px 24px rgba(46,125,50,0.28)" }}>
                💳 Proceed to Payment · ${cartTotal.toFixed(2)}
              </button>
            )}
          </div>
        )}
      </>
    );
  }

  // ── ORDER TRACKING ─────────────────────────────────────────
  if (screen === "tracking") {
    const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
    const pastOrders   = orders.filter(o => o.status === "delivered" || o.status === "cancelled");
    const STEP_MAP = { pending: 0, confirmed: 1, packing: 1, on_the_way: 2, delivered: 3 };
    const STEPS = ["Order Placed", "Packed & Ready", "Out for Delivery", "Delivered"];

    return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>My Orders</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["current", "past"].map(t => (
              <button key={t} onClick={() => setActiveOrderTab(t)} style={{ padding: "8px 20px", background: activeOrderTab === t ? "#fff" : "rgba(255,255,255,0.15)", color: activeOrderTab === t ? "#2e7d32" : "#fff", border: "none", borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{t === "current" ? "Active" : "Past Orders"}</button>
            ))}
          </div>
        </div>
        <div style={{ ...S.scroll, padding: "20px 24px 100px", background: T.screenBg }}>
          {showInvoice ? (
            <div style={{ ...S.card, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>🧾 Invoice</div>
                  <div style={{ fontSize: 13, color: T.muted }}>{showInvoice.order_number} · {new Date(showInvoice.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => setShowInvoice(null)} style={{ background: T.tag, border: "none", borderRadius: 10, padding: "6px 12px", color: T.tagText, fontWeight: 800, cursor: "pointer" }}>✕</button>
              </div>
              {showInvoice.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: T.subtext, marginBottom: 8, borderBottom: `1px solid ${T.cardBorder}`, paddingBottom: 8 }}>
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>${item.total_price.toFixed(2)}</span>
                </div>
              ))}
              {[["Delivery", "$1.99"], ["Tax", `$${showInvoice.tax.toFixed(2)}`], ["Total", `$${showInvoice.total.toFixed(2)}`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: l === "Total" ? 16 : 14, fontWeight: l === "Total" ? 900 : 400, color: l === "Total" ? T.text : T.subtext, marginTop: 8 }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ background: T.tag, borderRadius: 12, padding: "12px 16px", marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: T.tagText, fontWeight: 700 }}>Points Earned</span>
                <span style={{ fontWeight: 900, color: "#f59e0b" }}>+{showInvoice.points_earned} ⭐</span>
              </div>
            </div>
          ) : activeOrderTab === "current" ? (
            activeOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>No active orders</div>
            ) : activeOrders.map(order => (
              <div key={order.id} style={{ ...S.card, padding: "20px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text }}>{order.order_number}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ background: "#fff8e1", color: "#f57f17", borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>🚚 {order.status.replace("_", " ")}</div>
                </div>
                <div style={{ background: T.tag, borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: T.subtext, marginBottom: 4 }}>Estimated arrival</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.accent }}>{order.estimated_eta}</div>
                </div>
                {STEPS.map((step, i) => {
                  const done = i <= (STEP_MAP[order.status] || 0);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "start", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? T.hero : T.tag, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: done ? "#fff" : T.muted, fontWeight: 800 }}>{done ? "✓" : ""}</div>
                        {i < 3 && <div style={{ width: 2, height: 28, background: done ? T.accent : T.cardBorder }} />}
                      </div>
                      <div style={{ paddingTop: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: done ? 800 : 600, color: done ? T.text : T.muted }}>{step}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            pastOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>No past orders yet</div>
            ) : pastOrders.map(order => (
              <div key={order.id} style={{ ...S.card, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{order.order_number}</div>
                  <div style={{ background: T.tag, color: T.tagText, borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>✓ Delivered</div>
                </div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                {order.items.map((item, i) => <div key={i} style={{ fontSize: 14, color: T.subtext }}>• {item.product.name} × {item.quantity}</div>)}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 900, color: T.text }}>
                  <span>Total</span><span>${order.total.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={async () => {
                    for (const item of order.items) await cartAPI.update(item.product_id, item.quantity);
                    await loadCart(); setScreen("cart");
                  }} style={{ flex: 1, padding: "11px", background: T.tag, color: T.tagText, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Reorder</button>
                  <button onClick={() => setShowInvoice(order)} style={{ flex: 1, padding: "11px", background: T.card, color: T.text, border: `2px solid ${T.cardBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🧾 Invoice</button>
                </div>
              </div>
            ))
          )}
        </div>
        <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} />
      </>
    );
  }

  // ── PROFILE ────────────────────────────────────────────────
  if (screen === "profile") {
    if (subScreen === "editProfile") return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => { setSubScreen(null); setEditProfileSuccess(false); }} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Edit Profile</div>
        </div>
        <div style={{ ...S.scroll, padding: "28px 24px 100px", background: T.screenBg }}>
          <div style={{ ...S.card, padding: "24px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 80, height: 80, background: T.tag, borderRadius: "50%", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>👤</div>
            </div>
            {[
              { label: "Full Name", value: editProfileName, set: setEditProfileName, type: "text", placeholder: "Your full name", icon: "👤" },
              { label: "Email", value: user?.email || "", set: () => {}, type: "email", placeholder: "Email", icon: "✉️", disabled: true },
              { label: "Phone Number", value: editProfilePhone, set: setEditProfilePhone, type: "tel", placeholder: "+91 99999 99999", icon: "📞" },
            ].map(({ label, value, set, type, placeholder, icon, disabled }) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>{icon}</span>
                  <input
                    value={value}
                    onChange={e => set(e.target.value)}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{ ...S.input, paddingLeft: 42, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "text" }}
                  />
                </div>
                {disabled && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Email cannot be changed</div>}
              </div>
            ))}
            {editProfileSuccess && (
              <div style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 700, textAlign: "center" }}>✅ Profile updated successfully!</div>
            )}
            <button onClick={async () => {
              setEditProfileSaving(true); setEditProfileSuccess(false);
              try {
                const payload = {};
                if (editProfileName.trim()) payload.full_name = editProfileName.trim();
                if (editProfilePhone.trim()) payload.phone = editProfilePhone.trim();
                await usersAPI.update(payload);
                setUser(u => ({ ...u, ...payload }));
                setEditProfileSuccess(true);
              } catch {} finally { setEditProfileSaving(false); }
            }} disabled={editProfileSaving} style={{ ...S.btn, opacity: editProfileSaving ? 0.7 : 1 }}>
              {editProfileSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </>
    );

    if (subScreen === "addresses") return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => setSubScreen(null)} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Saved Addresses</div>
        </div>
        <div style={{ ...S.scroll, padding: "20px 24px 100px", background: T.screenBg }}>
          {addresses.map(a => (
            <div key={a.id} style={{ ...S.card, padding: "18px 20px", marginBottom: 12, display: "flex", gap: 14, alignItems: "start" }}>
              <div style={{ fontSize: 28 }}>{a.label === "Home" ? "🏠" : "🏢"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{a.label}</div>
                <div style={{ fontSize: 13, color: T.subtext, marginTop: 4 }}>{a.full_address}</div>
                {a.is_default && <div style={{ background: T.tag, color: T.tagText, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800, display: "inline-block", marginTop: 8 }}>Default</div>}
              </div>
              <button onClick={async () => { await addressesAPI.delete(a.id); loadAddresses(); }} style={{ background: "none", border: "none", color: T.danger, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={async () => {
            const label = prompt("Address label (e.g. Home, Work):");
            if (!label) return;
            const addr = prompt("Full address:");
            if (!addr) return;
            await addressesAPI.create({ label, full_address: addr, is_default: addresses.length === 0 });
            loadAddresses();
          }} style={{ ...S.btn }}>+ Add New Address</button>
        </div>
      </>
    );

    if (subScreen === "referral") return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => setSubScreen(null)} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Refer & Earn</div>
        </div>
        <div style={{ ...S.scroll, padding: "24px", background: T.screenBg }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 72, marginBottom: 12 }}>🎁</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 8 }}>Give $5, Get $5</div>
            <div style={{ fontSize: 15, color: T.subtext, lineHeight: 1.6 }}>Share your code. You both get $5 credit when they place their first order!</div>
          </div>
          {referral && (
            <>
              <div style={{ ...S.card, padding: "20px", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Your referral code</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.accent, letterSpacing: 4, marginBottom: 16 }}>{referral.referral_code}</div>
                <button onClick={() => { navigator.clipboard?.writeText(referral.referral_code); setReferralCopied(true); }} style={{ ...S.btn, padding: "14px" }}>{referralCopied ? "✅ Copied!" : "Copy Code"}</button>
              </div>
              <div style={{ ...S.card, padding: "20px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>Your Referrals</div>
                {[["Total Referrals", referral.total_referrals], ["Successful", referral.successful_referrals], ["Credits Earned", `$${referral.total_credit_earned.toFixed(2)}`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                    <span style={{ fontSize: 14, color: T.subtext }}>{l}</span>
                    <span style={{ fontWeight: 900, color: T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </>
    );

    return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 32px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={() => setDark(d => !d)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 16 }}>{dark ? "☀️" : "🌙"}</button>
          </div>
          <div style={{ width: 80, height: 80, background: "rgba(255,255,255,0.2)", borderRadius: "50%", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>👤</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{user?.full_name || "User"}</div>
          <button onClick={() => { setEditProfileName(user?.full_name || ""); setEditProfilePhone(user?.phone || ""); setEditProfileSuccess(false); setSubScreen("editProfile"); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "6px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>✏️ Edit Profile</button>
          <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center" }}>
            {[[loyalty?.points || 0, "Points ⭐"], [orders.length, "Orders"], [orders.flatMap(o => o.items).length, "Items"]].map(([n, l]) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{n}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...S.scroll, padding: "20px 24px 100px", background: T.screenBg }}>
          {loyalty && (
            <div style={{ ...S.card, padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>⭐ Loyalty: {loyalty.tier.charAt(0).toUpperCase() + loyalty.tier.slice(1)}</div>
                {loyalty.next_tier_name && <div style={{ fontSize: 12, color: T.muted }}>{loyalty.next_tier_points} pts to {loyalty.next_tier_name}</div>}
              </div>
              <div style={{ background: T.tag, borderRadius: 8, height: 10, marginBottom: 8 }}>
                <div style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", height: "100%", borderRadius: 8, width: loyalty.next_tier_name ? `${Math.min(100, 100 - (loyalty.next_tier_points / (loyalty.tier === "bronze" ? 500 : loyalty.tier === "silver" ? 1500 : 3000)) * 100)}%` : "100%" }} />
              </div>
              <div style={{ fontSize: 12, color: T.subtext }}>{loyalty.points} pts available · 500 pts = $5</div>
            </div>
          )}
          {[
            { icon: "👤", label: "Edit Profile", sub: "Name, email & phone", action: () => { setEditProfileName(user?.full_name || ""); setEditProfilePhone(user?.phone || ""); setEditProfileSuccess(false); setSubScreen("editProfile"); } },
            { icon: "📍", label: "Saved Addresses", sub: `${addresses.length} addresses`, action: () => setSubScreen("addresses") },
            ...(user?.is_admin ? [{ icon: "🛠", label: "Admin Panel", sub: "Manage orders & products", action: async () => { setAdminTab("orders"); setAdminLoading(true); setScreen("admin"); await loadAdminOrders(); setAdminLoading(false); } }] : []),
            { icon: "🎁", label: "Refer a Friend", sub: "Give $5, Get $5 credit", action: () => setSubScreen("referral") },
            { icon: "🔔", label: "Notifications", sub: `${unreadNotifs} unread`, action: () => setScreen("notifications") },
            { icon: "💬", label: "Help & Support", sub: "Chat with Daisy", action: () => setScreen("chat") },
          ].map(item => (
            <div key={item.label} onClick={item.action} style={{ ...S.card, padding: "16px 20px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{ fontSize: 22 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.label}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{item.sub}</div>
              </div>
              <div style={{ color: T.muted, fontSize: 18 }}>›</div>
            </div>
          ))}
          <button onClick={() => { localStorage.clear(); setUser(null); setCart([]); setScreen("login"); }} style={{ width: "100%", padding: "16px", background: dark ? "#2a1a1a" : "#fff0f0", color: T.danger, border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 8 }}>Sign Out</button>
        </div>
        <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} />
      </>
    );
  }

  // ── ADMIN PANEL ───────────────────────────────────────────
  if (screen === "admin") {
    const STATUS_FLOW = ["pending","confirmed","packing","on_the_way","delivered","cancelled"];
    const STATUS_COLORS = { pending:"#ff9800", confirmed:"#2196f3", packing:"#9c27b0", on_the_way:"#00bcd4", delivered:"#4caf50", cancelled:"#f44336" };
    const PF = productForm;
    const setPF = (k, v) => setProductForm(f => ({ ...f, [k]: v }));

    return wrap(
      <>
        <div style={{ background: T.hero, padding: "52px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>🛠 Admin Panel</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingBottom: 0 }}>
            {[["orders","📦 Orders"], ["products","🥛 Products"]].map(([t, label]) => (
              <button key={t} onClick={async () => { setAdminTab(t); setAdminLoading(true); if(t==="orders") await loadAdminOrders(); else await loadAdminProducts(); setAdminLoading(false); }} style={{ padding: "10px 20px", background: adminTab===t ? "#fff" : "rgba(255,255,255,0.15)", color: adminTab===t ? "#2e7d32" : "#fff", border: "none", borderRadius: "14px 14px 0 0", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ ...S.scroll, padding: "16px 20px 100px", background: T.screenBg }}>

          {/* ── ORDERS TAB ── */}
          {adminTab === "orders" && (
            adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
            adminOrders.length === 0 ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>No orders yet</div> :
            adminOrders.map(order => (
              <div key={order.id} style={{ ...S.card, padding:"18px 20px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:15, color:T.text }}>{order.order_number}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{order.user?.full_name} · {order.user?.email}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight:900, fontSize:16, color:T.accent }}>${order.total?.toFixed(2)}</div>
                </div>
                <div style={{ fontSize:13, color:T.subtext, marginBottom:10 }}>
                  {order.items?.map(i => `${i.product?.name} ×${i.quantity}`).join(", ")}
                </div>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>Update Status:</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {STATUS_FLOW.map(s => (
                    <button key={s} onClick={async () => {
                      await api.patch(`/orders/admin/${order.id}/status`, { status: s });
                      await loadAdminOrders();
                    }} style={{ padding:"6px 12px", background: order.status===s ? STATUS_COLORS[s] : T.tag, color: order.status===s ? "#fff" : T.subtext, border:"none", borderRadius:10, fontSize:11, fontWeight:800, cursor:"pointer" }}>
                      {s.replace("_"," ")}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* ── PRODUCTS TAB ── */}
          {adminTab === "products" && (
            <>
              <button onClick={() => { setEditingProduct(null); setProductForm({ name:"", description:"", price:"", unit:"", category:"Milk", emoji:"🥛", badge:"", stock:100, calories:"", protein:"", fat:"", carbs:"" }); setShowProductForm(true); }} style={{ ...S.btn, marginBottom:16 }}>+ Add New Product</button>

              {showProductForm && (
                <div style={{ ...S.card, padding:"20px", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:900, color:T.text, marginBottom:16 }}>{editingProduct ? "✏️ Edit Product" : "➕ New Product"}</div>
                  {[
                    ["Name", "name", "text"], ["Description", "description", "text"],
                    ["Price ($)", "price", "number"], ["Unit (e.g. 1 gallon)", "unit", "text"],
                    ["Emoji", "emoji", "text"], ["Badge (bestseller/new/popular)", "badge", "text"],
                    ["Stock", "stock", "number"], ["Calories", "calories", "number"],
                    ["Protein", "protein", "text"], ["Fat", "fat", "text"], ["Carbs", "carbs", "text"],
                  ].map(([label, key, type]) => (
                    <div key={key} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.subtext, marginBottom:4, textTransform:"uppercase" }}>{label}</div>
                      <input value={PF[key] ?? ""} onChange={e => setPF(key, e.target.value)} type={type} style={{ ...S.input, padding:"10px 14px" }} />
                    </div>
                  ))}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.subtext, marginBottom:4, textTransform:"uppercase" }}>Category</div>
                    <select value={PF.category} onChange={e => setPF("category", e.target.value)} style={{ ...S.input, padding:"10px 14px" }}>
                      {["Milk","Cheese","Yogurt","Cream","Butter"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={async () => {
                      const payload = { ...PF, price: parseFloat(PF.price), stock: parseInt(PF.stock), calories: PF.calories ? parseInt(PF.calories) : null };
                      if (editingProduct) { await api.put(`/products/${editingProduct.id}`, payload); }
                      else { await api.post("/products/", payload); }
                      setShowProductForm(false); setEditingProduct(null);
                      await loadAdminProducts();
                    }} style={{ ...S.btn, flex:1 }}>{editingProduct ? "Save Changes" : "Create Product"}</button>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} style={{ flex:1, padding:"17px", background:T.card, color:T.text, border:`2px solid ${T.cardBorder}`, borderRadius:18, fontSize:16, fontWeight:800, cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              {adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
                adminProducts.map(p => (
                  <div key={p.id} style={{ ...S.card, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ fontSize:36 }}>{p.emoji}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:T.text }}>{p.name}</div>
                      <div style={{ fontSize:12, color:T.muted }}>${p.price} · {p.unit} · Stock: {p.stock}</div>
                      <div style={{ fontSize:11, color: p.is_active ? T.accent : T.danger }}>{p.is_active ? "● Active" : "● Inactive"}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setEditingProduct(p); setProductForm({ name:p.name, description:p.description||"", price:p.price, unit:p.unit, category:p.category, emoji:p.emoji||"", badge:p.badge||"", stock:p.stock, calories:p.calories||"", protein:p.protein||"", fat:p.fat||"", carbs:p.carbs||"" }); setShowProductForm(true); }} style={{ background:T.tag, border:"none", borderRadius:10, padding:"8px 12px", color:T.tagText, fontWeight:800, cursor:"pointer", fontSize:13 }}>✏️</button>
                      <button onClick={async () => { if(window.confirm("Deactivate this product?")) { await api.delete(`/products/${p.id}`); await loadAdminProducts(); } }} style={{ background:"#ffebee", border:"none", borderRadius:10, padding:"8px 12px", color:"#c62828", fontWeight:800, cursor:"pointer", fontSize:13 }}>🗑</button>
                    </div>
                  </div>
                ))
              }
            </>
          )}
        </div>
      </>
    );
  }

  // ── HOME / CATALOG ─────────────────────────────────────────
  return wrap(
    <>
      <div style={{ background: T.hero, padding: "52px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Good morning 👋</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{user?.full_name?.split(" ")[0] || "Guest"}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setDark(d => !d)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 18, cursor: "pointer" }}>{dark ? "☀️" : "🌙"}</button>
            <button onClick={() => setScreen("notifications")} style={{ position: "relative", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 18, cursor: "pointer" }}>
              🔔
              {unreadNotifs > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: "#e53935", color: "#fff", borderRadius: 10, minWidth: 18, height: 18, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadNotifs}</div>}
            </button>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 18, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); loadProducts(); }} placeholder="Search dairy products..." style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, flex: 1 }} />
        </div>
      </div>
      <div style={{ ...S.scroll, paddingBottom: 90, background: T.screenBg }}>
        <div style={{ margin: "16px 20px", background: dark ? "linear-gradient(135deg,#1a3a1b,#2a4a2b)" : "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 24, padding: "20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.2 }}>🐄</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.accent, textTransform: "uppercase", letterSpacing: 1 }}>New User Offer</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text, marginTop: 4 }}>20% off your first order</div>
          <div style={{ fontSize: 13, color: T.subtext, marginTop: 4 }}>Use code <strong>NEWUSER20</strong> at checkout</div>
        </div>
        {loyalty && (
          <div style={{ margin: "0 20px 16px", background: dark ? "#1a2e1b" : "#fff8e1", borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: dark ? "#fbbf24" : "#92400e" }}>{loyalty.tier.charAt(0).toUpperCase() + loyalty.tier.slice(1)} Member · {loyalty.points} points</div>
              {loyalty.next_tier_name && <div style={{ fontSize: 11, color: T.muted }}>{loyalty.next_tier_points} pts to {loyalty.next_tier_name}!</div>}
            </div>
          </div>
        )}
        <div style={{ padding: "0 20px", marginBottom: 10 }}>
          <div style={{ overflowX: "auto", display: "flex", gap: 8, paddingBottom: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); }} style={{ padding: "8px 18px", background: category === cat ? T.hero : T.card, color: category === cat ? "#fff" : T.subtext, border: `2px solid ${category === cat ? "transparent" : T.cardBorder}`, borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{cat}</button>
            ))}
          </div>
        </div>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>Loading products...</div>
        ) : (
          <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {products.map(product => (
              <div key={product.id} style={{ ...S.card, borderRadius: 22, overflow: "hidden" }}>
                <div onClick={async () => { setSelectedProduct(product); const { data } = await reviewsAPI.forProduct(product.id); setProductReviews(data); setScreen("product"); }} style={{ background: dark ? T.tag : "#f1f8e9", padding: "20px 16px 16px", position: "relative", cursor: "pointer" }}>
                  {product.badge && <div style={{ position: "absolute", top: 10, left: 10, background: product.badge === "bestseller" ? "#ff6f00" : product.badge === "popular" ? "#6a1b9a" : "#00838f", color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{product.badge}</div>}
                  <div style={{ fontSize: 48, textAlign: "center", marginTop: 10 }}>{product.emoji}</div>
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 2 }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{product.unit}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#f59e0b" }}>★</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>{product.avg_rating} ({product.review_count})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.accent }}>${product.price}</div>
                    {getQty(product.id) > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.tag, borderRadius: 12, padding: "5px 10px" }}>
                        <button onClick={() => updateCart(product.id, getQty(product.id) - 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>−</button>
                        <span style={{ fontWeight: 900, fontSize: 14, color: T.text }}>{getQty(product.id)}</span>
                        <button onClick={() => updateCart(product.id, getQty(product.id) + 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => updateCart(product.id, 1)} style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 12, width: 32, height: 32, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} />
    </>
  );
}

function BottomNav({ screen, setScreen, cartCount, T }) {
  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "tracking", icon: "📦", label: "Orders" },
    { id: "cart", icon: "🛒", label: "Cart", badge: cartCount },
    { id: "chat", icon: "💬", label: "Support" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: T.navBg, borderTop: `1px solid ${T.navBorder}`, display: "flex", padding: "10px 0 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setScreen(tab.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
          <div style={{ fontSize: 20 }}>{tab.icon}</div>
          {tab.badge > 0 && <div style={{ position: "absolute", top: -4, right: "50%", marginRight: -22, background: "#e53935", color: "#fff", borderRadius: 10, minWidth: 17, height: 17, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{tab.badge}</div>}
          <div style={{ fontSize: 10, fontWeight: screen === tab.id ? 900 : 600, color: screen === tab.id ? T.accent : T.muted }}>{tab.label}</div>
          {screen === tab.id && <div style={{ width: 4, height: 4, background: T.accent, borderRadius: "50%" }} />}
        </button>
      ))}
    </div>
  );
}