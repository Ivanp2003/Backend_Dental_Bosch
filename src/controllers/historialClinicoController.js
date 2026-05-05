const HistorialClinico = require('../models/HistorialClinico');
const Paciente = require('../models/Paciente');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

// 🏥 CREAR HISTORIAL CLÍNICO (solo una vez por paciente)
const crearHistorialClinico = async (req, res) => {
  try {
    console.log('🏥 Creando historial clínico para paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;
    const { informacionGeneral } = req.body;

    // Validar ID de paciente
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Verificar que el paciente existe
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    // Verificar que no exista historial previo
    const historialExistente = await HistorialClinico.findOne({ paciente: pacienteId });
    if (historialExistente) {
      return res.status(400).json({
        success: false,
        mensaje: 'El paciente ya tiene un historial clínico'
      });
    }

    // Crear historial clínico
    const historialClinico = await HistorialClinico.create({
      paciente: pacienteId,
      informacionGeneral: informacionGeneral || {}
    });

    const historialCompleto = await HistorialClinico.findById(historialClinico._id)
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido email');

    res.status(201).json({
      success: true,
      mensaje: 'Historial clínico creado exitosamente',
      datos: historialCompleto
    });

  } catch (error) {
    console.error('❌ Error en crearHistorialClinico:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📋 AGREGAR REGISTRO AL HISTORIAL (lo más importante)
const agregarRegistroHistorial = async (req, res) => {
  try {
    console.log('📋 Agregando registro al historial del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;
    const registroData = req.body;

    // Validar ID de paciente
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Verificar que el paciente existe
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    // Agregar información del doctor
    registroData.doctor = req.perfil._id; // Doctor autenticado
    registroData.fecha = registroData.fecha || new Date();

    // Usar el método estático para agregar registro
    const historialActualizado = await HistorialClinico.agregarRegistro(pacienteId, registroData);

    const historialCompleto = await HistorialClinico.findById(historialActualizado._id)
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido email')
      .populate('registros.doctor', 'usuario especialidad')
      .populate('registros.doctor.usuario', 'nombre apellido');

    res.status(201).json({
      success: true,
      mensaje: 'Registro agregado exitosamente al historial clínico',
      datos: historialCompleto
    });

  } catch (error) {
    console.error('❌ Error en agregarRegistroHistorial:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📄 OBTENER HISTORIAL COMPLETO DE PACIENTE
const obtenerHistorialCompleto = async (req, res) => {
  try {
    console.log('📄 Obteniendo historial completo del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;

    // Validar ID de paciente
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Obtener historial completo
    const historial = await HistorialClinico.buscarPorPaciente(pacienteId);

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Historial clínico obtenido exitosamente',
      datos: historial
    });

  } catch (error) {
    console.error('❌ Error en obtenerHistorialCompleto:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 🔍 OBTENER REGISTROS ESPECÍFICOS (con filtros)
const obtenerRegistrosFiltrados = async (req, res) => {
  try {
    console.log('🔍 Obteniendo registros filtrados del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;
    const { 
      fechaDesde, 
      fechaHasta, 
      doctor, 
      tipoConsulta, 
      diagnostico,
      page = 1, 
      limit = 10 
    } = req.query;

    // Validar ID de paciente
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Obtener historial
    const historial = await HistorialClinico.findOne({ paciente: pacienteId })
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido email')
      .populate('registros.doctor', 'usuario especialidad')
      .populate('registros.doctor.usuario', 'nombre apellido');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    // Filtrar registros
    let registrosFiltrados = historial.registros;

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      registrosFiltrados = registrosFiltrados.filter(registro => 
        new Date(registro.fecha) >= desde
      );
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      registrosFiltrados = registrosFiltrados.filter(registro => 
        new Date(registro.fecha) <= hasta
      );
    }

    if (doctor) {
      registrosFiltrados = registrosFiltrados.filter(registro => 
        registro.doctor._id.toString() === doctor
      );
    }

    if (tipoConsulta) {
      registrosFiltrados = registrosFiltrados.filter(registro => 
        registro.tipoConsulta === tipoConsulta
      );
    }

    if (diagnostico) {
      registrosFiltrados = registrosFiltrados.filter(registro => 
        registro.diagnostico.principal.descripcion.toLowerCase().includes(diagnostico.toLowerCase())
      );
    }

    // Ordenar por fecha descendente
    registrosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = registrosFiltrados.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      mensaje: 'Registros filtrados obtenidos exitosamente',
      datos: {
        registros: paginatedResults,
        total: registrosFiltrados.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(registrosFiltrados.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerRegistrosFiltrados:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ✏️ ACTUALIZAR REGISTRO ESPECÍFICO
const actualizarRegistro = async (req, res) => {
  try {
    console.log('✏️ Actualizando registro:', req.params.registroId);
    
    const { pacienteId, registroId } = req.params;
    const datosActualizacion = req.body;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(pacienteId) || !mongoose.Types.ObjectId.isValid(registroId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'IDs inválidos'
      });
    }

    // Buscar y actualizar el registro específico
    const historial = await HistorialClinico.findOneAndUpdate(
      { 
        paciente: pacienteId,
        'registros._id': registroId
      },
      { 
        $set: { 
          'registros.$': { ...datosActualizacion, _id: registroId }
        }
      },
      { new: true }
    )
    .populate('paciente', 'usuario')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('registros.doctor', 'usuario especialidad')
    .populate('registros.doctor.usuario', 'nombre apellido');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Registro no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Registro actualizado exitosamente',
      datos: historial
    });

  } catch (error) {
    console.error('❌ Error en actualizarRegistro:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 🗑️ ELIMINAR REGISTRO ESPECÍFICO
const eliminarRegistro = async (req, res) => {
  try {
    console.log('🗑️ Eliminando registro:', req.params.registroId);
    
    const { pacienteId, registroId } = req.params;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(pacienteId) || !mongoose.Types.ObjectId.isValid(registroId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'IDs inválidos'
      });
    }

    const historial = await HistorialClinico.findOneAndUpdate(
      { paciente: pacienteId },
      { 
        $pull: { registros: { _id: registroId } },
        $inc: { 'metricas.totalConsultas': -1 }
      },
      { new: true }
    );

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Registro eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en eliminarRegistro:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📊 OBTENER ESTADÍSTICAS DEL HISTORIAL
const obtenerEstadisticasHistorial = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del historial del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    const historial = await HistorialClinico.findOne({ paciente: pacienteId })
      .populate('registros.doctor', 'usuario especialidad')
      .populate('registros.doctor.usuario', 'nombre apellido');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    // Calcular estadísticas
    const estadisticas = {
      totalConsultas: historial.registros.length,
      consultasPorTipo: {},
      consultasPorDoctor: {},
      diagnosticosFrecuentes: {},
      tratamientosRealizados: [],
      evolucionMensual: {},
      alergias: historial.informacionGeneral.alergias || [],
      condicionesMedicas: historial.informacionGeneral.condicionesMedicas || [],
      metricas: historial.metricas
    };

    // Procesar registros para estadísticas
    historial.registros.forEach(registro => {
      // Consultas por tipo
      estadisticas.consultasPorTipo[registro.tipoConsulta] = 
        (estadisticas.consultasPorTipo[registro.tipoConsulta] || 0) + 1;

      // Consultas por doctor
      const doctorNombre = registro.doctor.usuario.nombreCompleto;
      estadisticas.consultasPorDoctor[doctorNombre] = 
        (estadisticas.consultasPorDoctor[doctorNombre] || 0) + 1;

      // Diagnósticos frecuentes
      const diagnostico = registro.diagnostico.principal.descripcion;
      estadisticas.diagnosticosFrecuentes[diagnostico] = 
        (estadisticas.diagnosticosFrecuentes[diagnostico] || 0) + 1;

      // Tratamientos realizados
      if (registro.tratamientoRealizado) {
        registro.tratamientoRealizado.forEach(tratamiento => {
          estadisticas.tratamientosRealizados.push({
            procedimiento: tratamiento.procedimiento,
            fecha: registro.fecha,
            doctor: doctorNombre
          });
        });
      }

      // Evolución mensual
      const mes = new Date(registro.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      estadisticas.evolucionMensual[mes] = 
        (estadisticas.evolucionMensual[mes] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      mensaje: 'Estadísticas obtenidas exitosamente',
      datos: estadisticas
    });

  } catch (error) {
    console.error('❌ Error en obtenerEstadisticasHistorial:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

module.exports = {
  crearHistorialClinico,
  agregarRegistroHistorial,
  obtenerHistorialCompleto,
  obtenerRegistrosFiltrados,
  actualizarRegistro,
  eliminarRegistro,
  obtenerEstadisticasHistorial
};
