const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Proteger rutas - verificar JWT
exports.protegerRuta = async (req, res, next) => {
  let token;

  // Verificar si existe token en headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      mensaje: 'No está autorizado para acceder a esta ruta'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario del token
    req.usuario = await Usuario.findById(decoded.id).select('-password');

    if (!req.usuario || !req.usuario.activo) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no autorizado'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      mensaje: 'Token inválido o expirado'
    });
  }
};

// Verificar roles específicos
exports.autorizarRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        mensaje: `El rol ${req.usuario.rol} no tiene permisos para esta acción`
      });
    }
    next();
  };
};

// Verificar que el usuario esté confirmado
exports.verificarConfirmado = (req, res, next) => {
  if (!req.usuario.confirmado) {
    return res.status(403).json({
      success: false,
      mensaje: 'Debes confirmar tu cuenta antes de continuar'
    });
  }
  next();
};

// Verificar que el doctor esté aprobado
exports.verificarDoctorAprobado = (req, res, next) => {
  if (req.usuario.rol === 'doctor' && req.usuario.estado !== 'aprobado') {
    return res.status(403).json({
      success: false,
      mensaje: 'Tu cuenta de doctor está pendiente de aprobación'
    });
  }
  next();
};