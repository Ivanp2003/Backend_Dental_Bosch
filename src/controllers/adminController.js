const AdminService = require('../services/adminService');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const { enviarEmailAprobacionDoctor, enviarEmailRechazoDoctor } = require('../utils/email');

// 📝 NOTA: Los doctores ahora crean sus propias cuentas a través del endpoint de registro
// El administrador solo aprueba/rechaza las solicitudes pendientes

// ✏️ ACTUALIZAR DOCTOR
const actualizarDoctor = async (req, res) => {
  try {
    console.log('✏️ Admin actualizando doctor:', req.params.id);
    
    const { id } = req.params;
    const { datosUsuario, datosDoctor } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    // Validar email si se está actualizando
    if (datosUsuario?.email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(datosUsuario.email)) {
        return res.status(400).json({
          success: false,
          mensaje: 'Email inválido'
        });
      }
    }

    const doctorActualizado = await AdminService.actualizarDoctor(id, {
      datosUsuario,
      datosDoctor
    });

    res.status(200).json({
      success: true,
      mensaje: 'Doctor actualizado exitosamente',
      datos: doctorActualizado
    });

  } catch (error) {
    console.error('❌ Error en actualizarDoctor:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    if (error.message.includes('ya está registrado')) {
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

// 🔄 CAMBIAR ESTADO DE DOCTOR
const cambiarEstadoDoctor = async (req, res) => {
  try {
    console.log('🔄 Admin cambiando estado de doctor:', req.params.id);
    
    const { id } = req.params;
    const { activo, reasignarA, reasignacionAutomatica } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        mensaje: 'El campo activo debe ser booleano'
      });
    }

    // Si se está desactivando, validar reasignación
    if (!activo && !reasignarA && !reasignacionAutomatica) {
      return res.status(400).json({
        success: false,
        mensaje: 'Para desactivar un doctor debe especificar reasignación (reasignarA o reasignacionAutomatica)'
      });
    }

    if (reasignarA && !mongoose.Types.ObjectId.isValid(reasignarA)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor de reasignación inválido'
      });
    }

    const resultado = await AdminService.cambiarEstadoDoctor(id, activo, {
      reasignarA,
      reasignacionAutomatica
    });

    res.status(200).json({
      success: true,
      mensaje: `Doctor ${activo ? 'activado' : 'desactivado'} exitosamente`,
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en cambiarEstadoDoctor:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    if (error.message.includes('citas pendientes') || error.message.includes('disponibles')) {
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

// 🕐 ACTUALIZAR HORARIO DE DOCTOR
const actualizarHorarioDoctor = async (req, res) => {
  try {
    console.log('🕐 Admin actualizando horario de doctor:', req.params.id);
    
    const { id } = req.params;
    const { horarioAtencion } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    if (!Array.isArray(horarioAtencion) || horarioAtencion.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El horario de atención es obligatorio y debe ser un array'
      });
    }

    // Validar estructura del horario
    for (const horario of horarioAtencion) {
      if (!horario.dia || !horario.horaInicio || !horario.horaFin) {
        return res.status(400).json({
          success: false,
          mensaje: 'Cada horario debe contener: dia, horaInicio, horaFin'
        });
      }
    }

    const doctorActualizado = await AdminService.actualizarHorarioDoctor(id, horarioAtencion);

    res.status(200).json({
      success: true,
      mensaje: 'Horario actualizado exitosamente',
      datos: doctorActualizado
    });

  } catch (error) {
    console.error('❌ Error en actualizarHorarioDoctor:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        mensaje: error.message
      });
    }

    if (error.message.includes('Formato de hora') || error.message.includes('solapamiento')) {
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

// 📋 LISTAR DOCTORES
const listarDoctores = async (req, res) => {
  try {
    console.log('📋 Admin listando doctores');
    
    const { estado, especialidad, page, limit } = req.query;
    
    // Si la ruta es /doctores-pendientes, filtrar automáticamente por estado pendiente
    let filtroEstado = estado;
    if (req.originalUrl.includes('/doctores-pendientes')) {
      filtroEstado = 'pendiente';
      console.log('🔍 Filtrando doctores pendientes de aprobación');
    }
    
    const resultado = await AdminService.listarDoctores({
      estado: filtroEstado,
      especialidad,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });

    const mensaje = req.originalUrl.includes('/doctores-pendientes') 
      ? 'Doctores pendientes listados exitosamente'
      : 'Doctores listados exitosamente';

    res.status(200).json({
      success: true,
      mensaje,
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en listarDoctores:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔍 VER DETALLE DE DOCTOR
const obtenerDetalleDoctor = async (req, res) => {
  try {
    console.log('🔍 Admin obteniendo detalle de doctor:', req.params.id);
    
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    const detalle = await AdminService.obtenerDetalleDoctor(id);

    res.status(200).json({
      success: true,
      mensaje: 'Detalle de doctor obtenido exitosamente',
      datos: detalle
    });

  } catch (error) {
    console.error('❌ Error en obtenerDetalleDoctor:', error);
    
    if (error.message.includes('no encontrado')) {
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

// 👁️ VER TODAS LAS CITAS
const obtenerTodasLasCitas = async (req, res) => {
  try {
    console.log('👁️ Admin obteniendo todas las citas');
    
    const { doctor, fecha, estado, page, limit } = req.query;
    
    const resultado = await AdminService.obtenerTodasLasCitas({
      doctor,
      fecha,
      estado,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
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

// 🧑‍⚕️ LISTAR PACIENTES
const listarPacientes = async (req, res) => {
  try {
    console.log('🧑‍⚕️ Admin listando pacientes');
    
    const { page, limit, busqueda } = req.query;
    
    const resultado = await AdminService.listarPacientes({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      busqueda
    });

    res.status(200).json({
      success: true,
      mensaje: 'Pacientes listados exitosamente',
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en listarPacientes:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔍 VER DETALLE DE PACIENTE
const obtenerDetallePaciente = async (req, res) => {
  try {
    console.log('🔍 Admin obteniendo detalle de paciente:', req.params.id);
    
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    const detalle = await AdminService.obtenerDetallePaciente(id);

    res.status(200).json({
      success: true,
      mensaje: 'Detalle de paciente obtenido exitosamente',
      datos: detalle
    });

  } catch (error) {
    console.error('❌ Error en obtenerDetallePaciente:', error);
    
    if (error.message.includes('no encontrado')) {
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

// 🔗 CAMBIAR DOCTOR ASIGNADO A PACIENTE
const cambiarDoctorAsignado = async (req, res) => {
  try {
    console.log('🔗 Admin cambiando doctor asignado:', req.params.id);
    
    const { id } = req.params;
    const { doctorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente o doctor inválido'
      });
    }

    const pacienteActualizado = await AdminService.cambiarDoctorAsignado(id, doctorId);

    res.status(200).json({
      success: true,
      mensaje: 'Doctor asignado actualizado exitosamente',
      datos: pacienteActualizado
    });

  } catch (error) {
    console.error('❌ Error en cambiarDoctorAsignado:', error);
    
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

// 📊 OBTENER ESTADÍSTICAS DEL SISTEMA
const obtenerEstadisticas = async (req, res) => {
  try {
    console.log('📊 Admin obteniendo estadísticas del sistema');
    
    const estadisticas = await AdminService.obtenerEstadisticas();

    res.status(200).json({
      success: true,
      mensaje: 'Estadísticas obtenidas exitosamente',
      datos: estadisticas
    });

  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🗑️ ELIMINAR DOCTOR (SOFT DELETE)
const eliminarDoctor = async (req, res) => {
  try {
    console.log('🗑️ Admin eliminando doctor:', req.params.id);
    
    const resultado = await AdminService.eliminarDoctor(req.params.id);

    res.status(200).json({
      success: true,
      mensaje: 'Doctor eliminado exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en eliminarDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔄 REASIGNAR CITAS DE DOCTOR
const reasignarCitasDoctor = async (req, res) => {
  try {
    console.log('🔄 Admin reasignando citas del doctor:', req.params.id);
    console.log('📋 Datos de reasignación:', req.body);
    
    const { doctorDestino, reasignarTodas } = req.body;
    
    const resultado = await AdminService.reasignarCitasDoctor(req.params.id, {
      doctorDestino,
      reasignarTodas
    });

    res.status(200).json({
      success: true,
      mensaje: 'Citas reasignadas exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en reasignarCitasDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔍 VER DETALLE DE CITA
const obtenerDetalleCita = async (req, res) => {
  try {
    console.log('🔍 Admin obteniendo detalle de cita:', req.params.id);
    
    const cita = await AdminService.obtenerDetalleCita(req.params.id);

    res.status(200).json({
      success: true,
      mensaje: 'Detalle de cita obtenido exitosamente',
      data: cita
    });

  } catch (error) {
    console.error('❌ Error en obtenerDetalleCita:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔄 REASIGNAR CITA MANUALMENTE
const reasignarCita = async (req, res) => {
  try {
    console.log('🔄 Admin reasignando cita:', req.params.id);
    console.log('📋 Datos de reasignación:', req.body);
    
    const { doctorId, fecha, horaInicio } = req.body;
    
    const resultado = await AdminService.reasignarCita(req.params.id, {
      doctorId,
      fecha,
      horaInicio
    });

    res.status(200).json({
      success: true,
      mensaje: 'Cita reasignada exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en reasignarCita:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🗑️ ELIMINAR PACIENTE (SOFT DELETE)
const eliminarPaciente = async (req, res) => {
  try {
    console.log('🗑️ Admin eliminando paciente:', req.params.id);
    
    const resultado = await AdminService.eliminarPaciente(req.params.id);

    res.status(200).json({
      success: true,
      mensaje: 'Paciente eliminado exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en eliminarPaciente:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ APROBAR DOCTOR
const aprobarDoctor = async (req, res) => {
  try {
    console.log('✅ Admin aprobando doctor:', req.params.id);
    
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    // Buscar usuario y doctor
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    if (usuario.rol !== 'doctor') {
      return res.status(400).json({
        success: false,
        mensaje: 'El usuario no es un doctor'
      });
    }

    if (usuario.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        mensaje: 'El doctor no está pendiente de aprobación'
      });
    }

    // Buscar información del doctor
    const doctor = await Doctor.findOne({ usuario: id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Información del doctor no encontrada'
      });
    }

    // Actualizar estado del usuario
    usuario.estado = 'aprobado';
    await usuario.save();

    // Enviar email de aprobación
    await enviarEmailAprobacionDoctor(usuario.email, usuario.nombreCompleto, doctor.especialidad);

    res.status(200).json({
      success: true,
      mensaje: 'Doctor aprobado exitosamente',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombreCompleto,
          email: usuario.email,
          estado: usuario.estado
        },
        doctor: {
          especialidad: doctor.especialidad
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en aprobarDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ❌ RECHAZAR DOCTOR
const rechazarDoctor = async (req, res) => {
  try {
    console.log('❌ Admin rechazando doctor:', req.params.id);
    
    const { id } = req.params;
    const { motivo } = req.body; // Motivo opcional del rechazo

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de doctor inválido'
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    if (usuario.rol !== 'doctor') {
      return res.status(400).json({
        success: false,
        mensaje: 'El usuario no es un doctor'
      });
    }

    if (usuario.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        mensaje: 'El doctor no está pendiente de aprobación'
      });
    }

    // Actualizar estado del usuario
    usuario.estado = 'rechazado';
    await usuario.save();

    // Enviar email de rechazo
    await enviarEmailRechazoDoctor(usuario.email, usuario.nombreCompleto, motivo);

    res.status(200).json({
      success: true,
      mensaje: 'Doctor rechazado exitosamente',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombreCompleto,
          email: usuario.email,
          estado: usuario.estado
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en rechazarDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  // Gestión de Doctores
  actualizarDoctor,
  cambiarEstadoDoctor,
  actualizarHorarioDoctor,
  listarDoctores,
  obtenerDetalleDoctor,
  eliminarDoctor,
  reasignarCitasDoctor,
  aprobarDoctor,
  rechazarDoctor,
  
  // Gestión de Citas
  obtenerTodasLasCitas,
  obtenerDetalleCita,
  reasignarCita,
  
  // Gestión de Pacientes
  listarPacientes,
  obtenerDetallePaciente,
  cambiarDoctorAsignado,
  eliminarPaciente,
  
  // Estadísticas
  obtenerEstadisticas
};
