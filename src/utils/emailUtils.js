// Utilidades para debugging de rutas de confirmación

const generarURLsPrueba = (frontendUrl, token) => {
  return {
    actual: `${frontendUrl}confirmar-cuenta/${token}`,
    alternativa1: `${frontendUrl}confirmar-cuenta?token=${token}`,
    alternativa2: `${frontendUrl}auth/confirmar-cuenta/${token}`,
    alternativa3: `${frontendUrl}verify/${token}`,
    alternativa4: `${frontendUrl}confirm/${token}`,
    alternativa5: `${frontendUrl}activate/${token}`
  };
};

module.exports = {
  generarURLsPrueba
};
