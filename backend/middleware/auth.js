// ════════════════════════════════════════════════
//  middleware/auth.js  —  Middleware de autenticación JWT
// ════════════════════════════════════════════════
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Proteger rutas (requiere login) ───────────
exports.proteger = async (req, res, next) => {
  try {
    // Obtener token del header Authorization: Bearer <token>
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
        return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.', tokenExpired: true });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar que el usuario aún existe y está activo
    const usuario = await User.findById(decoded.id).select('-password');
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    // Adjuntar usuario a la request
    req.usuario = { id: usuario._id, rol: usuario.rol, email: usuario.email };
    next();
  } catch (err) {
    res.status(401).json({ error: 'No autorizado' });
  }
};

// ── Solo administradores ──────────────────────
exports.soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};
