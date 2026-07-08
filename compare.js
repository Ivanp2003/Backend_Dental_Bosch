require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI_PRODUCTION).then(async () => {
  const Usuario = require('./src/models/Usuario');
  const Paciente = require('./src/models/Paciente');
  
  const testUser = await Usuario.findOne({ email: 'paciente@dentalbosch.com' }).lean();
  
  const realUsers = await Usuario.find({ email: { $ne: 'paciente@dentalbosch.com' }, rol: 'paciente' }).lean();
  
  console.log(`Found ${realUsers.length} other patients.`);
  
  for (let u of realUsers) {
    const p = await Paciente.findOne({ usuario: u._id }).lean();
    console.log(`--- Patient: ${u.email} ---`);
    console.log('Has Paciente doc?', !!p);
    if (p) {
      console.log('Paciente keys:', Object.keys(p));
    }
  }
  
  console.log('\n--- TEST PATIENT DOC ---');
  const testPaciente = await Paciente.findOne({ usuario: testUser._id }).lean();
  console.log(JSON.stringify(testPaciente, null, 2));

  mongoose.disconnect();
});
