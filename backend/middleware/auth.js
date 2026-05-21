// middleware/auth.js
const jwt  = require('jsonwebtoken');
const { supabase } = require('../config/db');

// ── Proteger rutas ─────────────────────────────
exports.proteger = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Sesión expirada. Inicia sesión nuevamente.',
          tokenExpired: true
        });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar que el usuario existe en Supabase
    const { data: usuario, error } = await supabase
      .from('users')
      .select('id, rol, email, activo')
      .eq('id', decoded.id)
      .single();

    if (error || !usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    // Adjuntar usuario a la request
    req.usuario = {
      id:    usuario.id,
      rol:   usuario.rol,
      email: usuario.email,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'No autorizado' });
  }
};

// ── Solo administradores ───────────────────────
exports.soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de administrador.'
    });
  }
  next();
};