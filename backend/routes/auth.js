// routes/auth.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const authCtrl = require('../controllers/authController');
const { proteger } = require('../middleware/auth');

// ── Validaciones ───────────────────────────────
const validarRegistro = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
];

const validarLogin = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// ── Rutas públicas ─────────────────────────────
router.post('/register',
  validarRegistro, handleValidation, authCtrl.register);

router.post('/login',
  validarLogin, handleValidation, authCtrl.login);

router.post('/forgot-password',
  authCtrl.forgotPassword);

router.post('/reset-password/:token',
  authCtrl.resetPassword);

// ── Rutas protegidas ───────────────────────────
router.get('/me',
  proteger, authCtrl.getMe);

router.put('/update-password',
  proteger, authCtrl.updatePassword);

module.exports = router;