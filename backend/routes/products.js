// routes/products.js
const router = require('express').Router();
const Product = require('../models/Product');
const { proteger, soloAdmin } = require('../middleware/auth');

// GET todos los productos (con filtros y búsqueda)
router.get('/', async (req, res) => {
  try {
    const { categoria, marca, minPrecio, maxPrecio, q, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const filtro = { activo: true };

    if (categoria) filtro.categoria = categoria;
    if (marca) filtro.marca = { $regex: marca, $options: 'i' };
    if (minPrecio || maxPrecio) {
      filtro.precio = {};
      if (minPrecio) filtro.precio.$gte = Number(minPrecio);
      if (maxPrecio) filtro.precio.$lte = Number(maxPrecio);
    }
    if (q) filtro.$text = { $search: q };

    const total = await Product.countDocuments(filtro);
    const productos = await Product.find(filtro)
      .select('-reviews')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      productos,
      pagina: Number(page),
      totalPaginas: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id)
      .populate('reviews.usuario', 'nombre apellido avatar')
      .populate('telefonosCompatibles', 'nombre marca imagenPrincipal');
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ producto });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// POST agregar reseña
router.post('/:id/reviews', proteger, async (req, res) => {
  try {
    const { rating, comentario } = req.body;
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const yaReseño = producto.reviews.find(r => r.usuario.toString() === req.usuario.id);
    if (yaReseño) return res.status(400).json({ error: 'Ya calificaste este producto' });

    const User = require('../models/User');
    const user = await User.findById(req.usuario.id);

    producto.reviews.push({ usuario: req.usuario.id, nombre: user.nombreCompleto, rating, comentario });
    producto.calcularRating();
    await producto.save();
    res.status(201).json({ message: '✅ Reseña agregada', rating: producto.rating });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar reseña' });
  }
});

// ── ADMIN: Crear producto
router.post('/', proteger, soloAdmin, async (req, res) => {
  try {
    const producto = await Product.create(req.body);
    res.status(201).json({ producto });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── ADMIN: Actualizar producto
router.put('/:id', proteger, soloAdmin, async (req, res) => {
  try {
    const producto = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ producto });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── ADMIN: Eliminar producto (soft delete)
router.delete('/:id', proteger, soloAdmin, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: '✅ Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
