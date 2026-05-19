// ════════════════════════════════════════
//  js/products.js  —  Productos
// ════════════════════════════════════════

let currentFilters = { categoria:'', marca:'', minPrecio:'', maxPrecio:'', q:'', sort:'-createdAt', page:1 };
let totalPages = 1;
let wishlist = JSON.parse(localStorage.getItem('phonex_wishlist') || '[]');

// ── Renderizar tarjeta de producto ─────
function renderProductCard(p) {
  const descuento = p.precioAntes ? Math.round((1 - p.precio / p.precioAntes) * 100) : 0;
  const enWish = wishlist.includes(p._id);
  const specs = (p.especificaciones?.pantalla || p.especificaciones?.compatibilidad?.[0] || '');
  return `
    <div class="product-card">
      ${renderBadge(p.badge)}
      <button class="product-wishlist ${enWish ? 'active' : ''}" onclick="toggleWishlist('${p._id}',this)">
        ${enWish ? '❤️' : '🤍'}
      </button>
      <div class="product-img-wrap" onclick="showProductDetail('${p._id}')">
        ${p.imagenPrincipal
          ? `<img src="${p.imagenPrincipal}" alt="${p.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="product-img-placeholder" style="${p.imagenPrincipal ? 'display:none' : ''}">
          ${getCategoryEmoji(p.categoria)}
        </div>
      </div>
      <div class="product-info" onclick="showProductDetail('${p._id}')" style="cursor:pointer">
        <div class="product-brand">${p.marca}</div>
        <div class="product-name">${p.nombre}</div>
        ${specs ? `<div class="product-specs"><span class="spec-chip">${specs}</span></div>` : ''}
        <div class="product-stars">${renderStars(p.rating || 0)} <span style="color:var(--text-muted);font-size:0.75rem">(${p.numReviews || 0})</span></div>
        <div class="product-price-row">
          <span class="price">${formatPrice(p.precio)}</span>
          ${p.precioAntes ? `<span class="price-old">${formatPrice(p.precioAntes)}</span>` : ''}
          ${descuento > 0 ? `<span class="price-discount">-${descuento}%</span>` : ''}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary" style="flex:1" onclick="addToCart({
          id:'${p._id}', nombre:'${p.nombre.replace(/'/g,"\\'")}',
          marca:'${p.marca}', precio:${p.precio}, emoji:'${getCategoryEmoji(p.categoria)}'
        })">🛒 Agregar</button>
        <button class="btn btn-secondary btn-sm" onclick="showProductDetail('${p._id}')">Ver</button>
      </div>
    </div>`;
}

function getCategoryEmoji(cat) {
  const map = { smartphone:'📱', tablet:'📟', smartwatch:'⌚', audifonos:'🎧',
    cargador:'🔌', 'cargador-inalambrico':'⚡', funda:'🛡️', cable:'🔗', 'power-bank':'🔋' };
  return map[cat] || '📦';
}

// ── Cargar productos en el catálogo ────
async function loadCatalog() {
  const container = document.getElementById('catalog-products');
  container.innerHTML = Array(6).fill('<div class="card skeleton" style="height:380px"></div>').join('');

  try {
    const params = new URLSearchParams();
    if (currentFilters.categoria) params.set('categoria', currentFilters.categoria);
    if (currentFilters.marca)     params.set('marca', currentFilters.marca);
    if (currentFilters.minPrecio) params.set('minPrecio', currentFilters.minPrecio);
    if (currentFilters.maxPrecio) params.set('maxPrecio', currentFilters.maxPrecio);
    if (currentFilters.q)         params.set('q', currentFilters.q);
    params.set('sort',  currentFilters.sort);
    params.set('page',  currentFilters.page);
    params.set('limit', 12);

    const data = await api.get(`/products?${params}`);
    console.log(data);
    totalPages = data.totalPaginas;

    const title = document.getElementById('catalog-title');
    const sub   = document.getElementById('catalog-subtitle');
    const catLabels = { smartphone:'Smartphones', tablet:'Tablets', smartwatch:'Smartwatches',
      audifonos:'Audífonos', funda:'Fundas', cargador:'Cargadores',
      'cargador-inalambrico':'Carga Inalámbrica', cable:'Cables', 'power-bank':'Power Banks' };
    const catName = catLabels[currentFilters.categoria] || 'Todos los Productos';
    title.innerHTML = `${catName === 'Todos los Productos' ? 'Todos los' : ''} <span>${catName}</span>`;
    sub.textContent = `${data.total} producto${data.total !== 1 ? 's' : ''} encontrado${data.total !== 1 ? 's' : ''}`;

    if (data.productos.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>No encontramos productos con esos filtros.</p>
          <button class="btn btn-primary mt-2" onclick="resetFilters()">Ver todos los productos</button>
        </div>`;
    } else {
      container.innerHTML = data.productos.map(renderProductCard).join('');
    }
    renderPagination();
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">⚠️</div>
      <h3>Error al cargar</h3>
      <p>Verifica que el servidor esté corriendo.</p>
      <button class="btn btn-primary mt-2" onclick="loadCatalog()">Reintentar</button>
    </div>`;
  }
}

// ── Cargar productos destacados (home) ──
async function loadFeaturedProducts() {
  try {
    const data = await api.get('/products?badge=destacado&limit=4&sort=-vendidos');
    const container = document.getElementById('featured-products');
    if (container) container.innerHTML = data.productos.map(renderProductCard).join('');
  } catch (_) {}
}

async function loadAccessories() {
  try {
    const data = await api.get('/products?categoria=funda&limit=4');
    const container = document.getElementById('accessories-products');
    if (container) container.innerHTML = data.productos.map(renderProductCard).join('');
  } catch (_) {}
}

// ── Cargar conteo de categorías ─────────
async function loadCategoryCounts() {
  try {
    const data = await api.get('/categories');
    data.categorias.forEach(cat => {
      const el = document.getElementById(`cat-count-${cat._id}`);
      if (el) el.textContent = `${cat.total} productos`;
    });
  } catch (_) {}
}

// ── Detalle de producto ─────────────────
async function showProductDetail(id) {
  showPage('product');
  const container = document.getElementById('product-detail-content');
  container.innerHTML = '<div class="skeleton" style="height:400px;margin:2rem"></div>';

  try {
    const data = await api.get(`/products/${id}`);
    const p = data.producto;
    const specs = p.especificaciones || {};
    const specRows = Object.entries(specs)
      .filter(([k,v]) => v && !Array.isArray(v))
      .map(([k,v]) => {
        const labels = { pantalla:'Pantalla', procesador:'Procesador', ram:'RAM',
          almacenamiento:'Almacenamiento', camara:'Cámara', bateria:'Batería',
          sistemaOp:'Sistema Op.', conectividad:'Conectividad', peso:'Peso',
          dimensiones:'Dimensiones', material:'Material', garantia:'Garantía' };
        return `<div class="spec-row"><div class="spec-key">${labels[k]||k}</div><div class="spec-val">${v}</div></div>`;
      }).join('');

    const colores = specs.color || specs.compatibilidad || [];

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="showPage('catalog')">← Volver</button>
        <span style="color:var(--text-muted);font-size:0.85rem">${p.marca} / ${p.nombre}</span>
      </div>
      <div class="product-detail-grid">
        <div class="product-gallery">${getCategoryEmoji(p.categoria)}</div>
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div>
            <div style="font-size:0.8rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:0.4rem">${p.marca}</div>
            <h1 style="font-size:2rem;font-weight:800;line-height:1.2">${p.nombre}</h1>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            ${renderStars(p.rating || 0)}
            <span style="color:var(--text-muted);font-size:0.85rem">${p.numReviews || 0} reseñas</span>
          </div>
          <div style="display:flex;align-items:center;gap:1rem">
            <span style="font-family:'Syne',sans-serif;font-size:2.5rem;font-weight:800">${formatPrice(p.precio)}</span>
            ${p.precioAntes ? `<span style="font-size:1rem;color:var(--text-muted);text-decoration:line-through">${formatPrice(p.precioAntes)}</span>` : ''}
          </div>
          <p style="color:var(--text-muted);line-height:1.7">${p.descripcion}</p>
          ${colores.length ? `
            <div>
              <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Colores disponibles:</div>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
                ${colores.map(c => `<span class="spec-chip">${c}</span>`).join('')}
              </div>
            </div>` : ''}
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:0.9rem;color:${p.stock > 0 ? 'var(--success)' : 'var(--error)'}">
              ${p.stock > 0 ? `✅ En stock (${p.stock} disponibles)` : '❌ Agotado'}
            </span>
          </div>
          ${specRows ? `
            <div>
              <div style="font-size:0.9rem;font-weight:600;margin-bottom:0.75rem">Especificaciones técnicas</div>
              <div class="spec-table">${specRows}</div>
            </div>` : ''}
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
            <button class="btn btn-primary btn-lg" style="flex:1" onclick="addToCart({
              id:'${p._id}', nombre:'${p.nombre.replace(/'/g,"\\'")}',
              marca:'${p.marca}', precio:${p.precio}, emoji:'${getCategoryEmoji(p.categoria)}'
            })" ${p.stock === 0 ? 'disabled' : ''}>
              🛒 Agregar al carrito
            </button>
            <button class="btn-icon" onclick="toggleWishlist('${p._id}',this)">🤍</button>
          </div>
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><h3>Producto no encontrado</h3></div>';
  }
}

// ── Filtros ─────────────────────────────
function setFilter(key, value) {
  currentFilters[key] = value;
  currentFilters.page = 1;
  // Actualizar chips activos
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  event?.target?.classList.add('active');
  showPage('catalog');
}

function filterCategory(cat) {
  currentFilters.categoria = cat;
  currentFilters.page = 1;
  showPage('catalog');
}

function setPriceFilter(min, max) {
  currentFilters.minPrecio = min || '';
  currentFilters.maxPrecio = max >= 999999 ? '' : (max || '');
  currentFilters.page = 1;
  loadCatalog();
}

function setSortOrder(val) {
  currentFilters.sort = val;
  currentFilters.page = 1;
  loadCatalog();
}

function resetFilters() {
  currentFilters = { categoria:'', marca:'', minPrecio:'', maxPrecio:'', q:'', sort:'-createdAt', page:1 };
  loadCatalog();
}

function doSearch() {
  currentFilters.q = document.getElementById('searchInput').value.trim();
  currentFilters.page = 1;
  showPage('catalog');
}

function handleSearch(e) {
  if (e.key === 'Enter') doSearch();
}

// ── Paginación ──────────────────────────
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container || totalPages <= 1) { if(container) container.innerHTML=''; return; }
  let html = '';
  if (currentFilters.page > 1)
    html += `<button class="page-btn" onclick="goToPage(${currentFilters.page-1})">← Anterior</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i===currentFilters.page?'active':''}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (currentFilters.page < totalPages)
    html += `<button class="page-btn" onclick="goToPage(${currentFilters.page+1})">Siguiente →</button>`;
  container.innerHTML = html;
}

function goToPage(p) {
  currentFilters.page = p;
  loadCatalog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Wishlist ────────────────────────────
async function toggleWishlist(id, btn) {
  const user = getCurrentUser();
  if (!user) { openModal('loginModal'); return; }
  const idx = wishlist.indexOf(id);
  if (idx > -1) { wishlist.splice(idx,1); if(btn){btn.textContent='🤍';btn.classList.remove('active');} }
  else { wishlist.push(id); if(btn){btn.textContent='❤️';btn.classList.add('active');} }
  localStorage.setItem('phonex_wishlist', JSON.stringify(wishlist));
  toast(idx > -1 ? 'Eliminado de favoritos' : '❤️ Agregado a favoritos', idx > -1 ? 'warning' : 'success');
  try { await api.post(`/users/wishlist/${id}`, {}, true); } catch (_) {}
}
