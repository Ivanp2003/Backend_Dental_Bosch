const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../src/models/Usuario');
require('dotenv').config();

// Script para migrar contraseñas en texto plano a hash
const migrarContraseñas = async () => {
  try {
    // Conectar a la base de datos
    const MONGODB_URI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PRODUCTION 
      : process.env.MONGODB_URI_LOCAL;
    
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');

    // Obtener todos los usuarios que tienen contraseñas en texto plano
    // (las contraseñas encriptadas generalmente tienen más de 50 caracteres y empiezan con $2)
    const usuarios = await Usuario.find({
      password: { $not: /^\$2[aby]\$\d+\$/ }
    });

    console.log(`📊 Encontrados ${usuarios.length} usuarios con contraseñas en texto plano`);

    // Migrar cada usuario
    for (const usuario of usuarios) {
      try {
        // Verificar que la contraseña no sea undefined o null
        if (!usuario.password || usuario.password === undefined) {
          console.log(`⚠️ Usuario ${usuario.email} no tiene contraseña, estableciendo contraseña por defecto...`);
          
          // Establecer contraseña por defecto "123456"
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash("123456", salt);
          
          await Usuario.findByIdAndUpdate(usuario._id, {
            password: passwordHash
          });
          
          console.log(`✅ Usuario ${usuario.email} actualizado con contraseña por defecto`);
          continue;
        }

        // Generar salt y encriptar la contraseña actual
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(usuario.password, salt);

        // Actualizar la contraseña
        await Usuario.findByIdAndUpdate(usuario._id, {
          password: passwordHash
        });

        console.log(`✅ Usuario ${usuario.email} migrado exitosamente`);
      } catch (error) {
        console.error(`❌ Error migrando usuario ${usuario.email}:`, error.message);
      }
    }

    console.log('🎉 Migración completada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

// Ejecutar la migración
migrarContraseñas();
