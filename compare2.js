require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI_PRODUCTION).then(async () => {
  const Usuario = require('./src/models/Usuario');
  
  const testUser = await Usuario.findOne({ email: 'paciente@dentalbosch.com' }).lean();
  const realUser = await Usuario.findOne({ email: { $ne: 'paciente@dentalbosch.com' }, rol: 'paciente' }).lean();
  
  console.log('--- TEST USER ---');
  console.log(testUser);
  console.log('--- REAL USER ---');
  console.log(realUser);

  // Compare every key
  const keys = new Set([...Object.keys(testUser), ...Object.keys(realUser)]);
  for (let key of keys) {
    if (JSON.stringify(testUser[key]) !== JSON.stringify(realUser[key])) {
      console.log(`DIFF [${key}]: Test=(${typeof testUser[key]}) ${JSON.stringify(testUser[key])} | Real=(${typeof realUser[key]}) ${JSON.stringify(realUser[key])}`);
    }
  }

  mongoose.disconnect();
});
