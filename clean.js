require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_bosch').then(async () => {
  const Usuario = require('./src/models/Usuario');
  await Usuario.deleteMany({ email: { $in: ['doctor@dentalbosch.com', 'paciente@dentalbosch.com'] } });
  
  const Doctor = require('./src/models/Doctor');
  await Doctor.deleteMany({ especialidad: 'Odontología General' });
  
  const Paciente = require('./src/models/Paciente');
  await Paciente.deleteMany({});
  
  console.log('Usuarios de prueba antiguos eliminados.');
  
  await require('./src/seeds/AdminDoctor')();
  console.log('Nuevos usuarios recreados con contraseñas encriptadas y cédulas reales.');
  mongoose.disconnect();
});
