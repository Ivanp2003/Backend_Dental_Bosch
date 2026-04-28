const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Seleccionar URI según el entorno
    const MONGODB_URI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PRODUCTION 
      : process.env.MONGODB_URI_LOCAL;

    await mongoose.connect(MONGODB_URI);
    
    const environment = process.env.NODE_ENV === 'production' ? 'PRODUCCIÓN (Atlas)' : 'LOCAL';
    
    console.log(`MongoDB conectado: ${mongoose.connection.host}`);
    console.log(`Base de datos: ${mongoose.connection.name}`);
    console.log(`Entorno: ${environment}`);
    
    // Configurar índices para optimizar rendimiento
    const { configurarIndices } = require('./config/databaseIndexes');
    await configurarIndices();
    
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
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