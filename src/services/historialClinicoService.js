const HistorialClinico = require('../models/HistorialClinico');
const Paciente = require('../models/Paciente');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

class HistorialClinicoService {
  
  // 🏥 Crear historial clínico inicial
  static async crearHistorialInicial(pacienteId, datosAdicionales = {}) {
    try {
      // Verificar que el paciente existe
      const paciente = await Paciente.findById(pacienteId);
      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }

      // Verificar que no exista historial previo
      const historialExistente = await HistorialClinico.findOne({ paciente: pacienteId });
      if (historialExistente) {
        throw new Error('El paciente ya tiene un historial clínico');
      }

      // Crear historial con información básica
      const historial = await HistorialClinico.create({
        paciente: pacienteId,
        informacionGeneral: {
          grupoSanguineo: datosAdicionales.grupoSanguineo || null,
          factorRH: datosAdicionales.factorRH || null,
          alergias: datosAdicionales.alergias || [],
          condicionesMedicas: datosAdicionales.condicionesMedicas || [],
          medicamentosActuales: datosAdicionales.medicamentosActuales || [],
          habitos: datosAdicionales.habitos || {}
        },
        metricas: {
          totalConsultas: 0,
          ultimaVisita: null,
          proximaVisita: null,
          costoTotalTratamientos: 0,
          tratamientosCompletados: 0,
          emergenciasAtendidas: 0
        }
      });

      return await this.obtenerHistorialCompleto(pacienteId);
    } catch (error) {
      console.error('Error en crearHistorialInicial:', error);
      throw error;
    }
  }

  // 📋 Agregar nueva consulta al historial
  static async agregarConsulta(pacienteId, datosConsulta, doctorId) {
    try {
      // Validaciones básicas
      if (!datosConsulta.motivoConsulta) {
        throw new Error('El motivo de consulta es obligatorio');
      }

      if (!datosConsulta.diagnostico?.principal?.descripcion) {
        throw new Error('El diagnóstico principal es obligatorio');
      }

      // Estructurar el registro de consulta
      const nuevoRegistro = {
        fecha: datosConsulta.fecha || new Date(),
        doctor: doctorId,
        tipoConsulta: datosConsulta.tipoConsulta || 'consulta',
        motivoConsulta: datosConsulta.motivoConsulta,
        sintomasPrincipales: datosConsulta.sintomasPrincipales || [],
        evaluacionInicial: datosConsulta.evaluacionInicial || {},
        examenFisico: datosConsulta.examenFisico || {},
        diagnostico: datosConsulta.diagnostico,
        planTratamiento: datosConsulta.planTratamiento || {},
        tratamientoRealizado: datosConsulta.tratamientoRealizado || [],
        recetas: datosConsulta.recetas || [],
        indicaciones: datosConsulta.indicaciones || [],
        seguimiento: datosConsulta.seguimiento || {},
        archivos: datosConsulta.archivos || [],
        observaciones: datosConsulta.observaciones || '',
        consentimientos: datosConsulta.consentimientos || []
      };

      // Agregar el registro al historial
      const historial = await HistorialClinico.findOneAndUpdate(
        { paciente: pacienteId },
        { 
          $push: { registros: nuevoRegistro },
          $inc: { 'metricas.totalConsultas': 1 }
        },
        { new: true, upsert: true }
      );

      // Actualizar métricas adicionales
      if (nuevoRegistro.tipoConsulta === 'urgencia') {
        historial.metricas.emergenciasAtendidas += 1;
      }

      if (nuevoRegistro.tratamientoRealizado?.length > 0) {
        historial.metricas.tratamientosCompletados += nuevoRegistro.tratamientoRealizado.length;
        
        // Sumar costos estimados
        const costoTotal = nuevoRegistro.tratamientoRealizado.reduce((total, tratamiento) => {
          return total + (tratamiento.costoEstimado || 0);
        }, 0);
        
        historial.metricas.costoTotalTratamientos += costoTotal;
      }

      historial.metricas.ultimaVisita = nuevoRegistro.fecha;
      
      if (nuevoRegistro.seguimiento?.proximaCita) {
        historial.metricas.proximaVisita = nuevoRegistro.seguimiento.proximaCita;
      }

      await historial.save();
      return await this.obtenerHistorialCompleto(pacienteId);
    } catch (error) {
      console.error('Error en agregarConsulta:', error);
      throw error;
    }
  }

  // 📄 Obtener historial completo con todos los datos
  static async obtenerHistorialCompleto(pacienteId) {
    try {
      const historial = await HistorialClinico.findOne({ paciente: pacienteId })
        .populate('paciente', 'usuario')
        .populate('paciente.usuario', 'nombre apellido email telefono')
        .populate('registros.doctor', 'usuario especialidad')
        .populate('registros.doctor.usuario', 'nombre apellido')
        .sort({ 'registros.fecha': -1 });

      if (!historial) {
        throw new Error('Historial clínico no encontrado');
      }

      return historial;
    } catch (error) {
      console.error('Error en obtenerHistorialCompleto:', error);
      throw error;
    }
  }

  // 🔍 Buscar registros con filtros avanzados
  static async buscarRegistrosAvanzado(pacienteId, filtros = {}) {
    try {
      const historial = await HistorialClinico.findOne({ paciente: pacienteId })
        .populate('registros.doctor', 'usuario especialidad')
        .populate('registros.doctor.usuario', 'nombre apellido');

      if (!historial) {
        throw new Error('Historial clínico no encontrado');
      }

      let registros = historial.registros;

      // Aplicar filtros
      if (filtros.fechaDesde) {
        const desde = new Date(filtros.fechaDesde);
        registros = registros.filter(registro => 
          new Date(registro.fecha) >= desde
        );
      }

      if (filtros.fechaHasta) {
        const hasta = new Date(filtros.fechaHasta);
        registros = registros.filter(registro => 
          new Date(registro.fecha) <= hasta
        );
      }

      if (filtros.doctorId) {
        registros = registros.filter(registro => 
          registro.doctor._id.toString() === filtros.doctorId
        );
      }

      if (filtros.tipoConsulta) {
        registros = registros.filter(registro => 
          registro.tipoConsulta === filtros.tipoConsulta
        );
      }

      if (filtros.diagnostico) {
        const busqueda = filtros.diagnostico.toLowerCase();
        registros = registros.filter(registro => 
          registro.diagnostico.principal.descripcion.toLowerCase().includes(busqueda) ||
          registro.diagnostico.secundarios?.some(sec => 
            sec.descripcion.toLowerCase().includes(busqueda)
          )
        );
      }

      if (filtros.tratamiento) {
        const busqueda = filtros.tratamiento.toLowerCase();
        registros = registros.filter(registro => 
          registro.tratamientoRealizado?.some(tratamiento => 
            tratamiento.procedimiento.toLowerCase().includes(busqueda)
          )
        );
      }

      // Ordenar por fecha descendente
      registros.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      return registros;
    } catch (error) {
      console.error('Error en buscarRegistrosAvanzado:', error);
      throw error;
    }
  }

  // 📊 Generar estadísticas completas del historial
  static async generarEstadisticasCompletas(pacienteId) {
    try {
      const historial = await HistorialClinico.findOne({ paciente: pacienteId })
        .populate('registros.doctor', 'usuario especialidad')
        .populate('registros.doctor.usuario', 'nombre apellido');

      if (!historial) {
        throw new Error('Historial clínico no encontrado');
      }

      const estadisticas = {
        // Métricas básicas
        metricas: historial.metricas,
        
        // Análisis de consultas
        analisisConsultas: this.analizarConsultas(historial.registros),
        
        // Análisis de diagnósticos
        analisisDiagnosticos: this.analizarDiagnosticos(historial.registros),
        
        // Análisis de tratamientos
        analisisTratamientos: this.analizarTratamientos(historial.registros),
        
        // Información médica relevante
        informacionMedica: {
          alergias: historial.informacionGeneral.alergias || [],
          condicionesMedicas: historial.informacionGeneral.condicionesMedicas || [],
          medicamentosActuales: historial.informacionGeneral.medicamentosActuales || []
        },
        
        // Evolución temporal
        evolucionTemporal: this.analizarEvolucionTemporal(historial.registros)
      };

      return estadisticas;
    } catch (error) {
      console.error('Error en generarEstadisticasCompletas:', error);
      throw error;
    }
  }

  // 🔍 Analizar patrones de consultas
  static analizarConsultas(registros) {
    const analisis = {
      total: registros.length,
      porTipo: {},
      porDoctor: {},
      porMes: {},
      promedioDiasEntreConsultas: 0
    };

    registros.forEach((registro, index) => {
      // Por tipo
      analisis.porTipo[registro.tipoConsulta] = 
        (analisis.porTipo[registro.tipoConsulta] || 0) + 1;

      // Por doctor
      const doctorNombre = registro.doctor.usuario.nombreCompleto;
      analisis.porDoctor[doctorNombre] = 
        (analisis.porDoctor[doctorNombre] || 0) + 1;

      // Por mes
      const mes = new Date(registro.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      analisis.porMes[mes] = (analisis.porMes[mes] || 0) + 1;
    });

    // Calcular promedio de días entre consultas
    if (registros.length > 1) {
      const diasEntreConsultas = [];
      for (let i = 1; i < registros.length; i++) {
        const dias = Math.abs(
          new Date(registros[i].fecha) - new Date(registros[i-1].fecha)
        ) / (1000 * 60 * 60 * 24);
        diasEntreConsultas.push(dias);
      }
      analisis.promedioDiasEntreConsultas = 
        diasEntreConsultas.reduce((a, b) => a + b, 0) / diasEntreConsultas.length;
    }

    return analisis;
  }

  // 🏥 Analizar diagnósticos frecuentes
  static analizarDiagnosticos(registros) {
    const analisis = {
      diagnosticosPrincipales: {},
      diagnosticosSecundarios: {},
      totalDiagnosticos: 0
    };

    registros.forEach(registro => {
      // Diagnóstico principal
      const principal = registro.diagnostico.principal.descripcion;
      analisis.diagnosticosPrincipales[principal] = 
        (analisis.diagnosticosPrincipales[principal] || 0) + 1;
      analisis.totalDiagnosticos++;

      // Diagnósticos secundarios
      if (registro.diagnostico.secundarios) {
        registro.diagnostico.secundarios.forEach(secundario => {
          analisis.diagnosticosSecundarios[secundario.descripcion] = 
            (analisis.diagnosticosSecundarios[secundario.descripcion] || 0) + 1;
          analisis.totalDiagnosticos++;
        });
      }
    });

    return analisis;
  }

  // 🔧 Analizar tratamientos realizados
  static analizarTratamientos(registros) {
    const analisis = {
      tratamientosRealizados: {},
      totalTratamientos: 0,
      costoTotal: 0
    };

    registros.forEach(registro => {
      if (registro.tratamientoRealizado) {
        registro.tratamientoRealizado.forEach(tratamiento => {
          analisis.tratamientosRealizados[tratamiento.procedimiento] = 
            (analisis.tratamientosRealizados[tratamiento.procedimiento] || 0) + 1;
          analisis.totalTratamientos++;
          
          if (tratamiento.costoEstimado) {
            analisis.costoTotal += tratamiento.costoEstimado;
          }
        });
      }
    });

    return analisis;
  }

  // 📈 Analizar evolución temporal
  static analizarEvolucionTemporal(registros) {
    const evolucion = {
      primeraConsulta: null,
      ultimaConsulta: null,
      totalDiasTratamiento: 0,
      consultasPorTrimestre: {}
    };

    if (registros.length > 0) {
      evolucion.primeraConsulta = new Date(registros[registros.length - 1].fecha);
      evolucion.ultimaConsulta = new Date(registros[0].fecha);
      evolucion.totalDiasTratamiento = Math.floor(
        (evolucion.ultimaConsulta - evolucion.primeraConsulta) / (1000 * 60 * 60 * 24)
      );
    }

    // Consultas por trimestre
    registros.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const trimestre = `Q${Math.ceil((fecha.getMonth() + 1) / 3)}-${fecha.getFullYear()}`;
      evolucion.consultasPorTrimestre[trimestre] = 
        (evolucion.consultasPorTrimestre[trimestre] || 0) + 1;
    });

    return evolucion;
  }

  // 🔄 Actualizar información general del paciente
  static async actualizarInformacionGeneral(pacienteId, informacionActualizada) {
    try {
      const historial = await HistorialClinico.findOneAndUpdate(
        { paciente: pacienteId },
        { 
          $set: { 
            'informacionGeneral.grupoSanguineo': informacionActualizada.grupoSanguineo,
            'informacionGeneral.factorRH': informacionActualizada.factorRH,
            'informacionGeneral.alergias': informacionActualizada.alergias,
            'informacionGeneral.condicionesMedicas': informacionActualizada.condicionesMedicas,
            'informacionGeneral.medicamentosActuales': informacionActualizada.medicamentosActuales,
            'informacionGeneral.habitos': informacionActualizada.habitos
          }
        },
        { new: true }
      );

      if (!historial) {
        throw new Error('Historial clínico no encontrado');
      }

      return historial;
    } catch (error) {
      console.error('Error en actualizarInformacionGeneral:', error);
      throw error;
    }
  }
}

module.exports = HistorialClinicoService;
