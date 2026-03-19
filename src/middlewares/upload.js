const multer = require('multer');
const path = require('path');
const { subirImagenCloudinary, subirBase64Cloudinary, validarImagen } = require('../config/cloudinary');

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/tmp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos mejorado
const fileFilter = (req, file, cb) => {
  try {
    // Validar imagen
    validarImagen(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: fileFilter
});

// Middleware personalizado para subir a Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file && !req.body.foto) {
      return next();
    }

    let fotoUrl = null;
    let publicId = null;

    // Caso 1: Archivo subido via multer
    if (req.file) {
      const result = await subirImagenCloudinary(req.file.path, 'dental-bosch/perfiles');
      fotoUrl = result.secure_url;
      publicId = result.public_id;
    }
    // Caso 2: Base64 enviado en el body
    else if (req.body.foto && req.body.foto.startsWith('data:image/')) {
      const result = await subirBase64Cloudinary(req.body.foto, 'dental-bosch/perfiles');
      fotoUrl = result.secure_url;
      publicId = result.public_id;
    }
    // Caso 3: URL de imagen existente (no se sube nada)
    else if (req.body.foto && typeof req.body.foto === 'string') {
      fotoUrl = req.body.foto;
    }

    // Agregar la información de la foto al request
    req.fotoUrl = fotoUrl;
    req.fotoPublicId = publicId;

    next();
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al subir la imagen',
      error: error.message
    });
  }
};

// Middleware para actualizar foto de usuario
const uploadUserPhoto = upload.single('foto');

// Middleware combinado: upload + cloudinary
const uploadPhotoToCloudinary = [uploadUserPhoto, uploadToCloudinary];

module.exports = {
  upload,
  uploadUserPhoto,
  uploadToCloudinary,
  uploadPhotoToCloudinary
};