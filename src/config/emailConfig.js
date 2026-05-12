const sgMail = require('@sendgrid/mail');

// Configuración y diagnóstico de SendGrid
const configurarEmail = () => {
  console.log('🔧 Configurando servicio de email...');
  
  // Verificar variables de entorno
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  
  console.log('📧 Variables de email:');
  console.log('- SENDGRID_API_KEY:', sendgridApiKey ? `${sendgridApiKey.substring(0, 10)}...` : '❌ No configurada');
  console.log('- EMAIL_FROM:', emailFrom || 'noreply@dentalbosch.com (default)');
  
  if (!sendgridApiKey) {
    console.log('⚠️ SENDGRID_API_KEY no está configurada');
    return false;
  }
  
  // Validar formato de API Key
  if (!sendgridApiKey.startsWith('SG.')) {
    console.log('❌ SENDGRID_API_KEY no tiene el formato válido (debe empezar con SG.)');
    console.log('🔑 Formato esperado: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx');
    return false;
  }
  
  // Configurar SendGrid
  sgMail.setApiKey(sendgridApiKey);
  console.log('✅ SendGrid configurado correctamente');
  return true;
};

// Función de prueba de email
const probarEmail = async () => {
  if (!configurarEmail()) {
    throw new Error('SendGrid no está configurado');
  }
  
  try {
    const msg = {
      to: 'test@example.com', // Cambiar en producción
      from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
      subject: 'Prueba de configuración - Dental Bosch',
      text: 'Este es un email de prueba para verificar la configuración de SendGrid.',
      html: '<strong>Email de prueba enviado exitosamente desde Dental Bosch</strong>'
    };
    
    await sgMail.send(msg);
    console.log('✅ Email de prueba enviado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en prueba de email:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.log('🔑 Solución: Verifica tu API Key de SendGrid');
      console.log('1. Ve a https://app.sendgrid.com/settings/api_keys');
      console.log('2. Crea una nueva API Key con permisos "Mail Send"');
      console.log('3. Configura SENDGRID_API_KEY en tus variables de entorno');
    }
    
    throw error;
  }
};

module.exports = {
  configurarEmail,
  probarEmail,
  sgMail
};
