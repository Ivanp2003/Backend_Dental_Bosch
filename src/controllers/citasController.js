const CitasService = require('../services/citasService');
const Paciente = require('../models/Paciente');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

// 📅 CREAR CITA (PACIENTE, DOCTOR, ADMIN)
const crearCita = async (req, res) => {
  try {
    console.log('📅 Creando nueva cita');
    
    const { paciente, doctor, fecha, horaInicio, horaFin, motivo } = req.body;
    
    // Validaciones básicas
    if (!paciente || !doctor || !fecha || !horaInicio || !horaFin || !motivo) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos son obligatorios',
        camposRequeridos: ['paciente', 'doctor', 'fecha', 'horaInicio', 'horaFin', 'motivo']
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
    
    // Si es paciente, solo puede crear citas para sí mismo
    if (req.usuario.rol === 'paciente') {
      const pacienteData = await Paciente.findOne({ usuario: req.usuario.id });
      if (!pacienteData || pacienteData._id.toString() !== paciente) {
        return res.status(403).json({
          success: false,
          mensaje: 'Los pacientes solo pueden crear citas para sí mismos'
        });
      }
    }
    
    // Si es doctor, validar que pueda crear la cita
    if (req.usuario.rol === 'doctor') {
      const doctorData = await Doctor.findOne({ usuario: req.usuario.id });
      if (!doctorData || doctorData._id.toString() !== doctor) {
        return res.status(403).json({
          success: false,
          mensaje: 'Acción no autorizada'
        });
      }
    }

    const nuevaCita = await CitasService.crearCita({
      paciente,
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
    
    if (error.message.includes('inválidos') || error.message.includes('pasadas')) {
      return res.status(400).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 👨‍⚕️ OBTENER CITAS DEL DOCTOR AUTENTICADO
const obtenerCitasDoctor = async (req, res) => {
  try {
    console.log('👨‍⚕️ Obteniendo citas del doctor autenticado');
    
    // Obtener doctor del usuario autenticado
    const doctor = await Doctor.findOne({ usuario: req.usuario.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de doctor no encontrado'
      });
    }

    const { estado, desde, hasta, page, limit } = req.query;
    
    const resultado = await CitasService.obtenerCitasDoctor(
      doctor._id, 
      { estado, desde, hasta, page, limit }
    );

    res.status(200).json({
      success: true,
      mensaje: 'Citas obtenidas exitosamente',
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en obtenerCitasDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ CONFIRMAR CITA (DOCTOR/ADMIN)
const confirmarCita = async (req, res) => {
  try {
    console.log('✅ Confirmando cita:', req.params.id);
    
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cita inválido'
      });
    }

    // Solo doctores y admins pueden confirmar citas
    if (req.usuario.rol === 'paciente') {
      return res.status(403).json({
        success: false,
        mensaje: 'Los pacientes no pueden confirmar citas'
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
          mensaje: 'Solo puedes confirmar tus propias citas'
        });
      }
    }

    const citaConfirmada = await CitasService.confirmarCita(id);

    res.status(200).json({
      success: true,
      mensaje: 'Cita confirmada exitosamente',
      datos: citaConfirmada
    });

  } catch (error) {
    console.error('❌ Error en confirmarCita:', error);
    
    if (error.message.includes('no encontrada') || error.message.includes('pendientes')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const estadosPermitidos = ['pendiente', 'confirmada', 'finalizada', 'cancelada'];
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
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  crearCita,
  obtenerMisCitas,
  obtenerCitasDoctor,
  obtenerTodasLasCitas,
  cancelarCita,
  confirmarCita,
  actualizarEstadoCita,
  finalizarCita,
  obtenerDisponibilidadDoctor
};
