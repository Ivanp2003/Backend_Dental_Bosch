const { configurarEmail, sgMail } = require('../config/emailConfig');
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
  
  console.log(' URL de confirmación generada:', urlConfirmacion);
  console.log(' Enviando a:', email);
  console.log(' Frontend URL configurada:', process.env.URL_FRONTEND);
  console.log(' Token generado:', token);
  console.log(' Ruta completa:', urlConfirmacion);

  const contenido = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Gracias por registrarte en nuestro sistema. Para activar tu cuenta, haz clic en el siguiente botón:</p>
    <p><small>Si el botón no funciona, copia y pega este enlace en tu navegador:</small></p>
    <p><small><code>${urlConfirmacion}</code></small></p>
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
exports.enviarEmailRecuperacion = async (email, nombre, codigo) => {
  console.log('🔐 Código de recuperación generado:', codigo);
  
  // Configurar email antes de enviar
  if (!configurarEmail()) {
    console.error('❌ SendGrid no configurado. No se puede enviar el email de recuperación.');
    throw new Error('Servicio de email no disponible. Contacta al administrador.');
  }

  const contenido = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #007bff;">
      <h2 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: bold;">${codigo}</h2>
    </div>
    <p><strong>Este código expira en 15 minutos.</strong></p>
    <p style="color: #6c757d; font-size: 14px;">
      Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
    </p>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: 'Código de Recuperación - Dental Bosch',
    html: plantillaHTML('Recuperar Contraseña', contenido)
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
    <p>¡Bienvenido a Dental Bosch! Tu cuenta ha sido creada exitosamente.</p>
    ${rol === 'doctor' ? 
      '<p><strong>Nota:</strong> Tu cuenta de doctor está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada para que puedas comenzar a usar el sistema.</p>' : 
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

exports.enviarEmailAprobacionDoctor = async (email, nombre, especialidad) => {
  const frontendUrl = process.env.URL_FRONTEND || 'http://localhost:3000/';

  const contenido = `
    <p>¡Hola <strong>Dr. ${nombre}</strong>!</p>
    <p>¡Excelentes noticias! Tu cuenta de doctor ha sido <strong style="color: #28a745;">aprobada</strong> exitosamente.</p>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <p style="margin: 0;"><strong>Datos de tu cuenta:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>Nombre:</strong> Dr. ${nombre}</li>
        <li><strong>Especialidad:</strong> ${especialidad || 'Especialidad registrada'}</li>
        <li><strong>Estado:</strong> <span style="color: #28a745;">✅ Activo y Aprobado</span></li>
      </ul>
    </div>
    <p>A partir de este momento, puedes:</p>
    <ul>
      <li>🔐 Iniciar sesión en el sistema</li>
      <li>📅 Ver y gestionar tus citas</li>
      <li>👥 Atender a tus pacientes</li>
      <li>📋 Actualizar tu horario de atención</li>
    </ul>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📌 Próximos pasos recomendados:</strong></p>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li>Inicia sesión con tu email y contraseña</li>
        <li>Configura tu horario de atención</li>
        <li>Revisa tu perfil y completa tu información</li>
        <li>Explora el sistema y familiarízate con las herramientas</li>
      </ol>
    </div>
    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.</p>
    <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #28a745; color: white; border-radius: 8px;">
      <p style="margin: 0; font-size: 18px;"><strong>¡Estamos emocionados de tenerte en nuestro equipo!</strong></p>
      <p style="margin: 5px 0 0 0;">Juntos brindaremos el mejor cuidado dental a nuestros pacientes.</p>
    </div>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: '¡Bienvenido! Tu cuenta de doctor ha sido aprobada - Dental Bosch',
    html: plantillaHTML('¡Bienvenido al Equipo!', contenido, frontendUrl, 'Iniciar Sesión Ahora')
  };

  try {
    await sgMail.send(msg);
    console.log('¡Bienvenido! Email de aprobación enviado a:', email);
  } catch (error) {
    console.error('Error al enviar email de aprobación:', error.message);
    console.log('⚠️ Continuando flujo principal a pesar del error de email');
  }
};

exports.enviarEmailRechazoDoctor = async (email, nombre, motivo) => {
  const contenido = `
    <p>¡Hola <strong>${nombre}</strong>!</p>
    <p>Te informamos que tu solicitud de registro como doctor ha sido <strong style="color: #dc3545;">rechazada</strong>.</p>
    ${motivo ? `
    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
      <p style="margin: 0;"><strong>Motivo del rechazo:</strong></p>
      <p style="margin: 10px 0 0 0;">${motivo}</p>
    </div>
    ` : ''}
    <p>Si crees que esto es un error o deseas obtener más información sobre el motivo del rechazo, por favor contacta a nuestro equipo de soporte.</p>
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📌 Información importante:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Puedes enviar una nueva solicitud si corrigen los problemas identificados</li>
        <li>Te recomendamos revisar cuidadosamente los requisitos de registro</li>
        <li>Para consultas, contacta a soporte@dentalbosch.com</li>
      </ul>
    </div>
    <p>Te agradecemos tu interés en formar parte de nuestro equipo.</p>
    <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #6c757d; color: white; border-radius: 8px;">
      <p style="margin: 0; font-size: 18px;"><strong>Atentamente,</strong></p>
      <p style="margin: 5px 0 0 0;">El equipo de Dental Bosch</p>
    </div>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
    subject: 'Información sobre tu solicitud de registro - Dental Bosch',
    html: plantillaHTML('Solicitud Revisada', contenido)
  };

  try {
    await sgMail.send(msg);
    console.log('Email de rechazo enviado a:', email);
  } catch (error) {
    console.error('Error al enviar email de rechazo:', error.message);
    console.log('⚠️ Continuando flujo principal a pesar del error de email');
  }
};

exports.enviarNotificacionReasignacion = async (datosNotificacion) => {
  try {
    const {
      pacienteEmail,
      pacienteNombre,
      doctorAnteriorNombre,
      doctorNuevoNombre,
      doctorNuevoEmail,
      especialidad,
      fechaCambio
    } = datosNotificacion;

    console.log(' Enviando notificación de reasignación a paciente:', pacienteEmail);
    console.log(' Enviando notificación a nuevo doctor:', doctorNuevoEmail);

    // Email para el PACIENTE
    const contenidoPaciente = `
      <p>Hola <strong>${pacienteNombre}</strong>,</p>
      <p>Te informamos que ha habido un cambio en la asignación de tu doctor:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
        <p style="margin: 0 0 10px 0;"><strong>Cambio de Doctor:</strong></p>
        <p style="margin: 5px 0;">
          <span style="color: #dc3545;"> Doctor anterior:</span> ${doctorAnteriorNombre}
        </p>
        <p style="margin: 5px 0;">
          <span style="color: #28a745;"> Nuevo doctor:</span> <strong>${doctorNuevoNombre}</strong>
        </p>
        <p style="margin: 5px 0;">
          <span style="color: #007bff;"> Especialidad:</span> ${especialidad}
        </p>
        <p style="margin: 5px 0;">
          <span style="color: #6c757d;"> Fecha del cambio:</span> ${new Date(fechaCambio).toLocaleDateString('es-ES')}
        </p>
      </div>
      <p>Este cambio ha sido realizado por el administrador del sistema para garantizar la mejor atención posible.</p>
      <p style="color: #6c757d; font-size: 14px;">
        Si tienes alguna pregunta sobre este cambio, no dudes en contactarnos.
      </p>
    `;

    const msgPaciente = {
      to: pacienteEmail,
      from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
      subject: 'Cambio de Doctor Asignado - Dental Bosch',
      html: plantillaHTML('Cambio de Doctor Asignado', contenidoPaciente)
    };

    // Email para el NUEVO DOCTOR
    const contenidoDoctor = `
      <p>Hola <strong>Dr. ${doctorNuevoNombre}</strong>,</p>
      <p>Te informamos que se te han asignado nuevos pacientes:</p>
      <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0 0 10px 0;"><strong>Detalles de la Asignación:</strong></p>
        <p style="margin: 5px 0;">
          <span style="color: #007bff;"> Paciente:</span> ${pacienteNombre}
        </p>
        <p style="margin: 5px 0;">
          <span style="color: #6c757d;"> Fecha de asignación:</span> ${new Date(fechaCambio).toLocaleDateString('es-ES')}
        </p>
        <p style="margin: 5px 0;">
          <span style="color: #007bff;"> Especialidad:</span> ${especialidad}
        </p>
      </div>
      <p>Por favor, revisa tu panel de doctores para ver los detalles de tus nuevos pacientes y sus citas programadas.</p>
      <p style="color: #6c757d; font-size: 14px;">
        Si tienes alguna pregunta, no dudes en contactar al administrador.
      </p>
    `;

    const msgDoctor = {
      to: doctorNuevoEmail,
      from: process.env.EMAIL_FROM || 'noreply@dentalbosch.com',
      subject: 'Nuevos Pacientes Asignados - Dental Bosch',
      html: plantillaHTML('Nuevos Pacientes Asignados', contenidoDoctor)
    };

    // Enviar emails en paralelo sin bloquear el flujo principal
    const resultados = await Promise.allSettled([
      sgMail.send(msgPaciente),
      sgMail.send(msgDoctor)
    ]);

    // Procesar resultados
    resultados.forEach((resultado, index) => {
      const destinatario = index === 0 ? `paciente (${pacienteEmail})` : `doctor (${doctorNuevoEmail})`;
      
      if (resultado.status === 'fulfilled') {
        console.log(` Email de notificación enviado a ${destinatario}`);
      } else {
        console.error(` Error enviando email a ${destinatario}:`, resultado.reason.message);
        // No lanzar error para no bloquear el flujo principal
      }
    });

    console.log(' Notificaciones de reasignación procesadas');

  } catch (error) {
    console.error(' Error en enviarNotificacionReasignacion:', error.message);
    // No lanzar error para no bloquear el flujo principal
    console.log(' Continuando flujo principal a pesar del error de email');
  }
};
