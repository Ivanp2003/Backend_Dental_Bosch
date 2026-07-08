require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI_PRODUCTION).then(async () => {
  const Usuario = require('./src/models/Usuario');
  await Usuario.updateOne({ email: 'paciente@dentalbosch.com' }, { $unset: { pushToken: 1 } });
  console.log('pushToken removed');
  mongoose.disconnect();
});
