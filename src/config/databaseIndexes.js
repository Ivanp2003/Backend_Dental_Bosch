const mongoose = require('mongoose');

/**
 * Configuración de índices para optimizar el rendimiento de MongoDB
 * Se ejecuta al iniciar la aplicación para asegurar que todos los índices necesarios existan
 */

const configurarIndices = async () => {
  try {
    console.log('🔧 Configurando índices de MongoDB...');

    // Índices para colección Usuario
    const Usuario = mongoose.model('Usuario');
    await Usuario.collection.createIndexes([
      { key: { rol: 1 } },
      { key: { estado: 1 } },
      { key: { activo: 1 } },
      { key: { nombre: 'text', apellido: 'text' } }, // Búsqueda de texto
      { key: { cedula: 1 }, unique: true } // Índice único para cédula
    ]);

    // Índices para colección Paciente
    const Paciente = mongoose.model('Paciente');
    await Paciente.collection.createIndexes([
      { key: { usuario: 1 }, unique: true },
      { key: { doctorAsignado: 1 } },
      { key: { fechaNacimiento: 1 } },
      { key: { genero: 1 } },
      { key: { 'direccion.ciudad': 1 } },
      { key: { 'direccion.provincia': 1 } }
    ]);

    // Índices para colección Doctor
    const Doctor = mongoose.model('Doctor');
    await Doctor.collection.createIndexes([
      { key: { usuario: 1 }, unique: true },
      { key: { especialidad: 1 } },
      { key: { activo: 1 } },
      { key: { 'horarioAtencion.dia': 1 } },
      { key: { especialidad: 1, activo: 1 } } // Índice compuesto
    ]);

    // Índices para colección Cita (CRÍTICOS para rendimiento)
    const Cita = mongoose.model('Cita');
    await Cita.collection.createIndexes([
      // Índices básicos
      { key: { paciente: 1 } },
      { key: { doctor: 1 } },
      { key: { fecha: 1 } },
      { key: { estado: 1 } },
      
      // Índices compuestos para consultas frecuentes
      { key: { paciente: 1, fecha: 1, horaInicio: 1 } },
      { key: { doctor: 1, fecha: 1, horaInicio: 1 } },
      { key: { fecha: 1, estado: 1 } },
      { key: { doctor: 1, estado: 1 } },
      { key: { paciente: 1, estado: 1 } },
      
      // Índice único para evitar duplicados de citas
      { 
        key: { paciente: 1, fecha: 1, horaInicio: 1, estado: 1 }, 
        unique: true,
        partialFilterExpression: { estado: { $in: ['pendiente', 'confirmada'] } }
      },
      
      // Índices para rangos de fechas
      { key: { fecha: 1, horaInicio: 1 } },
      { key: { doctor: 1, fecha: 1, estado: 1, horaInicio: 1 } },
      
      // Índices para consultas de disponibilidad
      { 
        key: { doctor: 1, fecha: 1, estado: 1, horaInicio: 1, horaFin: 1 },
        partialFilterExpression: { estado: { $in: ['pendiente', 'confirmada'] } }
      }
    ]);

    // Índices para búsquedas de texto si es necesario
    await Cita.collection.createIndex({ 
      motivo: 'text', 
      notas: 'text' 
    });

    console.log('✅ Índices configurados exitosamente');
    
    // Mostrar estadísticas de índices
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).listIndexes().toArray();
      console.log(`📊 ${collection.name}: ${indexes.length} índices`);
    }

  } catch (error) {
    console.error('❌ Error configurando índices:', error);
    throw error;
  }
};

/**
 * Verificar y recrear índices si es necesario
 */
const verificarIndices = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Obtener todas las colecciones
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const indexes = await coll.listIndexes().toArray();
      
      // Eliminar índices innecesarios (excepto _id)
      const indexesToDelete = indexes.filter(index => 
        index.name !== '_id_' && 
        !index.name.includes('email_1') && // Mantener índice de email
        !index.name.includes('usuario_1') // Mantener índice de usuario
      );
      
      for (const index of indexesToDelete) {
        await coll.dropIndex(index.name);
        console.log(`🗑️ Índice eliminado: ${index.name} de ${collection.name}`);
      }
    }
    
    // Recrear índices necesarios
    await configurarIndices();
    
  } catch (error) {
    console.error('❌ Error verificando índices:', error);
  }
};

/**
 * Estadísticas de uso de índices para monitoreo
 */
const obtenerEstadisticasIndices = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = ['usuarios', 'pacientes', 'doctors', 'citas'];
    
    const stats = {};
    
    for (const collectionName of collections) {
      try {
        const coll = db.collection(collectionName);
        const indexes = await coll.listIndexes().toArray();
        
        stats[collectionName] = {
          totalIndexes: indexes.length,
          indexes: indexes.map(index => ({
            name: index.name,
            key: index.key,
            unique: !!index.unique
          }))
        };
      } catch (error) {
        console.warn(`⚠️ No se pudo obtener estadísticas de ${collectionName}:`, error.message);
      }
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de índices:', error);
    return {};
  }
};

module.exports = {
  configurarIndices,
  verificarIndices,
  obtenerEstadisticasIndices
};
