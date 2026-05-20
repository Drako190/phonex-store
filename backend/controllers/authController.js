// controllers/authController.js — Con Supabase
const { supabase } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generarToken = (id, rol) =>
  jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// REGISTRAR
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;

    // Verificar si existe
    const { data: existe } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existe) return res.status(400).json({ error: 'Este email ya está registrado' });

    // Hashear contraseña
    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    const { data: usuario, error } = await supabase
      .from('users')
      .insert({ nombre, apellido, email, password: hash, telefono })
      .select('id, nombre, apellido, email, rol, avatar')
      .single();

    if (error) throw error;

    const token = generarToken(usuario.id, usuario.rol);
    res.status(201).json({ message: '✅ Cuenta creada', token, usuario });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: usuario } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (!usuario) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    // Verificar bloqueo
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      const min = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
      return res.status(423).json({ error: `Cuenta bloqueada. Intenta en ${min} minutos` });
    }

    const correcto = await bcrypt.compare(password, usuario.password);
    if (!correcto) {
      const intentos = usuario.intentos_fallidos + 1;
      const update = intentos >= 5
        ? { intentos_fallidos: 0, bloqueado_hasta: new Date(Date.now() + 15 * 60000) }
        : { intentos_fallidos: intentos };
      await supabase.from('users').update(update).eq('id', usuario.id);
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    await supabase.from('users').update({
      intentos_fallidos: 0, bloqueado_hasta: null, ultimo_login: new Date()
    }).eq('id', usuario.id);

    const token = generarToken(usuario.id, usuario.rol);
    res.json({
      message: `✅ Bienvenido, ${usuario.nombre}!`, token,
      usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido,
        email: usuario.email, rol: usuario.rol, avatar: usuario.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// OLVIDÉ CONTRASEÑA
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: usuario } = await supabase
      .from('users').select('*').eq('email', email).eq('activo', true).single();

    if (!usuario) return res.json({ message: '📧 Si el email existe recibirás el enlace' });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await supabase.from('users').update({
      token_reset_password: tokenHash,
      token_reset_expira: new Date(Date.now() + 30 * 60000)
    }).eq('id', usuario.id);

    const resetURL = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${token}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM, to: usuario.email,
        subject: '🔐 Recupera tu contraseña — PhoneX Store',
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0d0d14;color:#f0f0ff;padding:2rem;border-radius:12px">
          <h2 style="color:#6c63ff">PhoneX Store</h2>
          <p>Hola <strong>${usuario.nombre}</strong>, haz clic para restablecer tu contraseña:</p>
          <a href="${resetURL}" style="display:inline-block;background:#6c63ff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:1rem 0">
            Restablecer contraseña
          </a>
          <p style="color:#6b6b8a;font-size:0.85rem">Expira en 30 minutos.</p>
        </div>`
      });
    } catch (e) {
      await supabase.from('users').update({
        token_reset_password: null, token_reset_expira: null
      }).eq('id', usuario.id);
      return res.status(500).json({ error: 'Error al enviar el email' });
    }

    res.json({ message: '📧 Si el email existe recibirás el enlace' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const { data: usuario } = await supabase.from('users')
      .select('*').eq('token_reset_password', tokenHash)
      .gt('token_reset_expira', new Date().toISOString()).single();

    if (!usuario) return res.status(400).json({ error: 'Token inválido o expirado' });
    if (req.body.password.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

    const hash = await bcrypt.hash(req.body.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await supabase.from('users').update({
      password: hash, token_reset_password: null,
      token_reset_expira: null, intentos_fallidos: 0, bloqueado_hasta: null
    }).eq('id', usuario.id);

    const token = generarToken(usuario.id, usuario.rol);
    res.json({ message: '✅ Contraseña actualizada', token });
  } catch (err) {
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};

// GET ME
exports.getMe = async (req, res) => {
  try {
    const { data: usuario } = await supabase
      .from('users').select('id, nombre, apellido, email, rol, avatar, telefono')
      .eq('id', req.usuario.id).single();
    res.json({ usuario });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const { data: usuario } = await supabase
      .from('users').select('password').eq('id', req.usuario.id).single();

    const correcto = await bcrypt.compare(passwordActual, usuario.password);
    if (!correcto) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    if (passwordNuevo.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

    const hash = await bcrypt.hash(passwordNuevo, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await supabase.from('users').update({ password: hash }).eq('id', req.usuario.id);

    const token = generarToken(req.usuario.id, req.usuario.rol);
    res.json({ message: '✅ Contraseña actualizada', token });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};