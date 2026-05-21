// config/seed.js — Supabase
require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const productos = [
  { nombre:'iPhone 16 Pro Max', marca:'Apple', categoria:'smartphone', precio:29999, precio_antes:32999,
    badge:'nuevo', descripcion:'El iPhone más avanzado con chip A18 Pro y pantalla de 6.9".', stock:20,
    especificaciones:{ pantalla:'6.9" OLED', procesador:'Apple A18 Pro', ram:'8GB', almacenamiento:'256GB',
      camara:'48MP', bateria:'4685 mAh', sistemaOp:'iOS 18', color:['Negro','Blanco','Titanio'] } },
  { nombre:'Samsung Galaxy S25 Ultra', marca:'Samsung', categoria:'smartphone', precio:27999,
    badge:'destacado', descripcion:'El Ultra definitivo con Snapdragon 8 Elite y cámara de 200MP.', stock:15,
    especificaciones:{ pantalla:'6.8" QHD+', procesador:'Snapdragon 8 Elite', ram:'12GB',
      almacenamiento:'512GB', camara:'200MP', bateria:'5000 mAh', sistemaOp:'Android 15' } },
  { nombre:'Google Pixel 9 Pro', marca:'Google', categoria:'smartphone', precio:22999, precio_antes:24999,
    badge:'oferta', descripcion:'La mejor IA en un smartphone con Tensor G4.', stock:8,
    especificaciones:{ pantalla:'6.8" OLED', procesador:'Tensor G4', ram:'16GB', camara:'50MP' } },
  { nombre:'AirPods Pro 2', marca:'Apple', categoria:'audifonos', precio:5999, precio_antes:6499,
    badge:'oferta', descripcion:'Cancelación de ruido activa con chip H2.', stock:40,
    especificaciones:{ conectividad:'Bluetooth 5.3', bateria:'30 hrs', color:['Blanco'] } },
  { nombre:'iPad Pro M4', marca:'Apple', categoria:'tablet', precio:24999,
    badge:'nuevo', descripcion:'La tablet más potente con chip M4 y pantalla OLED.', stock:10,
    especificaciones:{ pantalla:'11" OLED', procesador:'Apple M4', ram:'8GB' } },
  { nombre:'Apple Watch Series 10', marca:'Apple', categoria:'smartwatch', precio:8999, precio_antes:9999,
    badge:'oferta', descripcion:'El Apple Watch más delgado con sensor de salud avanzado.', stock:25,
    especificaciones:{ pantalla:'46mm Retina', bateria:'36 hrs' } },
  { nombre:'Cargador USB-C 65W GaN', marca:'Anker', categoria:'cargador', precio:649, precio_antes:799,
    badge:'oferta', descripcion:'Cargador GaN compacto de 65W.', stock:60, especificaciones:{} },
  { nombre:'Funda Silicona iPhone 16 Pro', marca:'Apple', categoria:'funda', precio:999,
    descripcion:'Funda oficial de silicona con MagSafe.', stock:50, especificaciones:{} },
];

const seed = async () => {
  console.log('🌱 Poblando Supabase...');

  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().in('email', ['admin@phonex.com','juan@test.com']);

  const { error: prodError } = await supabase.from('products').insert(productos);
  if (prodError) { console.error('❌ Error productos:', prodError.message); process.exit(1); }
  console.log(`✅ ${productos.length} productos insertados`);

  const hash1 = await bcrypt.hash('Admin1234', 12);
  const hash2 = await bcrypt.hash('User1234', 12);

  await supabase.from('users').insert([
    { nombre:'Admin', apellido:'PhoneX', email:'admin@phonex.com', password:hash1, rol:'admin' },
    { nombre:'Juan', apellido:'Pérez', email:'juan@test.com', password:hash2, rol:'usuario' },
  ]);
  console.log('✅ Usuarios de prueba creados');
  console.log('\n🎉 Supabase poblado exitosamente!\n');
  process.exit(0);
};

seed();