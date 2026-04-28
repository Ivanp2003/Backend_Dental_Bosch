const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware principal de autenticación
const autenticar = async (req, res, next) => {
  try {
    let token;

    // Verificar si existe token en headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        mensaje: 'Acceso denegado. No se proporcionó token'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario del token con datos completos
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario inactivo'
      });
    }

    // Inyectar datos en la request
    req.usuario = usuario;
    req.id = usuario._id;
    req.rol = usuario.rol;

    // Obtener perfil específico según rol
    await obtenerPerfilUsuario(req);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      mensaje: 'Token inválido o expirado'
    });
  }
};

// Obtener perfil específico del usuario según su rol
const obtenerPerfilUsuario = async (req) => {
  const { rol, _id: usuarioId } = req.usuario;

  try {
    switch (rol) {
      case 'paciente':
        const Paciente = require('../models/Paciente');
        req.perfil = await Paciente.findOne({ usuario: usuarioId })
          .populate('doctorAsignado', 'usuario especialidad')
          .populate('doctorAsignado.usuario', 'nombre apellido');
        break;

      case 'doctor':
        const Doctor = require('../models/Doctor');
        req.perfil = await Doctor.findOne({ usuario: usuarioId })
          .populate('usuario', 'nombre apellido email');
        break;

      case 'admin':
        // Para admin, el perfil es el propio usuario
        req.perfil = req.usuario;
        break;

      default:
        req.perfil = null;
    }
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    req.perfil = null;
  }
};

// Proteger rutas - verificar JWT (Mantenido para compatibilidad)
exports.protegerRuta = autenticar;

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

// Middleware para verificar acceso a recursos propios
exports.verificarAccesoPropio = (req, res, next) => {
  const { rol } = req.usuario;
  
  // Admin puede acceder a todo
  if (rol === 'admin') {
    return next();
  }
  
  // Para pacientes y doctores, verificar que accedan a sus propios recursos
  const recursoId = req.params.id || req.params.pacienteId || req.params.doctorId;
  
  if (req.perfil && req.perfil._id.toString() === recursoId) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    mensaje: 'No tienes permisos para acceder a este recurso'
  });
};

// Exportar todas las funciones
module.exports = {
  protegerRuta: exports.protegerRuta,
  autorizarRoles: exports.autorizarRoles,
  verificarConfirmado: exports.verificarConfirmado,
  verificarDoctorAprobado: exports.verificarDoctorAprobado,
  verificarAccesoPropio: exports.verificarAccesoPropio
};