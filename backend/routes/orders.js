// routes/orders.js — Supabase
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger, soloAdmin } = require('../middleware/auth');

// ── Mis órdenes ────────────────────────────────
router.get('/mis-ordenes', proteger, async (req, res) => {
  try {
    const { data: ordenes, error } = await supabase
      .from('orders')
      .select(`
        id,
        estado,
        total,
        subtotal,
        costo_envio,
        impuestos,
        created_at,
        fecha_pago,
        stripe_payment_status,
        direccion_envio,
        order_items (
          id,
          nombre,
          precio,
          cantidad,
          imagen
        )
      `)
      .eq('usuario_id', req.usuario.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ ordenes: ordenes || [] });
  } catch (err) {
    console.error('Error mis-ordenes:', err.message);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// ── Orden por ID ───────────────────────────────
router.get('/:id', proteger, async (req, res) => {
  try {
    const { data: orden, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !orden)
      return res.status(404).json({ error: 'Orden no encontrada' });

    if (orden.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin')
      return res.status(403).json({ error: 'No autorizado' });

    res.json({ orden });
  } catch (err) {
    console.error('Error orden:', err.message);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
});

// ── Admin: todas las órdenes ───────────────────
router.get('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { data: ordenes, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        users (nombre, apellido, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ ordenes: ordenes || [] });
  } catch (err) {
    console.error('Error admin ordenes:', err.message);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// ── Admin: cambiar estado ──────────────────────
router.patch('/:id/estado', proteger, soloAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ estado: req.body.estado })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ orden: data });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;