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
import { createClient } from "@supabase/supabase-js";

// ── Cliente Supabase ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// ── Almacenamiento en memoria (para reglas y webhook processing) ──────────────
// Las tiendas y tokens se persisten en Supabase.
// El Map se mantiene para lookups rápidos de reglas durante el procesamiento de webhooks.
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

  const state = crypto.randomBytes(16).toString("hex");
  const scopes = "read_orders,read_customers";
  const redirectUri = `${process.env.APP_URL}/auth/shopify/callback`;

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_CLIENT_ID}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  console.log(`[OAuth] Iniciando flujo para tienda: ${shop}`);
  res.redirect(authUrl);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CALLBACK OAUTH — Shopify redirige aquí después de que el cliente autoriza
//    GET /auth/shopify/callback?code=xxx&shop=xxx&state=xxx&hmac=xxx
// ─────────────────────────────────────────────────────────────────────────────
app.get("/auth/shopify/callback", async (req, res) => {
  const { shop, code, hmac, state } = req.query;

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

    // Guardamos en Map para lookups rápidos durante procesamiento de webhooks
    stores.set(shop, {
      accessToken: access_token,
      rules: DEFAULT_RULES,
      connectedAt: new Date().toISOString(),
      shopDomain: shop,
    });

    // ── Persistimos en Supabase ───────────────────────────────────────────────
    // upsert: inserta si no existe, actualiza access_token si ya existe
    const { error: dbError } = await supabase
      .from("stores")
      .upsert(
        {
          shop_domain: shop,
          access_token: access_token,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "shop_domain" }
      );

    if (dbError) {
      console.error(`[Supabase] ❌ Error guardando tienda ${shop}:`, dbError.message);
    } else {
      console.log(`[Supabase] ✅ Tienda guardada/actualizada: ${shop}`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    console.log(`[OAuth] ✅ Tienda conectada: ${shop}`);

    await registerWebhooks(shop, access_token);

    // Redirigimos al frontend en Netlify
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL;
    res.redirect(`${frontendUrl}/dashboard?shop=${shop}&connected=true`);

  } catch (err) {
    console.error("[OAuth] Error en callback:", err);
    res.status(500).json({ error: "Error interno durante la autenticación" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REGISTRAR WEBHOOKS EN SHOPIFY
//    topic: app/uninstalled — no requiere permisos protegidos
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
        topic: "app/uninstalled",
        address: webhookUrl,
        format: "json",
      },
    }),
  });

  const data = await res.json();

  if (data.webhook) {
    console.log(`[Webhooks] ✅ Webhook registrado para ${shop}: app/uninstalled`);
    return;
  }

  // "already been taken" = webhook ya existía → tratar como éxito
  const errors = data.errors || {};
  const alreadyExists =
    JSON.stringify(errors).toLowerCase().includes("already been taken") ||
    JSON.stringify(errors).toLowerCase().includes("already exists");

  if (alreadyExists) {
    console.log(`[Webhooks] ✅ Webhook ya existía para ${shop}: app/uninstalled (OK)`);
  } else {
    console.error(`[Webhooks] ❌ Error registrando webhook:`, errors);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RECIBIR WEBHOOK DE SHOPIFY
//    POST /webhooks/orders-fulfilled
// ─────────────────────────────────────────────────────────────────────────────
app.post("/webhooks/orders-fulfilled", async (req, res) => {
  const shopDomain = req.headers["x-shopify-shop-domain"];
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  if (!verifyWebhookSignature(req.rawBody, hmacHeader, process.env.SHOPIFY_CLIENT_SECRET)) {
    console.warn(`[Webhook] ⚠️ Firma inválida de ${shopDomain}`);
    return res.status(401).send("Unauthorized");
  }

  res.status(200).send("OK");
  processOrderFulfilled(shopDomain, req.body).catch(console.error);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROCESAR PEDIDO ENTREGADO
// ─────────────────────────────────────────────────────────────────────────────
async function processOrderFulfilled(shopDomain, order) {
  console.log(`[Webhook] 📦 Pedido entregado en ${shopDomain}: #${order.order_number}`);

  const store = stores.get(shopDomain);
  if (!store) {
    console.warn(`[Webhook] Tienda no encontrada en memoria: ${shopDomain}`);
    return;
  }

  const rule = store.rules.find(r => r.trigger === "orders/fulfilled" && r.active);
  if (!rule) {
    console.log(`[Webhook] No hay regla activa para orders/fulfilled en ${shopDomain}`);
    return;
  }

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

  const message = await generateReviewMessage({
    customerName: customer.firstName,
    shopDomain,
    reviewPlatform: rule.reviewPlatform,
    trigger: rule.triggerLabel,
  });

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
// 8. ENDPOINTS DE LA API
// ─────────────────────────────────────────────────────────────────────────────

// Ver tiendas conectadas — lee exclusivamente desde Supabase
// Incluye reglas asociadas desde la tabla rules
app.get("/api/stores", async (req, res) => {
  console.log("[Supabase] GET /api/stores — consultando tabla stores...");

  // 1. Leer todas las tiendas
  const { data: storesData, error: storesError } = await supabase
    .from("stores")
    .select("*")
    .order("connected_at", { ascending: false });

  if (storesError) {
    console.error("[Supabase] ❌ Error leyendo stores:", storesError.message, storesError.details, storesError.hint);
    return res.status(500).json({
      error: "Error leyendo tiendas desde Supabase",
      detail: storesError.message,
    });
  }

  console.log(`[Supabase] ✅ Tiendas encontradas: ${storesData.length}`);

  // 2. Para cada tienda, leer sus reglas desde la tabla rules
  const list = await Promise.all(
    storesData.map(async (store) => {
      console.log(`[Supabase] Consultando reglas para: ${store.shop_domain}`);

      const { data: rulesData, error: rulesError } = await supabase
        .from("rules")
        .select("*")
        .eq("store_id", store.id);

      if (rulesError) {
        console.error(
          `[Supabase] ❌ Error leyendo reglas para ${store.shop_domain}:`,
          rulesError.message,
          rulesError.details,
          rulesError.hint
        );
        // Si falla la lectura de reglas, devolvemos la tienda con conteo 0
        return {
          domain: store.shop_domain,
          connectedAt: store.connected_at,
          rulesCount: 0,
          activeRules: 0,
          rulesError: rulesError.message,
        };
      }

      const rules = rulesData || [];
      console.log(`[Supabase] ✅ Reglas para ${store.shop_domain} (id: ${store.id}): ${rules.length} total, ${rules.filter(r => r.active).length} activas`);

      return {
        domain: store.shop_domain,
        connectedAt: store.connected_at,
        googleReviewUrl: store.google_review_url || "",
        rulesCount: rules.length,
        activeRules: rules.filter(r => r.active).length,
        // Incluimos las reglas completas para que el frontend pueda usar sus IDs
        rules: rules.map(r => ({
          id: r.id,
          trigger: r.trigger || "orders/fulfilled",
          triggerLabel: r.trigger_label || "Pedido entregado",
          reviewPlatform: r.review_platform || "Google",
          channel: r.channel || "email",
          active: r.active,
          delay_days: r.delay_days ?? 7,
          prompt: r.prompt || "",
        })),
      };
    })
  );

  console.log("[Supabase] ✅ Respuesta de /api/stores lista");
  res.json({ stores: list, source: "supabase" });
});

// Ver reglas de una tienda
app.get("/api/stores/:shop/rules", (req, res) => {
  const store = stores.get(req.params.shop);
  if (!store) return res.status(404).json({ error: "Tienda no encontrada" });
  res.json({ rules: store.rules });
});

// Actualizar datos de una tienda (google_review_url, etc.)
app.patch("/api/stores/:shop", async (req, res) => {
  const { shop } = req.params;
  const { google_review_url } = req.body;

  console.log(`[PATCH Store] ${shop} → google_review_url: ${google_review_url}`);

  if (google_review_url === undefined) {
    return res.status(400).json({ error: "No se recibió ningún campo para actualizar" });
  }

  const { data, error } = await supabase
    .from("stores")
    .update({ google_review_url: google_review_url || null })
    .eq("shop_domain", shop)
    .select("shop_domain, google_review_url")
    .single();

  if (error) {
    console.error(`[Supabase] ❌ Error actualizando tienda ${shop}:`, error.message);
    return res.status(500).json({ error: "Error actualizando tienda en Supabase", detail: error.message });
  }

  console.log(`[Supabase] ✅ Tienda actualizada → google_review_url: ${data.google_review_url}`);
  res.json({ success: true, google_review_url: data.google_review_url });
});

// Crear nueva regla para una tienda — inserta en Supabase
app.post("/api/stores/:shop/rules", async (req, res) => {
  const { shop } = req.params;
  const { delay_days, channel, prompt } = req.body;

  console.log(`[POST] Nueva regla para ${shop}:`, req.body);

  // 1. Buscar la tienda en Supabase para obtener su id
  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("shop_domain", shop)
    .single();

  if (storeError || !storeData) {
    console.error(`[Supabase] ❌ Tienda no encontrada: ${shop}`, storeError?.message);
    return res.status(404).json({ error: `Tienda '${shop}' no encontrada en Supabase` });
  }

  console.log(`[Supabase] ✅ Tienda encontrada → id=${storeData.id}`);

  // 2. Insertar la nueva regla
  const { data, error } = await supabase
    .from("rules")
    .insert({
      store_id: storeData.id,
      trigger: "orders/fulfilled",
      trigger_label: "Pedido entregado",
      review_platform: "Google",
      channel: channel || "email",
      delay_days: delay_days !== undefined ? Number(delay_days) : 7,
      prompt: prompt || "",
      active: true,
    })
    .select("id, trigger, trigger_label, review_platform, channel, delay_days, prompt, active")
    .single();

  if (error) {
    console.error(`[Supabase] ❌ Error creando regla para ${shop}:`, error.message, error.hint);
    return res.status(500).json({ error: "Error creando regla en Supabase", detail: error.message });
  }

  console.log(`[Supabase] ✅ Regla creada → id=${data.id}`);
  res.status(201).json({
    rule: {
      id: data.id,
      trigger: data.trigger,
      triggerLabel: data.trigger_label,
      reviewPlatform: data.review_platform,
      channel: data.channel,
      delay_days: data.delay_days,
      prompt: data.prompt,
      active: data.active,
    }
  });
});


app.patch("/api/stores/:shop/rules/:ruleId", async (req, res) => {
  const { shop, ruleId } = req.params;
  const { active, delay_days, channel, prompt } = req.body;

  console.log(`[PATCH] shop=${shop} ruleId=${ruleId} body:`, req.body);

  // Construir objeto de campos a actualizar (solo los que vengan en el body)
  const updates = {};

  if (active !== undefined && active !== null) {
    updates.active = active === true || active === "true";
  }
  if (delay_days !== undefined) {
    updates.delay_days = Number(delay_days);
  }
  if (channel !== undefined) {
    updates.channel = channel;
  }
  if (prompt !== undefined) {
    updates.prompt = prompt;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No se recibió ningún campo para actualizar" });
  }

  console.log(`[Supabase] UPDATE rules SET`, updates, `WHERE id='${ruleId}'`);

  const { data, error } = await supabase
    .from("rules")
    .update(updates)
    .eq("id", ruleId)
    .select("id, active, delay_days, channel, prompt")
    .single();

  if (error) {
    console.error(`[Supabase] ❌ Error actualizando regla ${ruleId}:`, error.message, error.details, error.hint);
    return res.status(500).json({
      error: "Error actualizando regla en Supabase",
      detail: error.message,
      hint: error.hint,
    });
  }

  if (!data) {
    console.error(`[Supabase] ❌ UPDATE no afectó ninguna fila. ¿ruleId '${ruleId}' existe?`);
    return res.status(404).json({ error: `Regla con id '${ruleId}' no encontrada en Supabase` });
  }

  console.log(`[Supabase] ✅ Regla actualizada →`, data);
  res.json({ rule: data });
});

// Eliminar una regla — borra de Supabase
app.delete("/api/rules/:ruleId", async (req, res) => {
  const { ruleId } = req.params;

  console.log(`[DELETE] Eliminando regla id=${ruleId}`);

  const { error } = await supabase
    .from("rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    console.error(`[Supabase] ❌ Error eliminando regla ${ruleId}:`, error.message);
    return res.status(500).json({ error: "Error eliminando regla en Supabase", detail: error.message });
  }

  console.log(`[Supabase] ✅ Regla ${ruleId} eliminada`);
  res.json({ success: true });
});

// Vista previa con IA — genera mensaje de ejemplo para una regla
app.post("/api/rules/:ruleId/preview", async (req, res) => {
  const { ruleId } = req.params;

  console.log(`[Preview] Generando vista previa para regla ${ruleId}`);

  // 1. Buscar la regla en Supabase
  const { data: rule, error: ruleError } = await supabase
    .from("rules")
    .select("id, trigger, trigger_label, review_platform, channel, delay_days, prompt")
    .eq("id", ruleId)
    .single();

  if (ruleError || !rule) {
    console.error(`[Preview] ❌ Regla no encontrada: ${ruleId}`, ruleError?.message);
    return res.status(404).json({ error: `Regla '${ruleId}' no encontrada` });
  }

  // 2. Datos ficticios del cliente
  const demo = {
    name: "Carlos",
    store: "ReviewPilot Demo",
    platform: rule.review_platform || "Google",
    channel: rule.channel || "email",
    delay: rule.delay_days ?? 7,
  };

  // 3. Instrucción principal — el prompt del usuario tiene prioridad total
  const DEFAULT_PROMPT =
    "Escribe un mensaje breve, cálido y natural para pedirle una reseña al cliente. " +
    "Máximo 3 oraciones. Termina con una llamada a la acción clara.";

  const userPrompt = rule.prompt && rule.prompt.trim()
    ? rule.prompt.trim()
    : DEFAULT_PROMPT;

  // 4. System: impone las instrucciones del usuario como ley
  //    User: solo provee el contexto del cliente
  const systemInstruction =
    `Eres un asistente que redacta mensajes de solicitud de reseña para negocios. ` +
    `DEBES seguir estrictamente las siguientes instrucciones del dueño del negocio:\n\n` +
    `---\n${userPrompt}\n---\n\n` +
    `Responde ÚNICAMENTE con el mensaje final. Sin comillas, sin explicaciones, sin prefijos.`;

  const userContext =
    `Escribe el mensaje usando estos datos:\n` +
    `- Cliente: ${demo.name}\n` +
    `- Tienda: ${demo.store}\n` +
    `- Plataforma de reseña: ${demo.platform}\n` +
    `- Canal de envío: ${demo.channel}\n` +
    `- Días desde el pedido: ${demo.delay}`;

  console.log(`[Preview] Prompt usado:\n${userPrompt}`);
  console.log(`[Preview] System instruction:\n${systemInstruction}`);

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: systemInstruction,
        messages: [{ role: "user", content: userContext }],
      }),
    });

    const aiData = await aiRes.json();
    console.log(`[Preview] Claude status: ${aiRes.status} — response: ${JSON.stringify(aiData).slice(0, 300)}`);

    const message = aiData.content?.[0]?.text?.trim();

    if (!message) {
      console.error("[Preview] Claude no devolvió texto:", JSON.stringify(aiData));
      return res.status(500).json({ error: "La IA no generó un mensaje. Intenta de nuevo." });
    }

    console.log(`[Preview] ✅ Mensaje generado:\n${message}`);
    res.json({ success: true, message });

  } catch (err) {
    console.error("[Preview] ❌ Error llamando a Claude:", err.message);
    res.status(500).json({ error: "Error conectando con la IA. Intenta de nuevo." });
  }
});

// Enviar correo de prueba — genera mensaje con IA y lo envía con Resend
app.post("/api/rules/:ruleId/send-test", async (req, res) => {
  const { ruleId } = req.params;
  const TEST_EMAIL = "fbotasjacob@gmail.com";

  console.log(`[SendTest] Iniciando envío de prueba para regla ${ruleId} → ${TEST_EMAIL}`);

  // 1. Buscar la regla en Supabase
  const { data: rule, error: ruleError } = await supabase
    .from("rules")
    .select("id, store_id, trigger, trigger_label, review_platform, channel, delay_days, prompt")
    .eq("id", ruleId)
    .single();

  if (ruleError || !rule) {
    console.error(`[SendTest] ❌ Regla no encontrada: ${ruleId}`, ruleError?.message);
    return res.status(404).json({ error: `Regla '${ruleId}' no encontrada` });
  }

  // 1b. Buscar la tienda para obtener google_review_url
  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("shop_domain, google_review_url")
    .eq("id", rule.store_id)
    .single();

  if (storeError || !storeData) {
    console.error(`[SendTest] ❌ Tienda no encontrada para store_id: ${rule.store_id}`);
    return res.status(404).json({ error: "Tienda asociada no encontrada" });
  }

  if (!storeData.google_review_url || !storeData.google_review_url.trim()) {
    console.warn(`[SendTest] ⚠️ google_review_url vacío para ${storeData.shop_domain}`);
    return res.status(400).json({
      error: "Configura primero el enlace de Google Reviews en la vista de detalle de tu tienda.",
    });
  }

  const googleReviewUrl = storeData.google_review_url.trim();

  // 2. Datos ficticios del cliente
  const demo = {
    name: "Carlos",
    store: "ReviewPilot Demo",
    platform: rule.review_platform || "Google",
    channel: rule.channel || "email",
    delay: rule.delay_days ?? 7,
  };

  // 3. Generar mensaje con Claude (misma lógica que /preview)
  const DEFAULT_PROMPT =
    "Escribe un mensaje breve, cálido y natural para pedirle una reseña al cliente. " +
    "Máximo 3 oraciones. Termina con una llamada a la acción clara.";

  const userPrompt = rule.prompt && rule.prompt.trim() ? rule.prompt.trim() : DEFAULT_PROMPT;

  const systemInstruction =
    `Eres un asistente que redacta mensajes de solicitud de reseña para negocios. ` +
    `DEBES seguir estrictamente las siguientes instrucciones del dueño del negocio:\n\n` +
    `---\n${userPrompt}\n---\n\n` +
    `Responde ÚNICAMENTE con el mensaje final. Sin comillas, sin explicaciones, sin prefijos.`;

  const userContext =
    `Escribe el mensaje usando estos datos:\n` +
    `- Cliente: ${demo.name}\n` +
    `- Tienda: ${demo.store}\n` +
    `- Plataforma de reseña: ${demo.platform}\n` +
    `- Canal de envío: ${demo.channel}\n` +
    `- Días desde el pedido: ${demo.delay}`;

  console.log(`[SendTest] Generando mensaje con Claude...`);

  let message;
  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: systemInstruction,
        messages: [{ role: "user", content: userContext }],
      }),
    });

    const aiData = await aiRes.json();
    message = aiData.content?.[0]?.text?.trim();

    if (!message) {
      console.error("[SendTest] Claude no devolvió texto:", JSON.stringify(aiData));
      return res.status(500).json({ error: "La IA no pudo generar el mensaje. Intenta de nuevo." });
    }

    console.log(`[SendTest] Mensaje generado:\n${message}`);
  } catch (err) {
    console.error("[SendTest] ❌ Error llamando a Claude:", err.message);
    return res.status(500).json({ error: "Error conectando con la IA." });
  }

  // 4. Enviar email con Resend
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #ececec; }
    .badge { background: #fef3c7; color: #92400e; text-align: center; padding: 8px; font-size: 12px; font-weight: 600; }
    .header { background: #0a0a0a; padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 400; margin: 0; }
    .body { padding: 36px 40px; }
    .message { font-size: 16px; color: #333; line-height: 1.75; margin-bottom: 32px; }
    .cta { display: block; background: #0a0a0a; color: #fff; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #bbb; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">⚠️ Este es un correo de prueba generado por ReviewPilot</div>
    <div class="header"><h1>${demo.store}</h1></div>
    <div class="body">
      <p class="message">${message.replace(/\n/g, "<br>")}</p>
      <a href="${googleReviewUrl}" class="cta">⭐ Dejar mi reseña en ${demo.platform}</a>
    </div>
    <div class="footer">
      Cliente de prueba: ${demo.name} · Canal: ${demo.channel}<br>
      Powered by <strong>ReviewPilot</strong>
    </div>
  </div>
</body>
</html>`;

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [TEST_EMAIL],
        subject: "Vista previa de solicitud de reseña",
        html: htmlBody,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok || !emailData.id) {
      console.error("[SendTest] ❌ Error Resend:", JSON.stringify(emailData));
      return res.status(500).json({
        error: "Error enviando el correo.",
        detail: emailData?.message || JSON.stringify(emailData),
      });
    }

    console.log(`[SendTest] ✅ Correo enviado → id=${emailData.id} a ${TEST_EMAIL}`);
    res.json({ success: true, message: "Correo de prueba enviado", emailId: emailData.id });

  } catch (err) {
    console.error("[SendTest] ❌ Error enviando con Resend:", err.message);
    res.status(500).json({ error: "Error enviando el correo. Intenta de nuevo." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT DE PRUEBA — simula un pedido entregado sin depender de Shopify
// POST /api/test/orders-fulfilled
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/test/orders-fulfilled", async (req, res) => {
  const TEST_SHOP    = "reviewpilot-test.myshopify.com";
  const TEST_NAME    = "Carlos";
  const TEST_EMAIL   = "fbotasjacob@gmail.com";
  const TEST_PRODUCT = "pedido de prueba";

  console.log(`[TestWebhook] Simulando orders/fulfilled para ${TEST_SHOP}`);

  // 1. Buscar la tienda en Supabase
  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("id, shop_domain, google_review_url")
    .eq("shop_domain", TEST_SHOP)
    .single();

  if (storeError || !storeData) {
    console.error("[TestWebhook] ❌ Tienda no encontrada:", storeError?.message);
    return res.status(404).json({ error: `Tienda '${TEST_SHOP}' no encontrada en Supabase` });
  }

  if (!storeData.google_review_url || !storeData.google_review_url.trim()) {
    return res.status(400).json({
      error: "Configura primero el enlace de Google Reviews en la vista de detalle de tu tienda."
    });
  }

  console.log(`[TestWebhook] ✅ Tienda encontrada → id=${storeData.id}`);

  // 2. Buscar solicitudes activas de esa tienda
  const { data: rules, error: rulesError } = await supabase
    .from("rules")
    .select("id, trigger, trigger_label, review_platform, channel, delay_days, prompt")
    .eq("store_id", storeData.id)
    .eq("active", true);

  if (rulesError) {
    console.error("[TestWebhook] ❌ Error buscando reglas:", rulesError.message);
    return res.status(500).json({ error: "Error buscando solicitudes activas" });
  }

  if (!rules || rules.length === 0) {
    return res.status(400).json({
      error: "No hay solicitudes activas para esta tienda. Crea y activa al menos una."
    });
  }

  console.log(`[TestWebhook] ✅ Solicitudes activas encontradas: ${rules.length}`);

  const DEFAULT_PROMPT =
    "Escribe un mensaje breve, cálido y natural para pedirle una reseña al cliente. " +
    "Máximo 3 oraciones. Termina con una llamada a la acción clara.";

  const results = [];

  // 3. Por cada solicitud activa: generar mensaje y enviar email
  for (const rule of rules) {
    const userPrompt = rule.prompt?.trim() || DEFAULT_PROMPT;
    const platform   = rule.review_platform || "Google";
    const channel    = rule.channel || "email";

    const systemInstruction =
      `Eres un asistente que redacta mensajes de solicitud de reseña para negocios. ` +
      `DEBES seguir estrictamente las siguientes instrucciones del dueño del negocio:\n\n` +
      `---\n${userPrompt}\n---\n\n` +
      `Responde ÚNICAMENTE con el mensaje final. Sin comillas, sin explicaciones, sin prefijos.`;

    const userContext =
      `Escribe el mensaje usando estos datos:\n` +
      `- Cliente: ${TEST_NAME}\n` +
      `- Producto: ${TEST_PRODUCT}\n` +
      `- Tienda: ${TEST_SHOP.replace(".myshopify.com", "")}\n` +
      `- Plataforma de reseña: ${platform}\n` +
      `- Canal de envío: ${channel}\n` +
      `- Días desde el pedido: ${rule.delay_days ?? 7}`;

    console.log(`[TestWebhook] Generando mensaje con Claude para regla ${rule.id}...`);

    let message;
    try {
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 400,
          system: systemInstruction,
          messages: [{ role: "user", content: userContext }],
        }),
      });

      const aiData = await aiRes.json();
      message = aiData.content?.[0]?.text?.trim();

      if (!message) {
        console.error(`[TestWebhook] Claude no generó texto para regla ${rule.id}:`, JSON.stringify(aiData));
        results.push({ ruleId: rule.id, success: false, error: "Claude no generó texto" });
        continue;
      }

      console.log(`[TestWebhook] ✅ Mensaje generado:\n${message}`);
    } catch (err) {
      console.error(`[TestWebhook] ❌ Error Claude para regla ${rule.id}:`, err.message);
      results.push({ ruleId: rule.id, success: false, error: err.message });
      continue;
    }

    // 4. Enviar email con Resend
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #ececec; }
    .header { background: #0a0a0a; padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 400; margin: 0; }
    .body { padding: 36px 40px; }
    .message { font-size: 16px; color: #333; line-height: 1.75; margin-bottom: 32px; }
    .cta { display: block; background: #0a0a0a; color: #fff; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #bbb; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${TEST_SHOP.replace(".myshopify.com", "")}</h1></div>
    <div class="body">
      <p class="message">${message.replace(/\n/g, "<br>")}</p>
      <a href="${storeData.google_review_url}" class="cta">⭐ Dejar mi reseña en ${platform}</a>
    </div>
    <div class="footer">
      Enviado a ${TEST_NAME} · ${TEST_EMAIL}<br>
      Powered by <strong>ReviewPilot</strong>
    </div>
  </div>
</body>
</html>`;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [TEST_EMAIL],
          subject: `¿Qué te pareció tu ${TEST_PRODUCT}? ⭐`,
          html: htmlBody,
        }),
      });

      const emailData = await emailRes.json();

      if (!emailRes.ok || !emailData.id) {
        console.error(`[TestWebhook] ❌ Error Resend para regla ${rule.id}:`, JSON.stringify(emailData));
        results.push({ ruleId: rule.id, success: false, error: emailData?.message || "Error Resend" });
      } else {
        console.log(`[TestWebhook] ✅ Email enviado → id=${emailData.id} a ${TEST_EMAIL}`);
        results.push({ ruleId: rule.id, success: true, emailId: emailData.id, message });
      }
    } catch (err) {
      console.error(`[TestWebhook] ❌ Error enviando email para regla ${rule.id}:`, err.message);
      results.push({ ruleId: rule.id, success: false, error: err.message });
    }
  }

  const emailsSent = results.filter(r => r.success).length;
  console.log(`[TestWebhook] ✅ Completado — ${emailsSent}/${rules.length} emails enviados`);

  res.json({
    success: emailsSent > 0,
    emailsSent,
    total: rules.length,
    message: emailsSent > 0
      ? `${emailsSent} email(s) enviados correctamente a ${TEST_EMAIL}`
      : "No se pudo enviar ningún email. Revisa los logs de Railway.",
    results,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    stores_in_memory: stores.size,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

function isValidShopDomain(shop) {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

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
  → GET  /api/stores                Ver tiendas (Supabase)
  → GET  /health                    Health check
  `);
});
