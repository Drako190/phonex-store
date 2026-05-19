// ════════════════════════════════════════
//  models/Product.js  —  Modelo de Producto
// ════════════════════════════════════════
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  usuario:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nombre:    { type: String, required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comentario:{ type: String, maxlength: 500 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  nombre:      { type: String, required: [true,'Nombre requerido'], trim: true },
  marca:       { type: String, required: [true,'Marca requerida'], trim: true },
  categoria:   { type: String, required: [true,'Categoría requerida'],
    enum: ['smartphone','tablet','smartwatch','audifonos','cargador','funda','cable','cargador-inalambrico','power-bank','accesorio'] },
  descripcion: { type: String, required: true },
  precio:      { type: Number, required: [true,'Precio requerido'], min: 0 },
  precioAntes: { type: Number, default: null },
  descuento:   { type: Number, default: 0, min: 0, max: 100 },

  // Imágenes (URLs o paths)
  imagenes: [{ type: String }],
  imagenPrincipal: { type: String, default: '' },

  // Stock
  stock:      { type: Number, required: true, default: 0, min: 0 },
  sku:        { type: String, unique: true, sparse: true },

  // Especificaciones técnicas (flexible para distintos productos)
  especificaciones: {
    pantalla:      String,
    procesador:    String,
    ram:           String,
    almacenamiento:String,
    camara:        String,
    bateria:       String,
    sistemaOp:     String,
    conectividad:  String,
    color:         [String],
    peso:          String,
    dimensiones:   String,
    // Para accesorios
    compatibilidad:[String],
    material:      String,
    garantia:      String,
  },

  // Relación con teléfono compatible (para accesorios)
  telefonosCompatibles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Badge/etiqueta
  badge:  { type: String, enum: ['nuevo','oferta','destacado','agotado',null], default: null },
  activo: { type: Boolean, default: true },

  // Reseñas
  reviews: [reviewSchema],
  numReviews: { type: Number, default: 0 },
  rating:     { type: Number, default: 0 },

  // Ventas
  vendidos: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Índices ────────────────────────────────────
productSchema.index({ nombre: 'text', marca: 'text', descripcion: 'text' });
productSchema.index({ categoria: 1, activo: 1 });
productSchema.index({ precio: 1 });
productSchema.index({ marca: 1 });

// ── Middleware: calcular rating promedio ───────
productSchema.methods.calcularRating = function() {
  if (this.reviews.length === 0) { this.rating = 0; this.numReviews = 0; return; }
  const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating = Math.round((total / this.reviews.length) * 10) / 10;
  this.numReviews = this.reviews.length;
};

module.exports = mongoose.model('Product', productSchema);
