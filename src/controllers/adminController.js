const AdminService = require('../services/adminService');
const mongoose = require('mongoose');

// 🦷 CREAR DOCTOR
const crearDoctor = async (req, res) => {
  try {
    console.log('🦷 Admin creando doctor');
    
    const { datosUsuario, datosDoctor } = req.body;

    // Validar que existan los objetos de datos
    if (!datosUsuario || !datosDoctor) {
      return res.status(400).json({
        success: false,
        mensaje: 'Se requieren datosUsuario y datosDoctor'
      });
    }

    const { nombre, apellido, email, password, telefono } = datosUsuario;
    const { especialidad, horarioAtencion } = datosDoctor;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !especialidad) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan campos obligatorios',
        camposRequeridos: ['nombre', 'apellido', 'email', 'password', 'especialidad']
      });
    }

    // Validación de email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email inválido'
      });
    }

    // Validación de password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const resultado = await AdminService.crearDoctor({
      nombre,
      apellido,
      email,
      password,
      especialidad,
      telefono: telefono || '',
      horarioAtencion: horarioAtencion || []
    });

    res.status(201).json({
      success: true,
      mensaje: 'Doctor creado exitosamente',
      datos: resultado
    });

  } catch (error) {
    console.error('❌ Error en crearDoctor:', error);
    
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
    
    const resultado = await AdminService.listarDoctores({
      estado,
      especialidad,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });

    res.status(200).json({
      success: true,
      mensaje: 'Doctores listados exitosamente',
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

module.exports = {
  // Gestión de Doctores
  crearDoctor,
  actualizarDoctor,
  cambiarEstadoDoctor,
  actualizarHorarioDoctor,
  listarDoctores,
  obtenerDetalleDoctor,
  
  // Gestión de Citas
  obtenerTodasLasCitas,
  
  // Gestión de Pacientes
  listarPacientes,
  obtenerDetallePaciente,
  cambiarDoctorAsignado,
  
  // Estadísticas
  obtenerEstadisticas
};
