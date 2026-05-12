const nodemailer = require('nodemailer');

// Configuración para Gmail (alternativa a SendGrid)
const createTransporter = () => {
  // Usar Gmail si está configurado, si no, usar SendGrid
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Tu email de Gmail
        pass: process.env.EMAIL_PASS  // Tu App Password de Gmail
      }
    });
  }
  
  // Por defecto, retornar null para usar SendGrid
  return null;
};

// Función para enviar email con Nodemailer (Gmail)
exports.enviarEmailGmail = async (msg) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Gmail no está configurado. Usa SendGrid o configura EMAIL_SERVICE=gmail');
  }

  try {
    await transporter.sendMail(msg);
    console.log('Email enviado con Gmail');
  } catch (error) {
    console.error('Error enviando email con Gmail:', error.message);
    throw error;
  }
};

// Función de prueba
exports.enviarEmailPrueba = async () => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Gmail no configurado, usando SendGrid');
    return;
  }

  try {
    await transporter.sendMail({
      to: 'test@example.com',
      from: process.env.EMAIL_USER,
      subject: 'Prueba desde Gmail',
      text: 'Email de prueba enviado desde Dental Bosch'
    });
    console.log('Email de prueba enviado con Gmail');
  } catch (error) {
    console.error('Error en prueba de Gmail:', error.message);
  }
};
