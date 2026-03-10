const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Función para enviar emails de prueba
exports.enviarEmailPrueba = async () => {
  try {
    await sgMail.send({
      to: 'usuario@correo.com',
      from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
      subject: 'Correo de prueba',
      text: 'Tu backend funciona correctamente'
    });
    console.log('Email de prueba enviado exitosamente');
  } catch (error) {
    console.error('Error al enviar email de prueba:', error.message);
    throw error;
  }
};

module.exports = sgMail;