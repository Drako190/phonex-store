// ════════════════════════════════════════════════
//  js/config.js  —  Configuración del Frontend
// ════════════════════════════════════════════════

// 🔧 CAMBIA ESTA URL POR LA DE TU BACKEND
// Si corres el backend localmente: http://localhost:5000
// Si lo subes a un servidor: https://tu-dominio.com
const API_BASE = 'https://srv-d86409vavr4c73deepgg.onrender.com/api';

// Stripe Publishable Key (la pública, va aquí en el frontend)
// Cámbiala por tu clave de Stripe
const STRIPE_PK = 'pk_test_51TYgZ3GyxeIaw9rxeeectssnt2N5mh5Z9BzH0uexiLEn51YW40Gz9xmXTzZw8tetbJbV66UodOxWamdSVgLnv7MD00v2tMgFDb';

// ── Helpers para hacer peticiones al API ───────

const api = {
  // GET sin autenticación
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la petición');
    return data;
  },

  // GET con token JWT
  getAuth: async (endpoint) => {
    const token = localStorage.getItem('phonex_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { logout(); return; }
      throw new Error(data.error || 'Error en la petición');
    }
    return data;
  },

  // POST
  post: async (endpoint, body, useAuth = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (useAuth) headers.Authorization = `Bearer ${localStorage.getItem('phonex_token')}`;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la petición');
    return data;
  },

  // PUT
  put: async (endpoint, body) => {
    const token = localStorage.getItem('phonex_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  },
};

// ── Toast notifications ────────────────────────
function toast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.animation = 'slide-in-right 0.3s ease reverse'; setTimeout(() => t.remove(), 280); }, duration);
}

// ── Formatear precio ───────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(price);
}

// ── Estrellas ──────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '⭐'.repeat(full) + (half ? '✨' : '') + '☆'.repeat(empty) + ` <span style="color:var(--text-muted);font-size:0.8rem">(${rating})</span>`;
}

// ── Badge HTML ─────────────────────────────────
function renderBadge(badge) {
  if (!badge) return '';
  const map = { nuevo:'badge-new', oferta:'badge-sale', destacado:'badge-hot' };
  const labels = { nuevo:'NUEVO', oferta:'OFERTA', destacado:'🔥 HOT' };
  return `<span class="product-badge ${map[badge] || 'badge-new'}">${labels[badge] || badge}</span>`;
}
