const mongoose = require('mongoose');
const Paciente = require('../src/models/Paciente');
const Usuario = require('../src/models/Usuario');
require('dotenv').config();

// Script para restaurar datos corruptos de pacientes
const restaurarDatosPacientes = async () => {
  try {
    console.log('🔧 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los pacientes
    const pacientes = await Paciente.find({});
    console.log(`📊 Encontrados ${pacientes.length} pacientes`);

    let restaurados = 0;
    let errores = 0;

    for (const paciente of pacientes) {
      try {
        console.log(`\n🔄 Procesando paciente: ${paciente._id}`);
        
        let actualizaciones = {};
        let necesitaActualizacion = false;

        // Restaurar dirección si es string plano
        if (typeof paciente.direccion === 'string') {
          console.log(`📍 Dirección corrupta: "${paciente.direccion}"`);
          
          // Intentar reconstruir objeto desde string
          if (paciente.direccion.includes('calle') || paciente.direccion.includes('avenida') || paciente.direccion.includes('av.')) {
            // Si parece una dirección, asignar como calle
            actualizaciones.direccion = {
              calle: paciente.direccion,
              ciudad: 'Quito', // valor por defecto
              provincia: 'Pichincha' // valor por defecto
            };
            console.log(`✅ Dirección restaurada: ${JSON.stringify(actualizaciones.direccion)}`);
            necesitaActualizacion = true;
          } else {
            // Si no parece dirección, dejar como objeto vacío
            actualizaciones.direccion = {
              calle: '',
              ciudad: '',
              provincia: ''
            };
            necesitaActualizacion = true;
          }
        }

        // Restaurar contacto de emergencia si es string plano
        if (typeof paciente.contactoEmergencia === 'string') {
          console.log(`📞 Contacto corrupto: "${paciente.contactoEmergencia}"`);
          
          // Intentar reconstruir objeto desde string
          if (paciente.contactoEmergencia.match(/^\d{10}$/)) {
            // Si es un teléfono, crear objeto con teléfono
            actualizaciones.contactoEmergencia = {
              nombre: '',
              telefono: paciente.contactoEmergencia,
              parentesco: ''
            };
            console.log(`✅ Contacto restaurado: ${JSON.stringify(actualizaciones.contactoEmergencia)}`);
            necesitaActualizacion = true;
          } else {
            // Si es un nombre, crear objeto con nombre
            actualizaciones.contactoEmergencia = {
              nombre: paciente.contactoEmergencia,
              telefono: '',
              parentesco: ''
            };
            necesitaActualizacion = true;
          }
        }

        // Aplicar actualizaciones si es necesario
        if (necesitaActualizacion) {
          await Paciente.findByIdAndUpdate(paciente._id, actualizaciones);
          console.log(`✅ Paciente ${paciente._id} restaurado`);
          restaurados++;
        } else {
          console.log(`ℹ️ Paciente ${paciente._id} no necesita restauración`);
        }

      } catch (error) {
        console.error(`❌ Error restaurando paciente ${paciente._id}:`, error.message);
        errores++;
      }
    }

    console.log(`\n📈 Resumen:`);
    console.log(`✅ Pacientes restaurados: ${restaurados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📊 Total procesados: ${pacientes.length}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

// Ejecutar script
if (require.main === module) {
  restaurarDatosPacientes();
}

module.exports = restaurarDatosPacientes;
