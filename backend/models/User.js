// ════════════════════════════════════════
//  models/User.js  —  Modelo de Usuario
// ════════════════════════════════════════
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
  alias:     { type: String, default: 'Casa' },
  calle:     { type: String, required: true },
  ciudad:    { type: String, required: true },
  estado:    { type: String, required: true },
  cp:        { type: String, required: true },
  pais:      { type: String, default: 'México' },
  esPrincipal: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  nombre:   { type: String, required: [true, 'El nombre es requerido'], trim: true, maxlength: 50 },
  apellido: { type: String, required: [true, 'El apellido es requerido'], trim: true, maxlength: 50 },
  email: {
    type: String, required: [true, 'El email es requerido'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  password: {
    type: String, required: [true, 'La contraseña es requerida'],
    minlength: 8, select: false, // no se devuelve por defecto
  },
  telefono: { type: String, trim: true },
  avatar:   { type: String, default: null },
  rol: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },

  // Wishlist
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Direcciones guardadas
  direcciones: [addressSchema],

  // Stripe
  stripeCustomerId: { type: String, default: null },

  // Verificación de email
  emailVerificado: { type: Boolean, default: false },
  tokenVerificacion: String,

  // Recuperar contraseña
  tokenResetPassword: String,
  tokenResetPasswordExpira: Date,

  // Seguridad
  intentosFallidos: { type: Number, default: 0 },
  bloqueadoHasta:   { type: Date, default: null },
  activo:           { type: Boolean, default: true },
  ultimoLogin:      { type: Date, default: null },
}, {
  timestamps: true, // createdAt, updatedAt automáticos
  toJSON: { virtuals: true },
});

// ── Virtual: nombre completo ───────────────────
userSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

// ── Middleware: hashear contraseña antes de guardar ──
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// ── Método: comparar contraseña ───────────────
userSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// ── Método: generar token de reset ────────────
userSchema.methods.generarTokenReset = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.tokenResetPassword = crypto.createHash('sha256').update(token).digest('hex');
  this.tokenResetPasswordExpira = Date.now() + 30 * 60 * 1000; // 30 min
  return token; // Token sin hashear se envía al email
};

// ── Índices para mejor rendimiento ────────────
userSchema.index({ email: 1 });
userSchema.index({ tokenResetPassword: 1 });

module.exports = mongoose.model('User', userSchema);
