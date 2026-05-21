// middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');

exports.proteger = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Header recibido:', authHeader?.substring(0, 30));

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
    }

    const token = authHeader.substring(7).trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token OK, id:', decoded.id);
    } catch (err) {
      console.log('Token error:', err.name);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Sesión expirada.', tokenExpired: true });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { data: usuario, error } = await supabase
      .from('users')
      .select('id, rol, email, activo')
      .eq('id', decoded.id)
      .single();

    console.log('Usuario DB:', usuario?.id, '| Error:', error?.message);

    if (error || !usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.usuario = { id: usuario.id, rol: usuario.rol, email: usuario.email };
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'No autorizado' });
  }
};

exports.soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador.' });
  }
  next();
};