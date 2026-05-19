// ════════════════════════════════════════
//  js/cart.js  —  Carrito de compras
// ════════════════════════════════════════

let cart = JSON.parse(localStorage.getItem('phonex_cart') || '[]');

function saveCart() {
  localStorage.setItem('phonex_cart', JSON.stringify(cart));
  updateCartUI();
}

// ── Agregar al carrito ─────────────────
function addToCart(product) {
  const idx = cart.findIndex(i => i.id === product.id);
  if (idx > -1) {
    cart[idx].qty = Math.min(cart[idx].qty + 1, 10);
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  toast(`🛒 ${product.nombre} agregado al carrito`);
  // Animación del badge
  const badge = document.getElementById('cartBadge');
  badge.style.transform = 'scale(1.5)';
  setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

// ── Quitar del carrito ─────────────────
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  toast('Producto eliminado del carrito', 'warning');
}

// ── Cambiar cantidad ───────────────────
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else saveCart();
}

// ── Vaciar carrito ─────────────────────
function clearCart() {
  cart = [];
  saveCart();
}

// ── Totales ────────────────────────────
function getCartTotals() {
  const subtotal  = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const envio     = subtotal >= 1000 ? 0 : 99;
  const impuestos = Math.round(subtotal * 0.16 * 100) / 100;
  const total     = subtotal + envio + impuestos;
  return { subtotal, envio, impuestos, total };
}

// ── Toggle sidebar carrito ─────────────
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const bg      = document.getElementById('cartOverlayBg');
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open');
  bg.style.display = isOpen ? 'none' : 'block';
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

// ── Actualizar UI del carrito ──────────
function updateCartUI() {
  const badge  = document.getElementById('cartBadge');
  const total  = cart.reduce((s, i) => s + i.qty, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';

  const content = document.getElementById('cartContent');
  const footer  = document.getElementById('cartFooter');

  if (cart.length === 0) {
    content.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <button class="btn btn-primary btn-sm" onclick="toggleCart();showPage('catalog')">
          Explorar productos
        </button>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  content.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.emoji || '📱'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nombre}</div>
        <div class="cart-item-variant">${item.marca}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
          <span class="cart-item-price">${formatPrice(item.precio * item.qty)}</span>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>
  `).join('');

  const totals = getCartTotals();
  document.getElementById('cartSubtotal').textContent = formatPrice(totals.subtotal);
  document.getElementById('cartEnvio').textContent = totals.envio === 0 ? '🎁 Gratis' : formatPrice(totals.envio);
  document.getElementById('cartTotal').textContent = formatPrice(totals.total);
  footer.style.display = 'block';
}

// ── Ir al checkout ─────────────────────
function goToCheckout() {
  const user = getCurrentUser();
  if (!user) {
    toggleCart();
    toast('Inicia sesión para continuar', 'warning');
    openModal('loginModal');
    return;
  }
  if (cart.length === 0) { toast('Tu carrito está vacío', 'warning'); return; }
  toggleCart();
  showPage('checkout');
}

// ── Inicializar ────────────────────────
updateCartUI();
