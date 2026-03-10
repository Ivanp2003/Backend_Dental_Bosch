const sgMail = require('../config/sendgrid');

// Plantilla HTML base
const plantillaHTML = (titulo, contenido, enlace, textoBoton) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      margin: 20px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      background: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦷 ${titulo}</h1>
    </div>
    <div class="content">
      ${contenido}
      ${enlace ? `<center><a href="${enlace}" class="button">${textoBoton}</a></center>` : ''}
    </div>
    <div class="footer">
      <p>Sistema de Gestión Odontológica Dental Bosch</p>
      <p>Este es un correo automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
`;

// Enviar email de confirmación
exports.enviarEmailConfirmacion = async (email, nombre, token) => {
  // LOGGING PARA DEBUG
  console.log(' Intentando enviar email de confirmación...');
  console.log('Destinatario:', email);
  console.log('Nombre:', nombre);
  console.log('SendGrid API Key existe:', !!process.env.SENDGRID_API_KEY);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('URL_FRONTEND:', process.env.URL_FRONTEND);

  const urlConfirmacion = `${process.env.URL_FRONTEND}confirmar-cuenta/${token}`;
  console.log('URL de confirmación:', urlConfirmacion);
  
  const contenido = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Gracias por registrarte en nuestro sistema. Para activar tu cuenta, haz clic en el siguiente botón:</p>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: 'Confirma tu cuenta - Dental Bosch',
    html: plantillaHTML('Confirma tu cuenta', contenido, urlConfirmacion, 'Confirmar Cuenta')
  };

  console.log(' Mensaje a enviar:', JSON.stringify(msg, null, 2));

  try {
    const result = await sgMail.send(msg);
    console.log(' Email de confirmación enviado exitosamente');
    console.log('Resultado SendGrid:', result);
  } catch (error) {
    console.error(' Error al enviar email de confirmación:', error.message);
    console.error('Código de error:', error.code);
    console.error('Status:', error.response?.status);
    
    if (error.response) {
      console.error('Body completo del error:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
};

// Enviar email de recuperación de contraseña
exports.enviarEmailRecuperacion = async (email, nombre, token) => {
  // LOGGING PARA DEBUG
  console.log(' Intentando enviar email de recuperación...');
  console.log('Destinatario:', email);
  console.log('Nombre:', nombre);
  console.log('SendGrid API Key existe:', !!process.env.SENDGRID_API_KEY);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  const urlRecuperacion = `${process.env.URL_FRONTEND}recuperar-password/${token}`;
  console.log('URL de recuperación:', urlRecuperacion);
  
  const contenido = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
    <p><strong>Este enlace expira en 1 hora.</strong></p>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: 'Recuperar contraseña - Dental Bosch',
    html: plantillaHTML('Recuperar Contraseña', contenido, urlRecuperacion, 'Restablecer Contraseña')
  };

  console.log(' Mensaje de recuperación a enviar:', JSON.stringify(msg, null, 2));

  try {
    const result = await sgMail.send(msg);
    console.log(' Email de recuperación enviado exitosamente');
    console.log('Resultado SendGrid:', result);
  } catch (error) {
    console.error(' Error al enviar email de recuperación:', error.message);
    console.error('Código de error:', error.code);
    console.error('Status:', error.response?.status);
    
    if (error.response) {
      console.error('Body completo del error:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
};

// Enviar email de bienvenida
exports.enviarEmailBienvenida = async (email, nombre, rol) => {
  // LOGGING PARA DEBUG
  console.log(' Intentando enviar email de bienvenida...');
  console.log('Destinatario:', email);
  console.log('Nombre:', nombre);
  console.log('Rol:', rol);
  console.log('SendGrid API Key existe:', !!process.env.SENDGRID_API_KEY);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  const contenido = `
    <p>¡Hola <strong>${nombre}</strong>!</p>
    <p>Tu cuenta ha sido confirmada exitosamente.</p>
    ${rol === 'doctor' ? 
      '<p><strong>Nota:</strong> Tu cuenta de doctor está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada.</p>' : 
      '<p>Ya puedes iniciar sesión y comenzar a usar el sistema.</p>'
    }
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: '¡Bienvenido a Dental Bosch!',
    html: plantillaHTML('Cuenta Confirmada', contenido, process.env.URL_FRONTEND, 'Ir al Sistema')
  };

  console.log(' Mensaje de bienvenida a enviar:', JSON.stringify(msg, null, 2));

  try {
    const result = await sgMail.send(msg);
    console.log(' Email de bienvenida enviado exitosamente');
    console.log('Resultado SendGrid:', result);
  } catch (error) {
    console.error(' Error al enviar email de bienvenida:', error.message);
    console.error('Código de error:', error.code);
    console.error('Status:', error.response?.status);
    
    if (error.response) {
      console.error('Body completo del error:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
};

// Enviar email de aprobación de doctor
exports.enviarEmailAprobacionDoctor = async (email, nombre) => {
  // LOGGING PARA DEBUG
  console.log(' Intentando enviar email de aprobación...');
  console.log('Destinatario:', email);
  console.log('Nombre doctor:', nombre);
  console.log('SendGrid API Key existe:', !!process.env.SENDGRID_API_KEY);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  const contenido = `
    <p>¡Hola <strong>Dr. ${nombre}</strong>!</p>
    <p>Tu cuenta de doctor ha sido <strong>aprobada</strong> exitosamente.</p>
    <p>Ya puedes iniciar sesión y comenzar a atender pacientes.</p>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: 'Cuenta aprobada - Dental Bosch',
    html: plantillaHTML('Cuenta Aprobada', contenido, process.env.URL_FRONTEND, 'Iniciar Sesión')
  };

  console.log(' Mensaje de aprobación a enviar:', JSON.stringify(msg, null, 2));

  try {
    const result = await sgMail.send(msg);
    console.log(' Email de aprobación enviado exitosamente');
    console.log('Resultado SendGrid:', result);
  } catch (error) {
    console.error(' Error al enviar email de aprobación:', error.message);
    console.error('Código de error:', error.code);
    console.error('Status:', error.response?.status);
    
    if (error.response) {
      console.error('Body completo del error:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
};

// Enviar email de rechazo de doctor
exports.enviarEmailRechazoDoctor = async (email, nombre, motivo) => {
  // LOGGING PARA DEBUG
  console.log(' Intentando enviar email de rechazo...');
  console.log('Destinatario:', email);
  console.log('Nombre:', nombre);
  console.log('Motivo:', motivo || 'No especificado');
  console.log('SendGrid API Key existe:', !!process.env.SENDGRID_API_KEY);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  const contenido = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Lamentamos informarte que tu solicitud de registro como doctor ha sido <strong>rechazada</strong>.</p>
    ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
    <p>Si consideras que esto es un error, por favor contacta con nuestro equipo de soporte.</p>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: 'Solicitud rechazada - Dental Bosch',
    html: plantillaHTML('Solicitud Rechazada', contenido, null, null)
  };

  console.log(' Mensaje de rechazo a enviar:', JSON.stringify(msg, null, 2));

  try {
    const result = await sgMail.send(msg);
    console.log(' Email de rechazo enviado exitosamente');
    console.log('Resultado SendGrid:', result);
  } catch (error) {
    console.error(' Error al enviar email de rechazo:', error.message);
    console.error('Código de error:', error.code);
    console.error('Status:', error.response?.status);
    
    if (error.response) {
      console.error('Body completo del error:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
};