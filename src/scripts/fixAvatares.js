const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const { generarAvatarPorRol } = require('../utils/avatarUtils');
require('dotenv').config();

const fixAvatares = async () => {
  try {
    console.log('🔧 Iniciando corrección de avatares...');
    
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI_PRODUCTION);
    console.log('✅ Conectado a la base de datos');

    // Encontrar todos los usuarios con avatares de Cloudinary o vacíos
    const usuariosConProblemas = await Usuario.find({
      $or: [
        { foto: { $regex: /cloudinary/i } },
        { foto: { $exists: false } },
        { foto: null },
        { foto: '' }
      ]
    });

    console.log(`📊 Se encontraron ${usuariosConProblemas.length} usuarios con avatares problemáticos`);

    // Corregir cada usuario
    for (const usuario of usuariosConProblemas) {
      const nuevoAvatar = generarAvatarPorRol(
        usuario.rol, 
        usuario.nombre, 
        usuario.apellido
      );
      
      await Usuario.findByIdAndUpdate(usuario._id, { foto: nuevoAvatar });
      
      console.log(`✅ Avatar actualizado para: ${usuario.nombre} ${usuario.apellido} (${usuario.email})`);
    }

    console.log('🎉 ¡Todos los avatares han sido corregidos!');
    
  } catch (error) {
    console.error('❌ Error al corregir avatares:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  fixAvatares();
}

module.exports = fixAvatares;
