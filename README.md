# 🥩 La Carnicería

Demo web app para ordenar carne asada al carbón por internet, con experiencia tipo Domino's pizza tracker y panel de cocina en tiempo real.

**Stack:** HTML estático + Tailwind (CDN) + Express + Server-Sent Events. Sin base de datos — persistencia en archivo JSON.

## ✨ Features

- 📱 **Menú mobile-first** con paquetes, sides, salsas, bebidas — bilingüe ES/EN
- 🎨 Selector de término estilo Pantone (6 swatches del azul al bien cocido)
- 🛒 Carrito con persistencia en `localStorage`
- 🍳 **Tracker en vivo** estilo Domino's: 4 estaciones, dot pulsante en la activa, overlay + chime cuando está listo
- 🔥 **Kanban del parrillero** con 4 columnas (cola/sasonando/parrilla/lista) — actualización en tiempo real vía SSE
- 📺 **Pantalla TV** "now serving" para el local con overlay grande cuando una orden está lista
- 📊 **Dashboard admin** con ingresos, ticket promedio, top items y distribución por hora — filtrable por rango (hoy/semana/mes/todo)
- 🚫 **Toggle de items agotados** desde el parrillero — actualiza el menú del cliente en vivo
- 👤 **Nombre del cliente** en el checkout → llamadas personalizadas en el tracker y pantalla
- 🎨 32 íconos PNG minimalistas generados con Gemini

## 🚀 Cómo correrlo

Necesitas Node 18+ instalado.

```bash
npm install
npm start
```

Por defecto corre en el puerto `2929`. Para cambiarlo:

```bash
PORT=5656 npm start
```

## 🌐 URLs

| Rol | Path | Para qué |
|---|---|---|
| 🥩 Cliente | `/` | Menú + carrito + checkout |
| 📦 Tracker | `/track/CR-XXXXX` | Cliente ve su orden avanzar en vivo |
| 🔥 Parrillero | `/parrillero` | Cocina avanza órdenes en kanban |
| 📺 Pantalla | `/pantalla` | Display en TV del local con "now serving" |
| 📊 Admin | `/admin` | Dashboard de ventas + lista de órdenes |
| 🎨 Prompts | `/prompts` | Los 28 prompts de Gemini para regenerar íconos |

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────┐
│  Cliente (mobile)                                    │
│  ├─ Menú → POST /api/orders                          │
│  └─ Tracker → SSE /api/orders/:id/stream             │
└──────────────────────────────────────────────────────┘
                          ↕
              ┌─────────────────────────┐
              │   Express server        │
              │   (server.js)           │
              │   ├─ /api/* endpoints   │
              │   └─ SSE broadcaster    │
              └─────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────┐
│  Parrillero (desktop)  ←→  Pantalla (TV)             │
│  ├─ Kanban             ├─ Now serving board         │
│  └─ Avanza órdenes     └─ Overlay + chime           │
│  Admin (desktop)                                     │
│  └─ Dashboard          ↑ todos vía SSE /api/stream  │
└──────────────────────────────────────────────────────┘
```

## 📂 Estructura

```
.
├── server.js              ← Express + SSE backend
├── index.html             ← Cliente (menú + carrito)
├── track.html             ← Tracker estilo Domino's
├── parrillero.html        ← Kanban de cocina
├── pantalla.html          ← Display TV del local
├── admin.html             ← Dashboard de ventas
├── prompts.html           ← Galería de prompts Gemini
├── icons/                 ← 32 PNGs de íconos (001-032.png)
├── icons-spec.md          ← Spec completa de los íconos
└── package.json
```

## 🔌 API

| Método | Endpoint | Para qué |
|---|---|---|
| `POST` | `/api/orders` | Crear orden nueva |
| `GET` | `/api/orders` | Listar órdenes activas (`?all=1` incluye archivadas) |
| `GET` | `/api/orders/:id` | Detalle de una orden |
| `PATCH` | `/api/orders/:id` | Cambiar status manualmente |
| `POST` | `/api/orders/:id/advance` | Avanzar al siguiente status |
| `DELETE` | `/api/orders/:id` | Archivar orden entregada |
| `GET` | `/api/sold-out` | Lista de IDs agotados |
| `POST` | `/api/sold-out` | Marcar/desmarcar item agotado |
| `GET` | `/api/stats?range=today\|week\|month\|all` | Aggregaciones para dashboard |
| `GET` | `/api/stream` | SSE global (parrillero, pantalla, admin) |
| `GET` | `/api/orders/:id/stream` | SSE específico de una orden (tracker) |

## 🎨 Íconos

Los 32 íconos PNG en `/icons/` se generaron con **Google Gemini** usando los prompts en `prompts.html`. Si quieres regenerarlos o agregar más:

1. Abre `/prompts` en el navegador (con el server corriendo)
2. Copia el prompt completo del ícono que necesitas
3. Pégalo en Gemini → descarga el resultado como `NNN.png`
4. Reemplaza en `/icons/`

Mapeo en `index.html` función `svgIcon()` → constante `ICON_MAP`.

## 📦 Persistencia

Las órdenes se guardan en `orders.json` (creado en runtime, no se commitea). Para reset total: `rm orders.json && npm start`.

## 🚧 To-do si va a producción

- [ ] Autenticación para `/parrillero` y `/admin`
- [ ] Base de datos real (SQLite/Postgres) en lugar de JSON
- [ ] Pago real (Stripe / Mercado Pago / Clip)
- [ ] WhatsApp/SMS de "tu pedido está listo" via Twilio
- [ ] PWA — instalable como app
- [ ] Backup periódico de órdenes

## 📝 Licencia

MIT — úsalo, modifícalo, monta tu carnicería.
