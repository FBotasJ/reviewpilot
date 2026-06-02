import { useState, useEffect } from "react";

// Lee la URL del servidor desde variable de entorno
// En desarrollo: http://localhost:3001
// En producción (Railway): https://tu-app.railway.app
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const FONT = "'Instrument Serif', serif";
const BODY = "'Outfit', sans-serif";

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
function LandingPage({ onGetStarted }) {
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

      <footer style={{ borderTop: "1px solid #222", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0a0a" }}>
        <span style={{ fontSize: 18, fontFamily: FONT, color: "#fff" }}>ReviewPilot</span>
        <span style={{ fontSize: 12, color: "#555" }}>© 2026 ReviewPilot. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}

/* ─── SHOPIFY CONNECT ─────────────────────────────────────────────────────── */
function ShopifyConnect({ onBack, onDone }) {
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

    // En producción esto sería:
    // window.location.href = `${API_URL}/auth/shopify?shop=${domain}`;
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

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard({ onConnectMore }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores from Railway API on mount
  useEffect(() => {
    fetch("https://reviewpilot-production-3183.up.railway.app/api/stores")
      .then(r => r.json())
      .then(data => {
        setStores(data.stores || []);
        setLoading(false);
      })
      .catch(err => {
        setError("No se pudo conectar con el servidor.");
        setLoading(false);
      });
  }, []);

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
        <Btn onClick={onConnectMore} size="sm">+ Conectar tienda</Btn>
      </div>

      <div style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 30, fontFamily: FONT, fontWeight: 400, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>Tiendas conectadas y estado de automatizaciones</p>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#0a0a0a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 14, color: "#aaa" }}>Cargando tiendas desde Supabase…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", fontSize: 14, color: "#b91c1c", marginBottom: 24 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 0, padding: "12px 22px", borderBottom: "1px solid #f3f4f6", background: "#f9f9f9" }}>
              {["Tienda", "Conectada", "Reglas", "Activas", "Estado"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {stores.map((store, i) => {
              const isActive = store.activeRules > 0;
              return (
                <div key={store.domain} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "16px 22px", alignItems: "center",
                  borderBottom: i < stores.length - 1 ? "1px solid #f3f4f6" : "none",
                }}>
                  {/* Tienda */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#22c55e" : "#e5e7eb", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{store.domain}</div>
                    </div>
                  </div>

                  {/* Conectada */}
                  <span style={{ fontSize: 13, color: "#666" }}>{fmt(store.connectedAt)}</span>

                  {/* Reglas */}
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{store.rulesCount}</span>

                  {/* Activas */}
                  <span style={{ fontSize: 14, fontWeight: 600, color: store.activeRules > 0 ? "#16a34a" : "#aaa" }}>{store.activeRules}</span>

                  {/* Estado */}
                  <span style={{
                    display: "inline-block",
                    fontSize: 12, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 99,
                    background: isActive ? "#dcfce7" : "#f3f4f6",
                    color: isActive ? "#166534" : "#888",
                  }}>
                    {isActive ? "Activo" : "Sin reglas"}
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

/* ─── ROOT ───────────────────────────────────────────────────────────────── */
export default function App() {
  const isDashboard = window.location.pathname === "/dashboard";
  const [view, setView] = useState(isDashboard ? "dashboard" : "landing");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {view === "landing" && <LandingPage onGetStarted={() => setView("connect")} />}

      {view === "connect" && (
        <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <span style={{ fontSize: 22, fontFamily: FONT, color: "#0a0a0a" }}>ReviewPilot</span>
            </div>
            <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 22, padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <ShopifyConnect onBack={() => setView("landing")} onDone={() => setView("dashboard")} />
            </div>
          </div>
        </div>
      )}

      {view === "dashboard" && <Dashboard onConnectMore={() => setView("connect")} />}
    </>
  );
}
