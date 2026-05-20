// ════════════════════════════════════════════════
//  controllers/paymentController.js  —  Stripe
// ════════════════════════════════════════════════

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { supabase } = require('../config/db');

// ───────────────────────────────────────────────
// CREAR PAYMENT INTENT
// ───────────────────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  try {
    const { items, direccionEnvio } = req.body;

    // Validar carrito
    if (!items || items.length === 0) {
      return res.status(400).json({
        error: 'El carrito está vacío'
      });
    }

    let subtotal = 0;
    const itemsVerificados = [];

    // ───────────────────────────────────────────
    // Verificar productos desde MongoDB
    // ───────────────────────────────────────────
    for (const item of items) {

      const producto = await Product.findById(
        item.productoId || item.id
      );

      // Producto inexistente
      if (!producto) {
        return res.status(404).json({
          error: `Producto no encontrado: ${item.nombre}`
        });
      }

      // Producto inactivo
      if (producto.activo === false) {
        return res.status(400).json({
          error: `Producto inactivo: ${producto.nombre}`
        });
      }

      // Cantidad enviada
      const cantidad = item.cantidad || item.qty || 1;

      // Validar stock
      if (producto.stock < cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para: ${producto.nombre}`
        });
      }

      // Calcular subtotal
      subtotal += producto.precio * cantidad;

      // Guardar item verificado
      itemsVerificados.push({
        producto: producto._id,
        nombre: producto.nombre,
        imagen: producto.imagenPrincipal,
        precio: producto.precio,
        cantidad: cantidad,
      });
    }

    // ───────────────────────────────────────────
    // Totales
    // ───────────────────────────────────────────
    const costoEnvio = subtotal >= 1000 ? 0 : 99;

    const impuestos =
      Math.round(subtotal * 0.16 * 100) / 100;

    const total =
      subtotal + costoEnvio + impuestos;

    // ───────────────────────────────────────────
    // Crear PaymentIntent en Stripe
    // ───────────────────────────────────────────
    const paymentIntent =
      await stripe.paymentIntents.create({

        amount: Math.round(total * 100),

        currency: 'mxn',

        automatic_payment_methods: {
          enabled: true
        },

        metadata: {
          usuarioId: String(req.usuario.id),
          itemsCount: String(items.length),
        },
      });

    // Verificar productos desde Supabase
for (const item of items) {
  const { data: producto } = await supabase
    .from('products').select('*').eq('id', item.productoId).single();
  if (!producto || !producto.activo)
    return res.status(404).json({ error: `Producto no encontrado` });
  if (producto.stock < item.cantidad)
    return res.status(400).json({ error: `Stock insuficiente: ${producto.nombre}` });
  subtotal += producto.precio * item.cantidad;
  itemsVerificados.push({
    producto_id: producto.id, nombre: producto.nombre,
    imagen: producto.imagen_principal, precio: producto.precio, cantidad: item.cantidad,
  });
}

// Crear orden en Supabase
const { data: orden } = await supabase.from('orders').insert({
  usuario_id: req.usuario.id, subtotal, costo_envio: costoEnvio,
  impuestos, total, direccion_envio: direccionEnvio,
  stripe_payment_intent_id: paymentIntent.id,
}).select().single();

// Insertar items
await supabase.from('order_items').insert(
  itemsVerificados.map(i => ({ ...i, orden_id: orden.id }))
);

    // ───────────────────────────────────────────
    // Respuesta
    // ───────────────────────────────────────────
    res.json({
      clientSecret:
        paymentIntent.client_secret,

      orderId:
        orden._id,

      resumen: {
        subtotal,
        costoEnvio,
        impuestos,
        total,
      },
    });

  } catch (err) {

    console.error(
      '🔥 ERROR REAL STRIPE:',
      err
    );

    res.status(500).json({
      error: err.message,
      full: err,
    });
  }
};

// ───────────────────────────────────────────────
// CONFIRMAR PAGO
// ───────────────────────────────────────────────
exports.confirmarPago = async (req, res) => {

  try {

    const {
      paymentIntentId,
      orderId
    } = req.body;

    // Buscar payment intent
    const paymentIntent =
      await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

    // Verificar estado
    if (paymentIntent.status !== 'succeeded') {

      return res.status(400).json({
        error: 'El pago no fue completado'
      });
    }

    // Buscar orden
    const orden =
      await Order.findById(orderId);

    if (!orden) {

      return res.status(404).json({
        error: 'Orden no encontrada'
      });
    }

    // Actualizar orden
    orden.estado = 'pagado';

    orden.stripePaymentStatus =
      'succeeded';

    orden.fechaPago =
      new Date();

    await orden.save();

    // ───────────────────────────────────────────
    // Reducir stock
    // ───────────────────────────────────────────
    for (const item of orden.items) {

      await Product.findByIdAndUpdate(
        item.producto,
        {
          $inc: {
            stock: -item.cantidad,
            vendidos: item.cantidad
          }
        }
      );
    }

    // Respuesta
    res.json({
      message: '✅ Pago confirmado',
      orden
    });

  } catch (err) {

    console.error(
      '🔥 ERROR CONFIRMAR PAGO:',
      err
    );

    res.status(500).json({
      error: err.message,
      full: err,
    });
  }
};

// ───────────────────────────────────────────────
// WEBHOOK STRIPE
// ───────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {

  const sig =
    req.headers['stripe-signature'];

  let event;

  try {

    event =
      stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

  } catch (err) {

    console.error(
      '🔥 WEBHOOK ERROR:',
      err.message
    );

    return res.status(400).json({
      error: `Webhook Error: ${err.message}`
    });
  }

  // ───────────────────────────────────────────
  // Eventos Stripe
  // ───────────────────────────────────────────
  switch (event.type) {

    // Pago exitoso
    case 'payment_intent.succeeded': {

      const pi =
        event.data.object;

      await Order.findOneAndUpdate(
        {
          stripePaymentIntentId: pi.id
        },
        {
          estado: 'pagado',
          stripePaymentStatus: 'succeeded',
          fechaPago: new Date()
        }
      );

      console.log(
        '✅ Pago exitoso:',
        pi.id
      );

      break;
    }

    // Pago fallido
    case 'payment_intent.payment_failed': {

      const piFailed =
        event.data.object;

      await Order.findOneAndUpdate(
        {
          stripePaymentIntentId:
            piFailed.id
        },
        {
          estado: 'cancelado',
          stripePaymentStatus: 'failed'
        }
      );

      console.log(
        '❌ Pago fallido:',
        piFailed.id
      );

      break;
    }
  }

  // Confirmar recepción webhook
  res.json({
    received: true
  });
};