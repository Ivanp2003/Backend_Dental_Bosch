const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Seleccionar URI según el entorno
    let MONGODB_URI;
    
    if (process.env.NODE_ENV === 'production') {
      MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;
    } else {
      MONGODB_URI = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/dental_bosch';
    }

    // Verificar que tengamos una URI válida
    if (!MONGODB_URI) {
      throw new Error('No se encontró URI de MongoDB. Configura MONGODB_URI o MONGODB_URI_PRODUCTION/MONGODB_URI_LOCAL');
    }

    console.log(` Conectando a MongoDB en entorno: ${process.env.NODE_ENV || 'development'}`);
    await mongoose.connect(MONGODB_URI);
    
    const environment = process.env.NODE_ENV === 'production' ? 'PRODUCCIÓN (Atlas)' : 'LOCAL';
    
    console.log(`MongoDB conectado: ${mongoose.connection.host}`);
    console.log(`Base de datos: ${mongoose.connection.name}`);
    console.log(`Entorno: ${environment}`);
    
    // Configurar índices para optimizar rendimiento
    const { configurarIndices } = require('./config/databaseIndexes');
    await configurarIndices();
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN A MONGODB');
    console.error('Mensaje:', error.message);
    console.error('');
    console.error('🔧 SOLUCIONES POSIBLES:');
    console.error('1. Verifica que MONGODB_URI esté configurada en producción');
    console.error('2. Asegúrate que la URI de MongoDB sea válida');
    console.error('3. Confirma que el usuario tenga permisos en la BD');
    console.error('4. Verifica la whitelist de IPs en MongoDB Atlas');
    console.error('');
    console.error('Variables de entorno requeridas:');
    console.error('- MONGODB_URI (recomendado) o MONGODB_URI_PRODUCTION');
    console.error('- NODE_ENV=' + (process.env.NODE_ENV || 'no configurado'));
    console.error('');
    
    // En producción, no hacer exit inmediato para que Render pueda mostrar el error
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 La aplicación continuará intentando...');
      // No hacer exit para que Render pueda mostrar los logs
    } else {
      process.exit(1);
    }
  }
};

// Eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.log(' MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error(`Error de MongoDB: ${err.message}`);
});

module.exports = connectDB;