// routes/categories.js
const router = require('express').Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const categorias = await Product.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$categoria', total: { $sum: 1 }, marcas: { $addToSet: '$marca' } } },
      { $sort: { total: -1 } },
    ]);
    res.json({ categorias });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;
