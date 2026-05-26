const CitasService = require('../services/citasService');
const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

// 📅 CREAR CITA (PACIENTE, DOCTOR, ADMIN)
const crearCita = async (req, res) => {
  try {
    console.log('📅 Creando nueva cita');
    
    let { paciente, doctor, fecha, horaInicio, horaFin, motivo } = req.body;

    // Si el usuario es doctor, auto-asignar su propio ID de doctor
    let doctorAutenticado = null;
    if (req.usuario.rol === 'doctor') {
      doctorAutenticado = await Doctor.findOne({ usuario: req.usuario.id });
      if (!doctorAutenticado) {
        return res.status(404).json({
          success: false,
          mensaje: 'Perfil de doctor no encontrado'
        });
      }
      // Si no se envió doctor en el body, usar el del doctor autenticado
      if (!doctor) {
        doctor = doctorAutenticado._id.toString();
      }
    }

    // Validaciones básicas
    const camposRequeridos = ['doctor', 'fecha', 'horaInicio', 'horaFin', 'motivo'];
    if (req.usuario.rol !== 'paciente') {
      camposRequeridos.push('paciente');
    }
    
    const camposFaltantes = [];
    if (req.usuario.rol !== 'paciente' && !paciente) camposFaltantes.push('paciente');
    if (!doctor) camposFaltantes.push('doctor');
    if (!fecha) camposFaltantes.push('fecha');
    if (!horaInicio) camposFaltantes.push('horaInicio');
    if (!horaFin) camposFaltantes.push('horaFin');
    if (!motivo) camposFaltantes.push('motivo');
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos son obligatorios',
        camposRequeridos,
        camposFaltantes
      });
    }

    // Validar formato de hora
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Formato de hora inválido. Use HH:MM (ej: 09:00)'
      });
    }

    // Determinar quién crea la cita según el rol
    let creadoPor = req.usuario.rol;
    
    // Si es paciente, asignar automáticamente su ID de paciente
    let pacienteId = paciente;
    if (req.usuario.rol === 'paciente') {
      const pacienteData = await Paciente.findOne({ usuario: req.usuario.id });
      if (!pacienteData) {
        return res.status(404).json({
          success: false,
          mensaje: 'Perfil de paciente no encontrado'
        });
      }
      pacienteId = pacienteData._id.toString();
    }
    
    // Si es doctor, validar que pueda crear la cita (solo para sí mismo)
    if (req.usuario.rol === 'doctor') {
      if (doctorAutenticado._id.toString() !== doctor.toString()) {
        console.log('❌ Doctor autenticado:', doctorAutenticado._id.toString(), 'vs doctor del body:', doctor);
        return res.status(403).json({
          success: false,
          mensaje: 'Un doctor solo puede crear citas para sí mismo'
        });
      }
    }

    const nuevaCita = await CitasService.crearCita({
      paciente: pacienteId,
      doctor,
      fecha,
      horaInicio,
      horaFin,
      motivo,
      creadoPor
    }, req.usuario.rol);

    res.status(201).json({
      success: true,
      mensaje: 'Cita creada exitosamente',
      datos: nuevaCita
    });

  } catch (error) {
    console.error('❌ Error en crearCita:', error);
    
    if (error.message.includes('no encontrado') || error.message.includes('inactivo')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }
    
    if (error.message.includes('ya tiene') || error.message.includes('horario') || error.message.includes('disponibilidad')) {
      return res.status(409).json({
        success: false,
        mensaje: error.message
      });
    }

    if (error.message.includes('atendido hoy') || error.message.includes('historial clínico')) {
      return res.status(409).json({
        success: false,
        mensaje: error.message
      });
    }
    
    if (error.message.includes('inválid') || error.message.includes('pasadas')) {
      return res.status(400).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📋 OBTENER CITAS DEL PACIENTE AUTENTICADO
const obtenerMisCitas = async (req, res) => {
  try {
    console.log('📋 Obteniendo citas del paciente autenticado');
    
    // Obtener paciente del usuario autenticado
    const paciente = await Paciente.findOne({ usuario: req.usuario.id });
    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de paciente no encontrado'
      });
    }

    const { estado, desde, hasta, page, limit } = req.query;
    
    const resultado = await CitasService.obtenerCitasPaciente(
      paciente._id, 
      { estado, desde, hasta, page, limit }
    );

    res.status(200).json({
      success: true,
      mensaje: 'Citas obtenidas exitosamente',
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en obtenerMisCitas:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 👨‍⚕️ OBTENER CITAS DEL DOCTOR AUTENTICADO
const obtenerCitasDoctor = async (req, res) => {
  try {
    console.log('👨‍⚕️ Obteniendo citas del doctor autenticado');
    console.log('🔍 Usuario autenticado ID:', req.usuario.id);
    console.log('🔍 Rol del usuario:', req.usuario.rol);
    
    // Obtener doctor del usuario autenticado
    const doctor = await Doctor.findOne({ usuario: req.usuario.id });
    console.log('🔍 Doctor encontrado:', doctor ? `Sí (ID: ${doctor._id})` : 'No');
    
    if (!doctor) {
      console.log('❌ Perfil de doctor no encontrado para usuario:', req.usuario.id);
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de doctor no encontrado'
      });
    }

    const { estado, desde, hasta, page, limit } = req.query;
    console.log('🔍 Parámetros de consulta:', { estado, desde, hasta, page, limit });
    
    const resultado = await CitasService.obtenerCitasDoctor(
      doctor._id, 
      { estado, desde, hasta, page, limit }
    );
    
    console.log('🔍 Resultado del service:', {
      totalCitas: resultado.citas?.length || 0,
      pagination: resultado.pagination
    });

    res.status(200).json({
      success: true,
      mensaje: 'Citas obtenidas exitosamente',
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en obtenerCitasDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📅 OBTENER TODAS LAS CITAS (ADMIN)
const obtenerTodasLasCitas = async (req, res) => {
  try {
    console.log('📅 Obteniendo todas las citas (Admin)');
    
    const { estado, desde, hasta, doctor, paciente, page, limit } = req.query;
    
    const resultado = await CitasService.obtenerTodasLasCitas({
      estado, desde, hasta, doctor, paciente, page, limit
    });

    res.status(200).json({
      success: true,
      mensaje: 'Citas obtenidas exitosamente',
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en obtenerTodasLasCitas:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// ❌ CANCELAR CITA
const cancelarCita = async (req, res) => {
  try {
    console.log('❌ Cancelando cita:', req.params.id);
    
    const { id } = req.params;
    const { motivoCancelacion } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cita inválido'
      });
    }

    if (!motivoCancelacion || motivoCancelacion.trim().length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El motivo de cancelación es obligatorio'
      });
    }

    // Obtener la cita para verificar permisos
    const Cita = require('../models/Cita');
    const cita = await Cita.findById(id).populate('paciente').populate('doctor');

    if (!cita) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cita no encontrada'
      });
    }

    // Validar permisos según rol
    let canceladoPor = req.usuario.rol;
    
    if (req.usuario.rol === 'paciente') {
      const pacienteData = await Paciente.findOne({ usuario: req.usuario.id });
      if (!pacienteData || cita.paciente._id.toString() !== pacienteData._id.toString()) {
        return res.status(403).json({
          success: false,
          mensaje: 'No puedes cancelar citas de otros pacientes'
        });
      }
    } else if (req.usuario.rol === 'doctor') {
      const doctorData = await Doctor.findOne({ usuario: req.usuario.id });
      if (!doctorData || cita.doctor._id.toString() !== doctorData._id.toString()) {
        return res.status(403).json({
          success: false,
          mensaje: 'No puedes cancelar citas de otros doctores'
        });
      }
    }
    // Admin puede cancelar cualquier cita

    const citaCancelada = await CitasService.cancelarCita(
      id, 
      motivoCancelacion, 
      canceladoPor
    );

    res.status(200).json({
      success: true,
      mensaje: 'Cita cancelada exitosamente',
      datos: citaCancelada
    });

  } catch (error) {
    console.error('❌ Error en cancelarCita:', error);
    
    if (error.message.includes('no encontrada') || error.message.includes('finalizada') || error.message.includes('cancelada')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }
    
    if (error.message.includes('24 horas')) {
      return res.status(409).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 🔄 ACTUALIZAR ESTADO DE CITA (DOCTOR/ADMIN)
const actualizarEstadoCita = async (req, res) => {
  try {
    console.log('🔄 Actualizando estado de cita:', req.params.id);
    
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cita inválido'
      });
    }

    // Validar estados permitidos
    const estadosPermitidos = ['pendiente', 'finalizada', 'cancelada'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Estado no válido. Estados permitidos: ' + estadosPermitidos.join(', ')
      });
    }

    // Solo doctores y admins pueden actualizar estados
    if (req.usuario.rol === 'paciente') {
      return res.status(403).json({
        success: false,
        mensaje: 'Los pacientes no pueden actualizar el estado de las citas'
      });
    }

    // Si es doctor, validar que sea su cita
    if (req.usuario.rol === 'doctor') {
      const Cita = require('../models/Cita');
      const cita = await Cita.findById(id);
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          mensaje: 'Cita no encontrada'
        });
      }

      const doctorData = await Doctor.findOne({ usuario: req.usuario.id });
      if (!doctorData || cita.doctor.toString() !== doctorData._id.toString()) {
        return res.status(403).json({
          success: false,
          mensaje: 'Solo puedes actualizar el estado de tus propias citas'
        });
      }
    }

    const citaActualizada = await CitasService.actualizarEstadoCita(id, estado, observaciones, req.usuario.rol);

    res.status(200).json({
      success: true,
      mensaje: `Cita ${estado === 'finalizada' ? 'finalizada' : 'actualizada'} exitosamente`,
      datos: citaActualizada
    });

  } catch (error) {
    console.error('❌ Error en actualizarEstadoCita:', error);
    
    if (error.message.includes('no encontrada') || error.message.includes('confirmadas') || error.message.includes('futuras')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 🏁 FINALIZAR CITA (DOCTOR/ADMIN)
const finalizarCita = async (req, res) => {
  try {
    console.log('🏁 Finalizando cita:', req.params.id);
    
    const { id } = req.params;
    const { notas } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cita inválido'
      });
    }

    // Solo doctores y admins pueden finalizar citas
    if (req.usuario.rol === 'paciente') {
      return res.status(403).json({
        success: false,
        mensaje: 'Los pacientes no pueden finalizar citas'
      });
    }

    // Si es doctor, validar que sea su cita
    if (req.usuario.rol === 'doctor') {
      const Cita = require('../models/Cita');
      const cita = await Cita.findById(id);
      
      if (!cita) {
        return res.status(404).json({
          success: false,
          mensaje: 'Cita no encontrada'
        });
      }

      const doctorData = await Doctor.findOne({ usuario: req.usuario.id });
      if (!doctorData || cita.doctor.toString() !== doctorData._id.toString()) {
        return res.status(403).json({
          success: false,
          mensaje: 'Solo puedes finalizar tus propias citas'
        });
      }
    }

    const citaFinalizada = await CitasService.finalizarCita(id, notas);

    res.status(200).json({
      success: true,
      mensaje: 'Cita finalizada exitosamente',
      datos: citaFinalizada
    });

  } catch (error) {
    console.error('❌ Error en finalizarCita:', error);
    
    if (error.message.includes('no encontrada') || error.message.includes('confirmadas') || error.message.includes('futuras')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📅 OBTENER DISPONIBILIDAD DE DOCTOR
const obtenerDisponibilidadDoctor = async (req, res) => {
  try {
    console.log('📅 Obteniendo disponibilidad de doctor');
    
    const { doctorId, fecha } = req.query;

    if (!doctorId || !fecha) {
      return res.status(400).json({
        success: false,
        mensaje: 'El ID del doctor y la fecha son obligatorios'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    const disponibilidad = await CitasService.obtenerDisponibilidadDoctor(doctorId, fecha);

    res.status(200).json({
      success: true,
      mensaje: 'Disponibilidad obtenida exitosamente',
      datos: disponibilidad
    });

  } catch (error) {
    console.error('❌ Error en obtenerDisponibilidadDoctor:', error);
    
    if (error.message.includes('no encontrado') || error.message.includes('inactivo')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};

// 📅 OBTENER SLOTS OCUPADOS (PÚBLICO / PACIENTE)
const obtenerSlotsOcupados = async (req, res) => {
  try {
    console.log('📅 Obteniendo slots ocupados');
    
    const { doctor, fecha } = req.query;

    // Validaciones básicas
    if (!doctor || !mongoose.Types.ObjectId.isValid(doctor)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido o no proporcionado'
      });
    }

    if (!fecha) {
      return res.status(400).json({
        success: false,
        mensaje: 'La fecha es obligatoria (formato: YYYY-MM-DD)'
      });
    }

    // Validar formato de fecha
    const fechaValida = new Date(fecha);
    if (isNaN(fechaValida.getTime())) {
      return res.status(400).json({
        success: false,
        mensaje: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    // Verificar que el doctor exista y esté activo
    const doctorExistente = await Doctor.findOne({ 
      _id: doctor, 
      activo: true 
    });

    if (!doctorExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado o inactivo'
      });
    }

    // Buscar citas pendientes o finalizadas del doctor en esa fecha
    const citas = await Cita.find({
      doctor: doctor,
      fecha: fechaValida,
      estado: { $in: ['pendiente', 'finalizada'] }
    }).select('horaInicio horaFin');

    // Extraer todos los slots ocupados (cada cita puede ocupar múltiples slots de 30 min)
    const slotsOcupados = [];
    for (const cita of citas) {
      const [inicioHora, inicioMin] = cita.horaInicio.split(':').map(Number);
      const [finHora, finMin] = cita.horaFin.split(':').map(Number);
      
      const inicioMinutos = inicioHora * 60 + inicioMin;
      const finMinutos = finHora * 60 + finMin;
      
      // Agregar slots de 30 minutos
      for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
        const slotHora = Math.floor(minutos / 60);
        const slotMin = minutos % 60;
        const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
        if (!slotsOcupados.includes(slotStr)) {
          slotsOcupados.push(slotStr);
        }
      }
    }

    // Ordenar slots cronológicamente
    slotsOcupados.sort();

    res.status(200).json({
      success: true,
      mensaje: 'Bloques de horarios ocupados obtenidos exitosamente',
      datos: {
        doctor: doctor,
        fecha: fecha,
        slotsOcupados: slotsOcupados
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerSlotsOcupados:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error interno del servidor'
    });
  }
};


module.exports = {
  crearCita,
  obtenerMisCitas,
  obtenerCitasDoctor,
  obtenerTodasLasCitas,
  cancelarCita,
  actualizarEstadoCita,
  finalizarCita,
  obtenerSlotsOcupados,
  obtenerDisponibilidadDoctor
};
