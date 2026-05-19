# 📱 PhoneX Store — Tienda Online de Teléfonos

Proyecto universitario de tienda online completa con Node.js, Express, MongoDB y Stripe.

## 🗂️ Estructura
```
phonex-store/
├── backend/          ← Servidor Node.js + Express + MongoDB
│   ├── config/       ← Conexión BD y datos de prueba
│   ├── controllers/  ← Lógica de negocio
│   ├── middleware/   ← Autenticación JWT
│   ├── models/       ← Esquemas MongoDB
│   ├── routes/       ← Endpoints del API
│   ├── .env.example  ← ⚠️ Copiar como .env y llenar
│   └── server.js     ← Punto de entrada
└── frontend/         ← HTML, CSS, JavaScript puro
    ├── css/          ← Estilos
    ├── js/           ← Lógica del cliente
    ├── pages/        ← Páginas adicionales
    └── index.html    ← Página principal
```

## 🚀 Inicio rápido

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copia .env.example como .env
cp .env.example .env
# Edita .env con tus datos de MongoDB, JWT y Stripe
```

### 3. Poblar base de datos
```bash
npm run seed
```

### 4. Iniciar servidor
```bash
npm run dev
```

### 5. Abrir frontend
Abre `frontend/index.html` con **Live Server** en VS Code.

## 🔑 Usuarios de prueba
| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@phonex.com | Admin1234 | Administrador |
| juan@test.com | User1234 | Usuario |

## 💳 Tarjeta de prueba Stripe
```
Número: 4242 4242 4242 4242
Fecha:  Cualquier fecha futura
CVV:    Cualquier 3 dígitos
```

## 🔌 Endpoints principales
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/forgot-password | Recuperar contraseña |
| GET  | /api/products | Listar productos |
| GET  | /api/products/:id | Detalle de producto |
| POST | /api/payments/create-payment-intent | Crear pago |
| GET  | /api/orders/mis-ordenes | Mis pedidos |
