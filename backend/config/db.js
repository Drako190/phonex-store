// ════════════════════════════════════════
//  config/db.js  —  Conexión a MongoDB
// ════════════════════════════════════════
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Opciones recomendadas para producción
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);

    // Eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado. Intentando reconectar...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('👉 Verifica que MONGODB_URI en tu archivo .env sea correcto');
    process.exit(1); // Detiene el servidor si no hay conexión
  }
};

module.exports = connectDB;
