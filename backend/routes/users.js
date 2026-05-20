// routes/users.js — Con Supabase
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger, soloAdmin } = require('../middleware/auth');

router.put('/perfil', proteger, async (req, res) => {
  try {
    const permitidos = ['nombre', 'apellido', 'telefono', 'avatar'];
    const updates = {};
    permitidos.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data } = await supabase.from('users').update(updates)
      .eq('id', req.usuario.id).select('id,nombre,apellido,email,rol,avatar').single();
    res.json({ usuario: data });
  } catch (err) { res.status(500).json({ error: 'Error al actualizar perfil' }); }
});

router.post('/wishlist/:productoId', proteger, async (req, res) => {
  try {
    const { data: existe } = await supabase.from('wishlist')
      .select('id').eq('usuario_id', req.usuario.id).eq('producto_id', req.params.productoId).single();
    if (existe) {
      await supabase.from('wishlist').delete().eq('id', existe.id);
      res.json({ enWishlist: false });
    } else {
      await supabase.from('wishlist').insert({ usuario_id: req.usuario.id, producto_id: req.params.productoId });
      res.json({ enWishlist: true });
    }
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

router.post('/direcciones', proteger, async (req, res) => {
  try {
    const { data } = await supabase.from('direcciones')
      .insert({ ...req.body, usuario_id: req.usuario.id }).select();
    res.status(201).json({ direcciones: data });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

router.get('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { data } = await supabase.from('users')
      .select('id,nombre,apellido,email,rol,created_at').eq('activo', true).order('created_at', { ascending: false });
    res.json({ usuarios: data });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;