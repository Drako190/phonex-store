// ════════════════════════════════════════
//  js/checkout.js  —  Pago con Stripe
// ════════════════════════════════════════

let stripeInstance = null;
let stripeElements = null;
let cardElement = null;

function initStripe() {
  if (!stripeInstance && typeof Stripe !== 'undefined') {
    stripeInstance = Stripe(STRIPE_PK);
  }
}

// ── Cargar página de checkout ───────────
function loadCheckoutPage() {
  initStripe();
  const user = getCurrentUser();
  if (user) {
    document.getElementById('ship-nombre').value  = user.nombre  || '';
    document.getElementById('ship-apellido').value = user.apellido || '';
  }

  // Render items del carrito
  const container = document.getElementById('checkout-items');
  container.innerHTML = cart.map(item => `
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
      <div style="font-size:1.75rem">${item.emoji || '📱'}</div>
      <div style="flex:1">
        <div style="font-size:0.85rem;font-weight:600">${item.nombre}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Cant: ${item.qty}</div>
      </div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem">${formatPrice(item.precio * item.qty)}</div>
    </div>`).join('');

  // Totales
  const totals = getCartTotals();
  document.getElementById('co-subtotal').textContent = formatPrice(totals.subtotal);
  document.getElementById('co-envio').textContent = totals.envio === 0 ? '🎁 Gratis' : formatPrice(totals.envio);
  document.getElementById('co-iva').textContent    = formatPrice(totals.impuestos);
  document.getElementById('co-total').textContent  = formatPrice(totals.total);

  // Montar Stripe Elements
  if (stripeInstance) {
    const appearance = {
      theme: 'night',
      variables: { colorPrimary: '#6c63ff', colorBackground: '#13131e', colorText: '#f0f0ff',
        colorDanger: '#ff5252', fontFamily: 'DM Sans, sans-serif', borderRadius: '12px' }
    };
    stripeElements = stripeInstance.elements({ appearance });
    cardElement    = stripeElements.create('card', { hidePostalCode: true });
    const mountEl  = document.getElementById('stripe-card-element');
    mountEl.innerHTML = '';
    cardElement.mount('#stripe-card-element');
    cardElement.on('change', (e) => {
      const errDiv = document.getElementById('stripe-card-error');
      errDiv.textContent = e.error ? e.error.message : '';
    });
  } else {
    document.getElementById('stripe-card-element').innerHTML =
      '<p style="color:var(--warning);font-size:0.85rem">⚠️ Configura tu STRIPE_PK en js/config.js</p>';
  }
}

// ── Procesar pago ──────────────────────
async function procesarPago() {
  const btn = document.getElementById('payBtn');

  // Validar campos de envío
  const campos = ['ship-nombre','ship-apellido','ship-calle','ship-ciudad','ship-estado','ship-cp'];
  for (const c of campos) {
    if (!document.getElementById(c)?.value.trim()) {
      toast('Completa todos los campos de envío', 'error'); return;
    }
  }

  if (!stripeInstance || !cardElement) {
    toast('Error con Stripe. Verifica tu clave pública.', 'error'); return;
  }

  btn.disabled = true;
  btn.innerHTML = '⏳ Procesando pago...';

  try {
    const direccionEnvio = {
      calle:  document.getElementById('ship-calle').value.trim(),
      ciudad: document.getElementById('ship-ciudad').value.trim(),
      estado: document.getElementById('ship-estado').value.trim(),
      cp:     document.getElementById('ship-cp').value.trim(),
    };

    // 1. Crear PaymentIntent en el backend
    const { clientSecret, orderId } = await api.post('/payments/create-payment-intent', {
      items: cart.map(i => ({ productoId: i.id, nombre: i.nombre, cantidad: i.qty })),
      direccionEnvio,
    }, true);

    // 2. Confirmar pago con Stripe
    const cardName = document.getElementById('card-name').value || 'Cliente';
    const { paymentIntent, error } = await stripeInstance.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: cardName },
      }
    });

    if (error) {
      document.getElementById('stripe-card-error').textContent = error.message;
      toast('❌ ' + error.message, 'error');
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      // 3. Confirmar en el backend
      await api.post('/payments/confirmar', { paymentIntentId: paymentIntent.id, orderId }, true);
      clearCart();
      showSuccessPage(orderId);
    }
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔒 Pagar ahora';
  }
}

// ── Página de éxito ────────────────────
function showSuccessPage(orderId) {
  showPage('home');
  // Mostrar modal de éxito
  const overlay = document.createElement('div');
  overlay.className = 'overlay active';
  overlay.innerHTML = `
    <div class="modal" style="text-align:center;max-width:400px">
      <div style="font-size:4rem;margin-bottom:1rem">🎉</div>
      <div class="modal-title">¡Pago exitoso!</div>
      <div class="modal-subtitle">Tu pedido ha sido confirmado</div>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1.5rem">
        Recibirás un email de confirmación. Número de orden:<br>
        <strong style="color:var(--accent)">PX-${orderId?.slice(-8).toUpperCase()}</strong>
      </p>
      <button class="btn btn-primary btn-full" onclick="this.closest('.overlay').remove();showPage('account')">
        Ver mis pedidos
      </button>
      <button class="btn btn-secondary btn-full mt-1" onclick="this.closest('.overlay').remove()">
        Seguir comprando
      </button>
    </div>`;
  document.body.appendChild(overlay);
}
