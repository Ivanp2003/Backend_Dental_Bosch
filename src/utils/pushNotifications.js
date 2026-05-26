const fetch = require('node-fetch');

/**
 * Enviar notificación push via Expo Push API
 * @param {String} pushToken - ExponentPushToken del destinatario
 * @param {String} titulo - Título de la notificación
 * @param {String} mensaje - Cuerpo de la notificación
 * @param {Object} datosExtras - Datos adicionales para la app
 */
async function enviarNotificacionPush(pushToken, titulo, mensaje, datosExtras = {}) {
  if (!pushToken) return;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: titulo,
        body: mensaje,
        data: datosExtras,
      })
    });

    const result = await response.json();

    if (result.data && result.data.status === 'error') {
      console.error('Error en push notification:', result.data.message);
    } else {
      console.log('Notificación push enviada con éxito');
    }
  } catch (error) {
    // No lanzar error para no interrumpir el flujo principal
    console.error('Error enviando notificación push:', error.message);
  }
}

module.exports = { enviarNotificacionPush };
