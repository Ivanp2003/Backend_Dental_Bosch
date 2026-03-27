const cloudinary = require('cloudinary').v2;
const fs = require('fs-extra');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Subir archivos a Cloudinary (basado en tu proyecto de referencia)
const subirImagenCloudinary = async (filePath, folder = "Dental") => {
  try {
    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, { folder });
    
    // Eliminar archivo temporal después de subir
    await fs.unlink(filePath);
    
    return { secure_url, public_id };
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    // Eliminar archivo temporal incluso si hay error
    if (fs.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
    throw new Error('Error al subir imagen a Cloudinary');
  }
};

// Subir Base64 a Cloudinary (basado en tu proyecto de referencia)
const subirBase64Cloudinary = async (base64, folder = "Dental") => {
  try {
    // Se usa base64 para evitar que se dañen las imágenes cuando se transportan
    // data:image/png;base64,iVBORw0KGgjbjgfyvh
    // iVBORw0KGgjbjgfyvh
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    // iVBORw0KGgjbjgfyvh - 010101010101010101
    const { secure_url } = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' }, 
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
      
      stream.end(buffer);
    });
    
    return secure_url;
  } catch (error) {
    console.error('Error al subir base64 a Cloudinary:', error);
    throw new Error('Error al subir imagen a Cloudinary');
  }
};

// Eliminar imagen de Cloudinary (para actualizar)
const eliminarImagenCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw new Error('Error al eliminar imagen de Cloudinary');
  }
};

// Subir avatar por defecto usando UI Avatars (mejorado)
const subirAvatarPorDefecto = async (nombre, rol = 'paciente') => {
  try {
    // Generar avatar con iniciales del nombre
    const iniciales = nombre.split(' ').map(word => word[0]).join('').toUpperCase();
    const avatarUrl = `https://ui-avatars.com/api/?name=${iniciales}&background=${rol === 'doctor' ? '4F46E5' : '10B981'}&color=ffffff&size=200&bold=true`;
    
    // Descargar y subir a Cloudinary
    const response = await fetch(avatarUrl);
    const buffer = await response.buffer();
    
    const { secure_url, public_id } = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder: `Dental/avatars/${rol}`,
          public_id: `${rol}_${Date.now()}`,
          resource_type: 'auto'
        }, 
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      
      stream.end(buffer);
    });
    
    return { secure_url, public_id };
  } catch (error) {
    console.error('Error al generar avatar por defecto:', error);
    // Retornar avatar por defecto genérico usando UI Avatars
    return {
      secure_url: 'https://ui-avatars.com/api/?name=User&background=8b5cf6&color=ffffff&size=200&bold=true',
      public_id: 'default_avatar'
    };
  }
};

// Validar formato de imagen
const validarImagen = (file) => {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!tiposPermitidos.includes(file.mimetype)) {
    throw new Error('Formato de imagen no permitido. Use: JPG, PNG, GIF o WebP');
  }
  
  if (file.size > maxSize) {
    throw new Error('La imagen es demasiado grande. Máximo 5MB');
  }
  
  return true;
};

// Actualizar imagen con eliminación de la anterior (basado en tu proyecto)
const actualizarImagenCloudinary = async (filePath, public_id_anterior, folder = "Dental") => {
  try {
    // Eliminar imagen anterior si existe
    if (public_id_anterior) {
      await eliminarImagenCloudinary(public_id_anterior);
    }
    
    // Subir nueva imagen
    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, { folder });
    
    // Eliminar archivo temporal
    await fs.unlink(filePath);
    
    return { secure_url, public_id };
  } catch (error) {
    console.error('Error al actualizar imagen en Cloudinary:', error);
    // Eliminar archivo temporal incluso si hay error
    if (fs.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
    throw new Error('Error al actualizar imagen en Cloudinary');
  }
};

module.exports = {
  cloudinary,
  subirImagenCloudinary,
  subirBase64Cloudinary,
  eliminarImagenCloudinary,
  subirAvatarPorDefecto,
  validarImagen,
  actualizarImagenCloudinary
};