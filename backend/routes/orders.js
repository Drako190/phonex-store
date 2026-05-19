// ════ routes/orders.js ════
const router = require('express').Router();
const Order = require('../models/Order');
const { proteger, soloAdmin } = require('../middleware/auth');

router.get('/mis-ordenes', proteger, async (req, res) => {
  try {
    const ordenes = await Order.find({ usuario: req.usuario.id }).sort('-createdAt');
    res.json({ ordenes });
  } catch (err) { res.status(500).json({ error: 'Error al obtener órdenes' }); }
});

router.get('/:id', proteger, async (req, res) => {
  try {
    const orden = await Order.findById(req.params.id).populate('items.producto', 'nombre imagenPrincipal');
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    if (orden.usuario.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json({ orden });
  } catch (err) { res.status(500).json({ error: 'Error al obtener orden' }); }
});

router.get('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, estado } = req.query;
    const filtro = estado ? { estado } : {};
    const ordenes = await Order.find(filtro)
      .populate('usuario', 'nombre apellido email')
      .sort('-createdAt').limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    res.json({ ordenes });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

router.patch('/:id/estado', proteger, soloAdmin, async (req, res) => {
  try {
    const orden = await Order.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
    res.json({ orden });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;
