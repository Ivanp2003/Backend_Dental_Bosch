const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generar JWT
exports.generarJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

// Generar token aleatorio para confirmación/recuperación
exports.generarToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generar código de 6 dígitos para recuperación de contraseña
exports.generarCodigoRecuperacion = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash del token para almacenar en BD
exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};