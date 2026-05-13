// La Carnicería — Express + SSE backend
// Run: npm install && npm start
// Customer:    http://localhost:3000
// Parrillero:  http://localhost:3000/parrillero

const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 2929;
const DB_FILE = path.join(__dirname, 'orders.json');

// ---------- STORAGE (JSON file, simple persistence) ----------
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { orders: {}, soldOut: [] };
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!data.soldOut) data.soldOut = [];
    return data;
  } catch (e) {
    console.error('DB load failed, starting fresh:', e.message);
    return { orders: {}, soldOut: [] };
  }
}

let db = loadDB();
let saveTimer = null;
function saveDB() {
  // Debounce writes for performance
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), () => {});
  }, 100);
}

// ---------- STATUSES ----------
const STATUSES = ['queued', 'seasoning', 'grilling', 'ready'];

function nextStatus(current) {
  const i = STATUSES.indexOf(current);
  if (i < 0 || i >= STATUSES.length - 1) return null;
  return STATUSES[i + 1];
}

function genOrderId() {
  // CR-XXXXX uppercase, easy to read
  return 'CR-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ---------- SSE BROADCAST ----------
const allClients = new Set();           // global stream (parrillero)
const orderClients = new Map();         // orderId -> Set<res>

function sseSend(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastAll(event, data) {
  for (const r of allClients) sseSend(r, event, data);
}

function broadcastOrder(orderId, event, data) {
  const set = orderClients.get(orderId);
  if (!set) return;
  for (const r of set) sseSend(r, event, data);
}

// ---------- APP ----------
const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(__dirname, { extensions: ['html'] }));

// Routes for the dedicated pages
app.get('/parrillero', (req, res) => res.sendFile(path.join(__dirname, 'parrillero.html')));
app.get('/track/:id', (req, res) => res.sendFile(path.join(__dirname, 'track.html')));
app.get('/admin',     (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/pantalla',  (req, res) => res.sendFile(path.join(__dirname, 'pantalla.html')));

// ---------- API ----------

// Create order
app.post('/api/orders', (req, res) => {
  const { items, total, lang = 'es', subtotal, tax, customerName } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'invalid items' });
  }
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ error: 'invalid total' });
  }
  let id = genOrderId();
  // avoid collision (extremely unlikely but cheap)
  while (db.orders[id]) id = genOrderId();
  const now = Date.now();
  const order = {
    id,
    created_at: now,
    updated_at: now,
    status: 'queued',
    status_history: [{ status: 'queued', at: now }],
    items,
    subtotal: subtotal ?? total / 1.0825,
    tax: tax ?? total - total / 1.0825,
    total,
    lang,
    customerName: typeof customerName === 'string' ? customerName.trim().slice(0, 60) : '',
  };
  db.orders[id] = order;
  saveDB();
  broadcastAll('order:new', order);
  res.status(201).json(order);
});

// List orders (parrillero feed)
app.get('/api/orders', (req, res) => {
  const includeReady = req.query.includeReady === '1';
  const includeArchived = req.query.all === '1';
  const list = Object.values(db.orders)
    .filter(o => {
      if (o.archived && !includeArchived) return false;
      if (includeArchived) return true;
      return includeReady || o.status !== 'ready' || (Date.now() - o.updated_at < 1000 * 60 * 30);
    })
    .sort((a, b) => a.created_at - b.created_at);
  res.json(list);
});

// Single order
app.get('/api/orders/:id', (req, res) => {
  const order = db.orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'not found' });
  res.json(order);
});

// Update status (parrillero advances)
app.patch('/api/orders/:id', (req, res) => {
  const order = db.orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'not found' });
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });
  if (status === order.status) return res.json(order);
  order.status = status;
  order.updated_at = Date.now();
  order.status_history.push({ status, at: order.updated_at });
  saveDB();
  broadcastAll('order:update', order);
  broadcastOrder(order.id, 'order:update', order);
  res.json(order);
});

// Advance to next status (convenience for parrillero)
app.post('/api/orders/:id/advance', (req, res) => {
  const order = db.orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'not found' });
  const next = nextStatus(order.status);
  if (!next) return res.status(400).json({ error: 'already at final status' });
  order.status = next;
  order.updated_at = Date.now();
  order.status_history.push({ status: next, at: order.updated_at });
  saveDB();
  broadcastAll('order:update', order);
  broadcastOrder(order.id, 'order:update', order);
  res.json(order);
});

// Archive (parrillero "delivered" — kept for analytics, hidden from active feeds)
app.delete('/api/orders/:id', (req, res) => {
  const order = db.orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'not found' });
  order.archived = true;
  order.archived_at = Date.now();
  saveDB();
  broadcastAll('order:delete', { id: req.params.id });
  res.status(204).end();
});

// Aggregated stats endpoint — date-ranged
app.get('/api/stats', (req, res) => {
  const range = req.query.range || 'today';
  const now = new Date();
  let since;
  if (range === 'today') {
    const t = new Date(now); t.setHours(0,0,0,0);
    since = t.getTime();
  } else if (range === 'week') {
    since = now.getTime() - 7 * 24 * 3600 * 1000;
  } else if (range === 'month') {
    since = now.getTime() - 30 * 24 * 3600 * 1000;
  } else {
    since = 0;
  }
  const orders = Object.values(db.orders).filter(o => o.created_at >= since);
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const orderCount = orders.length;
  const avgTicket = orderCount ? revenue / orderCount : 0;
  // Top items
  const itemCounts = new Map();
  orders.forEach(o => {
    (o.items || []).forEach(it => {
      const key = (it.name || '?') + (it.serves ? ` · ${it.serves}` : it.sub ? ` · ${it.sub}` : '');
      const prev = itemCounts.get(key) || { name: key, qty: 0, revenue: 0 };
      prev.qty += (it.qty || 1);
      prev.revenue += (it.price || 0);
      itemCounts.set(key, prev);
    });
  });
  const topItems = [...itemCounts.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);
  const totalItems = topItems.reduce((s, i) => s + i.qty, 0)
    || [...itemCounts.values()].reduce((s, i) => s + i.qty, 0);
  // Status distribution
  const statusCounts = { queued: 0, seasoning: 0, grilling: 0, ready: 0, archived: 0 };
  orders.forEach(o => {
    if (o.archived) statusCounts.archived++;
    else statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  // Hourly breakdown (current range)
  const hourly = Array(24).fill(0);
  const hourlyRevenue = Array(24).fill(0);
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    hourly[h]++;
    hourlyRevenue[h] += (o.total || 0);
  });
  res.json({
    range,
    since,
    revenue,
    orderCount,
    avgTicket,
    totalItems,
    topItems,
    statusCounts,
    hourly,
    hourlyRevenue,
  });
});

// SSE — global stream (parrillero subscribes)
app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(`: connected\n\n`);
  allClients.add(res);
  const ping = setInterval(() => res.write(`: ping\n\n`), 20000);
  req.on('close', () => {
    clearInterval(ping);
    allClients.delete(res);
  });
});

// SSE — per-order stream (customer tracker subscribes)
app.get('/api/orders/:id/stream', (req, res) => {
  const orderId = req.params.id;
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(`: connected\n\n`);
  if (!orderClients.has(orderId)) orderClients.set(orderId, new Set());
  orderClients.get(orderId).add(res);
  const ping = setInterval(() => res.write(`: ping\n\n`), 20000);
  req.on('close', () => {
    clearInterval(ping);
    const set = orderClients.get(orderId);
    if (set) {
      set.delete(res);
      if (set.size === 0) orderClients.delete(orderId);
    }
  });
});

// ---------- SOLD-OUT (parrillero marks items unavailable) ----------
app.get('/api/sold-out', (req, res) => {
  res.json({ items: db.soldOut });
});

app.post('/api/sold-out', (req, res) => {
  const { id, soldOut } = req.body || {};
  if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'invalid id' });
  const set = new Set(db.soldOut);
  if (soldOut) set.add(id); else set.delete(id);
  db.soldOut = [...set];
  saveDB();
  broadcastAll('items:soldout', { items: db.soldOut });
  res.json({ items: db.soldOut });
});

// Health check
app.get('/api/health', (req, res) => res.json({
  ok: true,
  orders: Object.keys(db.orders).length,
  soldOut: db.soldOut.length,
}));

app.listen(PORT, () => {
  console.log(`\n  🥩 LA CARNICERÍA backend running\n`);
  console.log(`  Customer:   http://localhost:${PORT}`);
  console.log(`  Parrillero: http://localhost:${PORT}/parrillero\n`);
});
