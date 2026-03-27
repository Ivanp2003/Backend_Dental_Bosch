const { subirImagenCloudinary, subirBase64Cloudinary, validarImagen, eliminarImagenCloudinary, actualizarImagenCloudinary } = require('../config/cloudinary');

// Middleware para subir foto a Cloudinary (basado en tu proyecto de referencia)
const uploadPhotoToCloudinary = async (req, res, next) => {
  try {
    console.log(' Iniciando uploadPhotoToCloudinary');
    
    // Validar si hay archivo o base64
    if (!req.files?.foto && !req.body?.foto) {
      console.log(' No hay foto para procesar, continuando...');
      return next();
    }

    let fotoUrl = null;
    let publicId = null;

    // Caso 1: Archivo tradicional (express-fileupload)
    if (req.files?.foto) {
      console.log(' Procesando archivo tradicional:', req.files.foto.name);
      
      try {
        // Validar imagen
        validarImagen(req.files.foto);
        
        // Verificar que el archivo temporal exista
        if (!require('fs').existsSync(req.files.foto.tempFilePath)) {
          console.error(' Archivo temporal no encontrado:', req.files.foto.tempFilePath);
          return next();
        }
        
        // Subir a Cloudinary
        const result = await subirImagenCloudinary(req.files.foto.tempFilePath, 'Dental');
        fotoUrl = result.secure_url;
        publicId = result.public_id;
        
        console.log(' Archivo subido exitosamente:', fotoUrl);
      } catch (error) {
        console.error(' Error procesando archivo:', error.message);
        // Continuar sin foto si hay error
        return next();
      }
    }
    // Caso 2: Base64
    else if (req.body?.foto && req.body.foto.startsWith('data:image/')) {
      console.log(' Procesando imagen base64');
      
      try {
        fotoUrl = await subirBase64Cloudinary(req.body.foto, 'Dental');
        console.log(' Base64 subido exitosamente:', fotoUrl);
      } catch (error) {
        console.error(' Error procesando base64:', error.message);
        return next();
      }
    }
    // Caso 3: URL existente (no se sube nada)
    else if (req.body?.foto && typeof req.body.foto === 'string' && req.body.foto.trim() !== '') {
      console.log(' Usando URL existente:', req.body.foto);
      fotoUrl = req.body.foto.trim();
    }

    // Agregar información de la foto al request
    if (fotoUrl) {
      req.fotoUrl = fotoUrl;
      req.fotoPublicId = publicId;
      console.log(' Foto procesada y agregada al request');
    }

    next();
  } catch (error) {
    console.error(' Error en uploadPhotoToCloudinary:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al subir la imagen',
      error: error.message
    });
  }
};

// Middleware para actualizar foto con eliminación de la anterior (basado en tu proyecto)
const updatePhotoToCloudinary = async (req, res, next) => {
  try {
    console.log(' Iniciando updatePhotoToCloudinary');
    
    if (!req.files?.foto && !req.body?.foto) {
      console.log(' No hay foto para actualizar, continuando...');
      return next();
    }

    // Obtener usuario actual para saber su foto anterior
    const Usuario = require('../models/Usuario');
    const usuario = await Usuario.findById(req.usuario.id);
    
    let fotoUrl = null;
    let publicId = null;

    // Caso 1: Archivo tradicional
    if (req.files?.foto) {
      console.log(' Actualizando con archivo tradicional');
      
      try {
        validarImagen(req.files.foto);
        
        if (!require('fs').existsSync(req.files.foto.tempFilePath)) {
          console.error(' Archivo temporal no encontrado');
          return next();
        }
        
        // Usar función de actualización que elimina la anterior
        const result = await actualizarImagenCloudinary(
          req.files.foto.tempFilePath, 
          usuario.fotoPublicId, 
          'Dental'
        );
        fotoUrl = result.secure_url;
        publicId = result.public_id;
        
        console.log(' Foto actualizada exitosamente:', fotoUrl);
      } catch (error) {
        console.error(' Error actualizando archivo:', error.message);
        return next();
      }
    }
    // Caso 2: Base64
    else if (req.body?.foto && req.body.foto.startsWith('data:image/')) {
      console.log(' Actualizando con base64');
      
      try {
        // Eliminar foto anterior si existe
        if (usuario.fotoPublicId) {
          await eliminarImagenCloudinary(usuario.fotoPublicId);
          console.log(' Foto anterior eliminada');
        }
        
        fotoUrl = await subirBase64Cloudinary(req.body.foto, 'Dental');
        console.log(' Base64 actualizado exitosamente:', fotoUrl);
      } catch (error) {
        console.error(' Error actualizando base64:', error.message);
        return next();
      }
    }
    // Caso 3: URL existente
    else if (req.body?.foto && typeof req.body.foto === 'string' && req.body.foto.trim() !== '') {
      console.log(' Actualizando con URL existente');
      fotoUrl = req.body.foto.trim();
    }

    // Agregar información al request
    if (fotoUrl) {
      req.fotoUrl = fotoUrl;
      req.fotoPublicId = publicId;
      console.log(' Foto actualizada y agregada al request');
    }

    next();
  } catch (error) {
    console.error(' Error en updatePhotoToCloudinary:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar la imagen',
      error: error.message
    });
  }
};

// Middleware para manejar solo archivos (sin procesamiento)
const handleFileUpload = (req, res, next) => {
  // Este middleware solo asegura que los archivos estén disponibles
  // El procesamiento se hace en uploadPhotoToCloudinary
  next();
};

module.exports = {
  uploadPhotoToCloudinary,
  updatePhotoToCloudinary,
  handleFileUpload
};