// routes/auth.js
const router = require('express').Router();
const { body } = require('express-validator');
const authCtrl = require('../controllers/authController');
const { proteger } = require('../middleware/auth');

const validarRegistro = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 50 }),
  body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe tener mayúsculas, minúsculas y números'),
];

const validarLogin = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

const handleValidation = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

router.post('/register',         validarRegistro,  handleValidation, authCtrl.register);
router.post('/login',            validarLogin,     handleValidation, authCtrl.login);
router.post('/forgot-password',  authCtrl.forgotPassword);
router.post('/reset-password/:token', authCtrl.resetPassword);
router.get('/me',   proteger, authCtrl.getMe);
router.put('/update-password', proteger, authCtrl.updatePassword);

module.exports = router;
