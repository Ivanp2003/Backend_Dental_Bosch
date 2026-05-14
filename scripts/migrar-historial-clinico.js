/**
 * Script de Migración - Historial Clínico v1 a v2
 * 
 * Este script migra los datos del historial clínico de la estructura antigua
 * a la nueva estructura que cumple con los requerimientos de los skills.
 * 
 * USO: node scripts/migrar-historial-clinico.js
 * 
 * ADVERTENCIA: Este script es solo para migración de datos existentes.
 * Si no hay datos previos, no es necesario ejecutarlo.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HistorialClinico = require('../src/models/HistorialClinico');

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_bosch', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error de conexión:', err);
  process.exit(1);
});

// Función principal de migración
async function migrarHistoriales() {
  try {
    console.log('🔄 Iniciando migración de historiales clínicos...');
    
    // Contadores
    let totalMigrados = 0;
    let errores = 0;
    let saltados = 0;
    
    // Obtener todos los historiales antiguos (que tienen estructura de "registros")
    const historialesAntiguos = await HistorialClinico.find({
      'registros.0': { $exists: true } // Tiene al menos un registro
    });
    
    console.log(`📊 Historiales antiguos encontrados: ${historialesAntiguos.length}`);
    
    for (const historial of historialesAntiguos) {
      try {
        // Verificar si ya fue migrado
        if (historial.consultas && historial.consultas.length > 0) {
          console.log(`⏭️  Saltando historial ${historial._id} (ya migrado)`);
          saltados++;
          continue;
        }
        
        // Transformar registros a consultas
        const consultasTransformadas = historial.registros.map(registro => {
          // Transformar estructura antigua a nueva
          return {
            // Metadata
            cita: null, // No hay relación con citas en datos antiguos
            fecha: registro.fecha || new Date(),
            doctor: registro.doctor,
            
            // 1. Motivo de consulta
            motivoConsulta: registro.motivoConsulta || 'Consulta general',
            
            // 2. Enfermedad actual (mapear desde sintomasPrincipales)
            enfermedadActual: {
              descripcion: registro.sintomasPrincipales?.map(s => s.descripcion).join('; ') || '',
              tiempoEvolucion: registro.sintomasPrincipales?.[0]?.duracion || '',
              sintomas: registro.sintomasPrincipales?.map(s => s.descripcion) || [],
              intensidadDolor: registro.sintomasPrincipales?.[0]?.intensidad || 0,
              observaciones: registro.evaluacionInicial?.observaciones || ''
            },
            
            // 3. Antecedentes (no existían en estructura antigua, usar defaults)
            antecedentes: {
              alergias: {
                antibioticos: false,
                anestesia: false
              },
              enfermedades: {
                hemorragias: false,
                vih: false,
                tuberculosis: false,
                asma: false,
                diabetes: false,
                hipertension: false,
                cardiacas: false
              },
              otros: false,
              observaciones: ''
            },
            
            // 4. Signos vitales
            signosVitales: {
              presionArterial: registro.examenFisico?.signosVitales?.presionArterial 
                ? `${registro.examenFisico.signosVitales.presionArterial.sistolica}/${registro.examenFisico.signosVitales.presionArterial.diastolica}`
                : null,
              frecuenciaCardiaca: registro.examenFisico?.signosVitales?.frecuenciaCardiaca || null,
              temperatura: registro.examenFisico?.signosVitales?.temperatura || null,
              frecuenciaRespiratoria: registro.examenFisico?.signosVitales?.frecuenciaRespiratoria || null
            },
            
            // 5. Examen estomatognático (mapear desde examenCavidadOral)
            examenEstomatognatico: {
              labios: { 
                estado: 'normal', 
                observacion: registro.examenFisico?.examenCavidadOral?.labios || '' 
              },
              mejillas: { estado: 'normal', observacion: '' },
              maxilarSuperior: { estado: 'normal', observacion: '' },
              maxilarInferior: { estado: 'normal', observacion: '' },
              lengua: { 
                estado: 'normal', 
                observacion: registro.examenFisico?.examenCavidadOral?.lengua || '' 
              },
              paladar: { 
                estado: 'normal', 
                observacion: registro.examenFisico?.examenCavidadOral?.paladar || '' 
              },
              pisoBoca: { 
                estado: 'normal', 
                observacion: registro.examenFisico?.examenCavidadOral?.pisoBoca || '' 
              },
              carrillos: { estado: 'normal', observacion: '' },
              glandulasSalivales: { estado: 'normal', observacion: '' },
              oroFaringe: { estado: 'normal', observacion: '' },
              atm: { estado: 'normal', observacion: '' },
              ganglios: { estado: 'normal', observacion: '' },
              observaciones: registro.examenFisico?.examenCavidadOral?.observaciones || ''
            },
            
            // 6. Odontograma (pendiente)
            odontograma: {
              pendiente: true,
              data: null
            },
            
            // 7. Indicadores salud bucal (no existían, usar defaults)
            indicadoresSaludBucal: {
              higieneOral: { placa: null, calculo: null, gingivitis: null },
              enfermedadPeriodontal: null,
              maloclusion: null,
              fluorosis: null,
              indiceCPO: { C: 0, P: 0, O: 0, total: 0 }
            },
            
            // 8. Plan diagnóstico (no existía, usar defaults)
            planDiagnostico: {
              biometria: { solicitado: false, realizado: false, pendiente: false },
              quimicaSanguinea: { solicitado: false, realizado: false, pendiente: false },
              rayosX: { solicitado: false, realizado: false, pendiente: false },
              otros: '',
              observaciones: ''
            },
            
            // 9. Diagnósticos (mapear desde estructura antigua)
            diagnosticos: [
              {
                descripcion: registro.diagnostico?.principal?.descripcion || 'Diagnóstico no especificado',
                cie10: registro.diagnostico?.principal?.codigoCIE || null,
                tipo: 'definitivo' // Asumir como definitivo
              },
              ...(registro.diagnostico?.secundarios?.map(sec => ({
                descripcion: sec.descripcion || 'Diagnóstico secundario',
                cie10: sec.codigoCIE || null,
                tipo: 'presuntivo'
              })) || [])
            ],
            
            // 10. Tratamientos (mapear desde tratamientoRealizado)
            tratamientos: registro.tratamientoRealizado?.map((trat, index) => ({
              sesion: index + 1,
              fecha: registro.fecha || new Date(),
              diagnosticosComplicaciones: trat.complicaciones || '',
              procedimientos: [trat.procedimiento],
              prescripciones: [],
              codigo: '',
              firmaDoctor: {
                doctorId: registro.doctor,
                nombreDoctor: '', // No disponible en datos antiguos
                fecha: registro.fecha || new Date()
              }
            })) || [],
            
            // Recetas (mapear desde estructura antigua)
            recetas: registro.recetas?.map(receta => ({
              medicamento: receta.medicamento,
              dosis: receta.dosis,
              frecuencia: receta.frecuencia,
              duracion: receta.duracion,
              viaAdministracion: receta.viaAdministracion,
              instrucciones: receta.instrucciones,
              cantidad: receta.cantidad,
              observaciones: receta.observaciones
            })) || [],
            
            // Indicaciones
            indicaciones: registro.indicaciones?.map(ind => ({
              tipo: ind.tipo,
              descripcion: ind.descripcion
            })) || [],
            
            // Seguimiento
            seguimiento: {
              proximaCita: registro.seguimiento?.proximaCita || null,
              motivoSeguimiento: registro.seguimiento?.motivoSeguimiento || '',
              controles: registro.seguimiento?.controles || []
            },
            
            // Archivos
            archivos: registro.archivos?.map(archivo => ({
              tipo: archivo.tipo,
              nombre: archivo.nombre,
              url: archivo.url,
              descripcion: archivo.descripcion,
              fechaSubida: archivo.fechaSubida
            })) || [],
            
            // Observaciones
            observaciones: registro.observaciones || '',
            
            // Consentimientos
            consentimientos: registro.consentimientos?.map(cons => ({
              tipo: cons.tipo,
              firmado: cons.firmado,
              fechaFirma: cons.fechaFirma,
              testigo: cons.testigo,
              observaciones: cons.observaciones
            })) || []
          };
        });
        
        // Actualizar el historial con la nueva estructura
        historial.consultas = consultasTransformadas;
        
        // Eliminar el campo antiguo "registros"
        historial.registros = undefined;
        
        // Guardar cambios
        await historial.save();
        
        totalMigrados++;
        console.log(`✅ Historial ${historial._id} migrado exitosamente`);
        
      } catch (error) {
        errores++;
        console.error(`❌ Error migrando historial ${historial._id}:`, error.message);
      }
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`   Total migrados: ${totalMigrados}`);
    console.log(`   Errores: ${errores}`);
    console.log(`   Saltados: ${saltados}`);
    
    if (errores === 0 && totalMigrados > 0) {
      console.log('\n🎉 Migración completada exitosamente!');
    } else if (totalMigrados === 0) {
      console.log('\n⚠️  No se encontraron historiales para migrar.');
    } else {
      console.log('\n⚠️  Migración completada con errores. Revisa los logs.');
    }
    
  } catch (error) {
    console.error('❌ Error fatal en migración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('👋 Conexión cerrada');
    process.exit(errores > 0 ? 1 : 0);
  }
}

// Ejecutar migración
migrarHistoriales();