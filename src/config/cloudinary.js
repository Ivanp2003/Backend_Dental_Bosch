const cloudinary = require('cloudinary').v2;
const fs = require('fs-extra');
const path = require('path');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Subir archivos a Cloudinary
const subirImagenCloudinary = async (filePath, folder = "dental-bosch") => {
  try {
    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, { 
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      quality: 'auto',
      fetch_format: 'auto'
    });
    
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

// Subir Base64 a Cloudinary
const subirBase64Cloudinary = async (base64, folder = "dental-bosch") => {
  try {
    // Extraer el base64 puro (sin el prefijo data:image/...;base64,)
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    
    // Convertir a buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Subir usando stream
    const { secure_url, public_id } = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder, 
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          quality: 'auto',
          fetch_format: 'auto'
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
    console.error('Error al subir base64 a Cloudinary:', error);
    throw new Error('Error al subir imagen a Cloudinary');
  }
};

// Eliminar imagen de Cloudinary
const eliminarImagenCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw new Error('Error al eliminar imagen de Cloudinary');
  }
};

// Subir avatar por defecto si no tiene foto
const subirAvatarPorDefecto = async (nombre, rol = 'paciente') => {
  try {
    // Generar avatar inicial con las primeras letras del nombre
    const iniciales = nombre.split(' ').map(word => word[0]).join('').toUpperCase();
    const avatarUrl = `https://ui-avatars.com/api/?name=${iniciales}&background=${rol === 'doctor' ? '4F46E5' : '10B981'}&color=ffffff&size=200&bold=true`;
    
    // Descargar y subir a Cloudinary
    const response = await fetch(avatarUrl);
    const buffer = await response.buffer();
    
    const { secure_url, public_id } = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder: `dental-bosch/avatars/${rol}`,
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
    // Retornar avatar por defecto genérico
    return {
      secure_url: `https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,g_face,r_max,d_avatar.png.png`,
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

// Optimizar imagen antes de subir
const optimizarImagen = async (filePath) => {
  try {
    return filePath;
  } catch (error) {
    console.error('Error al optimizar imagen:', error);
    return filePath;
  }
};

module.exports = {
  cloudinary,
  subirImagenCloudinary,
  subirBase64Cloudinary,
  eliminarImagenCloudinary,
  subirAvatarPorDefecto,
  validarImagen,
  optimizarImagen
};