// ════════════════════════════════════════
//  models/Order.js  —  Modelo de Orden
// ════════════════════════════════════════
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  producto:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  nombre:    { type: String, required: true },
  imagen:    { type: String },
  precio:    { type: Number, required: true },
  cantidad:  { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  usuario:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:    [orderItemSchema],

  direccionEnvio: {
    calle:  { type: String, required: true },
    ciudad: { type: String, required: true },
    estado: { type: String, required: true },
    cp:     { type: String, required: true },
    pais:   { type: String, default: 'México' },
  },

  metodoPago: { type: String, required: true, default: 'stripe' },

  // Stripe
  stripePaymentIntentId: { type: String },
  stripePaymentStatus:   { type: String, default: 'pending' },

  // Precios
  subtotal:      { type: Number, required: true },
  costoEnvio:    { type: Number, default: 0 },
  descuento:     { type: Number, default: 0 },
  impuestos:     { type: Number, default: 0 },
  total:         { type: Number, required: true },

  // Estado del pedido
  estado: {
    type: String,
    enum: ['pendiente','pagado','procesando','enviado','entregado','cancelado','reembolsado'],
    default: 'pendiente',
  },

  // Seguimiento
  numeroSeguimiento: String,
  fechaPago:     Date,
  fechaEnvio:    Date,
  fechaEntrega:  Date,

  notas: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Virtual: número de orden amigable ──────────
orderSchema.virtual('numeroOrden').get(function() {
  return `PX-${this._id.toString().slice(-8).toUpperCase()}`;
});

orderSchema.index({ usuario: 1, createdAt: -1 });
orderSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Order', orderSchema);
