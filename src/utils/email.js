const sgMail = require('../config/sendgrid');
const { generarURLsPrueba } = require('./emailUtils');
const { asegurarUrlConDiagonal } = require('./urlUtils');

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

  // URL de respaldo si URL_FRONTEND no está configurada correctamente
  const frontendUrl = asegurarUrlConDiagonal(process.env.URL_FRONTEND || 'http://localhost:3000/');
  const urlConfirmacion = `${frontendUrl}confirmar-cuenta/${token}`;
  
  // Generar URLs alternativas para debugging
  const urlsAlternativas = generarURLsPrueba(frontendUrl, token);

  console.log(' URL de confirmación generada:', urlConfirmacion);
  console.log(' Enviando a:', email);
  console.log(' Frontend URL configurada:', process.env.URL_FRONTEND);
  console.log(' Token generado:', token);
  console.log(' Ruta completa:', urlConfirmacion);
  console.log(' URLs alternativas:', urlsAlternativas);

  const contenido = `

    <p>Hola <strong>${nombre}</strong>,</p>

    <p>Gracias por registrarte en nuestro sistema. Para activar tu cuenta, haz clic en el siguiente botón:</p>

    <p><small>Si el botón no funciona, prueba estas opciones:</small></p>
    <p><small><code>${urlConfirmacion}</code></small></p>
    <p><small><code>${urlsAlternativas.alternativa1}</code></small></p>
    <p><small><code>${urlsAlternativas.alternativa2}</code></small></p>

  `;

  const msg = {

    to: email,

    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',

    subject: 'Confirma tu cuenta - Dental Bosch',

    html: plantillaHTML('Confirma tu cuenta', contenido, urlConfirmacion, 'Confirmar Cuenta')

  };



  try {

    await sgMail.send(msg);

    console.log('Email de confirmación enviado a:', email);

  } catch (error) {

    console.error('Error al enviar email de confirmación:', error.message);

    throw error;

  }

};



// Enviar email de recuperación de contraseña

exports.enviarEmailRecuperacion = async (email, nombre, token) => {

  // URL de respaldo si URL_FRONTEND no está configurada correctamente
  const frontendUrl = asegurarUrlConDiagonal(process.env.URL_FRONTEND || 'http://localhost:3000/');
  const urlRecuperacion = `${frontendUrl}recuperar-password/${token}`;

  console.log(' URL de recuperación generada:', urlRecuperacion);

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



  try {

    await sgMail.send(msg);

    console.log('Email de recuperación enviado a:', email);

  } catch (error) {

    console.error('Error al enviar email de recuperación:', error.message);

    throw error;

  }

};



// Enviar email de bienvenida

exports.enviarEmailBienvenida = async (email, nombre, rol) => {

  // URL de respaldo si URL_FRONTEND no está configurada correctamente
  const frontendUrl = process.env.URL_FRONTEND || 'http://localhost:3000/';

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

    html: plantillaHTML('Cuenta Confirmada', contenido, frontendUrl, 'Ir al Sistema')

  };



  try {

    await sgMail.send(msg);

    console.log('Email de bienvenida enviado a:', email);

  } catch (error) {

    console.error('Error al enviar email de bienvenida:', error.message);

    throw error;

  }

};



// Enviar email de aprobación de doctor

exports.enviarEmailAprobacionDoctor = async (email, nombre) => {

  // URL de respaldo si URL_FRONTEND no está configurada correctamente
  const frontendUrl = process.env.URL_FRONTEND || 'http://localhost:3000/';

  const contenido = `

    <p>¡Hola <strong>Dr. ${nombre}</strong>!</p>

    <p>Tu cuenta de doctor ha sido <strong>aprobada</strong> exitosamente.</p>

    <p>Ya puedes iniciar sesión y comenzar a atender pacientes.</p>

  `;

  const msg = {

    to: email,

    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',

    subject: 'Cuenta aprobada - Dental Bosch',

    html: plantillaHTML('Cuenta Aprobada', contenido, frontendUrl, 'Iniciar Sesión')

  };



  try {

    await sgMail.send(msg);

    console.log('Email de aprobación enviado a:', email);

  } catch (error) {

    console.error('Error al enviar email de aprobación:', error.message);

    throw error;

  }

};



// Enviar email de rechazo de doctor

exports.enviarEmailRechazoDoctor = async (email, nombre, motivo) => {

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



  try {

    await sgMail.send(msg);

    console.log('Email de rechazo enviado a:', email);

  } catch (error) {

    console.error('Error al enviar email de rechazo:', error.message);

    throw error;

  }

};