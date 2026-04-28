const mongoose = require('mongoose');
const Doctor = require('../src/models/Doctor');
const Usuario = require('../src/models/Usuario');
require('dotenv').config();

async function limpiarDoctoresHuerfanos() {
  try {
    // Conectar a la base de datos usando la misma configuración que el servidor
    const MONGODB_URI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PRODUCTION 
      : process.env.MONGODB_URI_LOCAL;
    
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');

    // 1. Encontrar todos los doctores que no tienen usuario asociado
    const doctoresHuerfanos = await Doctor.find({ usuario: null });
    console.log(`📋 Encontrados ${doctoresHuerfanos.length} doctores huérfanos`);

    if (doctoresHuerfanos.length > 0) {
      // 2. Eliminar los doctores huérfanos
      const resultado = await Doctor.deleteMany({ usuario: null });
      console.log(`🗑️ Eliminados ${resultado.deletedCount} doctores huérfanos`);
    }

    // 3. Limpiar campos obsoletos de los doctores restantes
    const doctoresRestantes = await Doctor.find({});
    console.log(`📋 Doctores restantes: ${doctoresRestantes.length}`);

    for (const doctor of doctoresRestantes) {
      let necesitaActualizar = false;
      let actualizacion = {};

      // Eliminar campos obsoletos si existen
      if (doctor.calificacionPromedio !== undefined) {
        actualizacion.$unset = { ...actualizacion.$unset, calificacionPromedio: 1 };
        necesitaActualizar = true;
      }
      if (doctor.totalCalificaciones !== undefined) {
        actualizacion.$unset = { ...actualizacion.$unset, totalCalificaciones: 1 };
        necesitaActualizar = true;
      }

      if (necesitaActualizar) {
        await Doctor.findByIdAndUpdate(doctor._id, actualizacion);
        console.log(`🧹 Limpiado doctor ${doctor._id}`);
      }
    }

    // 4. Mostrar estadísticas finales
    const doctoresFinales = await Doctor.find({}).populate('usuario', 'nombre apellido email estado');
    console.log('\n📊 Estadísticas finales:');
    console.log(`Total doctores: ${doctoresFinales.length}`);
    
    doctoresFinales.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.usuario?.nombreCompleto || 'SIN USUARIO'} - ${doctor.especialidad} - ${doctor.usuario?.estado || 'SIN ESTADO'}`);
    });

    console.log('\n✅ Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la limpieza
limpiarDoctoresHuerfanos();
