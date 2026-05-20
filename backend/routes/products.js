// routes/products.js — Con Supabase
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger, soloAdmin } = require('../middleware/auth');

// GET todos los productos
router.get('/', async (req, res) => {
  try {
    const { categoria, marca, minPrecio, maxPrecio, q, page = 1, limit = 12, sort = '-created_at' } = req.query;

    let query = supabase.from('products').select('*', { count: 'exact' }).eq('activo', true);

    if (categoria) query = query.eq('categoria', categoria);
    if (marca)     query = query.ilike('marca', `%${marca}%`);
    if (minPrecio) query = query.gte('precio', minPrecio);
    if (maxPrecio) query = query.lte('precio', maxPrecio);
    if (q)         query = query.or(`nombre.ilike.%${q}%,marca.ilike.%${q}%,descripcion.ilike.%${q}%`);

    // Ordenar
    const desc = sort.startsWith('-');
    const campo = sort.replace('-', '');
    query = query.order(campo === 'createdAt' ? 'created_at' : campo, { ascending: !desc });

    // Paginación
    const from = (page - 1) * limit;
    query = query.range(from, from + Number(limit) - 1);

    const { data: productos, count, error } = await query;
    if (error) throw error;

    res.json({ productos, total: count, pagina: Number(page), totalPaginas: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: producto, error } = await supabase
      .from('products').select('*').eq('id', req.params.id).single();
    if (error || !producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const { data: reviews } = await supabase
      .from('reviews').select('*, users(nombre, apellido)').eq('producto_id', req.params.id);

    res.json({ producto: { ...producto, reviews: reviews || [] } });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST reseña
router.post('/:id/reviews', proteger, async (req, res) => {
  try {
    const { rating, comentario } = req.body;
    const { data: user } = await supabase.from('users')
      .select('nombre, apellido').eq('id', req.usuario.id).single();

    await supabase.from('reviews').insert({
      producto_id: req.params.id, usuario_id: req.usuario.id,
      nombre: `${user.nombre} ${user.apellido}`, rating, comentario
    });

    // Recalcular rating
    const { data: reviews } = await supabase
      .from('reviews').select('rating').eq('producto_id', req.params.id);
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await supabase.from('products').update({
      rating: Math.round(avg * 10) / 10, num_reviews: reviews.length
    }).eq('id', req.params.id);

    res.status(201).json({ message: '✅ Reseña agregada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar reseña' });
  }
});

// ADMIN: Crear producto
router.post('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ producto: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Actualizar
router.put('/:id', proteger, soloAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('products')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ producto: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Eliminar (soft delete)
router.delete('/:id', proteger, soloAdmin, async (req, res) => {
  try {
    await supabase.from('products').update({ activo: false }).eq('id', req.params.id);
    res.json({ message: '✅ Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;