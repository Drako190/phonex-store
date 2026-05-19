// routes/payments.js
const router = require('express').Router();
const paymentCtrl = require('../controllers/paymentController');
const { proteger } = require('../middleware/auth');

router.post('/create-payment-intent', proteger, paymentCtrl.createPaymentIntent);
router.post('/confirmar',             proteger, paymentCtrl.confirmarPago);
// El webhook /webhook se maneja en server.js ANTES del express.json()

module.exports = router;
