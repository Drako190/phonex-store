// ════════════════════════════════════════
//  js/auth.js  —  Autenticación
// ════════════════════════════════════════

// ── Abrir / Cerrar modales ─────────────
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}
function switchModal(from, to) { closeModal(from); openModal(to); }

// Cerrar modal al hacer clic fuera
document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ── Mostrar/ocultar contraseña ──────────
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── Fortaleza de contraseña ─────────────
function checkPasswordStrength(val) {
  const bar  = document.getElementById('passwordStrength');
  const text = document.getElementById('passwordStrengthText');
  if (!bar) return;
  let score = 0;
  if (val.length >= 8)  score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w:'0%',   color:'var(--border)',   label:'' },
    { w:'25%',  color:'var(--error)',    label:'Muy débil' },
    { w:'50%',  color:'var(--warning)',  label:'Débil' },
    { w:'75%',  color:'var(--gold)',     label:'Buena' },
    { w:'100%', color:'var(--success)',  label:'Muy fuerte 💪' },
  ];
  const lvl = levels[score];
  bar.style.width = lvl.w;
  bar.style.background = lvl.color;
  text.textContent = lvl.label;
  text.style.color = lvl.color;
}

// ── REGISTRAR ──────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  const errDiv = document.getElementById('registerError');
  errDiv.style.display = 'none';

  const nombre   = document.getElementById('regNombre').value.trim();
  const apellido = document.getElementById('regApellido').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const telefono = document.getElementById('regTelefono').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regPasswordConfirm').value;

  if (password !== confirm) {
    errDiv.textContent = 'Las contraseñas no coinciden';
    errDiv.style.display = 'block'; return;
  }

  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';

  try {
    const data = await api.post('/auth/register', { nombre, apellido, email, password, telefono });
    saveSession(data.token, data.usuario);
    closeModal('registerModal');
    toast(`🎉 Bienvenido, ${data.usuario.nombre}!`);
    updateNavAuth(data.usuario);
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear cuenta';
  }
}

// ── INICIAR SESIÓN ─────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn    = document.getElementById('loginBtn');
  const errDiv = document.getElementById('loginError');
  errDiv.style.display = 'none';

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  try {
    const data = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.usuario);
    closeModal('loginModal');
    toast(`✅ Bienvenido, ${data.usuario.nombre}!`);
    updateNavAuth(data.usuario);
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
  }
}

// ── OLVIDÉ CONTRASEÑA ──────────────────
async function handleForgotPassword(e) {
  e.preventDefault();
  const btn    = document.getElementById('forgotBtn');
  const msgDiv = document.getElementById('forgotMsg');
  const email  = document.getElementById('forgotEmail').value.trim();

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    await api.post('/auth/forgot-password', { email });
    msgDiv.style.display = 'block';
    msgDiv.style.background = 'rgba(0,230,118,0.1)';
    msgDiv.style.border = '1px solid var(--success)';
    msgDiv.style.color = 'var(--success)';
    msgDiv.textContent = '📧 ¡Revisa tu correo! Si existe, recibirás el enlace.';
    document.getElementById('forgotForm').style.display = 'none';
  } catch (err) {
    msgDiv.style.display = 'block';
    msgDiv.style.background = 'rgba(255,82,82,0.1)';
    msgDiv.style.border = '1px solid var(--error)';
    msgDiv.style.color = 'var(--error)';
    msgDiv.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar enlace';
  }
}

// ── CERRAR SESIÓN ──────────────────────
function logout() {
  localStorage.removeItem('phonex_token');
  localStorage.removeItem('phonex_user');
  updateNavAuth(null);
  toast('👋 Sesión cerrada');
  showPage('home');
  closeUserMenu();
}

// ── GUARDAR SESIÓN ─────────────────────
function saveSession(token, usuario) {
  localStorage.setItem('phonex_token', token);
  localStorage.setItem('phonex_user', JSON.stringify(usuario));
}

// ── OBTENER USUARIO ACTUAL ─────────────
function getCurrentUser() {
  const u = localStorage.getItem('phonex_user');
  return u ? JSON.parse(u) : null;
}

// ── ACTUALIZAR NAVBAR ──────────────────
function updateNavAuth(usuario) {
  const navGuest = document.getElementById('navGuest');
  const navUser  = document.getElementById('navUser');
  if (usuario) {
    navGuest.style.display = 'none';
    navUser.style.display  = 'block';
    document.getElementById('navUserName').textContent = usuario.nombre;
  } else {
    navGuest.style.display = 'block';
    navUser.style.display  = 'none';
  }
}

// ── MENÚ USUARIO ──────────────────────
function toggleUserMenu() {
  const d = document.getElementById('userDropdown');
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}
function closeUserMenu() {
  const d = document.getElementById('userDropdown');
  if (d) d.style.display = 'none';
}
document.addEventListener('click', (e) => {
  const btn = document.getElementById('userMenuBtn');
  if (btn && !btn.contains(e.target)) closeUserMenu();
});

// ── INICIALIZAR SESIÓN AL CARGAR ───────
function initAuth() {
  const user = getCurrentUser();
  if (user) updateNavAuth(user);
}
