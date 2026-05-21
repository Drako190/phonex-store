const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../config/db');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { items, direccionEnvio } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: 'El carrito está vacío' });

    let subtotal = 0;
    const itemsVerificados = [];

    // ── Verificar productos desde Supabase ──────
    for (const item of items) {
      const { data: producto } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productoId || item.id)
        .single();

      if (!producto)
        return res.status(404).json({ error: `Producto no encontrado: ${item.nombre}` });

      if (!producto.activo)
        return res.status(400).json({ error: `Producto inactivo: ${producto.nombre}` });

      const cantidad = item.cantidad || item.qty || 1;

      if (producto.stock < cantidad)
        return res.status(400).json({ error: `Stock insuficiente: ${producto.nombre}` });

      subtotal += producto.precio * cantidad;

      itemsVerificados.push({
        producto_id: producto.id,
        nombre:      producto.nombre,
        imagen:      producto.imagen_principal,
        precio:      producto.precio,
        cantidad,
      });
    }

    // ── Totales ─────────────────────────────────
    const costoEnvio = subtotal >= 1000 ? 0 : 99;
    const impuestos  = Math.round(subtotal * 0.16 * 100) / 100;
    const total      = subtotal + costoEnvio + impuestos;

    // ── Crear PaymentIntent en Stripe ────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(total * 100),
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        usuarioId:  String(req.usuario.id),
        itemsCount: String(items.length),
      },
    });

    // ── Crear orden en Supabase ──────────────────
    const { data: orden, error: ordenError } = await supabase
      .from('orders')
      .insert({
        usuario_id:               req.usuario.id,
        subtotal,
        costo_envio:              costoEnvio,
        impuestos,
        total,
        direccion_envio:          direccionEnvio,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status:    'pending',
        estado:                   'pendiente',
      })
      .select()
      .single();

    if (ordenError) throw ordenError;

    // ── Insertar items ───────────────────────────
    await supabase.from('order_items').insert(
      itemsVerificados.map(i => ({ ...i, orden_id: orden.id }))
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId:      orden.id,
      resumen:      { subtotal, costoEnvio, impuestos, total },
    });

  } catch (err) {
    console.error('🔥 ERROR STRIPE:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.confirmarPago = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ error: 'El pago no fue completado' });

    const { data: orden, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !orden)
      return res.status(404).json({ error: 'Orden no encontrada' });

    // Actualizar orden
    await supabase.from('orders').update({
      estado:                'pagado',
      stripe_payment_status: 'succeeded',
      fecha_pago:            new Date().toISOString(),
    }).eq('id', orderId);

    // Reducir stock
    for (const item of orden.order_items) {
      const { data: prod } = await supabase
        .from('products').select('stock, vendidos').eq('id', item.producto_id).single();
      if (prod) {
        await supabase.from('products').update({
          stock:    prod.stock    - item.cantidad,
          vendidos: prod.vendidos + item.cantidad,
        }).eq('id', item.producto_id);
      }
    }

    res.json({ message: '✅ Pago confirmado', orden });

  } catch (err) {
    console.error('🔥 ERROR CONFIRMAR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await supabase.from('orders').update({
        estado: 'pagado', stripe_payment_status: 'succeeded',
        fecha_pago: new Date().toISOString(),
      }).eq('stripe_payment_intent_id', event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      await supabase.from('orders').update({
        estado: 'cancelado', stripe_payment_status: 'failed',
      }).eq('stripe_payment_intent_id', event.data.object.id);
      break;
  }

  res.json({ received: true });
};