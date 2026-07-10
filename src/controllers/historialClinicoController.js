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
    const { datosAdicionales = {} } = req.body || {};

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
    // NORMALIZACIÓN DE CAMPOS (compatibilidad con formato simple)
    // ==============================
    // Si se envía diagnostico como string, convertir a array de objetos
    if (consultaData.diagnostico && !consultaData.diagnosticos) {
      consultaData.diagnosticos = [{
        descripcion: consultaData.diagnostico,
        tipo: 'presuntivo'
      }];
      delete consultaData.diagnostico;
    }

    // Si se envía tratamiento como string, convertir a array de objetos
    if (consultaData.tratamiento && !consultaData.tratamientos) {
      consultaData.tratamientos = [{
        sesion: 1,
        procedimientos: [consultaData.tratamiento],
        fecha: new Date()
      }];
      delete consultaData.tratamiento;
    }

    // ==============================
    // FIRMA AUTOMÁTICA DEL DOCTOR EN TRATAMIENTOS
    // ==============================
    // Obtener doctor con usuario para obtener nombre completo
    const doctor = await Doctor.findById(req.perfil._id).populate('usuario');
    if (doctor && consultaData.tratamientos && Array.isArray(consultaData.tratamientos)) {
      const nombreCompletoDoctor = `${doctor.usuario.nombre} ${doctor.usuario.apellido}`;
      
      consultaData.tratamientos.forEach(tratamiento => {
        if (!tratamiento.firmaDoctor) {
          tratamiento.firmaDoctor = {
            doctorId: doctor._id,
            nombreDoctor: nombreCompletoDoctor,
            fecha: new Date()
          };
        }
      });
    }

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

    const consultaExistente = historial.consultas.id(consultaId);

    if (!consultaExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    const ZONA_HORARIA_ECUADOR = -5;
    function getAhoraEnEcuador() {
      const ahora = new Date();
      const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
      return new Date(utc + (ZONA_HORARIA_ECUADOR * 3600000));
    }

    const ahoraEcuador = getAhoraEnEcuador();

    if (consultaExistente.cita) {
      const Cita = require('../models/Cita');
      const citaAsociada = await Cita.findById(consultaExistente.cita)
        .select('fecha horaFin');

      if (citaAsociada) {
        const [hora, minuto] = citaAsociada.horaFin.split(':');
        const fechaFinCita = new Date(citaAsociada.fecha);
        fechaFinCita.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        const utc = fechaFinCita.getTime() + fechaFinCita.getTimezoneOffset() * 60000;
        const fechaFinEcuador = new Date(utc + (ZONA_HORARIA_ECUADOR * 3600000));

        // Agregar una ventana de gracia de 72 horas después de que finalice la cita para facilitar pruebas
        const ventanaGraciaCita = new Date(fechaFinEcuador.getTime() + 72 * 60 * 60 * 1000);

        if (ahoraEcuador > ventanaGraciaCita) {
          return res.status(403).json({
            success: false,
            mensaje: 'Esta consulta ya no puede modificarse. Han pasado más de 72 horas desde que finalizó la cita.',
            detalle: `La cita asociada finalizó el ${fechaFinEcuador.toLocaleString('es-EC')}.`
          });
        }
      }
    }

    if (!consultaExistente.cita) {
      const fechaConsulta = new Date(consultaExistente.fecha);
      const ventanaGracia = new Date(fechaConsulta.getTime() + 72 * 60 * 60 * 1000);

      if (ahoraEcuador > ventanaGracia) {
        return res.status(403).json({
          success: false,
          mensaje: 'Esta consulta ya no puede modificarse. Han pasado más de 72 horas desde su creación.'
        });
      }
    }

    const CAMPOS_INMUTABLES_TRATAMIENTO = [
      'sesion',
      'fecha',
      'diagnosticosComplicaciones',
      'procedimientos',
      'prescripciones',
      'codigo',
      'firmaDoctor'
    ];

    if (datosActualizacion.tratamientos && Array.isArray(datosActualizacion.tratamientos)) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const utcHoy = hoy.getTime() + hoy.getTimezoneOffset() * 60000;
      const hoyEcuador = new Date(utcHoy + (ZONA_HORARIA_ECUADOR * 3600000));

      for (const tratamientoNuevo of datosActualizacion.tratamientos) {
        const tratamientoOriginal = consultaExistente.tratamientos?.find(
          t => t.sesion === tratamientoNuevo.sesion
        );

        if (!tratamientoOriginal) continue;

        const fechaTratamiento = new Date(tratamientoOriginal.fecha);
        fechaTratamiento.setHours(0, 0, 0, 0);
        const utcTrat = fechaTratamiento.getTime() + fechaTratamiento.getTimezoneOffset() * 60000;
        const fechaTratEcuador = new Date(utcTrat + (ZONA_HORARIA_ECUADOR * 3600000));

        if (fechaTratEcuador < hoyEcuador) {
          const camposIntentados = Object.keys(tratamientoNuevo).filter(
            campo => CAMPOS_INMUTABLES_TRATAMIENTO.includes(campo)
          );

          if (camposIntentados.length > 0) {
            return res.status(403).json({
              success: false,
              mensaje: `No se pueden modificar los campos de registro del tratamiento pasado la fecha de atención.`,
              camposBloqueados: camposIntentados,
              sesion: tratamientoOriginal.sesion,
              fechaAtencion: tratamientoOriginal.fecha
            });
          }
        }
      }
    }

    // ==============================
    // FIRMA AUTOMÁTICA DEL DOCTOR EN TRATAMIENTOS NUEVOS
    // ==============================
    // Obtener doctor con usuario para obtener nombre completo
    const doctor = await Doctor.findById(req.perfil._id).populate('usuario');
    if (doctor && datosActualizacion.tratamientos && Array.isArray(datosActualizacion.tratamientos)) {
      const nombreCompletoDoctor = `${doctor.usuario.nombre} ${doctor.usuario.apellido}`;
      
      datosActualizacion.tratamientos.forEach(tratamiento => {
        // Solo llenar firmaDoctor si es un tratamiento nuevo (no existe en consultaExistente)
        const tratamientoOriginal = consultaExistente.tratamientos?.find(
          t => t.sesion === tratamiento.sesion
        );
        
        if (!tratamientoOriginal && !tratamiento.firmaDoctor) {
          tratamiento.firmaDoctor = {
            doctorId: doctor._id,
            nombreDoctor: nombreCompletoDoctor,
            fecha: new Date()
          };
        }
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
      { returnDocument: 'after' }
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
// 🔍 OBTENER CONSULTA ESPECÍFICA
// ==============================
// GET /api/historial-clinico/:pacienteId/consulta/:consultaId
// Roles: admin, doctor, paciente (solo su propia consulta)
const obtenerConsultaEspecifica = async (req, res) => {
  try {
    console.log('🔍 Obteniendo consulta específica:', req.params.consultaId);
    
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
    })
    .populate('paciente', 'usuario')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('consultas.doctor', 'usuario especialidad')
    .populate('consultas.doctor.usuario', 'nombre apellido')
    .populate('consultas.cita', 'motivo fecha estado');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    const consultaEspecifica = historial.consultas.id(consultaId);

    if (!consultaEspecifica) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Consulta obtenida exitosamente',
      datos: consultaEspecifica
    });

  } catch (error) {
    console.error('❌ Error en obtenerConsultaEspecifica:', error);
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
      { returnDocument: 'after' }
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

// ==============================
// ODONTOGRAMA - FUNCIONES ESPECÍFICAS
// ==============================

const { generarOdontogramaInicial, validarCodigoFDI, obtenerNombreDiente, validarEstadoClinico, validarCara, validarCompatibilidadEstados, validarEstadoSuperficie } = require('../utils/odontogramaUtils');
const { obtenerMetadataVisual } = require('../utils/odontogramaVisualUtils');

/**
 * Inicializar odontograma en una consulta existente
 * POST /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/inicializar
 * Roles: doctor, admin
 */
const inicializarOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;
    const { tipoDenticion, copiarDesdeConsulta } = req.body;

    // Validar tipo de dentición
    if (!tipoDenticion || !['permanente', 'temporal', 'mixta'].includes(tipoDenticion)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Tipo de dentición inválido. Debe ser: permanente, temporal o mixta'
      });
    }

    // Buscar el historial y la consulta
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

    const consulta = historial.consultas.id(consultaId);

    // Verificar si ya tiene odontograma con dientes
    if (consulta.odontograma && consulta.odontograma.dientes && consulta.odontograma.dientes.length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Esta consulta ya tiene un odontograma inicializado'
      });
    }

    let nuevoOdontograma;
    let mensajeRespuesta = 'Odontograma inicializado correctamente';

    // Si se solicita copiar desde otra consulta, clonar su odontograma
    if (copiarDesdeConsulta) {
      if (!mongoose.Types.ObjectId.isValid(copiarDesdeConsulta)) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID de consulta origen inválido'
        });
      }

      const consultaOrigen = historial.consultas.id(copiarDesdeConsulta);

      if (!consultaOrigen) {
        return res.status(404).json({
          success: false,
          mensaje: 'Consulta origen no encontrada en el historial'
        });
      }

      if (!consultaOrigen.odontograma || !consultaOrigen.odontograma.dientes || consultaOrigen.odontograma.dientes.length === 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'La consulta origen no tiene un odontograma inicializado'
        });
      }

      // Clonar el odontograma de la consulta origen (deep copy)
      const odontogramaOrigen = consultaOrigen.odontograma.toObject();
      nuevoOdontograma = {
        fechaActualizacion: new Date(),
        tipoDenticion: odontogramaOrigen.tipoDenticion,
        observaciones: odontogramaOrigen.observaciones,
        dientes: odontogramaOrigen.dientes.map(d => ({
          codigoFDI: d.codigoFDI,
          estadoGeneral: d.estadoGeneral,
          superficies: {
            M: { estado: d.superficies.M.estado, observacion: d.superficies.M.observacion || '' },
            D: { estado: d.superficies.D.estado, observacion: d.superficies.D.observacion || '' },
            O: { estado: d.superficies.O.estado, observacion: d.superficies.O.observacion || '' },
            V: { estado: d.superficies.V.estado, observacion: d.superficies.V.observacion || '' },
            L: { estado: d.superficies.L.estado, observacion: d.superficies.L.observacion || '' },
            P: { estado: d.superficies.P.estado, observacion: d.superficies.P.observacion || '' }
          },
          movilidad: d.movilidad,
          recesion: d.recesion,
          tratamientosPendientes: d.tratamientosPendientes || [],
          observaciones: d.observaciones || ''
        }))
      };

      mensajeRespuesta = `Odontograma inicializado copiando desde consulta anterior`;
    } else {
      // Generar odontograma en blanco (comportamiento original)
      nuevoOdontograma = generarOdontogramaInicial(tipoDenticion);
    }

    // Persistir SOLO esa subruta para evitar revalidar otras consultas
    // del historial (que podrían tener datos legacy incompletos).
    const result = await HistorialClinico.updateOne(
      { paciente: pacienteId, activo: true, 'consultas._id': consultaId },
      {
        $set: {
          'consultas.$.odontograma': nuevoOdontograma,
          updatedBy: req.perfil._id
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: mensajeRespuesta,
      odontograma: nuevoOdontograma
    });

  } catch (error) {
    console.error('Error en inicializarOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al inicializar el odontograma',
      error: error.message
    });
  }
};

/**
 * Actualizar un diente específico del odontograma
 * PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/diente/:codigoFDI
 * Roles: doctor, admin
 */
const actualizarDienteOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId, codigoFDI } = req.params;
    const datosActualizacion = req.body;

    // Buscar historial y consulta
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

    const consulta = historial.consultas.id(consultaId);

    // Verificar que el odontograma esté inicializado
    if (!consulta.odontograma || !consulta.odontograma.dientes || consulta.odontograma.dientes.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Odontograma no inicializado. Debe inicializarlo primero.'
      });
    }

    // Validar código FDI
    if (!validarCodigoFDI(codigoFDI, consulta.odontograma.tipoDenticion)) {
      return res.status(400).json({
        success: false,
        mensaje: `Código FDI ${codigoFDI} inválido para dentición ${consulta.odontograma.tipoDenticion}`
      });
    }

    // Buscar el diente en el array
    const diente = consulta.odontograma.dientes.find(d => d.codigoFDI === codigoFDI);

    if (!diente) {
      return res.status(404).json({
        success: false,
        mensaje: `Diente ${codigoFDI} no encontrado en el odontograma`
      });
    }

    // ==============================
    // VALIDACIÓN DE ESTADO GENERAL
    // ==============================
    if (datosActualizacion.estadoGeneral) {
      if (!validarEstadoClinico(datosActualizacion.estadoGeneral)) {
        return res.status(400).json({
          success: false,
          mensaje: `Estado clínico inválido: ${datosActualizacion.estadoGeneral}`
        });
      }

      // Validar compatibilidad de estados
      const compatibilidad = validarCompatibilidadEstados(diente.estadoGeneral, datosActualizacion.estadoGeneral);
      if (!compatibilidad.valido) {
        return res.status(400).json({
          success: false,
          mensaje: compatibilidad.mensaje
        });
      }

      diente.estadoGeneral = datosActualizacion.estadoGeneral;
    }
    
    // ==============================
    // VALIDACIÓN DE SUPERFICIES
    // ==============================
    if (datosActualizacion.superficies) {
      Object.keys(datosActualizacion.superficies).forEach(cara => {
        // Validar que la cara sea válida
        if (!validarCara(cara)) {
          return res.status(400).json({
            success: false,
            mensaje: `Cara inválida: ${cara}. Caras válidas: M, D, O, V, L, P`
          });
        }

        if (diente.superficies[cara]) {
          // Validar estado de superficie
          if (datosActualizacion.superficies[cara].estado) {
            if (!validarEstadoSuperficie(datosActualizacion.superficies[cara].estado)) {
              return res.status(400).json({
                success: false,
                mensaje: `Estado de superficie inválido para cara ${cara}: ${datosActualizacion.superficies[cara].estado}`
              });
            }

            // Validar compatibilidad: CARIES + OBTURADO en misma cara
            const estadoActual = diente.superficies[cara].estado;
            const nuevoEstado = datosActualizacion.superficies[cara].estado;
            
            if (estadoActual === 'OBTURADO' && nuevoEstado === 'CARIES') {
              return res.status(400).json({
                success: false,
                mensaje: `PROHIBIDO: La cara ${cara} ya está obturada, no puede tener caries`
              });
            }

            diente.superficies[cara].estado = nuevoEstado;
          }
          if (datosActualizacion.superficies[cara].observacion !== undefined) {
            diente.superficies[cara].observacion = datosActualizacion.superficies[cara].observacion;
          }
        }
      });
    }
    
    if (datosActualizacion.movilidad !== undefined) diente.movilidad = datosActualizacion.movilidad;
    if (datosActualizacion.recesion !== undefined) diente.recesion = datosActualizacion.recesion;
    if (datosActualizacion.tratamientosPendientes) diente.tratamientosPendientes = datosActualizacion.tratamientosPendientes;
    if (datosActualizacion.observaciones !== undefined) diente.observaciones = datosActualizacion.observaciones;

    // Persistir SOLO el diente y la fecha del odontograma vía update dirigido,
    // evitando revalidar otras consultas legacy del historial.
    const fechaActualizacion = new Date();
    const dienteActualizado = diente.toObject ? diente.toObject() : diente;

    const result = await HistorialClinico.updateOne(
      { paciente: pacienteId, activo: true },
      {
        $set: {
          'consultas.$[c].odontograma.dientes.$[d]': dienteActualizado,
          'consultas.$[c].odontograma.fechaActualizacion': fechaActualizacion,
          updatedBy: req.perfil._id
        }
      },
      {
        arrayFilters: [
          { 'c._id': new mongoose.Types.ObjectId(consultaId) },
          { 'd.codigoFDI': codigoFDI }
        ]
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'No se pudo localizar el diente para actualizar'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: `Diente ${obtenerNombreDiente(codigoFDI)} actualizado correctamente`,
      diente: dienteActualizado
    });

  } catch (error) {
    console.error('Error en actualizarDienteOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el diente',
      error: error.message
    });
  }
};

/**
 * Obtener odontograma completo de una consulta
 * GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma
 * Roles: doctor, admin, paciente
 */
const obtenerOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;

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

    const consulta = historial.consultas.id(consultaId);

    // Retornar odontograma si existe, o null si no está inicializado
    if (!consulta.odontograma || !consulta.odontograma.dientes || consulta.odontograma.dientes.length === 0) {
      return res.status(200).json({
        success: true,
        odontograma: null,
        mensaje: 'Odontograma no inicializado para esta consulta'
      });
    }

    res.status(200).json({
      success: true,
      odontograma: consulta.odontograma
    });

  } catch (error) {
    console.error('Error en obtenerOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el odontograma',
      error: error.message
    });
  }
};

/**
 * Obtener tratamiento específico a detalle
 * GET /api/tratamientos/paciente/:pacienteId/consulta/:consultaId/sesion/:sesion
 * Roles: admin, doctor, paciente (solo sus propios tratamientos)
 */
const obtenerTratamientoDetalle = async (req, res) => {
  try {
    console.log('💊 Obteniendo tratamiento detalle:', req.params);
    
    const { pacienteId, consultaId, sesion } = req.params;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(pacienteId) || !mongoose.Types.ObjectId.isValid(consultaId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'IDs inválidos'
      });
    }

    const sesionNumero = parseInt(sesion);
    if (isNaN(sesionNumero) || sesionNumero < 1) {
      return res.status(400).json({
        success: false,
        mensaje: 'Número de sesión inválido'
      });
    }

    // Obtener historial con la consulta específica
    const historial = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true,
      'consultas._id': consultaId
    })
    .populate('consultas.doctor', 'usuario especialidad')
    .populate('consultas.doctor.usuario', 'nombre apellido email telefono')
    .populate('paciente', 'usuario')
    .populate('paciente.usuario', 'nombre apellido cedula');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico o consulta no encontrada'
      });
    }

    const consulta = historial.consultas.id(consultaId);

    if (!consulta) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada'
      });
    }

    // Buscar el tratamiento específico por número de sesión
    const tratamiento = consulta.tratamientos?.find(t => t.sesion === sesionNumero);

    if (!tratamiento) {
      return res.status(404).json({
        success: false,
        mensaje: `Tratamiento con sesión ${sesionNumero} no encontrado en esta consulta`
      });
    }

    // Construir respuesta detallada
    const tratamientoDetalle = {
      ...tratamiento.toObject(),
      consulta: {
        id: consulta._id,
        fecha: consulta.fecha,
        motivoConsulta: consulta.motivoConsulta,
        diagnosticos: consulta.diagnosticos
      },
      doctor: consulta.doctor ? {
        id: consulta.doctor._id,
        nombre: consulta.doctor.usuario ? 
          `${consulta.doctor.usuario.nombre} ${consulta.doctor.usuario.apellido}` : 
          'No disponible',
        especialidad: consulta.doctor.especialidad,
        email: consulta.doctor.usuario?.email,
        telefono: consulta.doctor.usuario?.telefono
      } : null,
      paciente: historial.paciente ? {
        id: historial.paciente._id,
        nombre: historial.paciente.usuario ? 
          `${historial.paciente.usuario.nombre} ${historial.paciente.usuario.apellido}` : 
          'No disponible',
        cedula: historial.paciente.usuario?.cedula
      } : null
    };

    res.status(200).json({
      success: true,
      mensaje: 'Tratamiento obtenido exitosamente',
      datos: tratamientoDetalle
    });

  } catch (error) {
    console.error('❌ Error en obtenerTratamientoDetalle:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Obtener tratamientos de un paciente
 * GET /api/historial-clinico/:pacienteId/tratamientos
 * Roles: admin, doctor, paciente (solo sus propios tratamientos)
 */
const obtenerTratamientosPaciente = async (req, res) => {
  try {
    console.log('💊 Obteniendo tratamientos del paciente:', req.params.pacienteId);
    
    const { pacienteId } = req.params;

    // Validar ID de paciente
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Obtener historial con todos los tratamientos de todas las consultas
    const historial = await HistorialClinico.findOne({ 
      paciente: pacienteId, 
      activo: true 
    })
    .populate('consultas.doctor', 'usuario especialidad')
    .populate('consultas.doctor.usuario', 'nombre apellido');

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Historial clínico no encontrado'
      });
    }

    // Extraer todos los tratamientos de todas las consultas
    const todosLosTratamientos = [];
    
    historial.consultas.forEach(consulta => {
      if (consulta.tratamientos && Array.isArray(consulta.tratamientos)) {
        consulta.tratamientos.forEach(tratamiento => {
          todosLosTratamientos.push({
            ...tratamiento.toObject(),
            consultaId: consulta._id,
            fechaConsulta: consulta.fecha,
            doctor: consulta.doctor ? {
              id: consulta.doctor._id,
              nombre: consulta.doctor.usuario ? 
                `${consulta.doctor.usuario.nombre} ${consulta.doctor.usuario.apellido}` : 
                'No disponible',
              especialidad: consulta.doctor.especialidad
            } : null
          });
        });
      }
    });

    // Ordenar por fecha de tratamiento (más reciente primero)
    todosLosTratamientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.status(200).json({
      success: true,
      mensaje: 'Tratamientos obtenidos exitosamente',
      datos: {
        tratamientos: todosLosTratamientos,
        total: todosLosTratamientos.length
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerTratamientosPaciente:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar observaciones generales del odontograma
 * PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/observaciones
 * Roles: doctor, admin
 */
const actualizarObservacionesOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;
    const { observaciones } = req.body;

    const historial = await HistorialClinico.findOne({
      paciente: pacienteId,
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada'
      });
    }

    const consulta = historial.consultas.id(consultaId);

    if (!consulta.odontograma || !consulta.odontograma.dientes || consulta.odontograma.dientes.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Odontograma no inicializado'
      });
    }

    const nuevasObservaciones = observaciones || '';
    const fechaActualizacion = new Date();

    const result = await HistorialClinico.updateOne(
      { paciente: pacienteId, activo: true, 'consultas._id': consultaId },
      {
        $set: {
          'consultas.$.odontograma.observaciones': nuevasObservaciones,
          'consultas.$.odontograma.fechaActualizacion': fechaActualizacion,
          updatedBy: req.perfil._id
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Observaciones actualizadas correctamente',
      observaciones: nuevasObservaciones
    });

  } catch (error) {
    console.error('Error en actualizarObservacionesOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar observaciones',
      error: error.message
    });
  }
};

/**
 * Obtener odontograma enriquecido con metadata visual
 * GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/visual
 * Roles: doctor, admin, paciente
 * 
 * Retorna los mismos datos clínicos + metadata para renderizado frontend
 */
const obtenerOdontogramaVisual = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;
    
    console.log(`📊 Obteniendo odontograma visual - Paciente: ${pacienteId}, Consulta: ${consultaId}`);
    
    // Obtener historial clínico
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
    
    // Buscar consulta específica
    const consulta = historial.consultas.id(consultaId);
    
    if (!consulta) {
      return res.status(404).json({ 
        success: false,
        mensaje: 'Consulta no encontrada' 
      });
    }
    
    // Verificar que el odontograma esté inicializado
    if (!consulta.odontograma || !consulta.odontograma.dientes || consulta.odontograma.dientes.length === 0) {
      return res.status(200).json({ 
        success: true,
        odontograma: null,
        mensaje: 'Odontograma no inicializado para esta consulta. Use /inicializar primero.'
      });
    }
    
    // Enriquecer cada diente con metadata visual
    const odontogramaObj = consulta.odontograma.toObject();
    const odontogramaEnriquecido = {
      ...odontogramaObj,
      dientes: odontogramaObj.dientes.map(diente => {
        return {
          ...diente,
          visual: obtenerMetadataVisual(
            diente.codigoFDI, 
            diente.estadoGeneral
          )
        };
      })
    };
    
    res.status(200).json({
      success: true,
      odontograma: odontogramaEnriquecido,
      metadata: {
        totalDientes: odontogramaEnriquecido.dientes.length,
        tipoDenticion: odontogramaEnriquecido.tipoDenticion,
        fechaActualizacion: odontogramaEnriquecido.fechaActualizacion
      }
    });
    
  } catch (error) {
    console.error('❌ Error en obtenerOdontogramaVisual:', error);
    res.status(500).json({ 
      success: false,
      mensaje: 'Error al obtener odontograma visual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  crearHistorialClinico,
  agregarConsulta,
  obtenerHistorialCompleto,
  obtenerConsultasFiltradas,
  obtenerConsultaEspecifica,
  actualizarConsulta,
  eliminarConsulta,
  eliminarHistorial,
  obtenerEstadisticasHistorial,
  obtenerTratamientosPaciente,
  obtenerTratamientoDetalle,
  // Funciones de odontograma
  inicializarOdontograma,
  actualizarDienteOdontograma,
  obtenerOdontograma,
  actualizarObservacionesOdontograma,
  obtenerOdontogramaVisual
};