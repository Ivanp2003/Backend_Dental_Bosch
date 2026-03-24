const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Proteger rutas - verificar JWT (Mantenido para compatibilidad)
exports.protegerRuta = async (req, res, next) => {
  console.log('🔒 Iniciando protegerRuta para:', req.path);
  let token;

  // Verificar si existe token en headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('✅ Token encontrado');
  } else {
    console.log('❌ No se proporcionó token en:', req.path);
    return res.status(401).json({
      success: false,
      mensaje: 'No está autorizado para acceder a esta ruta'
    });
  }

  try {
    // Verificar token
    console.log('🔍 Verificando token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido, decoded:', decoded.id);

    // Obtener usuario del token
    console.log('🔍 Buscando usuario en BD...');
    req.usuario = await Usuario.findById(decoded.id).select('-password');

    if (!req.usuario || !req.usuario.activo) {
      console.log('❌ Usuario no encontrado o inactivo:', decoded.id);
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no autorizado'
      });
    }

    console.log('✅ Usuario autenticado exitosamente:', {
      id: req.usuario._id,
      email: req.usuario.email,
      rol: req.usuario.rol
    });

    next();
  } catch (error) {
    console.log('❌ Error al verificar token:', error.message);
    return res.status(401).json({
      success: false,
      mensaje: 'Token inválido o expirado'
    });
  }
};

// Verificar roles específicos
exports.autorizarRoles = (...roles) => {
  return (req, res, next) => {
    console.log('🔍 Verificando roles:', {
      path: req.path,
      requiredRoles: roles,
      userRole: req.usuario?.rol,
      hasRole: roles.includes(req.usuario?.rol)
    });
    
    if (!roles.includes(req.usuario.rol)) {
      console.log('❌ Acceso denegado - Rol no autorizado:', {
        required: roles,
        current: req.usuario?.rol
      });
      return res.status(403).json({
        success: false,
        mensaje: `El rol ${req.usuario.rol} no tiene permisos para esta acción`
      });
    }
    
    console.log('✅ Rol autorizado correctamente');
    next();
  }
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

// Exportar todas las funciones
module.exports = {
  protegerRuta: exports.protegerRuta,
  autorizarRoles: exports.autorizarRoles,
  verificarConfirmado: exports.verificarConfirmado,
  verificarDoctorAprobado: exports.verificarDoctorAprobado
};