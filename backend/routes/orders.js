// routes/orders.js — Con Supabase
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger, soloAdmin } = require('../middleware/auth');

router.get('/mis-ordenes', proteger, async (req, res) => {
  try {
    const { data: ordenes } = await supabase.from('orders')
      .select('*, order_items(*)')
      .eq('usuario_id', req.usuario.id).order('created_at', { ascending: false });
    res.json({ ordenes });
  } catch (err) { res.status(500).json({ error: 'Error al obtener órdenes' }); }
});

router.get('/:id', proteger, async (req, res) => {
  try {
    const { data: orden } = await supabase.from('orders')
      .select('*, order_items(*)').eq('id', req.params.id).single();
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    if (orden.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin')
      return res.status(403).json({ error: 'No autorizado' });
    res.json({ orden });
  } catch (err) { res.status(500).json({ error: 'Error al obtener orden' }); }
});

router.get('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { data: ordenes } = await supabase.from('orders')
      .select('*, users(nombre, apellido, email)')
      .order('created_at', { ascending: false });
    res.json({ ordenes });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

router.patch('/:id/estado', proteger, soloAdmin, async (req, res) => {
  try {
    const { data } = await supabase.from('orders')
      .update({ estado: req.body.estado }).eq('id', req.params.id).select().single();
    res.json({ orden: data });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;