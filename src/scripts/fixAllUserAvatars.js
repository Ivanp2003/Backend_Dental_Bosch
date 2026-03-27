const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const { subirAvatarPorDefecto } = require('../config/cloudinary');
const { validarImagenURL } = require('../utils/avatarUtils');
require('dotenv').config();

const fixAllUserAvatars = async () => {
  try {
    console.log('🔧 Iniciando proceso de avatares para todos los usuarios...');
    
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI_PRODUCTION);
    console.log('✅ Conectado a la base de datos');

    // 1. Obtener todos los usuarios
    const todosLosUsuarios = await Usuario.find({});
    console.log(`📊 Total de usuarios encontrados: ${todosLosUsuarios.length}`);

    let usuariosActualizados = 0;
    let usuariosConAvatarPersonalizado = 0;
    let usuariosConAvatarRoto = 0;

    for (const usuario of todosLosUsuarios) {
      try {
        console.log(`\n🔍 Procesando usuario: ${usuario.nombre} ${usuario.apellido} (${usuario.email})`);
        console.log(`📸 Foto actual: ${usuario.foto || 'SIN FOTO'}`);
        console.log(`👤 Rol: ${usuario.rol}`);

        // 2. Verificar si tiene foto personalizada
        const tieneFotoPersonalizada = usuario.foto && 
          !usuario.foto.includes('ui-avatars.com') && 
          !usuario.foto.includes('cloudinary.com/demo/image/upload') &&
          !usuario.foto.includes('default-avatar');

        if (tieneFotoPersonalizada) {
          // 3. Validar si la foto existe y es accesible
          const fotoValida = await validarImagenURL(usuario.foto);
          
          if (fotoValida) {
            console.log(`✅ Avatar personalizado válido - No se actualiza`);
            usuariosConAvatarPersonalizado++;
            continue;
          } else {
            console.log(`❌ Avatar personalizado roto - Se reemplazará`);
            usuariosConAvatarRoto++;
          }
        } else {
          console.log(`⚠️ Sin avatar personalizado - Se asignará uno por defecto`);
        }

        // 4. Generar avatar por defecto según rol
        console.log(`🎨 Generando avatar por defecto para rol: ${usuario.rol}`);
        const avatarResult = await subirAvatarPorDefecto(`${usuario.nombre} ${usuario.apellido}`, usuario.rol);
        
        if (avatarResult && avatarResult.secure_url) {
          // 5. Actualizar base de datos
          await Usuario.findByIdAndUpdate(usuario._id, {
            foto: avatarResult.secure_url
          });

          console.log(`✅ Avatar actualizado: ${avatarResult.secure_url}`);
          console.log(`🆔 Public ID: ${avatarResult.public_id}`);
          usuariosActualizados++;

        } else {
          console.log(`❌ Error al generar avatar por defecto`);
        }

      } catch (error) {
        console.error(`❌ Error procesando usuario ${usuario.email}:`, error.message);
      }
    }

    // 6. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL PROCESO');
    console.log('='.repeat(60));
    console.log(`👥 Total usuarios procesados: ${todosLosUsuarios.length}`);
    console.log(`✅ Usuarios con avatar personalizado válido: ${usuariosConAvatarPersonalizado}`);
    console.log(`🔧 Usuarios actualizados con avatar por defecto: ${usuariosActualizados}`);
    console.log(`💥 Avatares rotos reemplazados: ${usuariosConAvatarRoto}`);
    console.log('='.repeat(60));

    if (usuariosActualizados > 0) {
      console.log(`\n🎉 ¡Proceso completado! ${usuariosActualizados} usuarios recibieron avatares por defecto.`);
    } else {
      console.log(`\n✨ Todos los usuarios ya tienen avatares válidos.`);
    }

  } catch (error) {
    console.error('❌ Error general en el proceso:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
};

// Función para verificar avatar específico por email
const verificarAvatarPorEmail = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI_PRODUCTION);
    
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      console.log(`❌ Usuario con email ${email} no encontrado`);
      return;
    }

    console.log(`👤 Usuario encontrado: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`📸 Foto actual: ${usuario.foto}`);
    console.log(`👤 Rol: ${usuario.rol}`);

    if (usuario.foto) {
      const isValid = await validarImagenURL(usuario.foto);
      console.log(`✅ Foto válida: ${isValid}`);
    } else {
      console.log(`⚠️ El usuario no tiene foto`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  const accion = process.argv[2];
  
  if (accion === 'verificar' && process.argv[3]) {
    const email = process.argv[3];
    console.log(`🔍 Verificando avatar para: ${email}`);
    verificarAvatarPorEmail(email);
  } else {
    console.log('🚀 Iniciando proceso masivo de avatares...');
    fixAllUserAvatars();
  }
}

module.exports = {
  fixAllUserAvatars,
  verificarAvatarPorEmail
};
