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
    // Validaciones iniciales para evitar bucle infinito
    const tieneArchivo = req.file;
    const tieneBase64 = req.body.foto && req.body.foto.startsWith('data:image/');
    const tieneUrlValida = req.body.foto && 
      typeof req.body.foto === 'string' && 
      req.body.foto.trim() !== '' &&
      !req.body.foto.includes('undefined') &&
      !req.body.foto.includes('null');

    if (!tieneArchivo && !tieneBase64 && !tieneUrlValida) {
      // No hay foto válida, continuar sin procesar
      return next();
    }

    let fotoUrl = null;
    let publicId = null;

    // Caso 1: Archivo subido via multer
    if (tieneArchivo) {
      const result = await subirImagenCloudinary(req.file.path, 'dental-bosch/perfiles');
      fotoUrl = result.secure_url;
      publicId = result.public_id;
    }
    // Caso 2: Base64 enviado en el body
    else if (tieneBase64) {
      const result = await subirBase64Cloudinary(req.body.foto, 'dental-bosch/perfiles');
      fotoUrl = result.secure_url;
      publicId = result.public_id;
    }
    // Caso 3: URL de imagen existente válida
    else if (tieneUrlValida) {
      fotoUrl = req.body.foto.trim();
    }

    // Solo agregar foto si es válida
    if (fotoUrl) {
      req.fotoUrl = fotoUrl;
      req.fotoPublicId = publicId;
    }

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