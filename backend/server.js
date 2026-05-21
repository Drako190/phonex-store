require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
const path     = require('path');

const { connectDB } = require('./config/db');

// ── Rutas ──────────────────────────────────────
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const orderRoutes    = require('./routes/orders');
const userRoutes     = require('./routes/users');
const paymentRoutes  = require('./routes/payments');
const categoryRoutes = require('./routes/categories');

// ── Conectar Supabase ──────────────────────────
connectDB();

const app = express();

app.set('trust proxy', 1);

// ── Seguridad ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ───────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Stripe Webhook (antes del json parser) ─────
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/paymentController').handleWebhook
);

// ── Body Parser ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logger ─────────────────────────────────────
app.use(morgan('dev'));

// ── Rate Limiting ──────────────────────────────
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones' },
  validate: { xForwardedForHeader: false },
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos' },
  validate: { xForwardedForHeader: false },
});

app.use('/api/', generalLimit);
app.use('/api/auth/login',           authLimit);
app.use('/api/auth/register',        authLimit);
app.use('/api/auth/forgot-password', authLimit);

// ── Rutas API ──────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/categories', categoryRoutes);

// ── Health check ───────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '✅ PhoneX Store API funcionando',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Errores globales ───────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Error interno' });
});

// ── Iniciar ────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  🚀 PhoneX Store corriendo            ║`);
  console.log(`║  📡 Puerto: ${PORT}                       ║`);
  console.log(`║  🌍 Entorno: ${process.env.NODE_ENV || 'development'}           ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;