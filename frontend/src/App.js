import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  authAPI, productsAPI, cartAPI, ordersAPI,
  reviewsAPI, addressesAPI, notifsAPI, loyaltyAPI, referralsAPI, usersAPI,
  supportAPI, adminAPI, wishlistAPI
} from "./api";
import api from "./api";


// ── Responsive CSS injected at runtime ───────────────────────
const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  #root { height: 100%; }

  /* Scrollbar styling */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }

  /* App shell */
  .dd-shell {
    font-family: 'Nunito', 'Segoe UI', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Mobile: full screen, no phone frame */
  .dd-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    min-height: 100vh;
  }

  /* Mobile: allow sticky bottom nav to work and content to scroll */
  @media (max-width: 767px) {
    .dd-frame {
      overflow: visible;
      min-height: 100dvh;
    }
    .dd-shell {
      min-height: 100dvh;
    }
  }


  /* Desktop sidebar nav */
  .dd-sidebar {
    display: none;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 220px;
    flex-direction: column;
    padding: 0;
    z-index: 100;
    box-shadow: 2px 0 20px rgba(0,0,0,0.08);
  }

  /* Desktop main content area */
  .dd-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100vh;
  }

  /* Desktop content gets a max-width and center */
  .dd-content-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Bottom nav: only on mobile */
  .dd-bottomnav {
    position: fixed;
    bottom: 0;
    left: 0; right: 0;
    z-index: 50;
  }

  /* Ensure scroll content clears fixed bottom nav on mobile */
  @media (max-width: 767px) {
    .dd-scroll-pad-bottom {
      padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
    }
  }

  /* Product grid: 2 cols mobile, 3-4 cols desktop */
  .dd-product-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    padding: 0 20px;
  }

  /* Header top padding: status bar height on mobile, smaller on desktop */
  .dd-header-pad { padding-top: 44px; }
  @media (min-width: 768px) {
    .dd-header-pad { padding-top: 28px !important; }
  }

  @media (min-width: 768px) {
    .dd-shell {
      flex-direction: row;
    }
    .dd-sidebar {
      display: flex;
    }
    .dd-frame {
      margin-left: 220px;
      min-height: 100vh;
      max-width: none;
    }
    .dd-bottomnav {
      display: none !important;
    }
    .dd-product-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      padding: 0 28px;
    }
    .dd-header-pad {
      padding-top: 28px;
    }
    .dd-content-area {
      max-width: 100%;
    }
  }

  @media (min-width: 1200px) {
    .dd-sidebar { width: 240px; }
    .dd-frame { margin-left: 240px; }
    .dd-product-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 0 32px;
    }
  }

  /* Auth / login pages — centered card on desktop */
  .dd-auth-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  @media (min-width: 768px) {
    .dd-auth-wrap {
      justify-content: center;
      align-items: center;
      padding: 40px 20px;
    }
    .dd-auth-card {
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      padding: 40px 36px !important;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    }
  }

  /* Two-column layout for detail screens on desktop */
  @media (min-width: 900px) {
    .dd-detail-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 0;
      flex: 1;
      overflow: hidden;
    }
    .dd-detail-main { overflow-y: auto; padding: 28px 32px; }
    .dd-detail-sidebar { overflow-y: auto; padding: 28px 24px; border-left: 1px solid var(--dd-border); }
  }

  /* Stats grid on admin */
  @media (min-width: 768px) {
    .dd-stats-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
    .dd-admin-content { max-width: 900px; margin: 0 auto; }
  }

  /* Two-col forms on desktop */
  @media (min-width: 768px) {
    .dd-form-wrap {
      max-width: 560px;
      margin: 0 auto;
    }
  }

  /* Smooth transitions */
  .dd-frame { transition: background 0.2s; }
  button { transition: opacity 0.15s, transform 0.1s; }
  button:active { transform: scale(0.97); }

  /* Desktop content centering for most screens */
  @media (min-width: 768px) {
    .dd-page-content {
      max-width: 860px;
      margin: 0 auto;
      width: 100%;
    }
    /* Override scroll padding on desktop */
    .dd-frame .dd-scroll-content {
      padding-bottom: 40px !important;
    }
  }

  /* Fix scroll containers to fill height */
  .dd-frame {
    display: flex;
    flex-direction: column;
  }

  /* Safe area insets for mobile notches */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .dd-bottomnav {
      padding-bottom: calc(8px + env(safe-area-inset-bottom)) !important;
    }
    .dd-header-pad {
      padding-top: env(safe-area-inset-top, 0px) !important;
    }
  }
  @media (min-width: 768px) {
    .dd-header-pad { padding-top: 28px !important; }
  }

  /* Scrollbar hidden on mobile for cleaner look */
  @media (max-width: 767px) {
    ::-webkit-scrollbar { width: 0; height: 0; }
  }

  /* Input focus rings */
  input:focus, textarea:focus, select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(67,160,71,0.2);
  }

  /* Card hover on desktop */
  @media (min-width: 768px) {
    .dd-product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
      transition: transform 0.2s, box-shadow 0.2s;
    }
  }
`;

// CSS injected via useEffect in DairyApp component

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

const LabeledInput = ({ label, value, onChange, type, placeholder, extra, inputStyle, inputFocus, inputBlur, onKeyDown }) => (
  <div style={{ marginBottom: 18 }}>
    <div className="dd-field-label">{label}</div>
    <input
      value={value} onChange={onChange} type={type} placeholder={placeholder}
      onFocus={inputFocus} onBlur={inputBlur} onKeyDown={onKeyDown}
      style={{ ...inputStyle, ...(extra || {}) }}
    />
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, hasError, showPassword, setShowPassword, dark, inputStyle, inputFocus, inputBlur, onKeyDown }) => (
  <div style={{ marginBottom: 18 }}>
    <div className="dd-field-label">{label}</div>
    <div style={{ position: "relative" }}>
      <input
        value={value} onChange={onChange}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        onFocus={inputFocus} onBlur={inputBlur} onKeyDown={onKeyDown}
        style={{ ...inputStyle, paddingRight: 52, borderColor: hasError ? "#ef5350" : undefined }}
      />
      <button onClick={() => setShowPassword(s => !s)} style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer", fontSize: 18,
        color: dark ? "#4a6e4b" : "#a5c9a5", padding: 0, lineHeight: 1,
      }}>{showPassword ? "🙈" : "👁️"}</button>
    </div>
  </div>
);

export default function DairyApp() {
  const [screen, setScreen]           = useState("onboarding");
  const [dark, setDark]               = useState(false);
  const [user, setUser]               = useState(null);
  const [products, setProducts]       = useState([]);
  const [cart, setCart]               = useState([]);
  const [wishlist, setWishlist]       = useState([]);  // [{id, product_id, product, created_at}]
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
  const [toasts, setToasts]           = useState([]);  // [{id, msg, type}]
  const [onboardStep, setOnboardStep] = useState(0);
  const [promoCode, setPromoCode]     = useState("");
  const [redeemPoints, setRedeemPoints] = useState(0);  // points to redeem at checkout
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError]   = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [activeOrderTab, setActiveOrderTab] = useState("current");
  const [subScreen, setSubScreen]     = useState(null);
  const [showInvoice, setShowInvoice] = useState(null);
  const [reviewText, setReviewText]   = useState("");
  const [canReview, setCanReview]     = useState(null); // null=loading, true/false/{reason}
  const [reviewRating, setReviewRating] = useState(5);
  const [chatMessages, setChatMessages] = useState([{ from: "bot", text: "Hi! 👋 I'm Daisy. How can I help you today?", time: "Now" }]);
  const [chatInput, setChatInput]     = useState("");
  const [chatTyping, setChatTyping]   = useState(false);
  const chatBottomRef = useRef(null);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatTyping]);
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
  const [cpCurrent, setCpCurrent]         = useState("");
  const [cpNew, setCpNew]                 = useState("");
  const [cpConfirm, setCpConfirm]         = useState("");
  const [cpSaving, setCpSaving]           = useState(false);
  const [cpError, setCpError]             = useState("");
  const [cpSuccess, setCpSuccess]         = useState(false);
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew]         = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);

  // ── Stripe state ──────────────────────────────────────────
  const [showPayment, setShowPayment]         = useState(false);
  const [paymentLoading, setPaymentLoading]   = useState(false);
  const [paymentError, setPaymentError]       = useState("");
  const [addressHighlight, setAddressHighlight] = useState(false);
  const [cardNumber, setCardNumber]           = useState("");
  const [cardExpiry, setCardExpiry]           = useState("");
  const [cardCvc, setCardCvc]                 = useState("");
  const [cardName, setCardName]               = useState("");

  // ── Admin state ───────────────────────────────────────────
  const [adminTab, setAdminTab]               = useState("orders");
  const [adminOrders, setAdminOrders]         = useState([]);
  const [adminProducts, setAdminProducts]     = useState([]);
  const [adminLoading, setAdminLoading]       = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct]   = useState(null);
  const [productForm, setProductForm]         = useState({ name:"", description:"", price:"", unit:"", category:"Milk", emoji:"🥛", badge:"", stock:100, calories:"", protein:"", fat:"", carbs:"" });

  // ── Support state ─────────────────────────────────────────
  const [supportTickets, setSupportTickets]       = useState([]);
  const [supportSubject, setSupportSubject]       = useState("");
  const [supportMessage, setSupportMessage]       = useState("");
  const [supportOrderId, setSupportOrderId]       = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess]       = useState(false);
  const [supportError, setSupportError]           = useState("");
  const [supportView, setSupportView]             = useState("chat"); // "chat" | "ticket" | "faq" | "tickets"

  // ── Admin extra state ─────────────────────────────────────
  const [adminStats, setAdminStats]         = useState(null);
  const [adminUsers, setAdminUsers]         = useState([]);
  const [adminPromos, setAdminPromos]       = useState([]);
  const [adminTickets, setAdminTickets]     = useState([]);
  const [adminPromoForm, setAdminPromoForm] = useState({ code:"", discount_percent:"", max_uses:"", min_order_value:"0", expires_at:"" });
  const [showPromoForm, setShowPromoForm]   = useState(false);

  const loadAdminOrders = useCallback(async () => {
    try { const { data } = await api.get("/orders/admin/all"); setAdminOrders(data); } catch {}
  }, []);

  const loadAdminProducts = useCallback(async () => {
    try { const { data } = await api.get("/products/admin/all"); setAdminProducts(data); } catch {}
  }, []);

  const loadAdminStats = useCallback(async () => {
    try { const { data } = await adminAPI.stats(); setAdminStats(data); } catch {}
  }, []);

  const loadAdminUsers = useCallback(async () => {
    try { const { data } = await adminAPI.users(); setAdminUsers(data); } catch {}
  }, []);

  const loadAdminPromos = useCallback(async () => {
    try { const { data } = await adminAPI.promos(); setAdminPromos(data); } catch {}
  }, []);

  const loadAdminTickets = useCallback(async () => {
    try { const { data } = await adminAPI.allTickets(); setAdminTickets(data); } catch {}
  }, []);

  const loadSupportTickets = useCallback(async () => {
    try { const { data } = await supportAPI.list(); setSupportTickets(data); } catch {}
  }, []);

  const T = dark ? DARK : LIGHT;

  // Shared styles
  // ── Inject CSS + fonts once, update theme vars on change
  React.useEffect(() => {
    // Inject responsive CSS once
    if (!document.getElementById('dd-responsive-css')) {
      const style = document.createElement('style');
      style.id = 'dd-responsive-css';
      style.textContent = RESPONSIVE_CSS;
      document.head.appendChild(style);
    }
    // Inject Nunito font once
    if (!document.getElementById('dd-fonts')) {
      const link = document.createElement('link');
      link.id = 'dd-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // ── Update theme CSS variables on dark/light toggle
  React.useEffect(() => {
    document.documentElement.style.setProperty('--dd-bg', T.bg);
    document.documentElement.style.setProperty('--dd-card', T.card);
    document.documentElement.style.setProperty('--dd-border', T.cardBorder);
    document.documentElement.style.setProperty('--dd-text', T.text);
    document.body.style.background = T.bg;
    document.body.style.color = T.text;
  }, [T]);

  const S = {
    btn:     { background: T.hero, color: "#fff", border: "none", borderRadius: 18, fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%", padding: "17px" },
    card:    { background: T.card, borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    input:   { width: "100%", padding: "14px 16px", border: `2px solid ${T.inputBorder}`, borderRadius: 14, fontSize: 15, background: T.input, outline: "none", color: T.text, boxSizing: "border-box" },
    backBtn: { background: T.card, border: "none", borderRadius: 12, padding: "8px 12px", fontSize: 18, cursor: "pointer", color: T.text },
    scroll:  { flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" },
    // No more fixed phone frame — full responsive layout
    frame:   { display: "flex", flexDirection: "column", flex: 1, background: T.phoneBg, position: "relative", minHeight: "100vh" },
  };

  // ── Global toast helper ─────────────────────────────────────
  const showToast = React.useCallback((msg, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  // wrap: responsive shell — sidebar on desktop, full-screen on mobile
  const wrap = (children) => (
    <div className="dd-shell" style={{ background: T.bg, fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {user && (
        <nav className="dd-sidebar" style={{ background: T.navBg, borderRight: `1px solid ${T.navBorder}` }}>
          <div style={{ padding: "28px 20px 20px", borderBottom: `1px solid ${T.navBorder}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.accent }}>🐄 DairyDrop</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{user?.full_name}</div>
          </div>
          <div style={{ flex: 1, padding: "16px 12px" }}>
            {[
              { id: "home", icon: "🏠", label: "Home" },
              { id: "wishlist", icon: "❤️", label: "Wishlist", badge: wishlist.length || 0 },
              { id: "tracking", icon: "📦", label: "Orders" },
              { id: "cart", icon: "🛒", label: "Cart", badge: cartCount },
              { id: "chat", icon: "💬", label: "Support" },
              { id: "profile", icon: "👤", label: "Profile" },
              ...(user?.is_admin ? [{ id: "admin", icon: "🛠", label: "Admin" }] : []),
            ].map(tab => (
              <button key={tab.id} onClick={() => setScreen(tab.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", marginBottom: 4, borderRadius: 14, border: "none",
                background: screen === tab.id ? T.tag : "transparent",
                color: screen === tab.id ? T.accent : T.subtext,
                fontWeight: screen === tab.id ? 800 : 600, fontSize: 14, cursor: "pointer", position: "relative",
                textAlign: "left",
              }}>
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && <span style={{ marginLeft: "auto", background: "#e53935", color: "#fff", borderRadius: 10, minWidth: 18, height: 18, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{tab.badge}</span>}
              </button>
            ))}
          </div>

          {/* ── Bottom actions ── */}
          <div style={{ padding: "14px 12px 20px", borderTop: `1px solid ${T.navBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Dark mode toggle row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 14, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 16 }}>{dark ? "☀️" : "🌙"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.subtext }}>{dark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              {/* Toggle switch */}
              <div onClick={() => setDark(d => !d)} style={{ width: 40, height: 22, borderRadius: 99, background: dark ? T.accent : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: dark ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)" }} />
              </div>
            </div>
            {/* Sign out */}
            <button onClick={() => { localStorage.clear(); setUser(null); setCart([]); setScreen("login"); }} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 14px", borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              cursor: "pointer",
              color: "#fff", fontWeight: 700, fontSize: 13,
              letterSpacing: "0.3px",
              boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
              transition: "opacity 0.15s, transform 0.12s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(239,68,68,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(239,68,68,0.35)"; }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </nav>
      )}
      <div className="dd-frame" style={{ background: T.phoneBg }}>
        {children}
        {/* ── Global toast stack ── */}
        <div style={{ position: "fixed", bottom: "calc(72px + env(safe-area-inset-bottom,0px))", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none", width: "100%", padding: "0 16px" }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: t.type === "error" ? "linear-gradient(135deg,#ef4444,#dc2626)" : t.type === "success" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#3b82f6,#2563eb)",
              color: "#fff", borderRadius: 14, padding: "11px 18px", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: 340, textAlign: "center",
              animation: "toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              lineHeight: 1.4,
            }}>
              {t.type === "error" ? "⚠️ " : t.type === "success" ? "✅ " : "ℹ️ "}{t.msg}
            </div>
          ))}
        </div>
        <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      </div>
    </div>
  );


  // ── Data loaders ──────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    try {
      const { data } = await productsAPI.list({ category: category !== "All" ? category : undefined, search: search || undefined });
      setProducts(data);
    } catch {}
  }, [category, search]);

  const loadWishlist = useCallback(async () => {
    try { const { data } = await api.get("/wishlist"); setWishlist(data); } catch {}
  }, []);

  const loadCart = useCallback(async () => {
    try { const { data } = await cartAPI.get(); setCart(data); } catch (e) { if (e.response?.status !== 401) showToast("Couldn't load cart"); }
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
        setScreen("home");
      }).catch(() => {
        localStorage.clear();
        setScreen("login");
      });
    }
  }, []);
  // ── Listen for forced logout from api.js (expired refresh token) ──
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setCart([]);
      setScreen("login");
    };
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  useEffect(() => { if (screen === "home") loadProducts(); }, [screen, loadProducts]);
  useEffect(() => {
    if (screen === "product" && selectedProduct && user) {
      setCanReview(null);
      reviewsAPI.canReview(selectedProduct.id)
        .then(r => setCanReview(r.data))
        .catch(() => setCanReview({ can_review: false, reason: "error" }));
    }
  }, [screen, selectedProduct, user]);
  useEffect(() => { if (user) { loadCart(); loadNotifications(); loadLoyalty(); loadAddresses(); loadWishlist(); } }, [user, loadCart, loadNotifications, loadLoyalty, loadAddresses, loadWishlist]);
  useEffect(() => { if (screen === "tracking") loadOrders(); }, [screen, loadOrders]);
  // Auto-refresh active orders every 30s while on tracking screen
  useEffect(() => {
    if (screen !== "tracking") return;
    const hasActive = orders.some(o => o.status !== "delivered" && o.status !== "cancelled");
    if (!hasActive) return;
    const poll = setInterval(() => loadOrders(), 30000);
    return () => clearInterval(poll);
  }, [screen, orders, loadOrders]);
  useEffect(() => { if (screen === "wishlist") loadWishlist(); }, [screen, loadWishlist]);
  useEffect(() => { if (subScreen === "referral") loadReferral(); }, [subScreen, loadReferral]);

  const cartCount    = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discount     = appliedPromo ? cartSubtotal * appliedPromo.discount_percent / 100 : 0;
  const pointsDiscount = Math.floor(redeemPoints / 500) * 50;  // 500 pts = ₹50
  const cartTotal    = Math.max(0, cartSubtotal - discount - pointsDiscount + 29.00 + cartSubtotal * 0.05);
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const updateCart = async (productId, quantity) => {
    try { await cartAPI.update(productId, quantity); await loadCart(); } catch { showToast("Couldn't update cart — please try again"); }
  };

  const getQty = (id) => cart.find(i => i.product_id === id)?.quantity || 0;
  const isWishlisted = (id) => wishlist.some(w => w.product_id === id);
  const toggleWishlist = async (productId, e) => {
    e?.stopPropagation();
    try {
      const { data } = await wishlistAPI.toggle(productId);
      setWishlist(data);
    } catch { showToast("Couldn't update wishlist"); }
  };

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
    setError("");
    if (!loginEmail.trim()) { setError("Please enter your email address"); return; }
    if (!loginPassword) { setError("Please enter your password"); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(loginEmail.trim())) { setError("Please enter a valid email address"); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.login(loginEmail.trim(), loginPassword);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await authAPI.me();
      setUser(me.data);
      setScreen("home");
    } catch (e) {
      setError(e.response?.data?.detail || "Invalid email or password");
    } finally { setLoading(false); }
  };

  const doRegister = async () => {
    setError("");
    if (!regName.trim()) { setError("Please enter your full name"); return; }
    if (!regEmail.trim()) { setError("Please enter your email address"); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(regEmail.trim())) { setError("Please enter a valid email address"); return; }
    if (!regPassword) { setError("Please enter a password"); return; }
    if (regPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (regPassword !== regConfirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.register({ email: regEmail.trim(), full_name: regName.trim(), password: regPassword });
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
    setError("");
    if (!adminName.trim()) { setError("Please enter your full name"); return; }
    if (!adminEmail.trim()) { setError("Please enter your email address"); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(adminEmail.trim())) { setError("Please enter a valid email address"); return; }
    if (!adminPassword) { setError("Please enter a password"); return; }
    if (adminPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (adminPassword !== adminConfirmPassword) { setError("Passwords do not match"); return; }
    if (!adminCode.trim()) { setError("Please enter the admin registration code"); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.register({ email: adminEmail.trim(), full_name: adminName.trim(), password: adminPassword, role: "admin", admin_code: adminCode.trim() });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await authAPI.me();
      setUser(me.data);
      setScreen("home");
    } catch (e) {
      setError(e.response?.data?.detail || "Admin registration failed");
    } finally { setLoading(false); }
  };


  if (screen === "onboarding") {
    // ── Onboarding CSS — re-inject on every dark toggle ──────
    {
      let s = document.getElementById('dd-ob-css');
      if (!s) { s = document.createElement('style'); s.id = 'dd-ob-css'; document.head.appendChild(s); }
      s.textContent = '';
      s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .dd-ob-root {
          position: fixed; inset: 0; z-index: 9999;
          font-family: 'DM Sans', sans-serif;
          display: flex; overflow: hidden;
          width: 100vw; height: 100vh;
        }
        /* Mobile: full screen */
        .dd-ob-left { display: none !important; }
        .dd-ob-right {
          flex: 1; width: 100%; display: flex; flex-direction: column;
          justify-content: space-between; overflow-y: auto;
        }
        .dd-ob-mobile-top {
          padding: 8px 28px 24px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          flex: 1; text-align: center; min-height: 0;
        }
        /* Desktop: split layout */
        @media (min-width: 768px) {
          .dd-ob-left {
            display: flex !important; flex: 1; position: relative; overflow: hidden;
            background: linear-gradient(145deg, #1a4a1e 0%, #2e7d32 45%, #43a047 80%, #66bb6a 100%);
            flex-direction: column; align-items: center; justify-content: center;
            padding: 60px 48px;
          }
          .dd-ob-right {
            width: 420px; flex: none; flex-shrink: 0; display: flex; flex-direction: column;
            justify-content: space-between; overflow-y: auto;
          }
          .dd-ob-mobile-top {
            padding: 8px 36px 24px;
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center; text-align: center;
          }
          .dd-ob-mobile-header { display: none !important; }
        }
        @media (min-width: 1024px) {
          .dd-ob-right { width: 460px; }
        }
        /* Blobs */
        .dd-ob-blob {
          position: absolute; border-radius: 50%; opacity: 0.1; background: #fff;
          animation: ob-float 8s ease-in-out infinite;
        }
        .dd-ob-blob:nth-child(1) { width: 350px; height: 350px; top: -100px; right: -80px; }
        .dd-ob-blob:nth-child(2) { width: 220px; height: 220px; bottom: -70px; left: -60px; animation-delay: 3s; }
        .dd-ob-blob:nth-child(3) { width: 140px; height: 140px; top: 55%; left: 25%; animation-delay: 5s; }
        @keyframes ob-float {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        /* Slide emoji animation */
        @keyframes ob-popin {
          0% { transform: scale(0.6) translateY(20px); opacity: 0; }
          70% { transform: scale(1.08) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .dd-ob-emoji-anim { animation: ob-popin 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes ob-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dd-ob-text-anim { animation: ob-fadein 0.4s 0.15s ease both; }
        /* Progress dots */
        .dd-ob-dot {
          height: 8px; border-radius: 4px; transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
          background: #2e7d32;
        }
        /* Continue button */
        .dd-ob-btn {
          width: 100%; padding: 18px; border: none; border-radius: 18px; font-size: 17px;
          font-family: 'DM Sans', sans-serif; font-weight: 700; cursor: pointer; letter-spacing: 0.3px;
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: #fff; box-shadow: 0 8px 24px rgba(46,125,50,0.4);
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .dd-ob-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(46,125,50,0.5); }
        .dd-ob-btn:active { transform: translateY(0); }
        /* Feature pill on left */
        .dd-ob-pill {
          display: flex; align-items: center; gap: 14px; padding: 16px 20px;
          background: rgba(255,255,255,0.1); border-radius: 18px; margin-bottom: 14px;
          backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.18);
          transition: transform 0.2s;
        }
        .dd-ob-pill:hover { transform: translateX(4px); }
        /* Step counter */
        @keyframes dd-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        .dd-ob-step {
          font-size: 13px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; opacity: 0.55;
        }
      `;
    }

    const slides = [
      {
        emoji: "🐄",
        tag: "Welcome",
        title: "Farm-fresh dairy,delivered to you",
        sub: "Order premium milk, cheese, butter & more sourced directly from trusted local farms.",
        accent: "#43a047",
        bg: dark ? "linear-gradient(160deg,#0a1f0b,#0d2e10,#111f12)" : "linear-gradient(160deg,#f0faf0,#e8f5e9,#f5fbf0)",
        features: ["🥛 100% organic & pure", "🚚 30-min delivery", "⭐ Earn reward points"],
      },
      {
        emoji: "🧀",
        tag: "Products",
        title: "Hundreds of dairy products",
        sub: "Explore artisan cheeses, yogurts, creams and more — with full nutrition info on every item.",
        accent: "#f59e0b",
        bg: dark ? "linear-gradient(160deg,#1a1000,#2a1a00,#1f1500)" : "linear-gradient(160deg,#fffdf0,#fff8e1,#fefce8)",
        features: ["🧀 Artisan cheeses", "🍦 Creamy yogurts", "🥚 Farm eggs & butter"],
      },
      {
        emoji: "🚚",
        tag: "Delivery",
        title: "Fast & reliable delivery",
        sub: "Get your order in 30 minutes or less. Track it live and earn loyalty points on every order!",
        accent: "#2196f3",
        bg: dark ? "linear-gradient(160deg,#001020,#001830,#001525)" : "linear-gradient(160deg,#f0f7ff,#e3f2fd,#f0f9ff)",
        features: ["⚡ 30-min delivery", "📍 Live order tracking", "🎁 Loyalty rewards"],
      },
    ];
    const sl = slides[onboardStep];
    const isLast = onboardStep === 2;

    return (
      <div className="dd-ob-root" style={{ background: sl.bg }}>
        {/* ── LEFT PANEL (desktop only) ── */}
        <div className="dd-ob-left">
          <div className="dd-ob-blob" /><div className="dd-ob-blob" /><div className="dd-ob-blob" />
          {/* Brand */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>DairyDrop</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginTop: 6, fontWeight: 500 }}>Fresh from the farm, fast to your door</div>
          </div>
          {/* Feature pills */}
          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360 }}>
            {[
              ["🐄", "Local farms", "100% organic, ethically sourced"],
              ["🚚", "Express delivery", "30 minutes to your door"],
              ["⭐", "Loyalty rewards", "Earn points on every order"],
              ["🔒", "Secure & trusted", "10,000+ happy customers"],
            ].map(([icon, title, sub]) => (
              <div key={title} className="dd-ob-pill">
                <div style={{ fontSize: 28, width: 44, textAlign: "center", flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="dd-ob-right" style={{ background: sl.bg }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "env(safe-area-inset-top, 20px) 24px 0", paddingTop: "max(20px, env(safe-area-inset-top, 20px))" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: dark ? "#c8e6c9" : "#1b5e20" }}>DairyDrop</div>
            <button onClick={() => setDark(d => !d)} style={{
              background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: "none",
              borderRadius: 12, padding: "8px 10px", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1b5e20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Main content */}
          <div className="dd-ob-mobile-top">
            {/* Step tag */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
              background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
              borderRadius: 20, padding: "6px 14px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: sl.accent }} />
              <span className="dd-ob-step" style={{ color: dark ? "#aaa" : "#666", fontSize: 11 }}>
                Step {onboardStep + 1} of 3 — {sl.tag}
              </span>
            </div>

            {/* Emoji */}
            <div key={`emoji-${onboardStep}`} className="dd-ob-emoji-anim" style={{ fontSize: "clamp(64px, 15vw, 96px)", marginBottom: 20, lineHeight: 1 }}>
              {sl.emoji}
            </div>

            {/* Title + sub */}
            <div key={`text-${onboardStep}`} className="dd-ob-text-anim">
              <div style={{
                fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 900,
                color: dark ? "#e8f5e9" : "#1b5e20", lineHeight: 1.2,
                whiteSpace: "pre-line", marginBottom: 12,
              }}>{sl.title}</div>
              <div style={{ fontSize: "clamp(13px, 3.5vw, 15px)", color: dark ? "#81c784" : "#4a7a4b", lineHeight: 1.65, maxWidth: 340, margin: "0 auto" }}>
                {sl.sub}
              </div>
            </div>

            {/* Mini feature pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
              {sl.features.map(f => (
                <div key={f} style={{
                  fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20,
                  background: dark ? "rgba(255,255,255,0.07)" : "rgba(46,125,50,0.08)",
                  color: dark ? "#a5d6a7" : "#2e7d32", border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(46,125,50,0.15)"}`,
                }}>{f}</div>
              ))}
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ padding: "0 24px", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 18 }}>
              {slides.map((_, i) => (
                <div key={i} className="dd-ob-dot" onClick={() => setOnboardStep(i)} style={{
                  width: i === onboardStep ? 28 : 8,
                  opacity: i === onboardStep ? 1 : 0.3,
                  cursor: "pointer",
                  background: sl.accent,
                }} />
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => isLast ? setScreen("login") : setOnboardStep(s => s + 1)}
              className="dd-ob-btn"
              style={{
                background: `linear-gradient(135deg, ${sl.accent}dd, ${sl.accent})`,
                boxShadow: `0 8px 24px ${sl.accent}55`,
                marginBottom: 14,
              }}
            >
              {isLast ? "🚀 Get Started" : "Continue"}
              {!isLast && <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>}
            </button>

            {/* Skip link — centered below button */}
            <div
              onClick={() => setScreen("login")}
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                cursor: "pointer",
                padding: "8px 0",
                letterSpacing: 0.2,
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)"}
              onMouseLeave={e => e.currentTarget.style.color = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"}
            >
              Skip for now
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── LOGIN / REGISTER / ADMIN ───────────────────────────────
  if (screen === "login") {
    // ── Login CSS — re-inject on every dark toggle ───────────
    {
      let s = document.getElementById('dd-login-css');
      if (!s) { s = document.createElement('style'); s.id = 'dd-login-css'; document.head.appendChild(s); }
      s.textContent = '';
      s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .dd-login-root {
          min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif;
          background: ${dark ? '#0a1a0b' : '#f0f7f0'};
        }
        /* Desktop split layout */
        @media (min-width: 768px) {
          .dd-login-left {
            flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
            background: linear-gradient(145deg, #1a4a1e 0%, #2e7d32 40%, #43a047 80%, #66bb6a 100%);
            padding: 60px 48px; position: relative; overflow: hidden;
          }
          .dd-login-right {
            width: 480px; flex-shrink: 0; display: flex; flex-direction: column;
            justify-content: center; padding: 48px 52px;
            background: ${dark ? '#0d1f0e' : '#ffffff'};
            overflow-y: auto; max-height: 100vh;
          }
        }
        /* Mobile: single column */
        @media (max-width: 767px) {
          .dd-login-left { display: none !important; }
          .dd-login-right {
            flex: 1; padding: 0 24px 40px; display: flex; flex-direction: column;
            background: ${dark ? '#0d1f0e' : '#ffffff'};
            overflow-y: auto;
          }
          .dd-login-mobile-header {
            background: linear-gradient(145deg, #1a4a1e, #2e7d32, #43a047);
            padding: 48px 32px 40px; text-align: center; margin: 0 -24px 32px;
            border-radius: 0 0 40px 40px;
          }
        }
        @media (min-width: 768px) {
          .dd-login-mobile-header { display: none !important; }
        }
        /* Floating blobs on left panel */
        .dd-blob {
          position: absolute; border-radius: 50%; opacity: 0.12;
          background: #fff; animation: dd-float 8s ease-in-out infinite;
        }
        .dd-blob:nth-child(1) { width: 300px; height: 300px; top: -80px; right: -80px; animation-delay: 0s; }
        .dd-blob:nth-child(2) { width: 200px; height: 200px; bottom: -60px; left: -60px; animation-delay: 3s; }
        .dd-blob:nth-child(3) { width: 150px; height: 150px; top: 50%; left: 30%; animation-delay: 5s; }
        @keyframes dd-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        /* Floating dairy items */
        .dd-float-item {
          position: absolute; font-size: 48px; opacity: 0.18;
          animation: dd-float 6s ease-in-out infinite;
        }
        .dd-float-item:nth-child(4) { top: 20%; right: 15%; animation-delay: 1s; font-size: 56px; }
        .dd-float-item:nth-child(5) { bottom: 25%; left: 10%; animation-delay: 2.5s; font-size: 40px; }
        .dd-float-item:nth-child(6) { top: 60%; right: 8%; animation-delay: 4s; font-size: 36px; }
        /* Input styling */
        .dd-login-input {
          width: 100%; padding: 14px 18px; border-radius: 14px; font-size: 15px;
          font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s;
          background: ${dark ? '#1a2e1b' : '#f5faf5'};
          border: 2px solid ${dark ? '#2a3f2b' : '#d4e8d4'};
          color: ${dark ? '#c8e6c9' : '#1b5e20'};
          box-sizing: border-box;
        }
        .dd-login-input:focus {
          border-color: #43a047;
          background: ${dark ? '#1e361f' : '#edf7ed'};
          box-shadow: 0 0 0 4px rgba(67,160,71,0.15);
        }
        .dd-login-input::placeholder { color: ${dark ? '#4a6e4b' : '#a5c9a5'}; }
        /* Tab pill */
        .dd-tab-pill {
          display: flex; background: ${dark ? '#1a2e1b' : '#edf7ed'};
          border-radius: 16px; padding: 5px; gap: 4px; margin-bottom: 32px;
        }
        .dd-tab-pill button {
          flex: 1; padding: 11px 8px; border: none; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px;
          cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
        }
        .dd-tab-pill button.active {
          background: #2e7d32; color: #fff;
          box-shadow: 0 4px 12px rgba(46,125,50,0.35);
        }
        .dd-tab-pill button.inactive {
          background: transparent; color: ${dark ? '#7aad7b' : '#5a8a5a'};
        }
        /* CTA button */
        .dd-login-btn {
          width: 100%; padding: 16px; border: none; border-radius: 16px; font-size: 16px;
          font-family: 'DM Sans', sans-serif; font-weight: 700; cursor: pointer;
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: #fff; letter-spacing: 0.3px;
          box-shadow: 0 6px 20px rgba(46,125,50,0.4);
          transition: all 0.2s;
        }
        .dd-login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(46,125,50,0.5); }
        .dd-login-btn:active { transform: translateY(0); }
        .dd-login-btn:disabled { opacity: 0.65; transform: none; cursor: not-allowed; }
        .dd-login-btn.admin-btn {
          background: linear-gradient(135deg, #1565c0, #1976d2);
          box-shadow: 0 6px 20px rgba(21,101,192,0.4);
        }
        /* Field label */
        .dd-field-label {
          font-size: 12px; font-weight: 700; letter-spacing: 0.8px;
          text-transform: uppercase; margin-bottom: 8px;
          color: ${dark ? '#7aad7b' : '#5a8a5a'};
        }
        /* Feature pills on left */
        .dd-feature-pill {
          display: flex; align-items: center; gap: 12px; padding: 14px 18px;
          background: rgba(255,255,255,0.1); border-radius: 16px; margin-bottom: 12px;
          backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15);
        }
        /* Divider */
        .dd-divider {
          display: flex; align-items: center; gap: 12px; margin: 20px 0;
          color: ${dark ? '#4a6e4b' : '#a5c9a5'}; font-size: 13px;
        }
        .dd-divider::before, .dd-divider::after {
          content: ''; flex: 1; height: 1px;
          background: ${dark ? '#2a3f2b' : '#d4e8d4'};
        }
        /* Fade-in animation */
        @keyframes dd-fadein {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dd-login-right { animation: dd-fadein 0.4s ease; }
        /* Scrollbar */
        .dd-login-right::-webkit-scrollbar { width: 4px; }
        .dd-login-right::-webkit-scrollbar-thumb { background: #43a047; border-radius: 2px; }
      `;
    }

    const inputStyle = {
      width: "100%", padding: "14px 18px", borderRadius: 14, fontSize: 15,
      fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.2s",
      background: dark ? "#1a2e1b" : "#f5faf5",
      border: `2px solid ${dark ? "#2a3f2b" : "#d4e8d4"}`,
      color: dark ? "#c8e6c9" : "#1b5e20", boxSizing: "border-box",
    };
    const inputFocus = (e) => {
      e.target.style.borderColor = "#43a047";
      e.target.style.boxShadow = "0 0 0 4px rgba(67,160,71,0.15)";
      e.target.style.background = dark ? "#1e361f" : "#edf7ed";
    };
    const inputBlur = (e) => {
      e.target.style.borderColor = dark ? "#2a3f2b" : "#d4e8d4";
      e.target.style.boxShadow = "none";
      e.target.style.background = dark ? "#1a2e1b" : "#f5faf5";
    };


    return (
      <div className="dd-login-root">
        {/* ── LEFT PANEL (desktop only) ── */}
        <div className="dd-login-left">
          <div className="dd-blob" />
          <div className="dd-blob" />
          <div className="dd-blob" />
          <div className="dd-float-item">🥛</div>
          <div className="dd-float-item">🧀</div>
          <div className="dd-float-item">🧈</div>
          {/* Brand */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 80, marginBottom: 8, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))" }}>🐄</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 10 }}>DairyDrop</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", fontWeight: 500, letterSpacing: 0.5 }}>Farm-fresh dairy, delivered fresh</div>
          </div>
          {/* Features */}
          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360 }}>
            {[
              ["🚚", "30-min delivery", "Lightning-fast to your door"],
              ["⭐", "Loyalty rewards", "Earn points on every order"],
              ["🌿", "100% organic", "Trusted local farms only"],
            ].map(([icon, title, sub]) => (
              <div key={title} className="dd-feature-pill">
                <div style={{ fontSize: 28, width: 44, textAlign: "center", flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL (form) ── */}
        <div className="dd-login-right">
          {/* Mobile-only header */}
          <div className="dd-login-mobile-header">
            <div style={{ fontSize: 56, marginBottom: 8 }}>🐄</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#fff" }}>DairyDrop</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>Farm-fresh dairy, delivered to you</div>
          </div>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: dark ? "#c8e6c9" : "#1b5e20" }}>
                {authTab === "signin" ? "Welcome back" : authTab === "register" ? "Create account" : "Admin access"}
              </div>
              <div style={{ fontSize: 13, color: dark ? "#7aad7b" : "#5a8a5a", marginTop: 2, fontWeight: 500 }}>
                {authTab === "signin" ? "Sign in to your account" : authTab === "register" ? "Join DairyDrop today" : "Restricted — code required"}
              </div>
            </div>
            <button onClick={() => setDark(d => !d)} style={{
              background: dark ? "#1a2e1b" : "#edf7ed", border: `2px solid ${dark ? "#2a3f2b" : "#d4e8d4"}`,
              borderRadius: 12, padding: "8px 10px", cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1b5e20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Tab switcher */}
          <div className="dd-tab-pill">
            {[["signin", "Sign In"], ["register", "Register"], ["admin", "Admin"]].map(([key, label]) => (
              <button key={key} className={authTab === key ? "active" : "inactive"}
                onClick={() => { setAuthTab(key); setError(""); }}>
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚠️</span> {error}
            </div>
          )}

          {/* ── SIGN IN ── */}
          {authTab === "signin" && (
            <div>
              <LabeledInput label="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" placeholder="you@example.com" inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} onKeyDown={e => e.key === "Enter" && doLogin()} />
              <PasswordInput label="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Your password" showPassword={showPassword} setShowPassword={setShowPassword} dark={dark} inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} onKeyDown={e => e.key === "Enter" && doLogin()} />
              <div style={{ textAlign: "right", fontSize: 13, color: "#43a047", fontWeight: 700, marginBottom: 24, cursor: "pointer", marginTop: -8 }}>
                Forgot password?
              </div>
              <button onClick={doLogin} disabled={loading} className="dd-login-btn" style={{
                width: "100%", padding: "16px", border: "none", borderRadius: 16, fontSize: 16,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #2e7d32, #43a047)", color: "#fff",
                boxShadow: "0 6px 20px rgba(46,125,50,0.4)", opacity: loading ? 0.7 : 1, transition: "all 0.2s",
              }}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
              <div className="dd-divider">or</div>
              <div style={{ textAlign: "center", fontSize: 14, color: dark ? "#7aad7b" : "#5a8a5a" }}>
                No account?{" "}
                <span onClick={() => { setAuthTab("register"); setError(""); }} style={{ color: "#43a047", fontWeight: 700, cursor: "pointer" }}>
                  Create one free →
                </span>
              </div>
            </div>
          )}

          {/* ── REGISTER ── */}
          {authTab === "register" && (
            <div>
              <LabeledInput label="Full Name" value={regName} onChange={e => setRegName(e.target.value)} type="text" placeholder="Jane Smith" inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} />
              <LabeledInput label="Email address" value={regEmail} onChange={e => setRegEmail(e.target.value)} type="email" placeholder="you@example.com" inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} />
              <PasswordInput label="Password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Create a strong password" showPassword={showPassword} setShowPassword={setShowPassword} dark={dark} inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} />
              <PasswordInput
                label="Confirm Password"
                value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                hasError={regConfirmPassword && regPassword !== regConfirmPassword}
                showPassword={showPassword} setShowPassword={setShowPassword} dark={dark} inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur}
              />
              {regConfirmPassword && regPassword !== regConfirmPassword && (
                <div style={{ fontSize: 12, color: "#ef5350", marginTop: -12, marginBottom: 14, fontWeight: 700 }}>⚠ Passwords do not match</div>
              )}
              {/* Promo banner */}
              <div style={{ background: dark ? "#1a3a1b" : "#e8f5e9", border: "1.5px solid #43a047", borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>🎁</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#81c784" : "#2e7d32" }}>New member offer</div>
                  <div style={{ fontSize: 12, color: dark ? "#7aad7b" : "#5a8a5a" }}>Use code <strong>NEWUSER20</strong> for 20% off your first order!</div>
                </div>
              </div>
              <button onClick={doRegister} disabled={loading} style={{
                width: "100%", padding: "16px", border: "none", borderRadius: 16, fontSize: 16,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #2e7d32, #43a047)", color: "#fff",
                boxShadow: "0 6px 20px rgba(46,125,50,0.4)", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Creating account…" : "Create Account →"}
              </button>
              <div style={{ textAlign: "center", fontSize: 14, color: dark ? "#7aad7b" : "#5a8a5a", marginTop: 20 }}>
                Already a member?{" "}
                <span onClick={() => { setAuthTab("signin"); setError(""); }} style={{ color: "#43a047", fontWeight: 700, cursor: "pointer" }}>Sign In →</span>
              </div>
            </div>
          )}

          {/* ── ADMIN ── */}
          {authTab === "admin" && (
            <div>
              <div style={{ background: dark ? "#0d1a2e" : "#e3f2fd", border: "1.5px solid #1976d2", borderRadius: 14, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>🔐</span>
                <div style={{ fontSize: 13, color: dark ? "#90caf9" : "#1565c0", fontWeight: 500 }}>
                  Admin accounts require an authorisation code from your organisation.
                </div>
              </div>
              <LabeledInput label="Full Name" value={adminName} onChange={e => setAdminName(e.target.value)} type="text" placeholder="Admin name" inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} />
              <LabeledInput label="Email address" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} type="email" placeholder="admin@company.com" inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} />
              <PasswordInput label="Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Create a strong password" showPassword={showPassword} setShowPassword={setShowPassword} dark={dark} inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur} />
              <PasswordInput
                label="Confirm Password"
                value={adminConfirmPassword} onChange={e => setAdminConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                hasError={adminConfirmPassword && adminPassword !== adminConfirmPassword}
                showPassword={showPassword} setShowPassword={setShowPassword} dark={dark} inputStyle={inputStyle} inputFocus={inputFocus} inputBlur={inputBlur}
              />
              {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
                <div style={{ fontSize: 12, color: "#ef5350", marginTop: -12, marginBottom: 14, fontWeight: 700 }}>⚠ Passwords do not match</div>
              )}
              <div style={{ marginBottom: 20 }}>
                <div className="dd-field-label">Admin Code</div>
                <input value={adminCode} onChange={e => setAdminCode(e.target.value)} type="text" placeholder="Enter authorisation code"
                  onFocus={inputFocus} onBlur={inputBlur} style={inputStyle} />
              </div>
              <button onClick={doAdminRegister} disabled={loading} style={{
                width: "100%", padding: "16px", border: "none", borderRadius: 16, fontSize: 16,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #1565c0, #1976d2)", color: "#fff",
                boxShadow: "0 6px 20px rgba(21,101,192,0.4)", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Creating admin…" : "Create Admin Account →"}
              </button>
              <div style={{ textAlign: "center", fontSize: 14, color: dark ? "#7aad7b" : "#5a8a5a", marginTop: 20 }}>
                Already have an account?{" "}
                <span onClick={() => { setAuthTab("signin"); setError(""); }} style={{ color: "#43a047", fontWeight: 700, cursor: "pointer" }}>Sign In →</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${dark ? "#1a3a1b" : "#e0ece0"}`, display: "flex", justifyContent: "center", gap: 24 }}>
            {["🌿 Organic", "🔒 Secure", "🚚 Fast"].map(item => (
              <div key={item} style={{ fontSize: 12, color: dark ? "#4a6e4b" : "#a5c9a5", fontWeight: 600 }}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PRODUCT DETAIL ─────────────────────────────────────────
  if (screen === "product" && selectedProduct) {
    const p = selectedProduct;
    const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 3);
    return wrap(
      <>
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
            <button onClick={(e) => toggleWishlist(p.id, e)} style={{ background: isWishlisted(p.id) ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.transform="scale(1.15)"}
              onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
            >{isWishlisted(p.id) ? "❤️" : "🤍"}</button>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 90 }}>{p.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 12 }}>{p.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>{p.unit}</div>
          </div>
        </div>
        <div style={{ ...S.scroll, padding: "20px 24px 80px", background: T.screenBg }}><div className="dd-form-wrap">
          <div style={{ ...S.card, padding: "18px 20px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.accent }}>₹{p.price}</div>
            {getQty(p.id) > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: T.tag, borderRadius: 16, padding: "10px 18px" }}>
                <button onClick={() => updateCart(p.id, getQty(p.id) - 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 22, fontWeight: 900, cursor: "pointer" }}>−</button>
                <span style={{ fontWeight: 900, fontSize: 18, color: T.text }}>{getQty(p.id)}</span>
                <button onClick={() => updateCart(p.id, getQty(p.id) + 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 22, fontWeight: 900, cursor: "pointer" }}>+</button>
              </div>
            ) : p.stock === 0 ? (
              <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 16, padding: "12px 28px", fontSize: 14, fontWeight: 800, textAlign: "center" }}>😔 Sold Out</div>
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
                    <div style={{ fontSize: 13, fontWeight: 900, color: T.accent, marginTop: 4 }}>₹{r.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ ...S.card, padding: "18px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 14 }}>⭐ Reviews ({productReviews.length})</div>
            {!user ? (
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, padding: "10px 14px", background: T.tag, borderRadius: 12 }}>
                Sign in to leave a review
              </div>
            ) : canReview === null ? (
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Checking eligibility...</div>
            ) : canReview.can_review ? (
              <>
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
                      showToast("Review posted!", "success");
                      setCanReview({ can_review: false, reason: "already_reviewed" });
                    } catch (e) { showToast(e.response?.data?.detail || "Couldn't post review"); }
                  }} style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 800, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Post</button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, marginBottom: 14, padding: "10px 14px", background: T.tag, borderRadius: 12, color: T.subtext }}>
                {canReview.reason === "already_reviewed" ? "✅ You've already reviewed this product" : "🛒 Purchase & receive this product to leave a review"}
              </div>
            )}
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
        </div></div>
        <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} user={user} />
      </>
    );
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────
  // ── WISHLIST SCREEN ──────────────────────────────────────────
  if (screen === "wishlist") return wrap(
    <>
      <div className="dd-header-pad" style={{ background: T.hero, padding: "0 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
          <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>❤️ My Wishlist</div>
          {wishlist.length > 0 && <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 12, padding: "3px 10px", fontSize: 12, fontWeight: 800 }}>{wishlist.length} items</div>}
        </div>
      </div>
      <div style={{ ...S.scroll, padding: "16px 16px 90px", background: T.screenBg }}>
        {wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🤍</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 8 }}>No saved items yet</div>
            <div style={{ fontSize: 14, color: T.subtext, marginBottom: 24 }}>Tap the ❤️ on any product to save it here for later</div>
            <button onClick={() => setScreen("home")} style={{ ...S.btn }}>Browse Products</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {wishlist.map(item => {
              const p = item.product;
              const qty = getQty(p.id);
              return (
                <div key={item.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  {/* Emoji thumbnail */}
                  <div onClick={async () => { setSelectedProduct(p); const { data } = await api.get("/reviews/product/" + p.id); setProductReviews(data); setScreen("product"); }}
                    style={{ width: 60, height: 60, borderRadius: 16, background: dark ? T.tag : "#f1f8e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, cursor: "pointer" }}>
                    {p.emoji}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{p.unit}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: T.accent }}>₹{p.price}</span>
                      {p.stock === 0 && <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", background: "#fee2e2", borderRadius: 6, padding: "2px 6px" }}>Out of stock</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {/* Remove from wishlist */}
                    <button onClick={() => toggleWishlist(p.id)} style={{ background: "#fee2e2", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>❤️</button>
                    {/* Cart controls */}
                    {qty > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.tag, borderRadius: 12, padding: "4px 8px" }}>
                        <button onClick={() => updateCart(p.id, qty - 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>−</button>
                        <span style={{ fontWeight: 900, fontSize: 13, color: T.text, minWidth: 14, textAlign: "center" }}>{qty}</span>
                        <button onClick={() => updateCart(p.id, qty + 1)} style={{ background: "none", border: "none", color: T.accent, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => updateCart(p.id, 1)} disabled={p.stock === 0}
                        style={{ background: p.stock === 0 ? T.muted : T.hero, color: "#fff", border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: p.stock === 0 ? "not-allowed" : "pointer" }}>
                        {p.stock === 0 ? "Sold out" : "Add"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} user={user} />
    </>
  );

  if (screen === "notifications") return wrap(
    <>
      <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Notifications</div>
          </div>
          <button onClick={async () => { await notifsAPI.markAllRead(); loadNotifications(); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark all read</button>
        </div>
      </div>
      <div style={{ ...S.scroll, padding: "16px 20px 80px", background: T.screenBg }}>
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
      <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} user={user} />
    </>
  );

  // ── SUPPORT / CHAT ─────────────────────────────────────────
  if (screen === "chat") {
    const FAQ = [
      { q: "When do you deliver?", a: "We deliver 7AM–9PM daily, 7 days a week." },
      { q: "What is the delivery fee?", a: "Just ₹29 per order. Free delivery on orders over ₹499!" },
      { q: "How do I return a product?", a: "Returns are accepted within 24 hours of delivery. Contact support with your order number." },
      { q: "How do loyalty points work?", a: "You earn 1 point per ₹1 spent. Redeem 500 points for ₹50 off any order." },
      { q: "Can I cancel an order?", a: "Yes! You can cancel pending or confirmed orders from the Orders screen before it's packed." },
      { q: "How do promo codes work?", a: "Enter your promo code at checkout. Codes like NEWUSER20 give 20% off your first order." },
      { q: "What areas do you deliver to?", a: "We currently cover most metro areas. Enter your address at checkout to confirm availability." },
    ];
    return wrap(
      <>
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
            <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐄</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Help & Support</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Daisy is here to help</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, paddingBottom: 0 }}>
            {[["chat","💬 Chat"], ["ticket","🎫 New Ticket"], ["tickets","📋 My Tickets"], ["faq","❓ FAQ"]].map(([v, label]) => (
              <button key={v} onClick={() => { setSupportView(v); if(v==="tickets") loadSupportTickets(); }} style={{ padding: "8px 12px", background: supportView===v ? "#fff" : "rgba(255,255,255,0.15)", color: supportView===v ? "#2e7d32" : "#fff", border: "none", borderRadius: "12px 12px 0 0", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>

        {/* ── CHAT TAB ── */}
        {supportView === "chat" && (() => {
          const sendChat = async (msg) => {
            if (!msg || !msg.trim() || chatTyping) return;
            setChatMessages(m => [...m, { from: "user", text: msg }]);
            setChatInput(""); setChatTyping(true);
            await new Promise(r => setTimeout(r, 1000));
            const q = msg.toLowerCase();
            const REPLIES = {
              order: `Your latest order is ${orders[0]?.status?.replace("_"," ") || "being processed"}! Check the Orders tab for details.`,
              delivery: "We deliver 7AM–9PM daily. ₹29 delivery fee — free on orders over ₹499! 🚚",
              return: "Returns accepted within 24 hours — tap 'New Ticket' to contact our team.",
              points: `You have ${loyalty?.points || 0} loyalty points (${loyalty?.tier || "bronze"} tier)! 500 pts = ₹50 off.`,
              cancel: "You can cancel pending or confirmed orders from the Orders tab. Tap the order to see the Cancel button.",
            };
            const reply = Object.entries(REPLIES).find(([k]) => q.includes(k));
            const botText = reply ? reply[1] : "I'm not sure about that one! 😅 Tap 'New Ticket' to reach our support team and we'll get back to you shortly.";
            setChatMessages(m => [...m, { from: "bot", text: botText }]);
            setChatTyping(false);
          };
          return (
            <>
              <div style={{ ...S.scroll, padding: "12px 16px 16px", background: T.screenBg, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Quick reply chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {["Order status", "Delivery times", "Return policy", "My points", "Cancel order"].map(q => (
                    <button key={q} onClick={() => sendChat(q)} style={{ background: T.tag, border: `1px solid ${T.cardBorder}`, borderRadius: 20, padding: "6px 12px", fontSize: 11, color: T.tagText, cursor: "pointer", fontWeight: 700 }}>{q}</button>
                  ))}
                </div>
                {chatMessages.map((m, i) => {
                  const isUser = m.from === "user";
                  const prevSame = i > 0 && chatMessages[i-1].from === m.from;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginTop: prevSame ? 2 : 10 }}>
                      {!isUser && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.hero, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, opacity: prevSame ? 0 : 1 }}>🐄</div>
                      )}
                      <div style={{ maxWidth: "72%", background: isUser ? T.hero : T.card, borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                        <div style={{ fontSize: 13.5, color: isUser ? "#fff" : T.text, lineHeight: 1.5 }}>{m.text}</div>
                      </div>
                      {isUser && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: T.text, opacity: prevSame ? 0 : 1 }}>👤</div>
                      )}
                    </div>
                  );
                })}
                {chatTyping && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.hero, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🐄</div>
                    <div style={{ background: T.card, borderRadius: "18px 18px 18px 4px", padding: "12px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0,1,2].map(n => (
                        <div key={n} style={{ width: 7, height: 7, borderRadius: "50%", background: T.muted, animation: `bounce 1.2s ease-in-out ${n*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
                <div ref={chatBottomRef} />
              </div>
              <div style={{ padding: "10px 16px 24px", background: T.navBg, borderTop: `1px solid ${T.navBorder}`, display: "flex", gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendChat(chatInput); }}
                  placeholder="Ask Daisy anything..."
                  style={{ ...S.input, flex: 1, padding: "11px 16px", fontSize: 14 }}
                />
                <button
                  onClick={() => sendChat(chatInput)}
                  disabled={chatTyping || !chatInput.trim()}
                  style={{ background: T.hero, color: "#fff", border: "none", borderRadius: 14, padding: "11px 16px", fontSize: 17, cursor: "pointer", opacity: (chatTyping || !chatInput.trim()) ? 0.45 : 1, transition: "opacity 0.15s", flexShrink: 0 }}
                >➤</button>
              </div>
            </>
          );
        })()}

        {/* ── NEW TICKET TAB ── */}
        {supportView === "ticket" && (
          <div style={{ ...S.scroll, padding: "20px 20px 40px", background: T.screenBg }}>
            {supportSuccess ? (
              <div style={{ ...S.card, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 8 }}>Ticket Submitted!</div>
                <div style={{ fontSize: 14, color: T.subtext, marginBottom: 20 }}>We'll get back to you soon. Check 'My Tickets' for updates.</div>
                <button onClick={() => { setSupportSuccess(false); setSupportSubject(""); setSupportMessage(""); setSupportOrderId(""); setSupportView("tickets"); loadSupportTickets(); }} style={S.btn}>View My Tickets</button>
              </div>
            ) : (
              <div style={{ ...S.card, padding: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 4 }}>🎫 Submit a Support Ticket</div>
                <div style={{ fontSize: 13, color: T.subtext, marginBottom: 20 }}>Our team typically responds within 2 hours.</div>
                {supportError && <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{supportError}</div>}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, marginBottom: 4, textTransform: "uppercase" }}>Subject</div>
                  <input value={supportSubject} onChange={e => setSupportSubject(e.target.value)} placeholder="e.g. Missing item, Wrong order..." style={{ ...S.input, padding: "11px 14px" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, marginBottom: 4, textTransform: "uppercase" }}>Order # (optional)</div>
                  <select value={supportOrderId} onChange={e => setSupportOrderId(e.target.value)} style={{ ...S.input, padding: "11px 14px" }}>
                    <option value="">— Select an order —</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} · ₹{(o.total ?? 0).toFixed(2)}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, marginBottom: 4, textTransform: "uppercase" }}>Message</div>
                  <textarea value={supportMessage} onChange={e => setSupportMessage(e.target.value)} placeholder="Describe your issue in detail..." rows={5} style={{ ...S.input, padding: "11px 14px", resize: "none", fontFamily: "inherit", fontSize: 14 }} />
                </div>
                <button onClick={async () => {
                  if (!supportSubject.trim() || !supportMessage.trim()) { setSupportError("Please fill in subject and message."); return; }
                  setSupportSubmitting(true); setSupportError("");
                  try {
                    await supportAPI.create({ subject: supportSubject, message: supportMessage, order_id: supportOrderId ? parseInt(supportOrderId) : null });
                    setSupportSuccess(true);
                  } catch (e) { setSupportError(e.response?.data?.detail || "Failed to submit ticket."); }
                  setSupportSubmitting(false);
                }} disabled={supportSubmitting} style={{ ...S.btn, opacity: supportSubmitting ? 0.7 : 1 }}>
                  {supportSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MY TICKETS TAB ── */}
        {supportView === "tickets" && (
          <div style={{ ...S.scroll, padding: "16px 20px 40px", background: T.screenBg }}>
            {supportTickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                <div>No tickets yet</div>
                <button onClick={() => setSupportView("ticket")} style={{ marginTop: 16, padding: "12px 24px", background: T.hero, color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Open a Ticket</button>
              </div>
            ) : supportTickets.map(t => (
              <div key={t.id} style={{ ...S.card, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{t.subject}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 8, background: t.status==="resolved" ? "#e8f5e9" : t.status==="in_progress" ? "#fff3e0" : "#e3f2fd", color: t.status==="resolved" ? "#2e7d32" : t.status==="in_progress" ? "#e65100" : "#1565c0" }}>{t.status.replace("_"," ")}</div>
                </div>
                <div style={{ fontSize: 13, color: T.subtext, marginBottom: 8 }}>{t.message.length > 80 ? t.message.slice(0,80)+"..." : t.message}</div>
                {t.admin_reply && (
                  <div style={{ background: T.tag, borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.tagText, marginBottom: 4 }}>💬 Support Reply</div>
                    <div style={{ fontSize: 13, color: T.text }}>{t.admin_reply}</div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>{new Date(t.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAQ TAB ── */}
        {supportView === "faq" && (
          <div style={{ ...S.scroll, padding: "16px 20px 40px", background: T.screenBg }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginBottom: 16 }}>Frequently Asked Questions</div>
            {FAQ.map((item, i) => (
              <div key={i} style={{ ...S.card, padding: "16px 18px", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.accent, marginBottom: 6 }}>Q: {item.q}</div>
                <div style={{ fontSize: 13, color: T.subtext, lineHeight: 1.6 }}>A: {item.a}</div>
              </div>
            ))}
            <div style={{ ...S.card, padding: 18, marginTop: 8, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>Still need help?</div>
              <button onClick={() => setSupportView("ticket")} style={{ padding: "12px 24px", background: T.hero, color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Open a Ticket</button>
            </div>
          </div>
        )}
      </>
    );
  }

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
            <span style={{ fontSize: 22, fontWeight: 900, color: T.accent }}>₹{orderPlaced.total.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => { setOrderPlaced(null); setScreen("tracking"); }} style={{ ...S.btn, marginBottom: 14 }}>Track My Order</button>
        <button onClick={() => { setOrderPlaced(null); setScreen("home"); }} style={{ width: "100%", padding: "17px", background: T.card, color: T.text, border: `2px solid ${T.cardBorder}`, borderRadius: 18, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Continue Shopping</button>
      </div>
    );
    return wrap(
      <>
        <div style={{ background: T.phoneBg, padding: "0 24px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setScreen("home")} style={S.backBtn}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>My Cart</div>
          <div style={{ marginLeft: "auto", background: T.tag, borderRadius: 10, padding: "4px 12px", fontSize: 13, fontWeight: 700, color: T.tagText }}>{cartCount} items</div>
        </div>
        <div style={{ ...S.scroll, padding: "0 24px 80px", background: T.screenBg }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.text, marginBottom: 8 }}>Your cart is empty</div>
              <div style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>Add some fresh dairy products<br />and come back here!</div>
              <button onClick={() => setScreen("home")} style={{ padding: "16px 36px", background: T.hero, color: "#fff", border: "none", borderRadius: 18, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>🛍️ Continue Shopping</button>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ ...S.card, padding: "16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 60, height: 60, background: T.tag, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.product.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{item.product.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: T.accent, marginTop: 4 }}>₹{(item.product.price * item.quantity).toFixed(2)}</div>
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
              {addresses.length === 0 ? (
                <div data-address-section style={{
                  ...S.card, padding: "20px", marginBottom: 14,
                  border: `2px dashed ${addressHighlight ? "#ef4444" : (dark ? "rgba(59,130,246,0.4)" : "#93c5fd")}`,
                  background: addressHighlight ? (dark ? "rgba(239,68,68,0.08)" : "#fff1f2") : (dark ? "rgba(59,130,246,0.06)" : "#eff6ff"),
                  boxShadow: addressHighlight ? "0 0 0 3px rgba(239,68,68,0.2)" : "none",
                  transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
                }}>
                  <style>{`@keyframes addr-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`}</style>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, animation: addressHighlight ? "addr-shake 0.45s ease" : "none" }}>
                    <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>📍</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: addressHighlight ? "#ef4444" : (dark ? "#93c5fd" : "#1d4ed8"), marginBottom: 4, transition: "color 0.3s" }}>
                        {addressHighlight ? "⚠️ Delivery address required!" : "No delivery address yet"}
                      </div>
                      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
                        Add a delivery address to place your order. It only takes a few seconds!
                      </div>
                      <button
                        onClick={() => { setScreen("profile"); setSubScreen("addresses"); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "11px 20px", borderRadius: 14, border: "none",
                          background: addressHighlight ? "#ef4444" : (dark ? "#2563eb" : "#1d4ed8"),
                          color: "#fff", fontWeight: 800, fontSize: 14,
                          cursor: "pointer", fontFamily: "inherit",
                          boxShadow: addressHighlight ? "0 4px 14px rgba(239,68,68,0.35)" : "0 4px 14px rgba(29,78,216,0.3)",
                          transition: "background 0.3s, box-shadow 0.3s",
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        Add Delivery Address
                        <span style={{ fontSize: 16, marginLeft: 2 }}>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div data-address-section style={{
                  ...S.card, padding: "16px 20px", marginBottom: 14,
                  border: `2px solid ${addressHighlight ? "#ef4444" : "transparent"}`,
                  boxShadow: addressHighlight ? "0 0 0 3px rgba(239,68,68,0.15)" : undefined,
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}>
                  <style>{`@keyframes addr-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`}</style>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, animation: addressHighlight ? "addr-shake 0.45s ease" : "none" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: addressHighlight ? "#ef4444" : T.text, transition: "color 0.3s" }}>
                      📍 {addressHighlight ? "Please select a delivery address!" : "Deliver to"}
                    </div>
                    <button
                      onClick={() => { setScreen("profile"); setSubScreen("addresses"); }}
                      style={{ fontSize: 12, fontWeight: 700, color: T.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                    >
                      + Add New
                    </button>
                  </div>
                  {addresses.map(a => (
                    <div key={a.id} onClick={() => setSelectedAddress(a.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.cardBorder}`, cursor: "pointer" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {selectedAddress === a.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.full_address}</div>
                      </div>
                      {selectedAddress === a.id && (
                        <div style={{ fontSize: 10, fontWeight: 800, color: T.accent, background: dark ? "rgba(34,197,94,0.15)" : "#dcfce7", padding: "3px 8px", borderRadius: 99, flexShrink: 0 }}>DELIVERING HERE</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Loyalty Points */}
              {loyalty?.points > 0 && (
                <div style={{ ...S.card, padding: "18px 20px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>⭐ Use Loyalty Points</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{loyalty.points} pts available</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Every 500 points = ₹50 off. Points used: multiples of 500 only.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setRedeemPoints(Math.max(0, redeemPoints - 500))} disabled={redeemPoints === 0}
                      style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: redeemPoints === 0 ? T.cardBorder : T.tag, color: redeemPoints === 0 ? T.muted : T.accent, fontSize: 20, fontWeight: 900, cursor: redeemPoints === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: redeemPoints > 0 ? T.accent : T.muted }}>{redeemPoints} pts</div>
                      {redeemPoints > 0 && <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>−₹{Math.floor(redeemPoints / 500) * 50} off</div>}
                    </div>
                    <button onClick={() => setRedeemPoints(Math.min(Math.floor(loyalty.points / 500) * 500, redeemPoints + 500))}
                      disabled={redeemPoints >= Math.floor(loyalty.points / 500) * 500}
                      style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: redeemPoints >= Math.floor(loyalty.points / 500) * 500 ? T.cardBorder : T.hero, color: "#fff", fontSize: 20, fontWeight: 900, cursor: redeemPoints >= Math.floor(loyalty.points / 500) * 500 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>
              )}
              {/* Summary */}
              <div style={{ ...S.card, padding: "20px", marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 14 }}>Order Summary</div>
                {[["Subtotal", `₹${cartSubtotal.toFixed(2)}`], ...(appliedPromo ? [[`Discount (${appliedPromo.discount_percent}%)`, `-₹${discount.toFixed(2)}`]] : []), ...(redeemPoints > 0 ? [[`Points (${redeemPoints} pts)`, `-₹${pointsDiscount.toFixed(2)}`]] : []), ["Delivery fee", "₹29"], ["Tax (5% GST)", `₹${(cartSubtotal * 0.05).toFixed(2)}`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: l.startsWith("Discount") ? T.accent : T.subtext }}>
                    <span>{l}</span><span style={{ fontWeight: l.startsWith("Discount") ? 800 : 400 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.cardBorder}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 16, color: T.text }}>
                  <span>Total</span><span>₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
        {cart.length > 0 && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px", background: T.navBg, borderTop: `1px solid ${T.navBorder}` }}>
            {showPayment ? (
              <div style={{ ...S.card, padding: "20px", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  💳 Dummy Payment
                  <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: T.muted }}>Test Mode</span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, padding: "8px 12px", background: dark ? "rgba(255,255,255,0.04)" : "#f9f9f9", borderRadius: 10, border: `1px solid ${T.cardBorder}` }}>
                  🧪 This is a test checkout. No real payment is processed.
                </div>
                {[
                  ["Cardholder Name", cardName, setCardName, "text", "John Doe"],
                  ["Card Number", cardNumber, v => setCardNumber(v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim()), "text", "4242 4242 4242 4242"],
                  ["Expiry (MM/YY)", cardExpiry, v => setCardExpiry(v.replace(/[^\d/]/g,"").slice(0,5)), "text", "12/26"],
                  ["CVC", cardCvc, v => setCardCvc(v.replace(/\D/g,"").slice(0,3)), "text", "123"],
                ].map(([label, val, set, type, ph]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.subtext, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                    <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={ph} style={{ ...S.input, padding: "10px 14px", fontSize: 14 }} />
                  </div>
                ))}
                {paymentError && (
                  <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    ⚠️ {paymentError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button onClick={async () => {
                    if (!cardName.trim()) { setPaymentError("Please enter cardholder name"); return; }
                    if (cardNumber.replace(/\s/g,"").length < 16) { setPaymentError("Please enter a valid 16-digit card number"); return; }
                    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) { setPaymentError("Expiry must be MM/YY format"); return; }
                    if (cardCvc.length < 3) { setPaymentError("CVC must be 3 digits"); return; }
                    setPaymentLoading(true); setPaymentError("");
                    // Simulate processing delay
                    await new Promise(r => setTimeout(r, 1500));
                    try {
                      const { data: order } = await ordersAPI.place({
                        address_id: selectedAddress,
                        promo_code: appliedPromo ? promoCode : undefined,
                        redeem_points: redeemPoints,
                        payment_intent_id: "dummy_" + Date.now(),
                      });
                      setOrderPlaced(order);
                      setShowPayment(false);
                      setCardNumber(""); setCardExpiry(""); setCardCvc(""); setCardName("");
                      await loadCart(); setAppliedPromo(null); setPromoCode(""); setRedeemPoints(0);
                      await loadLoyalty();
                    } catch (e) {
                      setPaymentError(e.response?.data?.detail || "Order failed. Please try again.");
                    } finally { setPaymentLoading(false); }
                  }} disabled={paymentLoading} style={{ ...S.btn, flex: 2, opacity: paymentLoading ? 0.85 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {paymentLoading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        Processing...
                      </>
                    ) : `✓ Pay ₹${cartTotal.toFixed(2)}`}
                  </button>
                  <button onClick={() => { setShowPayment(false); setPaymentError(""); }} style={{ flex: 1, padding: "14px", background: T.card, color: T.text, border: `1.5px solid ${T.cardBorder}`, borderRadius: 16, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: T.muted }}>🔒 Dummy checkout · any details accepted</div>
              </div>
            ) : (
              <button onClick={() => {
                if (!selectedAddress) {
                  // Scroll up to show the address section clearly
                  document.querySelector("[data-address-section]")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setAddressHighlight(true);
                  setTimeout(() => setAddressHighlight(false), 2000);
                  return;
                }
                setShowPayment(true); setPaymentError("");
              }} style={{
                ...S.btn,
                boxShadow: selectedAddress ? "0 8px 24px rgba(46,125,50,0.28)" : "none",
                opacity: selectedAddress ? 1 : 0.65,
                position: "relative",
              }}>
                {selectedAddress
                  ? `💳 Proceed to Payment · ₹${cartTotal.toFixed(2)}`
                  : "📍 Select a delivery address first"
                }
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
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px" }}>
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
        <div style={{ ...S.scroll, padding: "20px 24px 80px", background: T.screenBg }}>
        <div className="dd-form-wrap">
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
                  <span>₹{(item.total_price ?? 0).toFixed(2)}</span>
                </div>
              ))}
              {[["Delivery", "₹29"], ["Tax", `₹${(showInvoice.tax ?? 0).toFixed(2)}`], ["Total", `₹${(showInvoice.total ?? 0).toFixed(2)}`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: l === "Total" ? 16 : 14, fontWeight: l === "Total" ? 900 : 400, color: l === "Total" ? T.text : T.subtext, marginTop: 8 }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              {showInvoice.status !== "cancelled" && (
                <div style={{ background: T.tag, borderRadius: 12, padding: "12px 16px", marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: T.tagText, fontWeight: 700 }}>Points Earned</span>
                  <span style={{ fontWeight: 900, color: "#f59e0b" }}>+{showInvoice.points_earned} ⭐</span>
                </div>
              )}
              {showInvoice.status === "cancelled" && (
                <div style={{ background: "#ffebee", borderRadius: 12, padding: "12px 16px", marginTop: 12, textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: "#c62828", fontWeight: 700 }}>❌ Order Cancelled — No points awarded</span>
                </div>
              )}
            </div>
          ) : activeOrderTab === "current" ? (
            activeOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>No active orders</div>
                <div style={{ fontSize: 14, color: T.muted, marginBottom: 24 }}>Looks like you haven't ordered yet!</div>
                <button onClick={() => setScreen("home")} style={{ padding: "14px 32px", background: T.hero, color: "#fff", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>🛍️ Start Shopping</button>
              </div>
            ) : activeOrders.map(order => (
              <div key={order.id} style={{ ...S.card, padding: "20px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: T.text }}>{order.order_number}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ background: "#fff8e1", color: "#f57f17", borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>🚚 {(order.status || "pending").replace("_", " ")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.accent, fontWeight: 700 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, animation: "dd-pulse 1.5s ease-in-out infinite" }} />
                      Live tracking
                    </div>
                  </div>
                </div>
                <div style={{ background: T.tag, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: T.subtext, marginBottom: 4 }}>Estimated arrival</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.accent }}>{order.estimated_eta}</div>
                </div>
                {(order.status === "pending" || order.status === "confirmed") && (
                  <button onClick={async () => {
                    if (!window.confirm("Are you sure you want to cancel this order?")) return;
                    try {
                      await ordersAPI.cancel(order.id, "Cancelled by customer");
                      await loadOrders();
                    } catch(e) { showToast(e.response?.data?.detail || "Could not cancel order."); }
                  }} style={{ width: "100%", padding: "10px", background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14 }}>
                    ✕ Cancel Order
                  </button>
                )}
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
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🧾</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>No past orders yet</div>
                <div style={{ fontSize: 14, color: T.muted, marginBottom: 24 }}>Your order history will appear here.</div>
                <button onClick={() => setScreen("home")} style={{ padding: "14px 32px", background: T.hero, color: "#fff", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>🛍️ Start Shopping</button>
              </div>
            ) : pastOrders.map(order => (
              <div key={order.id} style={{ ...S.card, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{order.order_number}</div>
                  {order.status === "cancelled" ? (
                    <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>❌ Cancelled</div>
                  ) : (
                    <div style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>✓ Delivered</div>
                  )}
                </div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                {(order.items || []).map((item, i) => <div key={i} style={{ fontSize: 14, color: T.subtext }}>• {item.product?.name} × {item.quantity}</div>)}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 900, color: T.text }}>
                  <span>Total</span><span>₹{(order.total ?? 0).toFixed(2)}</span>
                </div>
                {order.status === "cancelled" ? (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#ffebee", borderRadius: 10, fontSize: 12, color: "#c62828", fontWeight: 700, textAlign: "center" }}>
                    No points awarded for cancelled orders
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button onClick={async () => {
                      const skipped = [];
                      for (const item of (order.items || [])) {
                        if (item.product?.stock === 0) { skipped.push(item.product.name); continue; }
                        await cartAPI.update(item.product_id, item.quantity);
                      }
                      await loadCart();
                      if (skipped.length > 0 && skipped.length === (order.items || []).length) {
                        showToast("All items are out of stock", "error"); return;
                      }
                      if (skipped.length > 0) showToast(skipped.join(", ") + " skipped — out of stock");
                      setScreen("cart");
                    }} style={{ flex: 1, padding: "11px", background: T.tag, color: T.tagText, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Reorder</button>
                    <button onClick={() => setShowInvoice(order)} style={{ flex: 1, padding: "11px", background: T.card, color: T.text, border: `2px solid ${T.cardBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🧾 Invoice</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        </div>
        <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} user={user} />
      </>
    );
  }

  // ── PROFILE ────────────────────────────────────────────────
  if (screen === "profile") {
    if (subScreen === "editProfile") return wrap(
      <>
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
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
              } catch (e) { showToast(e.response?.data?.detail || "Couldn't save profile"); } finally { setEditProfileSaving(false); }
            }} disabled={editProfileSaving} style={{ ...S.btn, opacity: editProfileSaving ? 0.7 : 1 }}>
              {editProfileSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </>
    );

    if (subScreen === "changePassword") {
      const pwField = (label, value, setValue, show, setShow, placeholder) => (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔒</span>
            <input
              value={value}
              onChange={e => { setValue(e.target.value); setCpError(""); setCpSuccess(false); }}
              type={show ? "text" : "password"}
              placeholder={placeholder}
              style={{ ...S.input, paddingLeft: 42, paddingRight: 52 }}
            />
            <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: dark ? "#4a6e4b" : "#a5c9a5", padding: 0 }}>
              {show ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      );

      const doChangePassword = async () => {
        setCpError(""); setCpSuccess(false);
        if (!cpCurrent) { setCpError("Please enter your current password"); return; }
        if (!cpNew) { setCpError("Please enter a new password"); return; }
        if (cpNew.length < 8) { setCpError("New password must be at least 8 characters"); return; }
        if (cpNew === cpCurrent) { setCpError("New password must be different from current password"); return; }
        if (cpNew !== cpConfirm) { setCpError("Passwords do not match"); return; }
        setCpSaving(true);
        try {
          await usersAPI.changePassword({ current_password: cpCurrent, new_password: cpNew });
          setCpSuccess(true);
          setCpCurrent(""); setCpNew(""); setCpConfirm("");
        } catch (e) {
          setCpError(e.response?.data?.detail || "Failed to update password");
        } finally { setCpSaving(false); }
      };

      return wrap(
        <>
          <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={() => setSubScreen(null)} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Change Password</div>
          </div>
          <div style={{ ...S.scroll, padding: "28px 24px 100px", background: T.screenBg }}>

            {/* Info card */}
            <div style={{ ...S.card, padding: "16px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>💡</div>
              <div style={{ fontSize: 13, color: T.subtext, lineHeight: 1.6 }}>
                Use a strong password with at least <b style={{ color: T.text }}>8 characters</b>, mixing letters, numbers and symbols.
              </div>
            </div>

            {/* Form card */}
            <div style={{ ...S.card, padding: "24px" }}>
              {pwField("Current Password", cpCurrent, setCpCurrent, cpShowCurrent, setCpShowCurrent, "Enter current password")}
              <div style={{ height: 1, background: T.cardBorder, margin: "4px 0 20px" }} />
              {pwField("New Password", cpNew, setCpNew, cpShowNew, setCpShowNew, "Enter new password")}
              {pwField("Confirm New Password", cpConfirm, setCpConfirm, cpShowConfirm, setCpShowConfirm, "Repeat new password")}

              {/* Password strength bar */}
              {cpNew.length > 0 && (() => {
                const strength = cpNew.length >= 12 && /[A-Z]/.test(cpNew) && /[0-9]/.test(cpNew) && /[^A-Za-z0-9]/.test(cpNew) ? 4
                  : cpNew.length >= 10 && /[A-Z]/.test(cpNew) && /[0-9]/.test(cpNew) ? 3
                  : cpNew.length >= 8 ? 2 : 1;
                const labels = ["", "Weak", "Fair", "Strong", "Very Strong"];
                const colors = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];
                return (
                  <div style={{ marginBottom: 20, marginTop: -8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= strength ? colors[strength] : T.cardBorder, transition: "background 0.3s" }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors[strength] }}>{labels[strength]}</div>
                  </div>
                );
              })()}

              {/* Error */}
              {cpError && (
                <div style={{ background: "#ffebee", color: "#c62828", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span> {cpError}
                </div>
              )}

              {/* Success */}
              {cpSuccess && (
                <div style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✅</span> Password updated successfully! Please use your new password next time you sign in.
                </div>
              )}

              <button onClick={doChangePassword} disabled={cpSaving} style={{ ...S.btn, opacity: cpSaving ? 0.7 : 1 }}>
                {cpSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        </>
      );
    }

    if (subScreen === "addresses") return wrap(
      <>
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => setSubScreen(null)} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Saved Addresses</div>
        </div>
        <div style={{ ...S.scroll, padding: "20px 24px 80px", background: T.screenBg }}><div className="dd-form-wrap">
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
        </div></div>
      </>
    );

    if (subScreen === "referral") return wrap(
      <>
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px", display: "flex", gap: 14, alignItems: "center" }}>
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
                {[["Total Referrals", referral.total_referrals], ["Successful", referral.successful_referrals], ["Credits Earned", `₹${referral.total_credit_earned.toFixed(2)}`]].map(([l, v]) => (
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

    const loyaltyPct = loyalty?.next_tier_name
      ? Math.min(100, 100 - (loyalty.next_tier_points / (loyalty.tier==="bronze"?500:loyalty.tier==="silver"?1500:3000)) * 100)
      : 100;
    const tierColor = loyalty?.tier==="gold"?"#f59e0b":loyalty?.tier==="silver"?"#94a3b8":"#cd7f32";
    const allMenuItems = [
      { icon:"✏️", label:"Edit Profile",    sub:"Name, email & phone",          color:"#22c55e", action:()=>{ setEditProfileName(user?.full_name||""); setEditProfilePhone(user?.phone||""); setEditProfileSuccess(false); setSubScreen("editProfile"); } },
      { icon:"🔒", label:"Change Password", sub:"Update your password",           color:"#ef4444", action:()=>{ setCpCurrent(""); setCpNew(""); setCpConfirm(""); setCpError(""); setCpSuccess(false); setSubScreen("changePassword"); } },
      { icon:"📍", label:"Saved Addresses", sub:`${addresses.length} location${addresses.length!==1?"s":""}`, color:"#3b82f6", action:()=>setSubScreen("addresses") },
      ...(user?.is_admin ? [{ icon:"⚙️", label:"Admin Panel", sub:"Manage orders & products", color:"#8b5cf6", action:async()=>{ setAdminTab("orders"); setAdminLoading(true); setScreen("admin"); await loadAdminOrders(); setAdminLoading(false); } }] : []),
      { icon:"🎁", label:"Refer a Friend",  sub:"Give ₹50, get ₹50 credit",        color:"#f59e0b", action:()=>setSubScreen("referral") },
      { icon:"🔔", label:"Notifications",   sub:`${unreadNotifs} unread`,         color:"#ef4444", action:()=>setScreen("notifications") },
      { icon:"💬", label:"Help & Support",  sub:"Chat with Daisy",               color:"#06b6d4", action:()=>setScreen("chat") },
    ];
    const acctItems   = allMenuItems.slice(0, user?.is_admin ? 4 : 3);
    const rewardItems = allMenuItems.slice(user?.is_admin ? 4 : 3);

    return wrap(
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          .pf2 * { box-sizing:border-box; font-family:'Inter',sans-serif; }

          /* HERO */
          .pf2-hero {
            position:relative; overflow:hidden;
            background:${dark
              ? 'linear-gradient(150deg,#052e16 0%,#14532d 100%)'
              : 'linear-gradient(150deg,#16a34a 0%,#15803d 100%)'};
          }
          .pf2-hero::before {
            content:''; position:absolute; inset:0; pointer-events:none;
            background: radial-gradient(ellipse at 75% -10%, rgba(187,247,208,0.22) 0%, transparent 55%),
                        radial-gradient(ellipse at 10% 110%, rgba(0,0,0,0.15) 0%, transparent 50%);
          }
          .pf2-hero-inner {
            position:relative; z-index:1; max-width:680px; margin:0 auto;
            padding:28px 20px 32px; display:flex; align-items:center; gap:18px;
          }
          @media(max-width:767px){ .pf2-hero-inner { padding:20px 16px 24px; } }

          .pf2-av {
            width:72px; height:72px; border-radius:50%; flex-shrink:0;
            background:rgba(255,255,255,0.16); border:2.5px solid rgba(255,255,255,0.5);
            display:flex; align-items:center; justify-content:center; font-size:30px;
            box-shadow:0 0 0 5px rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.2);
          }
          .pf2-info { flex:1; min-width:0; }
          .pf2-name { font-size:20px; font-weight:900; color:#fff; letter-spacing:-0.4px; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .pf2-email { font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:12px; }
          .pf2-ebtn {
            display:inline-flex; align-items:center; gap:5px; padding:6px 14px;
            border-radius:99px; cursor:pointer; background:rgba(255,255,255,0.18);
            border:1.5px solid rgba(255,255,255,0.35); color:#fff; font-size:11.5px;
            font-weight:700; font-family:'Inter',sans-serif; transition:background .15s;
          }
          .pf2-ebtn:hover { background:rgba(255,255,255,0.28); }

          /* STATS ROW in hero */
          .pf2-stats-row {
            max-width:680px; margin:0 auto;
            display:grid; grid-template-columns:repeat(3,1fr);
            border-top:1px solid rgba(255,255,255,0.12);
          }
          .pf2-stat-cell {
            text-align:center; padding:12px 8px;
            position:relative;
          }
          .pf2-stat-cell+.pf2-stat-cell::before {
            content:''; position:absolute; left:0; top:20%; height:60%; width:1px;
            background:rgba(255,255,255,0.15);
          }
          .pf2-sn { font-size:20px; font-weight:900; color:#fff; line-height:1; }
          .pf2-sl { font-size:9px; color:rgba(255,255,255,0.52); margin-top:3px; font-weight:700; letter-spacing:.9px; text-transform:uppercase; }

          /* BODY */
          .pf2-body { max-width:680px; margin:0 auto; padding:16px 14px 90px; }
          @media(min-width:768px){ .pf2-body { padding:20px 20px 60px; } }

          /* Hide mobile-only elements on desktop (sidebar already has them) */
          @media(min-width:768px){ .pf2-mobile-only { display:none !important; } }

          /* LOYALTY BANNER */
          .pf2-loy {
            background:${dark
              ? 'linear-gradient(135deg,#071a0c 0%,#0d2412 100%)'
              : 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)'};
            border:1.5px solid ${dark?'rgba(134,239,172,0.12)':'#b9f5c8'};
            border-radius:16px; padding:18px 20px; margin-bottom:12px;
            display:flex; align-items:center; gap:16px; position:relative; overflow:hidden;
          }
          .pf2-loy::after {
            content:''; position:absolute; right:-18px; top:-18px;
            width:90px; height:90px; border-radius:50%;
            background:${dark?'rgba(134,239,172,0.05)':'rgba(22,163,74,0.07)'};
            pointer-events:none;
          }
          .pf2-bar-wrap { flex:1; }
          .pf2-bar-bg { height:5px; border-radius:99px; background:${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}; overflow:hidden; margin-top:8px; }
          .pf2-bar-fg { height:100%; border-radius:99px; }

          /* SECTION CARDS */
          .pf2-card {
            background:${dark?'rgba(255,255,255,0.04)':'#fff'};
            border:1px solid ${dark?'rgba(255,255,255,0.07)':'#e8e8e8'};
            border-radius:16px; overflow:hidden; margin-bottom:12px;
            box-shadow:${dark?'none':'0 1px 4px rgba(0,0,0,0.05)'};
          }
          .pf2-card-label {
            font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase;
            color:${T.muted}; padding:13px 16px 8px;
            border-bottom:1px solid ${dark?'rgba(255,255,255,0.05)':'#f0f0f0'};
          }

          /* ROWS */
          .pf2-row {
            display:flex; align-items:center; gap:12px;
            padding:13px 16px; cursor:pointer; transition:background .12s;
          }
          .pf2-row:not(:last-child){ border-bottom:1px solid ${dark?'rgba(255,255,255,0.04)':'#f4f4f4'}; }
          .pf2-row:hover { background:${dark?'rgba(255,255,255,0.04)':'#f7fdf8'}; }
          .pf2-row:active { background:${dark?'rgba(255,255,255,0.08)':'#edf7ef'}; }
          .pf2-ic { width:36px; height:36px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:16px; }
          .pf2-rl { font-size:13.5px; font-weight:700; color:${T.text}; }
          .pf2-rs { font-size:11px; color:${T.muted}; margin-top:2px; }
          .pf2-ch {
            width:20px; height:20px; border-radius:6px; flex-shrink:0; margin-left:auto;
            background:${dark?'rgba(255,255,255,0.06)':'#f0f0f0'};
            display:flex; align-items:center; justify-content:center; font-size:11px; color:${T.muted};
          }
        `}</style>

        <div className="pf2" style={{ background:T.screenBg, minHeight:'100vh', overflowY:'auto' }}>

          {/* HERO — avatar + info + inline stats */}
          <div className="pf2-hero dd-header-pad">
            <div className="pf2-hero-inner">
              <div className="pf2-av">👤</div>
              <div className="pf2-info">
                <div className="pf2-name">
                  {user?.full_name||"User"}
                  {user?.is_admin && <span style={{marginLeft:8,fontSize:9,background:'rgba(139,92,246,0.4)',color:'#e9d5ff',padding:'2px 7px',borderRadius:99,fontWeight:800,letterSpacing:'0.8px',verticalAlign:'middle'}}>ADMIN</span>}
                </div>
                <div className="pf2-email">{user?.email}</div>
                <button className="pf2-ebtn" onClick={()=>{ setEditProfileName(user?.full_name||""); setEditProfilePhone(user?.phone||""); setEditProfileSuccess(false); setSubScreen("editProfile"); }}>✏️ Edit Profile</button>
              </div>
            </div>
            {/* Stats bar — full width below hero info */}
            <div className="pf2-stats-row">
              {[[loyalty?.points||0,"Points"],[orders.length,"Orders"],[addresses.length,"Addresses"]].map(([n,l])=>(
                <div key={l} className="pf2-stat-cell">
                  <div className="pf2-sn">{n}</div>
                  <div className="pf2-sl">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BODY */}
          <div className="pf2-body">

            {/* LOYALTY BANNER */}
            {loyalty && (
              <div className="pf2-loy">
                <div style={{fontSize:32}}>⭐</div>
                <div className="pf2-bar-wrap">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                    <div>
                      <span style={{fontSize:20,fontWeight:900,color:T.text}}>{loyalty.points}</span>
                      <span style={{fontSize:12,fontWeight:500,color:T.muted,marginLeft:5}}>pts</span>
                    </div>
                    <span style={{padding:'3px 10px',borderRadius:99,fontSize:10,fontWeight:800,background:tierColor+'18',color:tierColor,border:`1.5px solid ${tierColor}30`}}>{loyalty.tier.toUpperCase()}</span>
                  </div>
                  {loyalty.next_tier_name
                    ? <div style={{fontSize:11,color:T.muted,marginBottom:1}}><b style={{color:T.text}}>{loyalty.next_tier_points}</b> pts to <b style={{color:tierColor}}>{loyalty.next_tier_name}</b></div>
                    : <div style={{fontSize:11,color:tierColor,fontWeight:700}}>Max tier reached 🏆</div>
                  }
                  <div className="pf2-bar-bg">
                    <div className="pf2-bar-fg" style={{width:`${loyaltyPct}%`,background:`linear-gradient(90deg,${tierColor}88,${tierColor})`}}/>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            <div className="pf2-card">
              <div className="pf2-card-label">Account</div>
              {acctItems.map(item=>(
                <div key={item.label} className="pf2-row" onClick={item.action}>
                  <div className="pf2-ic" style={{background:item.color+'15'}}>{item.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="pf2-rl">{item.label}</div>
                    <div className="pf2-rs">{item.sub}</div>
                  </div>
                  <div className="pf2-ch">›</div>
                </div>
              ))}
            </div>

            {/* REWARDS & HELP */}
            <div className="pf2-card">
              <div className="pf2-card-label">Rewards & Help</div>
              {rewardItems.map(item=>(
                <div key={item.label} className="pf2-row" onClick={item.action}>
                  <div className="pf2-ic" style={{background:item.color+'15'}}>{item.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="pf2-rl">{item.label}</div>
                    <div className="pf2-rs">{item.sub}</div>
                  </div>
                  <div className="pf2-ch">›</div>
                </div>
              ))}
            </div>

            {/* DARK MODE TOGGLE — mobile only */}
            <div className="pf2-card pf2-mobile-only" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="pf2-ic" style={{ background: dark ? "rgba(251,191,36,0.15)" : "rgba(99,102,241,0.12)" }}>{dark ? "☀️" : "🌙"}</div>
                <div>
                  <div className="pf2-rl">{dark ? "Light Mode" : "Dark Mode"}</div>
                  <div className="pf2-rs">Switch appearance</div>
                </div>
              </div>
              <div onClick={() => setDark(d => !d)} style={{ width: 42, height: 24, borderRadius: 99, background: dark ? "#22c55e" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 4, left: dark ? 22 : 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)" }} />
              </div>
            </div>

            {/* SIGN OUT — mobile only (desktop has it in sidebar) */}
            <div className="pf2-mobile-only" style={{ marginBottom: 8 }}>
              <button
                onClick={() => { localStorage.clear(); setUser(null); setCart([]); setScreen("login"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "15px", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                  fontFamily: "inherit",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>

          </div>
        </div>
        <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} user={user} />
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
        <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={() => setScreen("home")} style={{ ...S.backBtn, background: "rgba(255,255,255,0.2)", color: "#fff" }}>←</button>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>🛠 Admin Panel</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, paddingBottom: 0, overflowX: "auto" }}>
            {[["stats","📊 Stats"], ["orders","📦 Orders"], ["products","🥛 Products"], ["promos","🏷 Promos"], ["users","👥 Users"], ["tickets","🎫 Tickets"]].map(([t, label]) => (
              <button key={t} onClick={async () => {
                setAdminTab(t); setAdminLoading(true);
                if(t==="orders") await loadAdminOrders();
                else if(t==="products") await loadAdminProducts();
                else if(t==="stats") await loadAdminStats();
                else if(t==="users") await loadAdminUsers();
                else if(t==="promos") await loadAdminPromos();
                else if(t==="tickets") await loadAdminTickets();
                setAdminLoading(false);
              }} style={{ padding: "8px 14px", background: adminTab===t ? "#fff" : "rgba(255,255,255,0.15)", color: adminTab===t ? "#2e7d32" : "#fff", border: "none", borderRadius: "12px 12px 0 0", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ ...S.scroll, padding: "16px 20px 80px", background: T.screenBg }}>

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
                  <div style={{ fontWeight:900, fontSize:16, color:T.accent }}>₹{order.total?.toFixed(2)}</div>
                </div>
                <div style={{ fontSize:13, color:T.subtext, marginBottom:10 }}>
                  {(order.items || []).map(i => `${i.product?.name} ×${i.quantity}`).join(", ")}
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

          {/* ── STATS TAB ── */}
          {adminTab === "stats" && (
            adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
            adminStats ? (
              <div>
                <div className="dd-stats-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                  {[
                    ["💰 Total Revenue", `₹${adminStats.total_revenue.toFixed(2)}`, "#e8f5e9"],
                    ["📦 Orders Today", adminStats.orders_today, "#e3f2fd"],
                    ["📅 This Week", adminStats.orders_this_week, "#fff8e1"],
                    ["👥 Total Users", adminStats.total_users, "#f3e5f5"],
                    ["✅ Active Users", adminStats.active_users, "#e0f2f1"],
                    ["⚠️ Low Stock", adminStats.low_stock_products, adminStats.low_stock_products > 0 ? "#ffebee" : "#e8f5e9"],
                  ].map(([label, val, bg]) => (
                    <div key={label} style={{ background: bg, borderRadius: 16, padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ ...S.card, padding:16, background: "#fff3e0", borderRadius:14 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#e65100" }}>Total Orders: {adminStats.total_orders}</div>
                </div>
              </div>
            ) : <div style={{ textAlign:"center", padding:40, color:T.muted }}>No data yet</div>
          )}

          {/* ── PROMOS TAB ── */}
          {adminTab === "promos" && (
            <>
              <button onClick={() => setShowPromoForm(p => !p)} style={{ ...S.btn, marginBottom:16 }}>
                {showPromoForm ? "✕ Close Form" : "+ Create Promo Code"}
              </button>
              {showPromoForm && (
                <div style={{ ...S.card, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:900, color:T.text, marginBottom:14 }}>New Promo Code</div>
                  {[["Code", "code", "text"], ["Discount %", "discount_percent", "number"], ["Max Uses", "max_uses", "number"], ["Min Order $", "min_order_value", "number"]].map(([label, key, type]) => (
                    <div key={key} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.subtext, marginBottom:4, textTransform:"uppercase" }}>{label}</div>
                      <input value={adminPromoForm[key]} onChange={e => setAdminPromoForm(f => ({...f, [key]: e.target.value}))} type={type} style={{ ...S.input, padding:"10px 14px" }} />
                    </div>
                  ))}
                  <button onClick={async () => {
                    try {
                      await adminAPI.createPromo({ code: adminPromoForm.code, discount_percent: parseFloat(adminPromoForm.discount_percent), max_uses: adminPromoForm.max_uses ? parseInt(adminPromoForm.max_uses) : null, min_order_value: parseFloat(adminPromoForm.min_order_value) || 0 });
                      setShowPromoForm(false); setAdminPromoForm({ code:"", discount_percent:"", max_uses:"", min_order_value:"0", expires_at:"" });
                      await loadAdminPromos();
                    } catch(e) { showToast(e.response?.data?.detail || "Failed to create promo"); }
                  }} style={S.btn}>Create Promo</button>
                </div>
              )}
              {adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
                adminPromos.length === 0 ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>No promo codes</div> :
                adminPromos.map(p => (
                  <div key={p.id} style={{ ...S.card, padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <div style={{ fontSize:15, fontWeight:900, color:T.accent }}>{p.code}</div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={async () => { await adminAPI.updatePromo(p.id, { is_active: !p.is_active }); await loadAdminPromos(); }} style={{ background: p.is_active ? "#ffebee" : "#e8f5e9", border:"none", borderRadius:8, padding:"5px 10px", color: p.is_active ? "#c62828" : "#2e7d32", fontWeight:800, cursor:"pointer", fontSize:11 }}>{p.is_active ? "Deactivate" : "Activate"}</button>
                        <button onClick={async () => { if(window.confirm("Delete this promo?")) { await adminAPI.deletePromo(p.id); await loadAdminPromos(); } }} style={{ background:"#ffebee", border:"none", borderRadius:8, padding:"5px 10px", color:"#c62828", fontWeight:800, cursor:"pointer", fontSize:13 }}>🗑</button>
                      </div>
                    </div>
                    <div style={{ fontSize:13, color:T.subtext }}>{p.discount_percent}% off · Min ${p.min_order_value} · Used {p.uses_count}/{p.max_uses || "∞"}</div>
                    <div style={{ fontSize:11, color: p.is_active ? T.accent : T.danger, fontWeight:700, marginTop:4 }}>{p.is_active ? "● Active" : "● Inactive"}</div>
                  </div>
                ))
              }
            </>
          )}

          {/* ── USERS TAB ── */}
          {adminTab === "users" && (
            adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
            adminUsers.length === 0 ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>No users</div> :
            adminUsers.map(u => (
              <div key={u.id} style={{ ...S.card, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:T.text }}>{u.full_name} {u.is_admin && <span style={{ background:"#1565c0", color:"#fff", borderRadius:6, padding:"2px 6px", fontSize:10 }}>ADMIN</span>}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{u.email}</div>
                    <div style={{ fontSize:11, color: u.is_active ? T.accent : T.danger, fontWeight:700, marginTop:2 }}>{u.is_active ? "● Active" : "● Inactive"}</div>
                  </div>
                  <button onClick={async () => { await adminAPI.toggleUser(u.id); await loadAdminUsers(); }} style={{ background: u.is_active ? "#ffebee" : "#e8f5e9", border:"none", borderRadius:10, padding:"8px 12px", color: u.is_active ? "#c62828" : "#2e7d32", fontWeight:800, cursor:"pointer", fontSize:12 }}>{u.is_active ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))
          )}

          {/* ── TICKETS TAB ── */}
          {adminTab === "tickets" && (
            adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
            adminTickets.length === 0 ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>No support tickets</div> :
            adminTickets.map(t => (
              <div key={t.id} style={{ ...S.card, padding:"16px 18px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{t.subject}</div>
                  <div style={{ fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:8, background: t.status==="resolved" ? "#e8f5e9" : t.status==="in_progress" ? "#fff3e0" : "#e3f2fd", color: t.status==="resolved" ? "#2e7d32" : t.status==="in_progress" ? "#e65100" : "#1565c0" }}>{t.status.replace("_"," ")}</div>
                </div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:6 }}>User #{t.user_id} · {new Date(t.created_at).toLocaleString()}</div>
                <div style={{ fontSize:13, color:T.subtext, marginBottom:10 }}>{t.message}</div>
                <AdminTicketReply ticket={t} T={T} S={S} onRefresh={loadAdminTickets} />
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
                    ["Price (₹)", "price", "number"], ["Unit (e.g. 1 gallon)", "unit", "text"],
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
                  {productFormError && (
                    <div style={{ background:"#ffebee", color:"#c62828", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                      <span>⚠️</span> {productFormError}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={async () => {
                      setProductFormError("");
                      if (!PF.name.trim()) { setProductFormError("Product name is required"); return; }
                      if (!PF.price || isNaN(parseFloat(PF.price)) || parseFloat(PF.price) <= 0) { setProductFormError("Please enter a valid price greater than 0"); return; }
                      if (!PF.unit.trim()) { setProductFormError("Unit is required (e.g. 1 litre, 500g)"); return; }
                      if (!PF.stock || isNaN(parseInt(PF.stock)) || parseInt(PF.stock) < 0) { setProductFormError("Please enter a valid stock quantity"); return; }
                      try {
                        const payload = { ...PF, name: PF.name.trim(), unit: PF.unit.trim(), price: parseFloat(PF.price), stock: parseInt(PF.stock), calories: PF.calories ? parseInt(PF.calories) : null };
                        if (editingProduct) { await api.put("/products/" + editingProduct.id, payload); }
                        else { await api.post("/products/", payload); }
                        setShowProductForm(false); setEditingProduct(null); setProductFormError("");
                        await loadAdminProducts();
                        showToast(editingProduct ? "Product updated!" : "Product created!", "success");
                      } catch (e) { setProductFormError(e.response?.data?.detail || "Failed to save product"); }
                    }} style={{ ...S.btn, flex:1 }}>{editingProduct ? "Save Changes" : "Create Product"}</button>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null); setProductFormError(""); }} style={{ flex:1, padding:"17px", background:T.card, color:T.text, border:`2px solid ${T.cardBorder}`, borderRadius:18, fontSize:16, fontWeight:800, cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              {adminLoading ? <div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading...</div> :
                adminProducts.map(p => (
                  <div key={p.id} style={{ ...S.card, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ fontSize:36 }}>{p.emoji}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:T.text }}>{p.name}</div>
                      <div style={{ fontSize:12, color:T.muted }}>₹{p.price} · {p.unit} · Stock: {p.stock}</div>
                      <div style={{ fontSize:11, color: p.is_active ? T.accent : T.danger }}>{p.is_active ? "● Active" : "● Inactive"}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setEditingProduct(p); setProductForm({ name:p.name, description:p.description||"", price:p.price, unit:p.unit, category:p.category, emoji:p.emoji||"", badge:p.badge||"", stock:p.stock, calories:p.calories||"", protein:p.protein||"", fat:p.fat||"", carbs:p.carbs||"" }); setShowProductForm(true); }} style={{ background:T.tag, border:"none", borderRadius:10, padding:"8px 12px", color:T.tagText, fontWeight:800, cursor:"pointer", fontSize:13 }}>✏️</button>
                      <button onClick={async () => { if(window.confirm(`Delete "${p.name}"? This cannot be undone.`)) { try { await api.delete("/products/" + p.id); await loadAdminProducts(); showToast("Product deleted", "success"); } catch(e) { showToast(e.response?.data?.detail || "Failed to delete product"); } } }} style={{ background:"#ffebee", border:"none", borderRadius:10, padding:"8px 12px", color:"#c62828", fontWeight:800, cursor:"pointer", fontSize:13 }}>🗑</button>
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
      <div className="dd-header-pad" style={{ background: T.hero, padding: "0 24px 24px" }}>
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
      <div style={{ ...S.scroll, paddingBottom: "calc(80px + env(safe-area-inset-bottom, 16px))", background: T.screenBg }}>
        <div style={{ margin: "16px 20px", background: dark ? "linear-gradient(135deg,#1a3a1b,#2a4a2b)" : "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 24, padding: "20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 72, opacity: 0.85, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))" }}>🐄</div>
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
          <div className="dd-product-grid" style={{}}>
            {products.map(product => (
              <div key={product.id} style={{ ...S.card, borderRadius: 22, overflow: "hidden" }}>
                <div onClick={async () => { setSelectedProduct(product); const { data } = await reviewsAPI.forProduct(product.id); setProductReviews(data); setScreen("product"); }} style={{ background: dark ? T.tag : "#f1f8e9", padding: "20px 16px 16px", position: "relative", cursor: "pointer" }}>
                  {product.badge && <div style={{ position: "absolute", top: 10, left: 10, background: product.badge === "bestseller" ? "#ff6f00" : product.badge === "popular" ? "#6a1b9a" : "#00838f", color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{product.badge}</div>}
                  {product.stock < 10 && product.stock > 0 && <div style={{ position: "absolute", top: 10, right: 10, background: "#e53935", color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 800 }}>Only {product.stock} left!</div>}
                  {product.stock === 0 && <div style={{ position: "absolute", top: 10, right: 10, background: "#757575", color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 800 }}>Out of Stock</div>}
                  {/* Heart / wishlist toggle */}
                  <button onClick={(e) => toggleWishlist(product.id, e)} style={{ position: "absolute", bottom: 8, right: 8, background: isWishlisted(product.id) ? "#fee2e2" : "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 28, height: 28, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.12)", transition: "transform 0.15s", zIndex: 2 }}
                    onMouseEnter={e => e.currentTarget.style.transform="scale(1.2)"}
                    onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
                  >{isWishlisted(product.id) ? "❤️" : "🤍"}</button>
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
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.accent }}>₹{product.price}</div>
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
      <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} T={T} user={user} />
    </>
  );
}

function AdminTicketReply({ ticket, T, S, onRefresh }) {
  const [reply, setReply] = React.useState(ticket.admin_reply || "");
  const [saving, setSaving] = React.useState(false);
  const doReply = async () => {
    setSaving(true);
    try {
      await fetch(`/api/support/admin/${ticket.id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ reply, status: "resolved" })
      });
      await onRefresh();
    } catch {}
    setSaving(false);
  };
  return (
    <div>
      <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply to this ticket..." rows={3}
        style={{ width:"100%", padding:"10px 12px", border:`1px solid ${T.inputBorder}`, borderRadius:10, fontSize:13, background:T.input, color:T.text, boxSizing:"border-box", resize:"none", fontFamily:"inherit" }} />
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button onClick={doReply} disabled={saving || !reply.trim()} style={{ flex:1, padding:"9px", background:"#1565c0", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:800, cursor:"pointer", opacity:saving || !reply.trim() ? 0.6 : 1 }}>
          {saving ? "Sending..." : "Send Reply & Resolve"}
        </button>
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen, cartCount, T, user }) {
  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "wishlist", icon: "❤️", label: "Saved" },
    { id: "cart", icon: "🛒", label: "Cart", badge: cartCount },
    { id: "tracking", icon: "📦", label: "Orders" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <div className="dd-bottomnav" style={{ background: T.navBg, borderTop: `1px solid ${T.navBorder}`, display: "flex", padding: "8px 0 env(safe-area-inset-bottom, 16px)", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setScreen(tab.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative", padding: "4px 0" }}>
          <div style={{ fontSize: 22 }}>{tab.icon}</div>
          {tab.badge > 0 && <div style={{ position: "absolute", top: 0, right: "50%", marginRight: -20, background: "#e53935", color: "#fff", borderRadius: 10, minWidth: 17, height: 17, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{tab.badge}</div>}
          <div style={{ fontSize: 10, fontWeight: screen === tab.id ? 900 : 600, color: screen === tab.id ? T.accent : T.muted }}>{tab.label}</div>
          {screen === tab.id && <div style={{ width: 4, height: 4, background: T.accent, borderRadius: "50%", marginTop: 1 }} />}
        </button>
      ))}
    </div>
  );
}