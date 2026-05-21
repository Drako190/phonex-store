// routes/categories.js — Supabase
const router = require('express').Router();
const { supabase } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('categoria')
      .eq('activo', true);

    if (error) throw error;

    // Contar productos por categoría
    const conteo = {};
    data.forEach(p => {
      conteo[p.categoria] = (conteo[p.categoria] || 0) + 1;
    });

    const categorias = Object.entries(conteo).map(([_id, total]) => ({
      _id, total
    }));

    res.json({ categorias });
  } catch (err) {
    console.error('Error categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

module.exports = router;