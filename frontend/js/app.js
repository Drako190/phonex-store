// ════════════════════════════════════════
//  js/app.js  —  Enrutamiento y cuenta
// ════════════════════════════════════════

const PAGES = ['home','catalog','product','checkout','account','wishlist'];

// ── Mostrar página ─────────────────────
function showPage(page) {
  PAGES.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = p === page ? 'block' : 'none';
  });
  // Actualizar nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Acciones al entrar a cada página
  if (page === 'home') {
    loadFeaturedProducts();
    loadAccessories();
    loadCategoryCounts();
  }
  if (page === 'catalog') {
    loadCatalog();
  }
  if (page === 'checkout') {
    const user = getCurrentUser();
    if (!user) { openModal('loginModal'); showPage('home'); return; }
    loadCheckoutPage();
  }
  if (page === 'account') {
    const user = getCurrentUser();
    if (!user) { openModal('loginModal'); showPage('home'); return; }
    showAccountTab('perfil');
  }
  if (page === 'wishlist') {
    loadWishlistPage();
  }
}

// ── Tabs de mi cuenta ───────────────────
function showAccountTab(tab) {
  document.querySelectorAll('.account-nav-item').forEach(i => i.classList.remove('active'));
  event?.target?.classList.add('active');
  const content = document.getElementById('account-content');
  const user = getCurrentUser();

  if (tab === 'perfil') {
    content.innerHTML = `
      <div class="account-card">
        <div class="account-card-title">👤 Mi Perfil</div>
        <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:white">
            ${user?.nombre?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:700">${user?.nombre} ${user?.apellido}</div>
            <div style="color:var(--text-muted);font-size:0.9rem">${user?.email}</div>
          </div>
        </div>
        <form onsubmit="updateProfile(event)">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-input" id="prof-nombre" value="${user?.nombre || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Apellido</label>
              <input type="text" class="form-input" id="prof-apellido" value="${user?.apellido || ''}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" value="${user?.email || ''}" disabled style="opacity:0.5">
            <div class="form-hint">El email no se puede cambiar</div>
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" id="prof-tel" placeholder="+52 000 000 0000">
          </div>
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </form>
      </div>`;
  }

  if (tab === 'pedidos') {
    content.innerHTML = `
      <div class="account-card">
        <div class="account-card-title">📦 Mis Pedidos</div>
        <div id="orders-list"><div class="skeleton" style="height:100px;margin-bottom:1rem"></div><div class="skeleton" style="height:100px"></div></div>
      </div>`;
    loadOrders();
  }

  if (tab === 'seguridad') {
    content.innerHTML = `
      <div class="account-card">
        <div class="account-card-title">🔐 Cambiar Contraseña</div>
        <div id="security-msg" style="display:none;padding:0.75rem;border-radius:8px;margin-bottom:1rem"></div>
        <form onsubmit="updatePassword(event)">
          <div class="form-group">
            <label class="form-label">Contraseña actual</label>
            <div class="input-icon-wrap">
              <span class="input-icon">🔒</span>
              <input type="password" class="form-input" id="sec-current" placeholder="••••••••">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nueva contraseña</label>
            <div class="input-icon-wrap">
              <span class="input-icon">🔒</span>
              <input type="password" class="form-input" id="sec-new" placeholder="Mín. 8 caracteres" oninput="checkPasswordStrength(this.value)">
            </div>
            <div id="passwordStrength" style="height:4px;border-radius:2px;margin-top:0.4rem;background:var(--border);transition:all 0.3s"></div>
            <div id="passwordStrengthText" class="form-hint"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar nueva contraseña</label>
            <div class="input-icon-wrap">
              <span class="input-icon">🔒</span>
              <input type="password" class="form-input" id="sec-confirm" placeholder="Repite la nueva contraseña">
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Actualizar contraseña</button>
        </form>
      </div>`;
  }

  if (tab === 'direcciones') {
    content.innerHTML = `
      <div class="account-card">
        <div class="account-card-title">📍 Mis Direcciones</div>
        <p style="color:var(--text-muted);margin-bottom:1.5rem">Guarda tus direcciones para agilizar el checkout.</p>
        <form onsubmit="saveAddress(event)">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Calle y número</label>
              <input type="text" class="form-input" id="addr-calle" placeholder="Av. Ejemplo 123">
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad</label>
              <input type="text" class="form-input" id="addr-ciudad" placeholder="Ciudad">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Estado</label>
              <input type="text" class="form-input" id="addr-estado" placeholder="Estado">
            </div>
            <div class="form-group">
              <label class="form-label">Código Postal</label>
              <input type="text" class="form-input" id="addr-cp" placeholder="00000">
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Guardar dirección</button>
        </form>
      </div>`;
  }
}

// ── Cargar pedidos ──────────────────────
async function loadOrders() {
  try {
    const data = await api.getAuth('/orders/mis-ordenes');
    const container = document.getElementById('orders-list');
    if (!container) return;
    if (data.ordenes.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>Sin pedidos aún</h3><p>Cuando hagas una compra, aparecerá aquí.</p></div>`;
      return;
    }
    container.innerHTML = data.ordenes.map(o => `
      <div class="card" style="padding:1.25rem;margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700">PX-${o._id.slice(-8).toUpperCase()}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">${new Date(o.createdAt).toLocaleDateString('es-MX')}</div>
          </div>
          <span class="order-status status-${o.estado}">${o.estado.toUpperCase()}</span>
          <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent)">${formatPrice(o.total)}</div>
        </div>
        <div style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted)">
          ${o.items?.length || 0} producto(s)
        </div>
      </div>`).join('');
  } catch (err) {
    const c = document.getElementById('orders-list');
    if (c) c.innerHTML = '<p style="color:var(--error)">Error al cargar pedidos</p>';
  }
}

// ── Actualizar perfil ───────────────────
async function updateProfile(e) {
  e.preventDefault();
  try {
    const data = await api.put('/users/perfil', {
      nombre:   document.getElementById('prof-nombre').value,
      apellido: document.getElementById('prof-apellido').value,
      telefono: document.getElementById('prof-tel').value,
    });
    const user = getCurrentUser();
    saveSession(localStorage.getItem('phonex_token'), { ...user, ...data.usuario });
    updateNavAuth(data.usuario);
    toast('✅ Perfil actualizado');
  } catch (err) { toast(err.message, 'error'); }
}

// ── Actualizar contraseña ───────────────
async function updatePassword(e) {
  e.preventDefault();
  const current = document.getElementById('sec-current').value;
  const newPass  = document.getElementById('sec-new').value;
  const confirm  = document.getElementById('sec-confirm').value;
  const msgDiv   = document.getElementById('security-msg');
  if (newPass !== confirm) { toast('Las contraseñas no coinciden', 'error'); return; }
  try {
    await api.put('/auth/update-password', { passwordActual: current, passwordNuevo: newPass });
    msgDiv.style.display = 'block';
    msgDiv.style.background = 'rgba(0,230,118,0.1)';
    msgDiv.style.border = '1px solid var(--success)';
    msgDiv.style.color = 'var(--success)';
    msgDiv.textContent = '✅ Contraseña actualizada exitosamente';
    toast('✅ Contraseña actualizada');
  } catch (err) { toast(err.message, 'error'); }
}

// ── Guardar dirección ───────────────────
async function saveAddress(e) {
  e.preventDefault();
  try {
    await api.post('/users/direcciones', {
      calle: document.getElementById('addr-calle').value,
      ciudad:document.getElementById('addr-ciudad').value,
      estado:document.getElementById('addr-estado').value,
      cp:    document.getElementById('addr-cp').value,
    }, true);
    toast('✅ Dirección guardada');
  } catch (err) { toast(err.message, 'error'); }
}

// ── Página de favoritos ─────────────────
async function loadWishlistPage() {
  const container = document.getElementById('wishlist-products');
  if (!container) return;
  if (wishlist.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">❤️</div><h3>Sin favoritos aún</h3><p>Agrega productos a tus favoritos para verlos aquí.</p></div>`;
    return;
  }
  try {
    const promises = wishlist.map(id => api.get(`/products/${id}`));
    const results  = await Promise.all(promises);
    container.innerHTML = results.map(r => renderProductCard(r.producto)).join('');
  } catch (_) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted)">Error al cargar favoritos</div>';
  }
}

function openWishlist() { showPage('wishlist'); }

// ── Navbar scroll effect ────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── INICIALIZAR APP ─────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initAuth();
  showPage('home');
});
