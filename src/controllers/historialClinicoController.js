const HistorialClinico = require('../models/HistorialClinico');
const Paciente = require('../models/Paciente');
const Doctor = require('../models/Doctor');
const Cita = require('../models/Cita');
const {
  obtenerProximoNumeroHistoriaClinica,
  calcularGrupoEtario,
  calcularEdad,
  calcularTotalCPO
} = require('../helpers/historialClinicoHelper');
const mongoose = require('mongoose');

// ==============================
// 🏥 CREAR HISTORIAL CLÍNICO
// ==============================
// POST /api/historial-clinico/:pacienteId
// Roles: admin, doctor
const crearHistorialClinico = async (req, res) => {
  try {
    console.log('🏥 Creando historial clínico para paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;
    const { datosAdicionales } = req.body;

    // Validar ID de paciente
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Verificar que el paciente existe
    const paciente = await Paciente.findById(pacienteId).populate('usuario');
    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    // Verificar que no exista historial previo (activo)
    const historialExistente = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true 
    });
    
    if (historialExistente) {
      return res.status(400).json({
        success: false,
        mensaje: 'El paciente ya tiene un historial clínico activo',
        numeroHistoriaClinica: historialExistente.numeroHistoriaClinica
      });
    }

    // Generar número único de historia clínica
    const numeroHistoriaClinica = await obtenerProximoNumeroHistoriaClinica(HistorialClinico);

    // Calcular grupo etario y edad automáticamente (Skill 2)
    const grupoEtario = calcularGrupoEtario(paciente.fechaNacimiento);
    const edad = calcularEdad(paciente.fechaNacimiento);

    // Crear historial clínico
    const historialClinico = await HistorialClinico.create({
      paciente: pacienteId,
      numeroHistoriaClinica,
      createdBy: req.perfil._id, // Usuario autenticado
      updatedBy: req.perfil._id,
      // Los campos de auditoría (createdAt, updatedAt) se generan automáticamente
    });

    const historialCompleto = await HistorialClinico.findById(historialClinico._id)
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido email')
      .populate('createdBy', 'nombre apellido')
      .populate('updatedBy', 'nombre apellido');

    res.status(201).json({
      success: true,
      mensaje: 'Historial clínico creado exitosamente',
      datos: {
        ...historialCompleto.toObject(),
        informacionComplementaria: {
          grupoEtario,
          edad,
          nombreCompleto: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en crearHistorialClinico:', error);
    
    // Manejar error de duplicado de número de historia clínica
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        mensaje: 'Ya existe un historial con este número. Intente nuevamente.'
      });
    }
    
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// 📋 AGREGAR CONSULTA AL HISTORIAL
// ==============================
// POST /api/historial-clinico/:pacienteId/consulta
// Roles: admin, doctor
const agregarConsulta = async (req, res) => {
  try {
    console.log('📋 Agregando consulta al historial del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;
    const consultaData = req.body;

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

    // Verificar que exista historial clínico
    const historial = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true 
    });
    
    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'El paciente no tiene un historial clínico activo. Debe crearlo primero.'
      });
    }

    // ==============================
    // INTEGRACIÓN CON CITAS (Skill 3)
    // ==============================
    // Si hay cita asociada, heredar motivo y establecer relación
    if (consultaData.citaId) {
      const cita = await Cita.findById(consultaData.citaId);
      if (cita) {
        // Heredar motivo de la cita (NO permitir edición si existe cita)
        consultaData.motivoConsulta = cita.motivo;
        consultaData.cita = cita._id;
      }
    }

    // ==============================
    // CAMPOS AUTOMÁTICOS (Skill 1)
    // ==============================
    consultaData.doctor = req.perfil._id; // Doctor autenticado
    consultaData.fecha = consultaData.fecha || new Date();

    // ==============================
    // VALIDACIONES ESPECÍFICAS
    // ==============================
    
    // Validar CIE-10 si existe
    if (consultaData.diagnosticos && consultaData.diagnosticos.length > 0) {
      for (const diagnostico of consultaData.diagnosticos) {
        if (diagnostico.cie10 && !validarCIE10(diagnostico.cie10)) {
          return res.status(400).json({
            success: false,
            mensaje: `Formato CIE-10 inválido para: ${diagnostico.cie10}`
          });
        }
      }
    }

    // Calcular total CPO si existe índice
    if (consultaData.indicadoresSaludBucal?.indiceCPO) {
      consultaData.indicadoresSaludBucal.indiceCPO = 
        calcularTotalCPO(consultaData.indicadoresSaludBucal.indiceCPO);
    }

    // Usar el método estático para agregar consulta
    const historialActualizado = await HistorialClinico.agregarConsulta(
      pacienteId, 
      consultaData, 
      req.perfil._id
    );

    const historialCompleto = await HistorialClinico.findById(historialActualizado._id)
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido email')
      .populate('consultas.doctor', 'usuario especialidad')
      .populate('consultas.doctor.usuario', 'nombre apellido')
      .populate('consultas.cita', 'motivo fecha estado');

    res.status(201).json({
      success: true,
      mensaje: 'Consulta agregada exitosamente al historial clínico',
      datos: historialCompleto
    });

  } catch (error) {
    console.error('❌ Error en agregarConsulta:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// 📄 OBTENER HISTORIAL COMPLETO
// ==============================
// GET /api/historial-clinico/:pacienteId
// Roles: admin, doctor, paciente (solo su propio historial)
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

    // Calcular información complementaria
    const paciente = await Paciente.findById(pacienteId).populate('usuario');
    const grupoEtario = calcularGrupoEtario(paciente?.fechaNacimiento);
    const edad = calcularEdad(paciente?.fechaNacimiento);

    res.status(200).json({
      success: true,
      mensaje: 'Historial clínico obtenido exitosamente',
      datos: {
        ...historial.toObject(),
        informacionComplementaria: {
          grupoEtario,
          edad,
          nombreCompleto: paciente ? `${paciente.usuario.nombre} ${paciente.usuario.apellido}` : null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerHistorialCompleto:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// 🔍 OBTENER CONSULTAS FILTRADAS
// ==============================
// GET /api/historial-clinico/:pacienteId/consultas?fechaDesde=2024-01-01&fechaHasta=2024-12-31&doctor=doctorId&tipoConsulta=consulta&page=1&limit=10
// Roles: admin, doctor, paciente (solo su propio historial)
const obtenerConsultasFiltradas = async (req, res) => {
  try {
    console.log('🔍 Obteniendo consultas filtradas del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;
    const { 
      fechaDesde, 
      fechaHasta, 
      doctor, 
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
    const historial = await HistorialClinico.findOne({ paciente: pacienteId, activo: true })
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido email')
      .populate('consultas.doctor', 'usuario especialidad')
      .populate('consultas.doctor.usuario', 'nombre apellido')
      .populate('consultas.cita', 'motivo fecha estado');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    // Filtrar consultas
    let consultasFiltradas = historial.consultas;

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      consultasFiltradas = consultasFiltradas.filter(consulta => 
        new Date(consulta.fecha) >= desde
      );
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      consultasFiltradas = consultasFiltradas.filter(consulta => 
        new Date(consulta.fecha) <= hasta
      );
    }

    if (doctor) {
      consultasFiltradas = consultasFiltradas.filter(consulta => 
        consulta.doctor._id.toString() === doctor
      );
    }

    if (diagnostico) {
      consultasFiltradas = consultasFiltradas.filter(consulta => 
        consulta.diagnosticos?.some(d => 
          d.descripcion.toLowerCase().includes(diagnostico.toLowerCase())
        )
      );
    }

    // Ordenar por fecha descendente
    consultasFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const consultasPaginadas = consultasFiltradas.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      mensaje: 'Consultas filtradas obtenidas exitosamente',
      datos: {
        consultas: consultasPaginadas,
        total: consultasFiltradas.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(consultasFiltradas.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerConsultasFiltradas:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// ✏️ ACTUALIZAR CONSULTA ESPECÍFICA
// ==============================
// PUT /api/historial-clinico/:pacienteId/consulta/:consultaId
// Roles: admin, doctor
const actualizarConsulta = async (req, res) => {
  try {
    console.log('✏️ Actualizando consulta:', req.params.consultaId);
    
    const { pacienteId, consultaId } = req.params;
    const datosActualizacion = req.body;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(pacienteId) || !mongoose.Types.ObjectId.isValid(consultaId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'IDs inválidos'
      });
    }

    // Verificar que el historial existe
    const historial = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    // Actualizar el updatedBy
    datosActualizacion.updatedBy = req.perfil._id;

    // Buscar y actualizar la consulta específica
    const historialActualizado = await HistorialClinico.findOneAndUpdate(
      { 
        paciente: pacienteId,
        'consultas._id': consultaId,
        activo: true
      },
      { 
        $set: { 
          [`consultas.$`]: { ...datosActualizacion, _id: consultaId },
          updatedBy: req.perfil._id
        }
      },
      { new: true }
    )
    .populate('paciente', 'usuario')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('consultas.doctor', 'usuario especialidad')
    .populate('consultas.doctor.usuario', 'nombre apellido');

    res.status(200).json({
      success: true,
      mensaje: 'Consulta actualizada exitosamente',
      datos: historialActualizado
    });

  } catch (error) {
    console.error('❌ Error en actualizarConsulta:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// 🗑️ ELIMINAR CONSULTA (SOFT DELETE)
// ==============================
// DELETE /api/historial-clinico/:pacienteId/consulta/:consultaId
// Roles: admin, doctor
// NOTA: Según Skill 1, NO se permite eliminación física
const eliminarConsulta = async (req, res) => {
  try {
    console.log('🗑️ Eliminando consulta (soft delete):', req.params.consultaId);
    
    const { pacienteId, consultaId } = req.params;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(pacienteId) || !mongoose.Types.ObjectId.isValid(consultaId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'IDs inválidos'
      });
    }

    // Verificar que el historial existe
    const historial = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    // Eliminar la consulta del array (soft delete a nivel de consulta)
    const historialActualizado = await HistorialClinico.findOneAndUpdate(
      { paciente: pacienteId, activo: true },
      { 
        $pull: { consultas: { _id: consultaId } },
        $set: { updatedBy: req.perfil._id },
        $inc: { 'metricas.totalConsultas': -1 }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      mensaje: 'Consulta eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en eliminarConsulta:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// 🗑️ ELIMINAR HISTORIAL (SOFT DELETE)
// ==============================
// DELETE /api/historial-clinico/:pacienteId
// Roles: admin
// NOTA: Según Skill 1, NO se permite eliminación física
const eliminarHistorial = async (req, res) => {
  try {
    console.log('🗑️ Eliminando historial (soft delete):', req.params.pacienteId);
    
    const { pacienteId } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    const historial = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true 
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    // Usar el método de soft delete
    await historial.eliminar(req.perfil._id);

    res.status(200).json({
      success: true,
      mensaje: 'Historial clínico eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en eliminarHistorial:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ==============================
// 📊 OBTENER ESTADÍSTICAS DEL HISTORIAL
// ==============================
// GET /api/historial-clinico/:pacienteId/estadisticas
// Roles: admin, doctor, paciente (solo sus propias estadísticas)
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

    const historial = await HistorialClinico.findOne({ paciente: pacienteId, activo: true })
      .populate('consultas.doctor', 'usuario especialidad')
      .populate('consultas.doctor.usuario', 'nombre apellido');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    // Calcular estadísticas
    const estadisticas = {
      totalConsultas: historial.consultas.length,
      consultasPorDoctor: {},
      diagnosticosFrecuentes: {},
      tratamientosRealizados: [],
      evolucionMensual: {},
      metricas: historial.metricas
    };

    // Procesar consultas para estadísticas
    historial.consultas.forEach(consulta => {
      // Consultas por doctor
      if (consulta.doctor?.usuario?.nombreCompleto) {
        const doctorNombre = consulta.doctor.usuario.nombreCompleto;
        estadisticas.consultasPorDoctor[doctorNombre] = 
          (estadisticas.consultasPorDoctor[doctorNombre] || 0) + 1;
      }

      // Diagnósticos frecuentes
      if (consulta.diagnosticos && consulta.diagnosticos.length > 0) {
        consulta.diagnosticos.forEach(diagnostico => {
          const descripcion = diagnostico.descripcion;
          estadisticas.diagnosticosFrecuentes[descripcion] = 
            (estadisticas.diagnosticosFrecuentes[descripcion] || 0) + 1;
        });
      }

      // Tratamientos realizados
      if (consulta.tratamientos && consulta.tratamientos.length > 0) {
        consulta.tratamientos.forEach(tratamiento => {
          estadisticas.tratamientosRealizados.push({
            sesion: tratamiento.sesion,
            fecha: tratamiento.fecha,
            procedimientos: tratamiento.procedimientos,
            doctor: consulta.doctor?.usuario?.nombreCompleto
          });
        });
      }

      // Evolución mensual
      const mes = new Date(consulta.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
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

// ==============================
// FUNCIONES AUXILIARES
// ==============================

function validarCIE10(codigo) {
  if (!codigo) return false;
  const regex = /^[A-Z]\d{2}(\.\d{1,4})?$/;
  return regex.test(codigo.toUpperCase());
}

module.exports = {
  crearHistorialClinico,
  agregarConsulta,
  obtenerHistorialCompleto,
  obtenerConsultasFiltradas,
  actualizarConsulta,
  eliminarConsulta,
  eliminarHistorial,
  obtenerEstadisticasHistorial
};