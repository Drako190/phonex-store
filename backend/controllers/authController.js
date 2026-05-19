// ════════════════════════════════════════════════
//  controllers/authController.js
// ════════════════════════════════════════════════
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ── Generar JWT ────────────────────────────────
const generarToken = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── Configurar transporte de email ─────────────
const crearTransporter = () => nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ── REGISTRAR ─────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;

    // Verificar si el email ya existe
    const existente = await User.findOne({ email });
    if (existente) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Crear usuario
    const usuario = await User.create({ nombre, apellido, email, password, telefono });

    const token = generarToken(usuario._id, usuario.rol);

    res.status(201).json({
      message: '✅ Cuenta creada exitosamente',
      token,
      usuario: {
        id:       usuario._id,
        nombre:   usuario.nombre,
        apellido: usuario.apellido,
        email:    usuario.email,
        rol:      usuario.rol,
        avatar:   usuario.avatar,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }
    if (err.name === 'ValidationError') {
      const errores = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errores[0] });
    }
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
};

// ── INICIAR SESIÓN ────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario (incluir password que está oculto)
    const usuario = await User.findOne({ email, activo: true }).select('+password');
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Verificar si está bloqueado
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > Date.now()) {
      const minutos = Math.ceil((usuario.bloqueadoHasta - Date.now()) / 60000);
      return res.status(423).json({ error: `Cuenta bloqueada. Intenta en ${minutos} minutos` });
    }

    // Verificar contraseña
    const passwordCorrecto = await usuario.compararPassword(password);
    if (!passwordCorrecto) {
      usuario.intentosFallidos += 1;
      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        usuario.intentosFallidos = 0;
      }
      await usuario.save({ validateBeforeSave: false });
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Resetear intentos fallidos y guardar último login
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    usuario.ultimoLogin = new Date();
    await usuario.save({ validateBeforeSave: false });

    const token = generarToken(usuario._id, usuario.rol);

    res.json({
      message: `✅ Bienvenido, ${usuario.nombre}!`,
      token,
      usuario: {
        id:       usuario._id,
        nombre:   usuario.nombre,
        apellido: usuario.apellido,
        email:    usuario.email,
        rol:      usuario.rol,
        avatar:   usuario.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// ── OLVIDÉ CONTRASEÑA ─────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const usuario = await User.findOne({ email, activo: true });
    // Por seguridad, siempre respondemos igual aunque no exista el email
    if (!usuario) {
      return res.json({ message: '📧 Si el email existe, recibirás un enlace de recuperación' });
    }

    const tokenReset = usuario.generarTokenReset();
    await usuario.save({ validateBeforeSave: false });

    // URL de reset (ajusta según tu frontend)
    const resetURL = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${tokenReset}`;

    // Enviar email
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      usuario.email,
        subject: '🔐 Recupera tu contraseña — PhoneX Store',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0d0d14;color:#f0f0ff;padding:2rem;border-radius:12px;border:1px solid #1e1e2e">
            <h2 style="color:#6c63ff">PhoneX Store</h2>
            <h3>Recuperar contraseña</h3>
            <p>Hola <strong>${usuario.nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
            <a href="${resetURL}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#8b5cf6);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:1rem 0;font-weight:600">
              Restablecer contraseña
            </a>
            <p style="color:#6b6b8a;font-size:0.85rem">Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste esto, ignora este email.</p>
            <hr style="border-color:#1e1e2e">
            <p style="color:#3a3a5c;font-size:0.75rem">© PhoneX Store — Proyecto Universitario</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
      usuario.tokenResetPassword = undefined;
      usuario.tokenResetPasswordExpira = undefined;
      await usuario.save({ validateBeforeSave: false });
      return res.status(500).json({ error: 'Error al enviar el email. Verifica la configuración.' });
    }

    res.json({ message: '📧 Si el email existe, recibirás un enlace de recuperación' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// ── RESETEAR CONTRASEÑA ───────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hashear el token recibido para comparar con el guardado
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const usuario = await User.findOne({
      tokenResetPassword: tokenHash,
      tokenResetPasswordExpira: { $gt: Date.now() },
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Actualizar contraseña
    usuario.password = password;
    usuario.tokenResetPassword = undefined;
    usuario.tokenResetPasswordExpira = undefined;
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();

    const newToken = generarToken(usuario._id, usuario.rol);
    res.json({
      message: '✅ Contraseña actualizada exitosamente',
      token: newToken,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

// ── OBTENER PERFIL (ruta protegida) ───────────
exports.getMe = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id)
      .populate('wishlist', 'nombre precio imagenPrincipal marca');
    res.json({ usuario });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

// ── ACTUALIZAR CONTRASEÑA (sesión activa) ─────
exports.updatePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const usuario = await User.findById(req.usuario.id).select('+password');

    const correcto = await usuario.compararPassword(passwordActual);
    if (!correcto) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    if (passwordNuevo.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });

    usuario.password = passwordNuevo;
    await usuario.save();

    const token = generarToken(usuario._id, usuario.rol);
    res.json({ message: '✅ Contraseña actualizada', token });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};
