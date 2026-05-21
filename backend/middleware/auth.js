// middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');

exports.proteger = async (req, res, next) => {
  try {
    // ── Leer el header Authorization ────────────
    const authHeader = req.headers['authorization'] ||
                       req.headers['Authorization'];

    console.log('🔐 Auth header recibido:', authHeader ? 'SÍ' : 'NO');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
    }

    const token = authHeader.substring(7); // Quitar "Bearer "
    console.log('🎫 Token recibido (primeros 20 chars):', token.substring(0, 20));

    // ── Verificar JWT ────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token válido, usuario ID:', decoded.id);
    } catch (err) {
      console.log('❌ Token inválido:', err.name, err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Sesión expirada. Inicia sesión nuevamente.',
          tokenExpired: true,
        });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    // ── Buscar usuario en Supabase ───────────────
    const { data: usuario, error } = await supabase
      .from('users')
      .select('id, rol, email, activo')
      .eq('id', decoded.id)
      .single();

    console.log('👤 Usuario encontrado:', usuario ? 'SÍ' : 'NO', error?.message || '');

    if (error || !usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    req.usuario = {
      id:    usuario.id,
      rol:   usuario.rol,
      email: usuario.email,
    };

    next();
  } catch (err) {
    console.error('❌ Error en middleware auth:', err);
    res.status(401).json({ error: 'No autorizado' });
  }
};

exports.soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador.' });
  }
  next();
};