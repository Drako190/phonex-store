// ════ routes/users.js ════
const router = require('express').Router();
const User = require('../models/User');
const { proteger, soloAdmin } = require('../middleware/auth');

// Actualizar perfil
router.put('/perfil', proteger, async (req, res) => {
  try {
    const permitidos = ['nombre', 'apellido', 'telefono', 'avatar'];
    const updates = {};
    permitidos.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const usuario = await User.findByIdAndUpdate(req.usuario.id, updates, { new: true, runValidators: true });
    res.json({ usuario });
  } catch (err) { res.status(500).json({ error: 'Error al actualizar perfil' }); }
});

// Wishlist: toggle
router.post('/wishlist/:productoId', proteger, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id);
    const idx = usuario.wishlist.indexOf(req.params.productoId);
    if (idx > -1) { usuario.wishlist.splice(idx, 1); }
    else { usuario.wishlist.push(req.params.productoId); }
    await usuario.save();
    res.json({ wishlist: usuario.wishlist, enWishlist: idx === -1 });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

// Agregar dirección
router.post('/direcciones', proteger, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id);
    usuario.direcciones.push(req.body);
    await usuario.save();
    res.status(201).json({ direcciones: usuario.direcciones });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

// Admin: listar usuarios
router.get('/', proteger, soloAdmin, async (req, res) => {
  try {
    const usuarios = await User.find({ activo: true }).select('-password').sort('-createdAt');
    res.json({ usuarios });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;


// ════ routes/payments.js ════
// (Este archivo se usa para las rutas, el webhook se maneja en server.js directamente)
const routerPay = require('express').Router();
const paymentCtrl = require('../controllers/paymentController');

routerPay.post('/create-payment-intent', proteger, paymentCtrl.createPaymentIntent);
routerPay.post('/confirmar',             proteger, paymentCtrl.confirmarPago);
// webhook se registra directamente en server.js antes del json parser

module.exports = routerPay;
