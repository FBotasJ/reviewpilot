# Guía de despliegue — ReviewPilot

## Estructura del proyecto

```
reviewpilot/
├── frontend/       → Se despliega en Netlify
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── netlify.toml
│   ├── .env.production
│   └── package.json
│
└── server/         → Se despliega en Railway
    ├── index.js
    ├── .env.example
    ├── railway.toml
    └── package.json
```

---

## PARTE 1 — Desplegar el servidor en Railway

### Paso 1: Subir a GitHub

```bash
# En la carpeta raíz del proyecto:
git init
git add .
git commit -m "Initial commit"

# Crea un repo en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/reviewpilot.git
git push -u origin main
```

### Paso 2: Crear proyecto en Railway

1. Ve a **railway.app** y crea una cuenta (gratis)
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige tu repositorio
5. Railway detecta el `server/` automáticamente

### Paso 3: Configurar variables de entorno en Railway

En el dashboard de Railway → tu servicio → **"Variables"**, agrega:

```
SHOPIFY_CLIENT_ID        = tu_api_key_de_shopify
SHOPIFY_CLIENT_SECRET    = tu_api_secret_de_shopify
ANTHROPIC_API_KEY        = sk-ant-...
RESEND_API_KEY           = re_...
EMAIL_FROM               = noreply@tu-dominio.com
APP_URL                  = (déjalo vacío por ahora, lo llenarás después)
PORT                     = 3001
NODE_ENV                 = production
```

### Paso 4: Obtener la URL de Railway

Después del deploy, Railway te da una URL como:
`https://reviewpilot-server-production.up.railway.app`

Cópiala y actualiza la variable `APP_URL` con esa URL.

---

## PARTE 2 — Desplegar el frontend en Netlify

### Paso 1: Actualizar la URL del servidor

Abre `frontend/.env.production` y pon la URL de Railway:

```env
REACT_APP_API_URL=https://reviewpilot-server-production.up.railway.app
```

Haz commit y push:
```bash
git add .
git commit -m "Add Railway URL"
git push
```

### Paso 2: Crear proyecto en Netlify

1. Ve a **netlify.com** y crea una cuenta (gratis)
2. Click en **"Add new site"** → **"Import an existing project"**
3. Conecta tu GitHub y elige el repositorio
4. Configura el build:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/build`
5. Click en **"Deploy site"**

### Paso 3: Variables de entorno en Netlify

En Netlify → **Site settings** → **Environment variables**:

```
REACT_APP_API_URL = https://reviewpilot-server-production.up.railway.app
```

Haz un nuevo deploy para que tome efecto.

---

## PARTE 3 — Actualizar Shopify con las URLs finales

Con tus URLs en mano, vuelve a **partners.shopify.com** → tu app → **App setup**:

- **App URL:** `https://TU-SITE.netlify.app`
- **Allowed redirection URLs:** `https://reviewpilot-server-production.up.railway.app/auth/shopify/callback`

---

## URLs finales de tu app

| Servicio | URL |
|---|---|
| Frontend (Netlify) | `https://TU-SITE.netlify.app` |
| Servidor (Railway) | `https://reviewpilot-server-production.up.railway.app` |
| OAuth callback | `https://...railway.app/auth/shopify/callback` |
| Webhook endpoint | `https://...railway.app/webhooks/orders-fulfilled` |
| Health check | `https://...railway.app/health` |

---

## Probar que todo funciona

```bash
# 1. Verificar que el servidor está vivo
curl https://reviewpilot-server-production.up.railway.app/health

# 2. Iniciar el flujo OAuth con tu tienda de desarrollo
# Abre en el navegador:
https://reviewpilot-server-production.up.railway.app/auth/shopify?shop=tu-dev-store.myshopify.com
```

Si ves la pantalla de autorización de Shopify, ¡todo está funcionando! 🎉
