// ════════════════════════════════════════════════
//  server.js  —  PhoneX Store Backend
// ════════════════════════════════════════════════
require('dotenv').config(); // ← Carga el archivo .env
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');

// ── Rutas ──────────────────────────────────────
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const orderRoutes    = require('./routes/orders');
const userRoutes     = require('./routes/users');
const paymentRoutes  = require('./routes/payments');
const categoryRoutes = require('./routes/categories');

// ── Conectar a MongoDB ─────────────────────────
connectDB();

const app = express();

// ── Seguridad: Headers HTTP ────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ───────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:5500',  // Live Server de VS Code
    'http://localhost:5500',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Stripe Webhook (antes de express.json) ─────
app.use('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/paymentController').handleWebhook
);

// ── Body Parser ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ─────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limiting (Anti-spam/DDoS) ────────────
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas peticiones, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Más estricto para login/register
  message: { error: 'Demasiados intentos de autenticación' },
});

app.use('/api/', generalLimit);
app.use('/api/auth/login', authLimit);
app.use('/api/auth/register', authLimit);
app.use('/api/auth/forgot-password', authLimit);

// ── Archivos estáticos (uploads) ───────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rutas API ──────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/categories', categoryRoutes);

// ── Ruta de salud del servidor ─────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '✅ PhoneX Store API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── Manejo de rutas no encontradas ────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Manejo global de errores ──────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Iniciar servidor ──────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  🚀 PhoneX Store corriendo            ║`);
  console.log(`║  📡 Puerto: ${PORT}                       ║`);
  console.log(`║  🌍 Entorno: ${process.env.NODE_ENV || 'development'}           ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;
