const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.HOST_MAILTRAP,
  port: parseInt(process.env.PORT_MAILTRAP),
  secure: false, // false para puerto 587
  auth: {
    user: process.env.USER_MAILTRAP,
    pass: process.env.PASS_MAILTRAP
  },
  tls: {
    rejectUnauthorized: false
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