const { generarAvatarPorRol, validarImagenURL } = require('../utils/avatarUtils');

// Middleware para asegurar que los usuarios tengan avatares válidos
const asegurarAvatarValido = async (req, res, next) => {
  try {
    // Solo ejecutar en rutas que devuelven datos de usuario
    if (!req.usuario || !req.path.includes('/perfil') && !req.path.includes('/auth/perfil')) {
      return next();
    }

    const usuario = req.usuario;
    
    // Si el avatar es de Cloudinary o está vacío, generar uno nuevo
    if (!usuario.foto || usuario.foto.includes('cloudinary')) {
      usuario.foto = generarAvatarPorRol(usuario.rol, usuario.nombre, usuario.apellido);
      
      // Opcional: Guardar en base de datos
      await require('../models/Usuario').findByIdAndUpdate(
        usuario._id,
        { foto: usuario.foto }
      );
    }

    // Validar que la URL sea accesible (async, no bloqueante)
    validarImagenURL(usuario.foto).catch(() => {
      console.log(`Avatar no accesible para usuario ${usuario._id}, generando nuevo...`);
      usuario.foto = generarAvatarPorRol(usuario.rol, usuario.nombre, usuario.apellido);
    });

    next();
  } catch (error) {
    console.error('Error en avatarMiddleware:', error);
    next();
  }
};

// Middleware para validar avatar en registro
const validarAvatarRegistro = async (req, res, next) => {
  try {
    const { rol, nombre, apellido } = req.body;
    
    // Si no se proporciona foto o es de Cloudinary, generar una
    if (!req.body.foto || req.body.foto.includes('cloudinary')) {
      req.body.foto = generarAvatarPorRol(
        rol || 'paciente', 
        nombre || 'Usuario', 
        apellido || 'Default'
      );
    }
    
    next();
  } catch (error) {
    console.error('Error en validarAvatarRegistro:', error);
    next();
  }
};

module.exports = {
  asegurarAvatarValido,
  validarAvatarRegistro
};
