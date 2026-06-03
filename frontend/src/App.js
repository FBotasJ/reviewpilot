import logo from "./assets/logo.png";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (frontend) ────────────────────────────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: fetch con Authorization header del usuario actual
async function authFetch(url, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
}

// Lee la URL del servidor desde variable de entorno
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const FONT = "'Instrument Serif', serif";
const BODY = "'Outfit', sans-serif";

/* ─── LOGO COMPONENT ───────────────────────────────────────────────────────── */
const Logo = ({ height = 36, dark = false }) => (
  <img
    src={logo}
    alt="ReviewPilot"
    style={{
      height,
      width: "auto",
      objectFit: "contain",
      display: "block",
      filter: dark ? "brightness(0) invert(1)" : "none",
    }}
  />
);

/* ─── Utilidades ─────────────────────────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function Btn({ children, onClick, variant = "dark", size = "md", style: s = {}, disabled }) {
  const sizes = { sm: { padding: "8px 18px", fontSize: 13 }, md: { padding: "12px 24px", fontSize: 14 }, lg: { padding: "16px 36px", fontSize: 16 } };
  const variants = {
    dark: { background: "#0a0a0a", color: "#fff", border: "none" },
    light: { background: "#fff", color: "#0a0a0a", border: "1.5px solid #e0e0e0" },
    ghost: { background: "transparent", color: "#0a0a0a", border: "1.5px solid #0a0a0a" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        borderRadius: 12, cursor: disabled ? "default" : "pointer",
        fontFamily: BODY, fontWeight: 600, transition: "all 0.18s",
        display: "inline-flex", alignItems: "center", gap: 8,
        opacity: disabled ? 0.45 : 1,
        ...variants[variant], ...sizes[size], ...s,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.82")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}
    >{children}</button>
  );
}

/* ─── LANDING PAGE ───────────────────────────────────────────────────────── */
function LandingPage({ onGetStarted, onPrivacy, onTerms, onContact }) {
  const steps = [
    { n: "01", title: "Conecta tu tienda", desc: "Shopify, WooCommerce, Airbnb o Stripe. Un clic y listo." },
    { n: "02", title: "Elige el disparador", desc: "Pedido entregado, check-out, onboarding completado…" },
    { n: "03", title: "La IA escribe el mensaje", desc: "Claude genera 3 opciones personalizadas para tu negocio." },
    { n: "04", title: "Las reseñas llegan solas", desc: "El sistema envía, registra y mide. Tú solo revisas el dashboard." },
  ];

  const testimonials = [
    { name: "Carla M.", role: "Anfitriona Airbnb · Madrid", text: "Pasé de 12 a 47 reseñas en 6 semanas sin hacer nada.", stars: 5 },
    { name: "Diego R.", role: "Tienda Shopify · CDMX", text: "La tasa de conversión pasó del 8% al 41% vs cuando lo hacía manual.", stars: 5 },
    { name: "Sofía K.", role: "SaaS B2B · Buenos Aires", text: "El trigger de onboarding es oro puro. El momento perfecto.", stars: 5 },
  ];

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh", fontFamily: BODY }}>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,250,250,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #ececec",
        padding: "0 48px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 22, fontFamily: FONT, color: "#0a0a0a" }}>ReviewPilot</span>
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#777" }}>
          {["Producto", "Precios", "Docs"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
        </div>
        <Btn onClick={onGetStarted} size="sm">Empezar gratis →</Btn>
      </nav>

      {/* HERO */}
      <section style={{ padding: "100px 48px 80px", textAlign: "center", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ background: "#0a0a0a", color: "#fff", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
            ✨ Mensajes generados con IA
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: 1.1, fontFamily: FONT, color: "#0a0a0a", marginBottom: 24, fontWeight: 400 }}>
          Más reseñas,<br /><em style={{ color: "#666" }}>sin pedirlas tú.</em>
        </h1>
        <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 40px" }}>
          Conecta tu tienda y envía solicitudes automáticas justo cuando el cliente está más satisfecho.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={onGetStarted} size="lg">Conectar mi tienda →</Btn>
          <Btn variant="light" size="lg">Ver demo</Btn>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "#bbb" }}>Sin tarjeta · 14 días gratis · Cancela cuando quieras</p>

        {/* Floating preview card */}
        <div style={{
          marginTop: 60, background: "#fff", border: "1px solid #ececec",
          borderRadius: 20, padding: "22px 26px", maxWidth: 400, margin: "60px auto 0",
          boxShadow: "0 8px 40px rgba(0,0,0,0.07)", textAlign: "left",
          animation: "float 4s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📦</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a" }}>Pedido entregado · Carlos M.</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>hace 2 minutos</div>
            </div>
            <span style={{ marginLeft: "auto", background: "#0a0a0a", color: "#fff", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>✓ Enviado</span>
          </div>
          <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#444", lineHeight: 1.6 }}>
            "Hola Carlos, tu pedido llegó 🎉 ¿Qué te pareció? Una reseña en Google nos ayuda un montón."
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#aaa", display: "flex", gap: 8 }}>
            <span>💬 WhatsApp</span><span>·</span><span>⭐ Google</span><span>·</span><span style={{ color: "#22c55e", fontWeight: 700 }}>41% conversión</span>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section style={{ padding: "36px 48px", borderTop: "1px solid #ececec", borderBottom: "1px solid #ececec", background: "#fff" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", letterSpacing: 2, fontWeight: 700, marginBottom: 20 }}>SE CONECTA CON</p>
        <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
          {[["🛍️","Shopify"],["🛒","WooCommerce"],["🏠","Airbnb"],["💳","Stripe"],["📅","Calendly"],["🔍","Google"],["⭐","Trustpilot"]].map(([icon,name]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "#888", fontWeight: 500 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>{name}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "90px 48px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: 40, fontFamily: FONT, fontWeight: 400, color: "#0a0a0a" }}>De cero a reseñas<br /><em>en 10 minutos</em></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 18, padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 12, color: "#bbb", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{s.n}</div>
              <h3 style={{ fontSize: 19, fontFamily: FONT, fontWeight: 400, color: "#0a0a0a", marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "80px 48px", background: "#f5f5f5" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: 40, fontFamily: FONT, fontWeight: 400, textAlign: "center", marginBottom: 48, color: "#0a0a0a" }}>
            Lo que dicen <em>quienes ya lo usan</em>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 18, padding: "26px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ color: "#f59e0b", fontSize: 14, marginBottom: 12 }}>{"★".repeat(t.stars)}</div>
                <p style={{ fontSize: 14, color: "#444", lineHeight: 1.75, marginBottom: 18 }}>"{t.text}"</p>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "90px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontFamily: FONT, fontWeight: 400, marginBottom: 48, color: "#0a0a0a" }}>Simple y transparente</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { name: "Starter", price: "$9", features: ["1 plataforma","500 envíos/mes","Email y SMS","2 reglas activas"], highlight: false },
              { name: "Growth", price: "$29", features: ["5 plataformas","5,000 envíos/mes","Email, SMS y WhatsApp","Reglas ilimitadas","Mensajes con IA"], highlight: true },
              { name: "Scale", price: "$79", features: ["Ilimitado todo","Analytics avanzado","Soporte prioritario","API access"], highlight: false },
            ].map((p, i) => (
              <div key={i} style={{
                background: p.highlight ? "#0a0a0a" : "#fff",
                border: p.highlight ? "none" : "1px solid #ececec",
                borderRadius: 20, padding: "30px 26px",
                boxShadow: p.highlight ? "0 12px 40px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                position: "relative",
              }}>
                {p.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#000", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>MÁS POPULAR</div>}
                <div style={{ fontSize: 15, fontWeight: 700, color: p.highlight ? "#fff" : "#0a0a0a", marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 34, fontWeight: 700, fontFamily: FONT, color: p.highlight ? "#fff" : "#0a0a0a", marginBottom: 20 }}>{p.price}<span style={{ fontSize: 14, color: p.highlight ? "#888" : "#aaa", fontWeight: 400 }}>/mes</span></div>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9, fontSize: 13, color: p.highlight ? "#ccc" : "#555" }}>
                    <span style={{ color: "#22c55e" }}>✓</span>{f}
                  </div>
                ))}
                <Btn onClick={onGetStarted} variant={p.highlight ? "light" : "dark"} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>Empezar</Btn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "90px 48px", textAlign: "center", background: "#0a0a0a" }}>
        <h2 style={{ fontSize: 48, fontFamily: FONT, fontWeight: 400, color: "#fff", lineHeight: 1.15, marginBottom: 20 }}>
          Tu próxima reseña<br /><em style={{ color: "#888" }}>ya está en camino.</em>
        </h2>
        <Btn onClick={onGetStarted} size="lg" variant="light">Crear cuenta gratis →</Btn>
      </section>

      <footer style={{ borderTop: "1px solid #222", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0a0a", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 18, fontFamily: FONT, color: "#fff" }}>ReviewPilot</span>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <span
            onClick={onPrivacy}
            style={{ fontSize: 13, color: "#888", cursor: "pointer", fontFamily: BODY }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "#888"}
          >Política de Privacidad</span>
          <span style={{ color: "#333", fontSize: 12 }}>|</span>
          <span
            onClick={onTerms}
            style={{ fontSize: 13, color: "#888", cursor: "pointer", fontFamily: BODY }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "#888"}
          >Términos de Servicio</span>
          <span style={{ color: "#333", fontSize: 12 }}>|</span>
          <span
            onClick={onContact}
            style={{ fontSize: 13, color: "#888", cursor: "pointer", fontFamily: BODY }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "#888"}
          >Contacto</span>
          <span style={{ color: "#333", fontSize: 12 }}>|</span>
          <a href="mailto:support@reviewpilot.company" style={{ fontSize: 13, color: "#888", textDecoration: "none", fontFamily: BODY }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "#888"}
          >support@reviewpilot.company</a>
          <span style={{ fontSize: 12, color: "#333" }}>© 2026 ReviewPilot</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── SHOPIFY CONNECT ─────────────────────────────────────────────────────── */
function ShopifyConnect({ onBack, onDone, session }) {
  const [shopInput, setShopInput] = useState("");
  const [step, setStep] = useState("form"); // form | connecting | done
  const [log, setLog] = useState([]);
  const [focused, setFocused] = useState(false);

  const addLog = (msg, type = "info") => setLog(prev => [...prev, { msg, type }]);

  const handleConnect = async () => {
    if (shopInput.length < 2) return;
    const domain = `${shopInput}.myshopify.com`;
    setStep("connecting");
    setLog([]);

    addLog(`Iniciando conexión con ${domain}…`);
    await sleep(700);
    addLog("Redirigiendo a Shopify OAuth…");
    await sleep(1100);
    addLog("Cliente autorizó la app ✓", "success");
    await sleep(700);
    addLog("Intercambiando código por access_token…");
    await sleep(900);
    addLog("Access token obtenido ✓", "success");
    await sleep(500);
    addLog("Registrando webhook: orders/fulfilled…");
    await sleep(800);
    addLog("Webhook registrado en Shopify ✓", "success");
    await sleep(500);
    addLog("Creando regla: Pedido entregado → Email Google ✓", "success");
    await sleep(400);
    addLog("¡Tienda conectada y lista! 🎉", "done");
    setStep("done");

    // Redirigir al OAuth real de Shopify con token de sesión en header
    // El backend guardará user_id en la tienda al completar el OAuth
    const token = session?.access_token;
    const oauthUrl = `https://reviewpilot-production-3183.up.railway.app/auth/shopify?shop=${domain}${token ? `&token=${token}` : ""}`;
    window.location.href = oauthUrl;
  };

  if (step === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontFamily: FONT, fontWeight: 400, marginBottom: 10 }}>¡Todo listo!</h2>
        <p style={{ fontSize: 15, color: "#777", marginBottom: 8, lineHeight: 1.7 }}>
          <strong>{shopInput}.myshopify.com</strong> está conectada.<br />
          Cada pedido entregado disparará automáticamente una solicitud de reseña.
        </p>
        <div style={{ background: "#f9f9f9", border: "1px solid #ececec", borderRadius: 14, padding: "18px 22px", margin: "24px 0", textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#bbb", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>REGLA ACTIVADA</div>
          {[["⚡","Disparador","Pedido entregado"],["✉️","Canal","Email"],["⭐","Destino","Google Reviews"],["🤖","Mensaje","Generado con IA"],["⏱️","Timing","48h después"]].map(([icon,label,val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: "#888" }}>{icon} {label}</span>
              <span style={{ fontWeight: 600, color: "#0a0a0a" }}>{val}</span>
            </div>
          ))}
        </div>
        <Btn onClick={onDone} style={{ width: "100%", justifyContent: "center" }}>Ir al dashboard →</Btn>
      </div>
    );
  }

  if (step === "connecting") {
    const statusOrder = ["form","connecting","done"];
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, border: "3px solid #e5e7eb", borderTopColor: "#0a0a0a", borderRadius: "50%", margin: "0 auto 14px", animation: "spin 0.8s linear infinite" }} />
          <h2 style={{ fontSize: 22, fontFamily: FONT, fontWeight: 400 }}>Conectando tu tienda…</h2>
          <p style={{ fontSize: 13, color: "#aaa" }}>{shopInput}.myshopify.com</p>
        </div>
        <div style={{ background: "#0a0a0a", borderRadius: 12, padding: "16px 18px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.9, maxHeight: 220, overflowY: "auto" }}>
          {log.map((l, i) => (
            <div key={i} style={{ color: l.type === "success" ? "#4ade80" : l.type === "done" ? "#facc15" : "#aaa" }}>
              <span style={{ color: "#444" }}>&gt; </span>{l.msg}
            </div>
          ))}
          <span style={{ color: "#444", animation: "blink 1s infinite" }}>▋</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", marginBottom: 20, fontFamily: BODY }}>← Volver</button>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🛍️</div>
        <h2 style={{ fontSize: 26, fontFamily: FONT, fontWeight: 400, color: "#0a0a0a", marginBottom: 8 }}>Conecta tu tienda Shopify</h2>
        <p style={{ fontSize: 14, color: "#777", lineHeight: 1.6 }}>Ingresa tu dominio y nosotros hacemos el resto en segundos.</p>
      </div>

      <div style={{
        display: "flex", alignItems: "center",
        border: focused ? "2px solid #0a0a0a" : "1.5px solid #e0e0e0",
        borderRadius: 12, overflow: "hidden", background: "#fff", marginBottom: 10, transition: "border 0.15s",
      }}>
        <span style={{ padding: "0 14px", fontSize: 13, color: "#bbb", whiteSpace: "nowrap" }}>https://</span>
        <input
          value={shopInput}
          onChange={e => setShopInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="mi-tienda"
          style={{ flex: 1, border: "none", outline: "none", padding: "13px 0", fontSize: 14, fontFamily: BODY, background: "transparent" }}
        />
        <span style={{ padding: "0 14px", fontSize: 13, color: "#bbb", whiteSpace: "nowrap" }}>.myshopify.com</span>
      </div>
      <p style={{ fontSize: 12, color: "#bbb", marginBottom: 24 }}>Ejemplo: si tu tienda es <strong>mi-tienda.myshopify.com</strong>, escribe solo <strong>mi-tienda</strong></p>

      <Btn onClick={handleConnect} disabled={shopInput.length < 2} style={{ width: "100%", justifyContent: "center" }}>
        Conectar con Shopify →
      </Btn>

      <div style={{ marginTop: 20, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {["🔒 OAuth 2.0 seguro", "✓ Sin acceso a pagos", "✓ Cancela cuando quieras"].map((t, i) => (
          <span key={i} style={{ fontSize: 12, color: "#bbb" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── STORE DETAIL ───────────────────────────────────────────────────────── */
function StoreDetail({ store, onBack, onStoreUpdated }) {
  const [rules, setRules] = useState(
    store.rules && store.rules.length > 0
      ? store.rules
      : [{ id: null, triggerLabel: "Pedido entregado", channel: "email", reviewPlatform: "Google", active: true }]
  );
  const [saving, setSaving] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newRule, setNewRule] = useState({ delay_days: 7, channel: "email", prompt: "" });
  const [creating_saving, setCreatingSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [previews, setPreviews] = useState({});
  const [sendTests, setSendTests] = useState({});
  const [googleUrl, setGoogleUrl] = useState(store.googleReviewUrl || "");
  const [googleUrlSaving, setGoogleUrlSaving] = useState(false);
  const [googleUrlSaved, setGoogleUrlSaved] = useState(false);

  // ── Toggle activo/inactivo ─────────────────────────────────────────────────
  const toggleRule = async (rule) => {
    if (!rule.id) { console.warn("[ReviewPilot] rule.id es null"); return; }
    setSaving(rule.id);
    const newActive = !rule.active;
    console.log(`[ReviewPilot] PATCH toggle → ruleId=${rule.id} active=${newActive}`);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/stores/${encodeURIComponent(store.domain)}/rules/${rule.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: newActive }) }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      const data = JSON.parse(text);
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: data.rule.active } : r));
      if (onStoreUpdated) onStoreUpdated();
    } catch (err) {
      console.error("[ReviewPilot] Error toggle:", err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  // ── Guardar edición ────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editing) return;
    setSaving(editing.ruleId);
    console.log(`[ReviewPilot] PATCH edit → ruleId=${editing.ruleId}`, editing);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/stores/${encodeURIComponent(store.domain)}/rules/${editing.ruleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delay_days: Number(editing.delay_days),
            channel: editing.channel,
            prompt: editing.prompt,
          }),
        }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      const data = JSON.parse(text);
      setRules(prev => prev.map(r =>
        r.id === editing.ruleId
          ? { ...r, delay_days: data.rule.delay_days, channel: data.rule.channel, prompt: data.rule.prompt }
          : r
      ));
      setEditing(null);
      if (onStoreUpdated) onStoreUpdated();
    } catch (err) {
      console.error("[ReviewPilot] Error saveEdit:", err.message);
      alert(`Error guardando: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  // ── Crear nueva regla ──────────────────────────────────────────────────────
  const createRule = async () => {
    setCreatingSaving(true);
    console.log(`[ReviewPilot] POST nueva regla para ${store.domain}:`, newRule);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/stores/${encodeURIComponent(store.domain)}/rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delay_days: Number(newRule.delay_days),
            channel: newRule.channel,
            prompt: newRule.prompt,
          }),
        }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      const data = JSON.parse(text);
      // Agrega la nueva regla al estado local
      setRules(prev => [...prev, data.rule]);
      setCreating(false);
      setNewRule({ delay_days: 7, channel: "email", prompt: "" });
      // Refresca el dashboard
      if (onStoreUpdated) onStoreUpdated();
    } catch (err) {
      console.error("[ReviewPilot] Error createRule:", err.message);
      alert(`Error creando la regla: ${err.message}`);
    } finally {
      setCreatingSaving(false);
    }
  };

  // ── Eliminar regla ─────────────────────────────────────────────────────────
  const deleteRule = async (ruleId) => {
    setSaving(ruleId);
    console.log(`[ReviewPilot] DELETE regla id=${ruleId}`);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/rules/${ruleId}`,
        { method: "DELETE" }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      // Elimina la tarjeta del estado local
      setRules(prev => prev.filter(r => r.id !== ruleId));
      setConfirming(null);
      if (onStoreUpdated) onStoreUpdated();
    } catch (err) {
      console.error("[ReviewPilot] Error deleteRule:", err.message);
      alert(`Error eliminando la regla: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  // ── Vista previa con IA ────────────────────────────────────────────────────
  const generatePreview = async (ruleId) => {
    setPreviews(prev => ({ ...prev, [ruleId]: { loading: true, message: null, error: null } }));
    console.log(`[ReviewPilot] POST preview → ruleId=${ruleId}`);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/rules/${ruleId}/preview`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      const data = JSON.parse(text);
      setPreviews(prev => ({ ...prev, [ruleId]: { loading: false, message: data.message, error: null } }));
    } catch (err) {
      console.error("[ReviewPilot] Error preview:", err.message);
      setPreviews(prev => ({ ...prev, [ruleId]: { loading: false, message: null, error: "No se pudo generar la vista previa. Intenta de nuevo." } }));
    }
  };

  // ── Enviar correo de prueba ────────────────────────────────────────────────
  const sendTest = async (ruleId) => {
    setSendTests(prev => ({ ...prev, [ruleId]: { loading: true, sent: false, error: null } }));
    console.log(`[ReviewPilot] POST send-test → ruleId=${ruleId}`);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/rules/${ruleId}/send-test`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      setSendTests(prev => ({ ...prev, [ruleId]: { loading: false, sent: true, error: null } }));
      // Reset "enviado" después de 5 segundos
      setTimeout(() => setSendTests(prev => ({ ...prev, [ruleId]: { loading: false, sent: false, error: null } })), 5000);
    } catch (err) {
      console.error("[ReviewPilot] Error send-test:", err.message);
      setSendTests(prev => ({ ...prev, [ruleId]: { loading: false, sent: false, error: "No se pudo enviar el correo. Intenta de nuevo." } }));
    }
  };

  // ── Guardar enlace de Google Reviews ──────────────────────────────────────
  const saveGoogleUrl = async () => {
    setGoogleUrlSaving(true);
    setGoogleUrlSaved(false);
    console.log(`[ReviewPilot] PATCH store google_review_url → ${googleUrl}`);
    try {
      const res = await fetch(
        `https://reviewpilot-production-3183.up.railway.app/api/stores/${encodeURIComponent(store.domain)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ google_review_url: googleUrl }),
        }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      setGoogleUrlSaved(true);
      if (onStoreUpdated) onStoreUpdated();
      setTimeout(() => setGoogleUrlSaved(false), 4000);
    } catch (err) {
      console.error("[ReviewPilot] Error guardando google_review_url:", err.message);
      alert(`Error guardando el enlace: ${err.message}`);
    } finally {
      setGoogleUrlSaving(false);
    }
  };

  const stepIcons = { "orders/fulfilled": "📦", email: "✉️", Email: "✉️", whatsapp: "💬", sms: "📱" };
  const inp = { border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: BODY, width: "100%", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: BODY }}>
      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ececec", padding: "0 40px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888", padding: 0 }}>←</button>
        <span style={{ fontSize: 20, fontFamily: FONT }}>ReviewPilot</span>
      </div>

      <div style={{ maxWidth: 640, margin: "48px auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: "#aaa", marginBottom: 4 }}>Solicitudes de reseña</p>
          <h1 style={{ fontSize: 26, fontFamily: FONT, fontWeight: 400, color: "#0a0a0a", wordBreak: "break-all" }}>{store.domain}</h1>
        </div>

        {/* Meta card */}
        <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 16, padding: "22px 26px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              ["Conectada", new Date(store.connectedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })],
              ["Total solicitudes", rules.length],
              ["Solicitudes activas", rules.filter(r => r.active).length],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", fontFamily: FONT }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Enlace de Google Reviews */}
        <div style={{ background: "#fff", border: `1px solid ${googleUrl ? "#ececec" : "#fde68a"}`, borderRadius: 16, padding: "22px 26px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a" }}>🔗 Enlace de Google Reviews</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Se usará en los correos de solicitud de reseña</div>
            </div>
            {googleUrl && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "#dcfce7", color: "#166534" }}>
                Configurado
              </span>
            )}
          </div>

          {/* Aviso si no hay enlace */}
          {!googleUrl && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#92400e" }}>
              ⚠️ Agrega tu enlace de Google Reviews para poder enviar solicitudes reales.
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="url"
              value={googleUrl}
              onChange={e => { setGoogleUrl(e.target.value); setGoogleUrlSaved(false); }}
              placeholder="https://g.page/r/tu-enlace-de-google-reviews"
              style={{ ...inp, flex: 1 }}
              onFocus={e => e.target.style.borderColor = "#0a0a0a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
            <button
              onClick={saveGoogleUrl}
              disabled={googleUrlSaving}
              style={{
                background: googleUrlSaved ? "#16a34a" : "#0a0a0a",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                cursor: googleUrlSaving ? "default" : "pointer",
                fontFamily: BODY, whiteSpace: "nowrap",
                transition: "background 0.2s",
                opacity: googleUrlSaving ? 0.7 : 1,
              }}
            >
              {googleUrlSaving ? "Guardando…" : googleUrlSaved ? "✓ Enlace guardado" : "Guardar enlace"}
            </button>
          </div>
        </div>

        {/* Rules */}
        {rules.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 16, padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#aaa" }}>No hay solicitudes de reseña configuradas.</p>
          </div>
        )}

        {rules.map((rule) => {
          const isSaving = saving === rule.id;
          const isEditing = editing?.ruleId === rule.id;
          const steps = [
            { icon: "📦", label: rule.triggerLabel ? rule.triggerLabel.replace("Pedido entregado", "Cuando se entrega un pedido") : "Cuando se entrega un pedido" },
            { icon: "⏱️", label: `Enviar después de ${rule.delay_days ?? 7} días` },
            { icon: stepIcons[rule.channel] || "✉️", label: `Enviar por ${rule.channel || "email"}` },
          ];

          return (
            <div key={rule.id || "default"} style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 16 }}>

              {/* Card header */}
              <div style={{ padding: "18px 26px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a" }}>Solicitud de reseña</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{rule.reviewPlatform || "Google"} · {rule.channel || "Email"}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 99, background: rule.active ? "#dcfce7" : "#f3f4f6", color: rule.active ? "#166534" : "#888" }}>
                  {rule.active ? "Solicitud activa" : "Solicitud desactivada"}
                </span>
              </div>

              {/* Steps (ocultos mientras se edita) */}
              {!isEditing && (
                <div style={{ padding: "22px 26px" }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: rule.active ? "#f0fdf4" : "#f3f4f6", border: `1.5px solid ${rule.active ? "#bbf7d0" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          {step.icon}
                        </div>
                        {i < steps.length - 1 && <div style={{ width: 2, height: 20, background: "#f0f0f0", marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingTop: 7 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: rule.active ? "#0a0a0a" : "#aaa" }}>
                          {rule.active ? "✓ " : ""}{step.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vista previa con IA + Enviar prueba */}
              {!isEditing && rule.id && (() => {
                const p = previews[rule.id];
                const t = sendTests[rule.id];
                return (
                  <div style={{ padding: "0 26px 20px" }}>
                    {/* Botones lado a lado */}
                    {(!p || (!p.loading && !p.message && !p.error)) && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => generatePreview(rule.id)}
                          style={{
                            background: "none", border: "1.5px solid #e5e7eb",
                            borderRadius: 10, padding: "8px 16px",
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            color: "#555", fontFamily: BODY,
                            display: "flex", alignItems: "center", gap: 6,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#0a0a0a"; e.currentTarget.style.color = "#0a0a0a"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#555"; }}
                        >
                          🤖 Vista previa con IA
                        </button>

                        <button
                          onClick={() => sendTest(rule.id)}
                          disabled={t?.loading}
                          style={{
                            background: "none", border: "1.5px solid #e5e7eb",
                            borderRadius: 10, padding: "8px 16px",
                            fontSize: 13, fontWeight: 600,
                            cursor: t?.loading ? "default" : "pointer",
                            color: t?.sent ? "#16a34a" : "#555",
                            borderColor: t?.sent ? "#bbf7d0" : "#e5e7eb",
                            fontFamily: BODY,
                            display: "flex", alignItems: "center", gap: 6,
                            transition: "all 0.15s",
                            opacity: t?.loading ? 0.6 : 1,
                          }}
                          onMouseEnter={e => { if (!t?.loading && !t?.sent) { e.currentTarget.style.borderColor = "#0a0a0a"; e.currentTarget.style.color = "#0a0a0a"; }}}
                          onMouseLeave={e => { if (!t?.loading && !t?.sent) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#555"; }}}
                        >
                          {t?.loading ? (
                            <>
                              <div style={{ width: 12, height: 12, border: "2px solid #e5e7eb", borderTopColor: "#555", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              Enviando…
                            </>
                          ) : t?.sent ? "✓ Correo enviado" : "✉️ Enviar prueba"}
                        </button>
                      </div>
                    )}

                    {/* Error de envío */}
                    {t?.error && !p?.message && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#b91c1c", fontFamily: BODY }}>⚠️ {t.error}</span>
                        <button onClick={() => sendTest(rule.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#b91c1c", fontFamily: BODY, padding: 0, fontWeight: 600 }}>
                          Reintentar
                        </button>
                      </div>
                    )}

                    {/* Cargando preview */}
                    {p?.loading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
                        <div style={{ width: 16, height: 16, border: "2px solid #e5e7eb", borderTopColor: "#0a0a0a", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#888", fontFamily: BODY }}>Generando mensaje con IA…</span>
                      </div>
                    )}

                    {/* Mensaje generado */}
                    {p?.message && (
                      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, textTransform: "uppercase" }}>
                            🤖 Ejemplo generado con IA
                          </span>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <button
                              onClick={() => sendTest(rule.id)}
                              disabled={t?.loading}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: t?.sent ? "#16a34a" : "#555", fontFamily: BODY, padding: 0, fontWeight: 600 }}
                            >
                              {t?.loading ? "Enviando…" : t?.sent ? "✓ Enviado" : "✉️ Enviar prueba"}
                            </button>
                            <button
                              onClick={() => generatePreview(rule.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#888", fontFamily: BODY, padding: 0 }}
                            >
                              ↻ Regenerar
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7, margin: 0, fontFamily: BODY }}>
                          {p.message}
                        </p>
                        <p style={{ fontSize: 11, color: "#bbb", margin: "10px 0 0" }}>
                          Cliente de ejemplo: Carlos · Tienda: ReviewPilot Demo
                        </p>
                      </div>
                    )}

                    {/* Error preview */}
                    {p?.error && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#b91c1c", fontFamily: BODY }}>⚠️ {p.error}</span>
                        <button
                          onClick={() => generatePreview(rule.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#b91c1c", fontFamily: BODY, padding: 0, fontWeight: 600 }}
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Formulario de edición */}
              {isEditing && (
                <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Disparador</label>
                    <div style={{ ...inp, background: "#f9f9f9", color: "#aaa", cursor: "default" }}>📦 Cuando se entrega un pedido (orders/fulfilled)</div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Días de espera</label>
                    <input
                      type="number" min={0} max={90}
                      value={editing.delay_days}
                      onChange={e => setEditing(prev => ({ ...prev, delay_days: e.target.value }))}
                      style={inp}
                      onFocus={e => e.target.style.borderColor = "#0a0a0a"}
                      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Canal</label>
                    <select
                      value={editing.channel}
                      onChange={e => setEditing(prev => ({ ...prev, channel: e.target.value }))}
                      style={{ ...inp, background: "#fff" }}
                    >
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Prompt (instrucción para la IA)</label>
                    <textarea
                      rows={4}
                      value={editing.prompt}
                      onChange={e => setEditing(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Ej: Escribe un mensaje cálido y breve para pedirle una reseña al cliente..."
                      style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                      onFocus={e => e.target.style.borderColor = "#0a0a0a"}
                      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                    <Btn size="sm" disabled={isSaving} onClick={saveEdit}>
                      {isSaving ? "Guardando…" : "💾 Guardar"}
                    </Btn>
                    <Btn variant="light" size="sm" onClick={() => setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>
              )}

              {/* Actions (ocultos mientras se edita) */}
              {!isEditing && confirming !== rule.id && (
                <div style={{ padding: "16px 26px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
                  <Btn
                    variant="light" size="sm" disabled={!rule.id}
                    onClick={() => setEditing({ ruleId: rule.id, delay_days: rule.delay_days ?? 7, channel: rule.channel || "email", prompt: rule.prompt || "" })}
                  >
                    ✏️ Editar
                  </Btn>
                  <Btn
                    variant={rule.active ? "ghost" : "dark"} size="sm"
                    disabled={isSaving || !rule.id}
                    onClick={() => toggleRule(rule)}
                  >
                    {isSaving ? "Guardando…" : rule.active ? "⏸ Desactivar" : "✓ Activar"}
                  </Btn>
                  <Btn
                    variant="light" size="sm" disabled={!rule.id}
                    onClick={() => setConfirming(rule.id)}
                    style={{ marginLeft: "auto", color: "#dc2626", borderColor: "#fecaca" }}
                  >
                    🗑 Eliminar
                  </Btn>
                </div>
              )}

              {/* Confirmación de eliminación */}
              {!isEditing && confirming === rule.id && (
                <div style={{ padding: "18px 26px", borderTop: "1px solid #fecaca", background: "#fef2f2" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#b91c1c", marginBottom: 14 }}>
                    ¿Seguro que deseas eliminar esta solicitud de reseña?
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn
                      size="sm"
                      disabled={isSaving}
                      onClick={() => deleteRule(rule.id)}
                      style={{ background: "#dc2626", color: "#fff", border: "none" }}
                    >
                      {isSaving ? "Eliminando…" : "Eliminar"}
                    </Btn>
                    <Btn variant="light" size="sm" onClick={() => setConfirming(null)}>
                      Cancelar
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Botón nueva automatización */}
        {!creating && (
          <button
            onClick={() => { setCreating(true); setNewRule({ delay_days: 7, channel: "email", prompt: "" }); }}
            style={{
              width: "100%", padding: "14px", borderRadius: 14,
              border: "1.5px dashed #d1d5db", background: "transparent",
              cursor: "pointer", fontSize: 14, fontWeight: 600,
              color: "#6b7280", fontFamily: BODY,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 16, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0a0a0a"; e.currentTarget.style.color = "#0a0a0a"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; }}
          >
            + Crear solicitud
          </button>
        )}

        {/* Formulario de nueva automatización */}
        {creating && (
          <div style={{ background: "#fff", border: "1.5px solid #0a0a0a", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginBottom: 16 }}>
            <div style={{ padding: "18px 26px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a" }}>Crear solicitud de reseña</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Se activará automáticamente al crear</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 99, background: "#dcfce7", color: "#166534" }}>
                Activa al guardar
              </span>
            </div>

            <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Trigger — solo lectura */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Disparador</label>
                <div style={{ ...inp, background: "#f9f9f9", color: "#aaa", cursor: "default" }}>📦 Cuando se entrega un pedido (orders/fulfilled)</div>
              </div>

              {/* Días de espera */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Días de espera</label>
                <input
                  type="number" min={0} max={90}
                  value={newRule.delay_days}
                  onChange={e => setNewRule(prev => ({ ...prev, delay_days: e.target.value }))}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = "#0a0a0a"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>

              {/* Canal */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Canal</label>
                <select
                  value={newRule.channel}
                  onChange={e => setNewRule(prev => ({ ...prev, channel: e.target.value }))}
                  style={{ ...inp, background: "#fff" }}
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              {/* Prompt */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Prompt (instrucción para la IA)</label>
                <textarea
                  rows={4}
                  value={newRule.prompt}
                  onChange={e => setNewRule(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Ej: Escribe un mensaje cálido y breve para pedirle una reseña al cliente..."
                  style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = "#0a0a0a"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <Btn size="sm" disabled={creating_saving} onClick={createRule}>
                  {creating_saving ? "Creando…" : "✓ Guardar solicitud"}
                </Btn>
                <Btn variant="light" size="sm" onClick={() => setCreating(false)}>Cancelar</Btn>
              </div>
            </div>
          </div>
        )}

        {store.source && (
          <p style={{ fontSize: 12, color: "#bbb", textAlign: "right", marginTop: 8 }}>Fuente: {store.source}</p>
        )}
      </div>
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard({ onConnectMore, onLogout, userEmail }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // tienda seleccionada para detalle

  const fetchStores = () => {
    setLoading(true);
    authFetch("https://reviewpilot-production-3183.up.railway.app/api/stores")
      .then(r => {
        if (r.status === 401) { if (onLogout) onLogout(); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setStores(data.stores || []);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo conectar con el servidor.");
        setLoading(false);
      });
  };

  useEffect(() => { fetchStores(); }, []);

  // Si hay tienda seleccionada, mostrar detalle
  if (selected) {
    return (
      <StoreDetail
        store={selected}
        onBack={() => setSelected(null)}
        onStoreUpdated={() => {
          setLoading(true);
          authFetch("https://reviewpilot-production-3183.up.railway.app/api/stores")
            .then(r => r.json())
            .then(data => {
              const fresh = data.stores || [];
              setStores(fresh);
              const refreshed = fresh.find(s => s.domain === selected.domain);
              if (refreshed) setSelected(refreshed);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        }}
      />
    );
  }

  const fmt = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: BODY }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #ececec", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20, fontFamily: FONT }}>ReviewPilot</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {userEmail && <span style={{ fontSize: 13, color: "#aaa" }}>{userEmail}</span>}
          <Btn onClick={onConnectMore} size="sm">+ Conectar tienda</Btn>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{ fontSize: 13, color: "#888", background: "none", border: "none", cursor: "pointer", fontFamily: BODY, padding: 0 }}
              onMouseEnter={e => e.target.style.color = "#0a0a0a"}
              onMouseLeave={e => e.target.style.color = "#888"}
            >Cerrar sesión</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 30, fontFamily: FONT, fontWeight: 400, marginBottom: 6 }}>Panel de reseñas</h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>Tus tiendas — selecciona una para administrar sus solicitudes de reseña</p>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#0a0a0a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 14, color: "#aaa" }}>Cargando tiendas desde Supabase…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", fontSize: 14, color: "#b91c1c" }}>
            ❌ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && stores.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
            <p style={{ fontSize: 15, color: "#555", marginBottom: 20 }}>No hay tiendas conectadas aún.</p>
            <Btn onClick={onConnectMore}>Conectar primera tienda</Btn>
          </div>
        )}

        {/* Stores list */}
        {!loading && !error && stores.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 22px", borderBottom: "1px solid #f3f4f6", background: "#f9f9f9" }}>
              {["Tienda", "Conectada", "Solicitudes", "Activas", "Estado"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {/* Rows — clickeables */}
            {stores.map((store, i) => {
              const isActive = store.activeRules > 0;
              return (
                <div
                  key={store.domain}
                  onClick={() => setSelected(store)}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    padding: "16px 22px", alignItems: "center",
                    borderBottom: i < stores.length - 1 ? "1px solid #f3f4f6" : "none",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9f9f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Tienda */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#22c55e" : "#e5e7eb", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{store.domain}</span>
                  </div>

                  {/* Conectada */}
                  <span style={{ fontSize: 13, color: "#666" }}>{fmt(store.connectedAt)}</span>

                  {/* Reglas */}
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{store.rulesCount}</span>

                  {/* Activas */}
                  <span style={{ fontSize: 14, fontWeight: 600, color: store.activeRules > 0 ? "#16a34a" : "#aaa" }}>{store.activeRules}</span>

                  {/* Estado */}
                  <span style={{
                    display: "inline-block", fontSize: 12, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 99,
                    background: isActive ? "#dcfce7" : "#f3f4f6",
                    color: isActive ? "#166534" : "#888",
                  }}>
                    {isActive ? "Activo" : "Sin solicitudes activas"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



/* ─── AUTH — LOGIN & REGISTER ───────────────────────────────────────────── */
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [focused, setFocused] = useState(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const switchMode = (m) => { setMode(m); setError(null); setSuccess(null); setConfirm(""); setShowPwd(false); setShowConfirm(false); setForgotMode(false); };

  const sendForgot = async () => {
    setForgotError(null);
    const trimmedEmail = (forgotEmail || "").trim();
    if (!trimmedEmail) {
      setForgotError("Ingresa tu correo electrónico.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setForgotError("Ingresa un correo electrónico válido.");
      return;
    }
    setForgotLoading(true);
    console.log("[Auth] Enviando correo de recuperación a:", trimmedEmail);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: "https://reviewpilot-fbj.netlify.app",
      });
      if (error) {
        console.log("RESET PASSWORD ERROR:", error);
        const msg = error.message || "";
        setForgotError(
          msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many")
            ? "Has realizado demasiados intentos en poco tiempo. Espera unos minutos e inténtalo nuevamente."
            : "No pudimos procesar tu solicitud. Verifica el correo e inténtalo nuevamente."
        );
        setForgotLoading(false);
        return;
      }
      console.log("[Auth] ✅ Correo de recuperación enviado a:", trimmedEmail);
      setForgotSuccess(true);
    } catch (err) {
      console.log("RESET PASSWORD ERROR:", err);
      setForgotError("No pudimos procesar tu solicitud. Verifica el correo e inténtalo nuevamente.");
    } finally {
      setForgotLoading(false);
    }
  };

  const inp = {
    flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10,
    padding: "12px 14px", fontSize: 14, fontFamily: BODY, outline: "none",
    transition: "border-color 0.15s", background: "#fff",
  };

  const eyeBtn = (show, toggle, field) => (
    <button
      type="button"
      onClick={toggle}
      tabIndex={-1}
      style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer", padding: 4,
        color: focused === field ? "#0a0a0a" : "#bbb", fontSize: 16, lineHeight: 1,
      }}
      title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {show ? "🙈" : "👁"}
    </button>
  );

  const friendlyError = (msg) => {
    console.error("[Auth] Error de Supabase:", msg);
    if (msg.includes("rate limit") || msg.includes("too many requests")) return "Has realizado demasiados intentos en poco tiempo. Espera unos minutos e inténtalo nuevamente.";
    if (msg.includes("already registered") || msg.includes("User already registered")) return "Ya existe una cuenta con este correo electrónico.";
    if (msg.includes("Invalid login credentials") || msg.includes("Invalid login")) return "Correo o contraseña incorrectos.";
    if (msg.includes("Email not confirmed")) return "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.";
    if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    return "Ocurrió un error inesperado. Inténtalo nuevamente.";
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!email || !password) { setError("Completa todos los campos."); return; }
    if (mode === "register") {
      if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
      if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        console.log("[Auth] ✅ Inicio de sesión exitoso:", data.user?.email);
        onAuth(data.session);
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        console.log("[Auth] ✅ Registro exitoso para:", email);
        setSuccess("Cuenta creada. Revisa tu correo para confirmar tu cuenta.");
        switchMode("login");
      }
    } catch (err) {
      setError(friendlyError(err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 26, fontFamily: FONT, color: "#0a0a0a" }}>ReviewPilot</span>
          <p style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>
            {mode === "login" ? "Inicia sesión para acceder a tu panel" : "Crea tu cuenta gratuita"}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 20, padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: 28, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
            {[["login", "Iniciar sesión"], ["register", "Crear cuenta"]].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                  background: mode === m ? "#fff" : "transparent",
                  color: mode === m ? "#0a0a0a" : "#888",
                  fontWeight: mode === m ? 700 : 400,
                  fontSize: 13, cursor: "pointer", fontFamily: BODY,
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{ ...inp, width: "100%", borderColor: focused === "email" ? "#0a0a0a" : "#e5e7eb" }}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Contraseña</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
                  style={{ ...inp, width: "100%", paddingRight: 40, borderColor: focused === "password" ? "#0a0a0a" : "#e5e7eb" }}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {eyeBtn(showPwd, () => setShowPwd(s => !s), "password")}
              </div>
            </div>

            {/* Confirmar contraseña — solo en registro */}
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Confirmar contraseña</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    style={{
                      ...inp, width: "100%", paddingRight: 40,
                      borderColor: confirm && confirm !== password ? "#f87171"
                        : focused === "confirm" ? "#0a0a0a" : "#e5e7eb",
                    }}
                    onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  {eyeBtn(showConfirm, () => setShowConfirm(s => !s), "confirm")}
                </div>
                {/* Indicador en tiempo real */}
                {confirm && confirm !== password && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Las contraseñas no coinciden.</p>
                )}
                {confirm && confirm === password && (
                  <p style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>✓ Las contraseñas coinciden.</p>
                )}
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#b91c1c" }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#166534" }}>
                ✓ {success}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: "#0a0a0a", color: "#fff", border: "none",
                borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700,
                cursor: loading ? "default" : "pointer", fontFamily: BODY,
                opacity: loading ? 0.7 : 1, marginTop: 4,
              }}
            >
              {loading ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>

            {/* Enlace olvidé contraseña — solo en login */}
            {mode === "login" && !forgotMode && (
              <button
                onClick={() => { setForgotMode(true); setForgotEmail(""); setForgotError(null); setForgotSuccess(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#888", fontFamily: BODY, padding: 0, textAlign: "center", textDecoration: "underline" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>

          {/* Formulario de recuperación — aparece debajo del login */}
          {forgotMode && (
            <div style={{ marginTop: 24, borderTop: "1px solid #f3f4f6", paddingTop: 20 }}>
              {!forgotSuccess ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", marginBottom: 4 }}>Recuperar contraseña</p>
                  <p style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>Te enviaremos un enlace para restablecer tu contraseña.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                      type="email" value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); setForgotError(null); }}
                      placeholder="tu@email.com"
                      style={{ ...inp, width: "100%", borderColor: "#e5e7eb" }}
                      onKeyDown={e => e.key === "Enter" && sendForgot()}
                    />
                    {forgotError && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#b91c1c" }}>
                        ⚠️ {forgotError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={sendForgot} disabled={forgotLoading}
                        style={{ flex: 1, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: forgotLoading ? "default" : "pointer", fontFamily: BODY, opacity: forgotLoading ? 0.7 : 1 }}
                      >
                        {forgotLoading ? "Enviando…" : "Enviar enlace"}
                      </button>
                      <button
                        onClick={() => setForgotMode(false)}
                        style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px 16px", fontSize: 13, color: "#555", cursor: "pointer", fontFamily: BODY }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#166534", marginBottom: 4 }}>Correo enviado</p>
                  <p style={{ fontSize: 13, color: "#166534" }}>Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.</p>
                  <button
                    onClick={() => { setForgotMode(false); setForgotSuccess(false); }}
                    style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#166534", fontFamily: BODY, textDecoration: "underline" }}
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 20 }}>
          Tus datos están seguros. No compartimos tu información con terceros.
        </p>
      </div>
    </div>
  );
}

/* ─── RESET PASSWORD PAGE ────────────────────────────────────────────────── */
function ResetPasswordPage({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const inp = {
    flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10,
    padding: "12px 14px", fontSize: 14, fontFamily: BODY, outline: "none",
    background: "#fff", width: "100%",
  };

  const handleReset = async () => {
    setError(null);
    if (!password) { setError("Ingresa tu nueva contraseña."); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    console.log("[Auth] Actualizando contraseña...");
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      console.log("[Auth] ✅ Contraseña actualizada correctamente");
      setSuccess(true);
      setTimeout(() => onDone(), 3000);
    } catch (err) {
      console.error("[Auth] Error actualizando contraseña:", err.message);
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado. Solicita uno nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 26, fontFamily: FONT, color: "#0a0a0a" }}>ReviewPilot</span>
          <p style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>Restablece tu contraseña</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 20, padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {!success ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 14, color: "#555" }}>Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.</p>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Nueva contraseña</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    style={{ ...inp, paddingRight: 40 }}
                    onKeyDown={e => e.key === "Enter" && handleReset()}
                  />
                  <button type="button" onClick={() => setShowPwd(s => !s)} tabIndex={-1}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#bbb" }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Confirmar contraseña</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    style={{ ...inp, paddingRight: 40, borderColor: confirm && confirm !== password ? "#f87171" : "#e5e7eb" }}
                    onKeyDown={e => e.key === "Enter" && handleReset()}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#bbb" }}>
                    {showConfirm ? "🙈" : "👁"}
                  </button>
                </div>
                {confirm && confirm !== password && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Las contraseñas no coinciden.</p>}
                {confirm && confirm === password && <p style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>✓ Las contraseñas coinciden.</p>}
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#b91c1c" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleReset} disabled={loading}
                style={{ background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: BODY, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Actualizando…" : "Guardar nueva contraseña"}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", fontFamily: FONT, marginBottom: 8 }}>Contraseña actualizada</p>
              <p style={{ fontSize: 14, color: "#666" }}>Tu contraseña ha sido actualizada correctamente. Redirigiendo al inicio de sesión…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CONTACT PAGE ───────────────────────────────────────────────────────── */
function ContactPage({ onBack }) {
  return (
    <LegalPage title="Contacto" onBack={onBack}>
      <Section title="¿Necesitas ayuda con ReviewPilot?">
        <Legal_P>Nuestro equipo está disponible para ayudarte con dudas sobre la aplicación, privacidad de datos, integraciones con Shopify o soporte técnico en general.</Legal_P>
      </Section>

      <Section title="Correo de soporte">
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 28 }}>✉️</div>
          <div>
            <p style={{ fontSize: 13, color: "#aaa", marginBottom: 4, fontFamily: BODY }}>Escríbenos a</p>
            <a href="mailto:support@reviewpilot.company" style={{ fontSize: 18, fontWeight: 700, color: "#2563eb", textDecoration: "none", fontFamily: BODY }}>
              support@reviewpilot.company
            </a>
          </div>
        </div>
        <Legal_P>Tiempo de respuesta estimado: <strong>24 a 48 horas hábiles.</strong></Legal_P>
      </Section>

      <Section title="¿En qué podemos ayudarte?">
        <Legal_Li>Dudas sobre el funcionamiento de la app</Legal_Li>
        <Legal_Li>Configuración de solicitudes de reseña</Legal_Li>
        <Legal_Li>Integración con tu tienda Shopify</Legal_Li>
        <Legal_Li>Solicitudes de eliminación de datos (RGPD / LFPDPPP)</Legal_Li>
        <Legal_Li>Reporte de errores o problemas técnicos</Legal_Li>
        <Legal_Li>Preguntas sobre privacidad y términos de servicio</Legal_Li>
      </Section>
    </LegalPage>
  );
}

/* ─── LEGAL PAGE SHELL ───────────────────────────────────────────────────── */
function LegalPage({ title, children, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>
      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ececec", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          onClick={onBack}
          style={{ fontSize: 22, fontFamily: FONT, color: "#0a0a0a", cursor: "pointer" }}
        >ReviewPilot</span>
        <Btn onClick={onBack} variant="light" size="sm">← Inicio</Btn>
      </nav>
      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontSize: 40, fontFamily: FONT, fontWeight: 400, color: "#0a0a0a", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, color: "#aaa", marginBottom: 48 }}>Última actualización: 1 de junio de 2026</p>
        {children}
      </div>
      {/* Footer */}
      <footer style={{ borderTop: "1px solid #ececec", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 16, fontFamily: FONT, color: "#0a0a0a" }}>ReviewPilot</span>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ cursor: "pointer" }} onClick={() => window.location.assign("/privacy")}>Política de Privacidad</span>
          <span style={{ color: "#ccc" }}>|</span>
          <span style={{ cursor: "pointer" }} onClick={() => window.location.assign("/terms")}>Términos de Servicio</span>
          <span style={{ color: "#ccc" }}>|</span>
          <span style={{ cursor: "pointer" }} onClick={() => window.location.assign("/contact")}>Contacto</span>
          <span style={{ color: "#ccc" }}>|</span>
          <a href="mailto:support@reviewpilot.company" style={{ color: "#888", textDecoration: "none" }}>support@reviewpilot.company</a>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a", marginBottom: 12, fontFamily: BODY }}>{title}</h2>
      {children}
    </div>
  );
}

function Legal_P({ children }) {
  return <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8, marginBottom: 12, fontFamily: BODY }}>{children}</p>;
}

function Legal_Li({ children }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
      <span style={{ color: "#0a0a0a", fontWeight: 700, flexShrink: 0 }}>•</span>
      <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8, margin: 0, fontFamily: BODY }}>{children}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#666", fontFamily: BODY }}>{label}</span>
      <span style={{ fontSize: 14, color: "#333", fontFamily: BODY }}>{value}</span>
    </div>
  );
}

/* ─── PRIVACY PAGE ───────────────────────────────────────────────────────── */
function PrivacyPage({ onBack }) {
  return (
    <LegalPage title="Política de Privacidad" onBack={onBack}>

      <Section title="1. Introducción">
        <Legal_P>ReviewPilot ("nosotros", "la app") es una aplicación de Shopify que ayuda a los comerciantes a enviar solicitudes de reseña a sus clientes después de una compra. Esta Política de Privacidad explica cómo manejamos los datos de los comerciantes (dueños de tiendas Shopify) y de sus clientes.</Legal_P>
        <Legal_P>Al instalar ReviewPilot, aceptas esta Política de Privacidad. Si no estás de acuerdo, desinstala la app.</Legal_P>
      </Section>

      <Section title="2. Datos del comerciante">
        <Legal_P>Cuando un comerciante instala ReviewPilot, recopilamos y almacenamos:</Legal_P>
        <Legal_Li>Dominio de la tienda (ej: tutienda.myshopify.com)</Legal_Li>
        <Legal_Li>Token de acceso OAuth — para recibir notificaciones de pedidos entregados</Legal_Li>
        <Legal_Li>Configuración de solicitudes de reseña (reglas, días de espera, prompt de IA, enlace de Google Reviews)</Legal_Li>
        <Legal_P>Estos datos se almacenan en nuestra base de datos (Supabase) y se usan exclusivamente para operar la app. No vendemos ni compartimos los datos del comerciante con terceros.</Legal_P>
      </Section>

      <Section title="3. Datos del cliente final">
        <Legal_P>ReviewPilot procesa los siguientes datos de clientes desde los webhooks de Shopify:</Legal_P>
        <Legal_Li>Nombre del cliente — para personalizar el saludo del email de solicitud de reseña</Legal_Li>
        <Legal_Li>Correo electrónico del cliente — para entregar el email de solicitud de reseña</Legal_Li>
        <Legal_P style={{ fontWeight: 700 }}>IMPORTANTE: Estos datos se procesan exclusivamente en memoria. NUNCA se almacenan en ninguna base de datos, archivo de log, ni sistema de almacenamiento persistente. Se usan únicamente para generar y enviar un solo email y se descartan inmediatamente después.</Legal_P>
      </Section>

      <Section title="4. Retención de datos">
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
          <InfoRow label="Configuración del comerciante" value="Retenida mientras la app esté instalada. Eliminada al desinstalar." />
          <InfoRow label="Nombre del cliente" value="No se retiene. Solo se procesa en memoria." />
          <InfoRow label="Email del cliente" value="No se retiene. Solo se procesa en memoria." />
          <InfoRow label="Logs de envío" value="No se retienen. Solo estado de entrega de Resend (sin datos personales)." />
        </div>
      </Section>

      <Section title="5. Proveedores de terceros">
        <Legal_Li><strong>Resend (resend.com)</strong> — Proveedor de entrega de email. El email del cliente se comparte únicamente para la entrega. Certificado SOC 2 Tipo II.</Legal_Li>
        <Legal_Li><strong>Anthropic (anthropic.com)</strong> — Generación de mensajes con IA. El nombre del cliente se incluye en el prompt. Anthropic no usa estos datos para entrenar modelos.</Legal_Li>
        <Legal_Li><strong>Railway (railway.app)</strong> — Hosting del backend. No se almacenan datos de clientes en Railway.</Legal_Li>
        <Legal_Li><strong>Supabase (supabase.com)</strong> — Base de datos solo para configuración del comerciante. No se almacenan datos de clientes.</Legal_Li>
      </Section>

      <Section title="6. Tus derechos">
        <Legal_P>Los clientes que deseen no recibir más emails de solicitud de reseña de un comerciante específico deben contactar directamente a ese comerciante.</Legal_P>
        <Legal_P>Los comerciantes que deseen eliminar sus datos deben desinstalar la app ReviewPilot, lo cual activará la eliminación de toda la configuración almacenada.</Legal_P>
      </Section>

      <Section title="7. Contacto">
        <Legal_P>Para preguntas sobre privacidad o solicitudes de eliminación de datos, contáctanos en: <a href="mailto:support@reviewpilot.company" style={{color:"#2563eb"}}>support@reviewpilot.company</a></Legal_P>
      </Section>

    </LegalPage>
  );
}

/* ─── TERMS PAGE ─────────────────────────────────────────────────────────── */
function TermsPage({ onBack }) {
  return (
    <LegalPage title="Términos de Servicio" onBack={onBack}>

      <Section title="1. Aceptación">
        <Legal_P>Al instalar ReviewPilot, tú ("el comerciante") aceptas estos Términos de Servicio. Si no estás de acuerdo, no instales la app.</Legal_P>
      </Section>

      <Section title="2. Descripción del servicio">
        <Legal_P>ReviewPilot automatiza los emails de solicitud de reseña post-compra. El comerciante configura las reglas; ReviewPilot genera mensajes personalizados usando IA (Claude de Anthropic) y los envía a los clientes por email después de que su pedido ha sido entregado.</Legal_P>
      </Section>

      <Section title="3. Responsabilidades del comerciante">
        <Legal_Li>Eres responsable de asegurarte de que tienes el derecho legal de enviar emails a tus clientes en tu jurisdicción (p. ej., cumplimiento con CAN-SPAM, GDPR, LFPDPPP, CASL).</Legal_Li>
        <Legal_Li>Eres responsable de configurar un enlace de Google Reviews correcto y vigente.</Legal_Li>
        <Legal_Li>No debes usar ReviewPilot para enviar spam, contenido engañoso, o cualquier comunicación que viole las leyes aplicables.</Legal_Li>
        <Legal_Li>Eres responsable del contenido de tu prompt de IA. No incluyas instrucciones para generar contenido falso, engañoso o ilegal.</Legal_Li>
        <Legal_Li>No debes usar ReviewPilot para recopilar, almacenar o procesar datos de clientes más allá de lo descrito en la Política de Privacidad.</Legal_Li>
      </Section>

      <Section title="4. Manejo de datos">
        <Legal_P>ReviewPilot procesa nombre y email del cliente en memoria exclusivamente para enviar emails de solicitud de reseña. No se almacenan datos de clientes. Consulta nuestra Política de Privacidad para más detalles.</Legal_P>
      </Section>

      <Section title="5. Disponibilidad del servicio">
        <Legal_P>ReviewPilot se provee "tal como está". Nos esforzamos por mantener alta disponibilidad, pero no garantizamos disponibilidad ininterrumpida. Podemos actualizar, modificar o descontinuar funciones sin previo aviso.</Legal_P>
      </Section>

      <Section title="6. Limitación de responsabilidad">
        <Legal_P>ReviewPilot no es responsable por daños indirectos, incidentales o consecuentes derivados del uso de la app, incluyendo: fallas en la entrega de emails, calidad del contenido generado por IA, o disponibilidad de la API de Shopify.</Legal_P>
        <Legal_P>Nuestra responsabilidad máxima se limita al monto pagado por el servicio en los últimos 3 meses.</Legal_P>
      </Section>

      <Section title="7. Terminación">
        <Legal_P>Cualquiera de las partes puede terminar este acuerdo en cualquier momento. Desinstalar ReviewPilot de tu tienda Shopify constituye terminación. Al terminar, todos los datos de configuración almacenados del comerciante serán eliminados.</Legal_P>
      </Section>

      <Section title="8. Cambios a los términos">
        <Legal_P>Podemos actualizar estos Términos en cualquier momento. El uso continuado de la app después de los cambios constituye aceptación de los nuevos Términos. Te notificaremos cambios materiales por email.</Legal_P>
      </Section>

      <Section title="9. Ley aplicable">
        <Legal_P>Estos Términos se rigen por las leyes de México. Cualquier disputa se resolverá en los tribunales competentes de la Ciudad de México.</Legal_P>
      </Section>

      <Section title="10. Contacto">
        <Legal_P>Para preguntas sobre estos Términos: <a href="mailto:support@reviewpilot.company" style={{color:"#2563eb"}}>support@reviewpilot.company</a></Legal_P>
      </Section>

    </LegalPage>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────── */
export default function App() {
  const path = window.location.pathname;
  const hash = window.location.hash;
  const isPasswordRecovery = hash.includes("type=recovery");
  const wantsDashboard = path === "/dashboard" || path.startsWith("/dashboard");

  const [session, setSession] = useState(undefined);
  const [view, setView] = useState(
    isPasswordRecovery ? "reset" :
    path === "/privacy" ? "privacy" :
    path === "/terms"   ? "terms"   :
    path === "/contact" ? "contact" :
    "main"
  );

  // Detectar sesión al cargar y escuchar cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("[Auth] Auth event:", event);
      if (event === "PASSWORD_RECOVERY") setView("reset");
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.history.pushState({}, "", "/");
  };

  const goHome = () => { setView("main"); window.history.pushState({}, "", "/"); };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  `;

  // Páginas públicas y reset — accesibles sin sesión
  if (view === "privacy") return <><style>{styles}</style><PrivacyPage onBack={goHome} /></>;
  if (view === "terms")   return <><style>{styles}</style><TermsPage onBack={goHome} /></>;
  if (view === "contact") return <><style>{styles}</style><ContactPage onBack={goHome} /></>;
  if (view === "reset")   return <><style>{styles}</style><ResetPasswordPage onDone={() => { window.history.replaceState({}, "", "/"); setView("main"); }} /></>;

  // Cargando sesión
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <style>{styles}</style>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#0a0a0a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Sin sesión
  if (!session) {
    return (
      <>
        <style>{styles}</style>
        <AuthApp
          startOnAuth={wantsDashboard}
          onAuth={(s) => {
            setSession(s);
            window.history.replaceState({}, "", "/dashboard");
          }}
          onPrivacy={() => { setView("privacy"); window.history.pushState({}, "", "/privacy"); }}
          onTerms={() => { setView("terms"); window.history.pushState({}, "", "/terms"); }}
          onContact={() => { setView("contact"); window.history.pushState({}, "", "/contact"); }}
        />
      </>
    );
  }

  // Con sesión — app principal (siempre muestra dashboard)
  return (
    <>
      <style>{styles}</style>
      <MainApp
        session={session}
        onLogout={handleLogout}
        onPrivacy={() => { setView("privacy"); window.history.pushState({}, "", "/privacy"); }}
        onTerms={() => { setView("terms"); window.history.pushState({}, "", "/terms"); }}
      />
    </>
  );
}

/* ─── AUTH APP (sin sesión) ──────────────────────────────────────────────── */
function AuthApp({ onAuth, onPrivacy, onTerms, onContact, startOnAuth }) {
  const [screen, setScreen] = useState(startOnAuth ? "auth" : "landing");
  return screen === "landing"
    ? <LandingPage
        onGetStarted={() => setScreen("auth")}
        onPrivacy={onPrivacy}
        onTerms={onTerms}
        onContact={onContact}
      />
    : <AuthPage onAuth={onAuth} onBack={startOnAuth ? null : () => setScreen("landing")} />;
}

/* ─── MAIN APP (con sesión) ──────────────────────────────────────────────── */
function MainApp({ session, onLogout, onPrivacy, onTerms }) {
  const [screen, setScreen] = useState("dashboard");
  const userEmail = session?.user?.email;

  return screen === "connect"
    ? (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 22, fontFamily: FONT, color: "#0a0a0a" }}>ReviewPilot</span>
          </div>
          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 22, padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <ShopifyConnect onBack={() => setScreen("dashboard")} onDone={() => setScreen("dashboard")} session={session} />
          </div>
        </div>
      </div>
    )
    : <Dashboard
        onConnectMore={() => setScreen("connect")}
        onLogout={onLogout}
        userEmail={userEmail}
      />;
}
