/**
 * ReviewPilot — Backend Server
 * ─────────────────────────────────────────────────────────────────────────────
 * Maneja:
 *  1. OAuth con Shopify (flujo completo "conectar con un clic")
 *  2. Registro automático de webhooks después de conectar
 *  3. Recepción de webhooks (orders/fulfilled)
 *  4. Generación de mensaje con IA (Claude)
 *  5. Envío del email de solicitud de reseña (Resend)
 */

import express from "express";
import cors from "cors";
import crypto from "crypto";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));

// IMPORTANTE: El webhook de Shopify necesita el body RAW para verificar la firma
// Por eso parseamos JSON solo en rutas que no sean el webhook
app.use((req, res, next) => {
  if (req.path === "/webhooks/orders-fulfilled") {
    let rawBody = "";
    req.on("data", (chunk) => { rawBody += chunk; });
    req.on("end", () => {
      req.rawBody = rawBody;
      try { req.body = JSON.parse(rawBody); } catch { req.body = {}; }
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

// ── Almacenamiento en memoria (en producción usa PostgreSQL/Supabase) ─────────
// Guarda: { shopDomain → { accessToken, rules, connectedAt } }
const stores = new Map();

// Reglas de automatización por defecto al conectar una tienda
const DEFAULT_RULES = [
  {
    id: "rule_1",
    trigger: "orders/fulfilled",
    triggerLabel: "Pedido entregado",
    reviewPlatform: "Google",
    channel: "email",
    delayHours: 48,
    active: true,
    messageTemplate: null, // null = generar con IA cada vez
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. INICIO DEL FLUJO OAUTH
//    El frontend redirige al cliente a esta URL con su dominio de Shopify
//    GET /auth/shopify?shop=mi-tienda.myshopify.com
// ─────────────────────────────────────────────────────────────────────────────
app.get("/auth/shopify", (req, res) => {
  const { shop } = req.query;

  if (!shop || !isValidShopDomain(shop)) {
    return res.status(400).json({ error: "Dominio de Shopify inválido" });
  }

  // Generamos un 'state' aleatorio para proteger contra ataques CSRF
  const state = crypto.randomBytes(16).toString("hex");

  // Permisos que necesita ReviewPilot:
  // - read_orders: para leer datos del pedido y del cliente
  // - write_script_tags: opcional, para tracking en la tienda
  const scopes = "read_orders,read_customers";

  const redirectUri = `${process.env.APP_URL}/auth/shopify/callback`;

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_CLIENT_ID}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  console.log(`[OAuth] Iniciando flujo para tienda: ${shop}`);

  // En producción: guardar el state en sesión o cookie firmada
  // Aquí lo pasamos directo por simplicidad del ejemplo
  res.redirect(authUrl);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CALLBACK OAUTH — Shopify redirige aquí después de que el cliente autoriza
//    GET /auth/shopify/callback?code=xxx&shop=xxx&state=xxx&hmac=xxx
// ─────────────────────────────────────────────────────────────────────────────
app.get("/auth/shopify/callback", async (req, res) => {
  const { shop, code, hmac, state } = req.query;

  // Verificamos que la solicitud viene realmente de Shopify
  if (!verifyShopifyHmac(req.query, process.env.SHOPIFY_CLIENT_SECRET)) {
    return res.status(401).json({ error: "HMAC inválido. Solicitud no autorizada." });
  }

  try {
    // Intercambiamos el código temporal por un access_token permanente
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    const { access_token } = await tokenRes.json();

    if (!access_token) {
      return res.status(400).json({ error: "No se pudo obtener el access token" });
    }

    // Guardamos la tienda y sus reglas por defecto
    stores.set(shop, {
      accessToken: access_token,
      rules: DEFAULT_RULES,
      connectedAt: new Date().toISOString(),
      shopDomain: shop,
    });

    console.log(`[OAuth] ✅ Tienda conectada: ${shop}`);

    // Registramos los webhooks automáticamente
    await registerWebhooks(shop, access_token);

    // Redirigimos al dashboard con éxito
    res.redirect(`${process.env.APP_URL}/dashboard?shop=${shop}&connected=true`);

  } catch (err) {
    console.error("[OAuth] Error en callback:", err);
    res.status(500).json({ error: "Error interno durante la autenticación" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REGISTRAR WEBHOOKS EN SHOPIFY
//    Después de conectar, le decimos a Shopify que nos avise cuando:
//    - Un pedido sea entregado (orders/fulfilled)
// ─────────────────────────────────────────────────────────────────────────────
async function registerWebhooks(shop, accessToken) {
  const webhookUrl = `${process.env.APP_URL}/webhooks/orders-fulfilled`;

  const res = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      webhook: {
        topic: "orders/fulfilled",       // Evento: pedido entregado
        address: webhookUrl,              // URL de tu servidor
        format: "json",
      },
    }),
  });

  const data = await res.json();

  if (data.webhook) {
    console.log(`[Webhooks] ✅ Webhook registrado para ${shop}: orders/fulfilled`);
  } else {
    console.error(`[Webhooks] ❌ Error registrando webhook:`, data.errors);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RECIBIR WEBHOOK DE SHOPIFY
//    Shopify llama a esta URL cada vez que un pedido es marcado como entregado
//    POST /webhooks/orders-fulfilled
// ─────────────────────────────────────────────────────────────────────────────
app.post("/webhooks/orders-fulfilled", async (req, res) => {
  const shopDomain = req.headers["x-shopify-shop-domain"];
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  // Verificamos la firma del webhook para confirmar que viene de Shopify
  if (!verifyWebhookSignature(req.rawBody, hmacHeader, process.env.SHOPIFY_CLIENT_SECRET)) {
    console.warn(`[Webhook] ⚠️ Firma inválida de ${shopDomain}`);
    return res.status(401).send("Unauthorized");
  }

  // Respondemos rápido a Shopify (debe recibir 200 en menos de 5 segundos)
  res.status(200).send("OK");

  // Procesamos el evento en background
  processOrderFulfilled(shopDomain, req.body).catch(console.error);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROCESAR PEDIDO ENTREGADO
//    Extrae datos del cliente → genera mensaje con IA → envía email
// ─────────────────────────────────────────────────────────────────────────────
async function processOrderFulfilled(shopDomain, order) {
  console.log(`[Webhook] 📦 Pedido entregado en ${shopDomain}: #${order.order_number}`);

  const store = stores.get(shopDomain);
  if (!store) {
    console.warn(`[Webhook] Tienda no encontrada: ${shopDomain}`);
    return;
  }

  // Buscamos la regla activa para 'orders/fulfilled'
  const rule = store.rules.find(r => r.trigger === "orders/fulfilled" && r.active);
  if (!rule) {
    console.log(`[Webhook] No hay regla activa para orders/fulfilled en ${shopDomain}`);
    return;
  }

  // Extraemos datos del cliente del payload de Shopify
  const customer = {
    firstName: order.customer?.first_name || "Cliente",
    lastName: order.customer?.last_name || "",
    email: order.customer?.email || order.email,
    orderId: order.id,
    orderNumber: order.order_number,
  };

  if (!customer.email) {
    console.warn(`[Webhook] Pedido #${order.order_number} sin email de cliente`);
    return;
  }

  console.log(`[AI] Generando mensaje para ${customer.firstName} ${customer.email}...`);

  // Generamos el mensaje personalizado con Claude
  const message = await generateReviewMessage({
    customerName: customer.firstName,
    shopDomain,
    reviewPlatform: rule.reviewPlatform,
    trigger: rule.triggerLabel,
  });

  // Enviamos el email
  await sendReviewEmail({
    to: customer.email,
    customerName: customer.firstName,
    message,
    reviewPlatform: rule.reviewPlatform,
    shopDomain,
  });

  console.log(`[Email] ✅ Solicitud enviada a ${customer.email}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GENERAR MENSAJE CON CLAUDE
// ─────────────────────────────────────────────────────────────────────────────
async function generateReviewMessage({ customerName, shopDomain, reviewPlatform, trigger }) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Escribe un mensaje corto y natural (máximo 3 oraciones) para pedirle una reseña a un cliente.
Datos:
- Nombre del cliente: ${customerName}
- Tienda: ${shopDomain.replace(".myshopify.com", "")}
- Evento: ${trigger}
- Plataforma de reseña: ${reviewPlatform}

El mensaje debe ser cálido, breve y terminar con una llamada a la acción. Solo devuelve el mensaje, sin comillas ni explicaciones.`
        }]
      }),
    });

    const data = await res.json();
    return data.content?.[0]?.text || `Hola ${customerName}, gracias por tu compra. ¿Nos dejarías una reseña en ${reviewPlatform}?`;
  } catch (err) {
    console.error("[AI] Error generando mensaje:", err);
    return `Hola ${customerName}, gracias por tu compra. Tu opinión nos ayuda a mejorar. ¿Nos dejarías una reseña en ${reviewPlatform}? 🙏`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ENVIAR EMAIL CON RESEND
// ─────────────────────────────────────────────────────────────────────────────
async function sendReviewEmail({ to, customerName, message, reviewPlatform, shopDomain }) {
  const reviewLinks = {
    Google: "https://g.page/r/tu-link-google-reviews",
    Trustpilot: "https://www.trustpilot.com/review/tu-dominio",
    TripAdvisor: "https://www.tripadvisor.com/tu-perfil",
  };

  const reviewUrl = reviewLinks[reviewPlatform] || "#";
  const storeName = shopDomain.replace(".myshopify.com", "");

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #ececec; }
    .header { background: #0a0a0a; padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 400; margin: 0; letter-spacing: -0.5px; }
    .body { padding: 36px 40px; }
    .message { font-size: 16px; color: #333; line-height: 1.75; margin-bottom: 32px; }
    .cta { display: block; background: #0a0a0a; color: #fff; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #bbb; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="body">
      <p class="message">${message.replace(/\n/g, "<br>")}</p>
      <a href="${reviewUrl}" class="cta">⭐ Dejar mi reseña en ${reviewPlatform}</a>
    </div>
    <div class="footer">
      Recibiste este email porque realizaste una compra en ${storeName}.<br>
      Powered by <strong>ReviewPilot</strong>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject: `¿Qué te pareció tu pedido? ⭐`,
        html: htmlBody,
      }),
    });

    const data = await res.json();
    if (data.id) {
      console.log(`[Email] Enviado. ID: ${data.id}`);
    } else {
      console.error("[Email] Error:", data);
    }
  } catch (err) {
    console.error("[Email] Error enviando:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ENDPOINTS DE LA API (para el frontend del dashboard)
// ─────────────────────────────────────────────────────────────────────────────

// Ver tiendas conectadas
app.get("/api/stores", (req, res) => {
  const list = Array.from(stores.entries()).map(([domain, data]) => ({
    domain,
    connectedAt: data.connectedAt,
    rulesCount: data.rules.length,
    activeRules: data.rules.filter(r => r.active).length,
  }));
  res.json({ stores: list });
});

// Ver reglas de una tienda
app.get("/api/stores/:shop/rules", (req, res) => {
  const store = stores.get(req.params.shop);
  if (!store) return res.status(404).json({ error: "Tienda no encontrada" });
  res.json({ rules: store.rules });
});

// Activar/pausar una regla
app.patch("/api/stores/:shop/rules/:ruleId", (req, res) => {
  const store = stores.get(req.params.shop);
  if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

  const rule = store.rules.find(r => r.id === req.params.ruleId);
  if (!rule) return res.status(404).json({ error: "Regla no encontrada" });

  rule.active = req.body.active ?? rule.active;
  res.json({ rule });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    stores: stores.size,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

// Valida que el dominio tiene formato correcto de Shopify
function isValidShopDomain(shop) {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

// Verifica el HMAC que Shopify manda en el callback OAuth
function verifyShopifyHmac(queryParams, secret) {
  const { hmac, ...rest } = queryParams;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

// Verifica la firma del body del webhook
function verifyWebhookSignature(rawBody, hmacHeader, secret) {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       ReviewPilot Server                 ║
  ║  Corriendo en http://localhost:${PORT}     ║
  ╚══════════════════════════════════════════╝

  Endpoints:
  → GET  /auth/shopify              Iniciar OAuth
  → GET  /auth/shopify/callback     Callback OAuth
  → POST /webhooks/orders-fulfilled Recibir webhooks
  → GET  /api/stores                Ver tiendas conectadas
  → GET  /health                    Health check
  `);
});
