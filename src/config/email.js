const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.HOST_MAILTRAP,
  port: parseInt(process.env.PORT_MAILTRAP),
  secure: process.env.PORT_MAILTRAP === '465', // true para 465, false para otros
  auth: {
    user: process.env.USER_MAILTRAP,
    pass: process.env.PASS_MAILTRAP
  }
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error('Error de configuración de email:', error);
  } else {
    console.log('Servidor de email listo para enviar mensajes');
  }
});

module.exports = transporter;