// ════════════════════════════════════════════════
//  config/seed.js  —  Poblar BD con datos de prueba
//  Ejecutar con: npm run seed
// ════════════════════════════════════════════════
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const productos = [
  // ── SMARTPHONES ──────────────────────────────
  { nombre:'iPhone 16 Pro Max', marca:'Apple', categoria:'smartphone', precio:29999, precioAntes:32999, badge:'nuevo',
    descripcion:'El iPhone más avanzado con chip A18 Pro, pantalla ProMotion 6.9" y cámara de 48MP.', stock:20,
    imagenPrincipal:'/images/16 pro max.png',
    especificaciones:{ pantalla:'6.9" Super Retina XDR OLED ProMotion', procesador:'Apple A18 Pro', ram:'8GB',
      almacenamiento:'256GB', camara:'48MP + 12MP + 12MP', bateria:'4685 mAh', sistemaOp:'iOS 18', color:['Negro','Blanco','Titanio Natural','Titanio Desierto'] } },

  { nombre:'Samsung Galaxy S25 Ultra', marca:'Samsung', categoria:'smartphone', precio:27999, precioAntes:null, badge:'destacado',
    descripcion:'El Ultra definitivo con Snapdragon 8 Elite, cámara de 200MP y S Pen integrado.', stock:15,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX',
    especificaciones:{ pantalla:'6.8" Dynamic AMOLED 2X QHD+', procesador:'Snapdragon 8 Elite', ram:'12GB',
      almacenamiento:'512GB', camara:'200MP + 10MP + 50MP + 12MP', bateria:'5000 mAh', sistemaOp:'Android 15', color:['Titanio Negro','Titanio Gris','Titanio Plata'] } },

  { nombre:'Google Pixel 9 Pro XL', marca:'Google', categoria:'smartphone', precio:22999, precioAntes:24999, badge:'oferta',
    descripcion:'La mejor IA en un smartphone con Tensor G4 y cámara prodigiosa.', stock:8,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX',
    especificaciones:{ pantalla:'6.8" LTPO OLED', procesador:'Google Tensor G4', ram:'16GB',
      almacenamiento:'128GB', camara:'50MP + 48MP + 48MP', bateria:'5060 mAh', sistemaOp:'Android 15', color:['Negro','Gris Porcelana','Verde Menta'] } },

  { nombre:'iPhone 15', marca:'Apple', categoria:'smartphone', precio:16999, precioAntes:18999, badge:'oferta',
    descripcion:'iPhone 15 con Dynamic Island, USB-C y cámara de 48MP.', stock:30,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX',
    especificaciones:{ pantalla:'6.1" Super Retina XDR', procesador:'Apple A16 Bionic', ram:'6GB',
      almacenamiento:'128GB', camara:'48MP + 12MP', bateria:'3877 mAh', sistemaOp:'iOS 18', color:['Negro','Rosa','Amarillo','Verde','Azul'] } },

  { nombre:'OnePlus 13 Pro', marca:'OnePlus', categoria:'smartphone', precio:19999, precioAntes:null, badge:'nuevo',
    descripcion:'Hasselblad Camera, carga de 100W y pantalla AMOLED de 6.8".', stock:12,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX',
    especificaciones:{ pantalla:'6.82" LTPO AMOLED 4K', procesador:'Snapdragon 8 Elite', ram:'12GB',
      almacenamiento:'256GB', camara:'50MP Hasselblad + 50MP + 48MP', bateria:'6000 mAh', sistemaOp:'OxygenOS 15', color:['Negro Volcánico','Blanco Perlado'] } },

  { nombre:'Xiaomi 14 Ultra', marca:'Xiaomi', categoria:'smartphone', precio:24999, precioAntes:null, badge:'destacado',
    descripcion:'Cámara Leica de clase profesional con zoom óptico variable.', stock:6,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX',
    especificaciones:{ pantalla:'6.73" OLED LTPO', procesador:'Snapdragon 8 Gen 3', ram:'16GB',
      almacenamiento:'512GB', camara:'50MP Leica + 50MP + 50MP + 50MP', bateria:'5300 mAh', sistemaOp:'Android 14', color:['Negro','Blanco'] } },

  // ── TABLETS ──────────────────────────────────
  { nombre:'iPad Pro M4 11"', marca:'Apple', categoria:'tablet', precio:24999, precioAntes:null, badge:'nuevo',
    descripcion:'La tablet más potente del mundo con chip M4 y pantalla OLED Ultra Retina XDR.', stock:10,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ pantalla:'11" OLED Ultra Retina XDR', procesador:'Apple M4',
      ram:'8GB', almacenamiento:'256GB', bateria:'31.29 Wh', sistemaOp:'iPadOS 17', color:['Negro Espacial','Plata'] } },

  { nombre:'Samsung Galaxy Tab S9 Ultra', marca:'Samsung', categoria:'tablet', precio:22999, precioAntes:24999, badge:'oferta',
    descripcion:'Pantalla AMOLED de 14.6" con S Pen incluido y diseño sin bisel.', stock:7,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ pantalla:'14.6" Dynamic AMOLED 2X', procesador:'Snapdragon 8 Gen 2',
      ram:'12GB', almacenamiento:'256GB', bateria:'11200 mAh', sistemaOp:'Android 13', color:['Grafito'] } },

  // ── SMARTWATCHES ─────────────────────────────
  { nombre:'Apple Watch Series 10', marca:'Apple', categoria:'smartwatch', precio:8999, precioAntes:9999, badge:'oferta',
    descripcion:'El Apple Watch más delgado y avanzado con sensor de salud de nueva generación.', stock:25,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ pantalla:'46mm Always-On Retina', procesador:'S10', bateria:'36 hrs',
      conectividad:'GPS + Cellular', color:['Negro','Plata','Dorado','Rosa'] } },

  { nombre:'Samsung Galaxy Watch 7', marca:'Samsung', categoria:'smartwatch', precio:6499, precioAntes:null, badge:null,
    descripcion:'Smartwatch con BioActive Sensor y monitoreo avanzado de salud.', stock:18,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ pantalla:'40mm AMOLED', bateria:'40 hrs', conectividad:'GPS + LTE',
      color:['Verde','Crema','Verde Oscuro'] } },

  // ── AUDIFONOS ─────────────────────────────────
  { nombre:'AirPods Pro 2', marca:'Apple', categoria:'audifonos', precio:5999, precioAntes:6499, badge:'oferta',
    descripcion:'Cancelación de ruido activa de siguiente nivel con chip H2 y audio espacial.', stock:40,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ conectividad:'Bluetooth 5.3', bateria:'30 hrs (con estuche)',
      compatibilidad:['iPhone','iPad','Mac'], color:['Blanco'] } },

  { nombre:'Samsung Galaxy Buds3 Pro', marca:'Samsung', categoria:'audifonos', precio:4499, precioAntes:4999, badge:'oferta',
    descripcion:'Diseño tipo varilla con ANC inteligente y audio Hi-Fi.', stock:22,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ conectividad:'Bluetooth 5.4', bateria:'26 hrs (con estuche)',
      compatibilidad:['Android'], color:['Negro','Plata'] } },

  { nombre:'Sony WH-1000XM6', marca:'Sony', categoria:'audifonos', precio:7999, precioAntes:8499, badge:null,
    descripcion:'Los mejores audifonos con cancelación de ruido del mercado, 40 horas de batería.', stock:14,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ conectividad:'Bluetooth 5.3', bateria:'40 hrs', color:['Negro','Plata','Azul'] } },

  // ── CARGADORES ────────────────────────────────
  { nombre:'Cargador USB-C 65W GaN', marca:'Anker', categoria:'cargador', precio:649, precioAntes:799, badge:'oferta',
    descripcion:'Cargador GaN compacto de 65W para laptop, tablet y teléfono simultáneamente.', stock:60,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ compatibilidad:['USB-C Universal','MacBook','iPad','Android','iPhone'], color:['Negro','Blanco'] } },

  { nombre:'MagSafe Cargador Inalámbrico 15W', marca:'Apple', categoria:'cargador-inalambrico', precio:1099, precioAntes:null, badge:null,
    descripcion:'Carga inalámbrica magnética hasta 15W exclusivo para iPhone 12 y superiores.', stock:35,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ compatibilidad:['iPhone 12 y superior'], color:['Blanco'] } },

  // ── FUNDAS ───────────────────────────────────
  { nombre:'Funda Silicona iPhone 16 Pro', marca:'Apple', categoria:'funda', precio:999, precioAntes:null, badge:null,
    descripcion:'Funda oficial de silicona con MagSafe integrado. Acabado suave y premium.', stock:50,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ compatibilidad:['iPhone 16 Pro'], material:'Silicona', color:['Negro','Azul Tormenta','Verde Ciprés','Durazno'] } },

  { nombre:'Funda UAG Monarch Galaxy S25 Ultra', marca:'UAG', categoria:'funda', precio:1299, precioAntes:1499, badge:'oferta',
    descripcion:'Protección militar MIL-STD-810G con diseño premium de 5 capas.', stock:20,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ compatibilidad:['Samsung Galaxy S25 Ultra'], material:'Policarbonato + Aluminio', color:['Negro','Dorado','Kevlar'] } },

  // ── CABLES ───────────────────────────────────
  { nombre:'Cable USB-C a USB-C 240W 2m', marca:'Anker', categoria:'cable', precio:349, precioAntes:399, badge:null,
    descripcion:'Cable trenzado de nylon con soporte de carga de hasta 240W y USB 3.2.', stock:80,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ compatibilidad:['USB-C Universal'], color:['Negro','Blanco'] } },

  // ── POWER BANKS ──────────────────────────────
  { nombre:'Anker PowerCore 26800 PD', marca:'Anker', categoria:'power-bank', precio:1799, precioAntes:1999, badge:'oferta',
    descripcion:'Power bank de 26800mAh con carga rápida Power Delivery de 65W.', stock:30,
    imagenPrincipal:'https://via.placeholder.com/300x300?text=PhoneX', especificaciones:{ bateria:'26800 mAh', compatibilidad:['Universal USB-C/A'], color:['Negro'] } },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phonex_store');
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones
    await Product.deleteMany({});
    await User.deleteMany({ rol: 'admin' });
    // Insertar productos
    await Product.insertMany(productos);
    console.log(`✅ ${productos.length} productos insertados`);

    // Crear usuario admin de prueba
    await User.create({
      nombre: 'Admin', apellido: 'PhoneX', email: 'admin@phonex.com',
      password: 'Admin1234', rol: 'admin',
    });
    console.log('✅ Admin creado: admin@phonex.com / Admin1234');

    // Crear usuario de prueba
    await User.create({
      nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com',
      password: 'User1234', rol: 'usuario',
    });
    console.log('✅ Usuario de prueba: juan@test.com / User1234');

    console.log('\n🎉 Base de datos poblada exitosamente!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al poblar BD:', err);
    process.exit(1);
  }
};

seedDB();
