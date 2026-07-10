require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_bosch')
  .then(async () => {
    console.log('Conectado a la base de datos.');
    
    const Paciente = require('./src/models/Paciente');
    const Usuario = require('./src/models/Usuario');
    
    // Obtener todos los pacientes
    const pacientes = await Paciente.find().populate('usuario');
    
    let eliminados = 0;
    
    for (const paciente of pacientes) {
      if (!paciente.usuario) {
        // El paciente no tiene un usuario asociado o el usuario asociado ya no existe
        await Paciente.findByIdAndDelete(paciente._id);
        eliminados++;
        console.log(`Paciente sin datos eliminado: ${paciente._id}`);
      }
    }
    
    console.log(`Proceso completado. Total de pacientes sin datos eliminados: ${eliminados}`);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error de conexión:', err);
  });
