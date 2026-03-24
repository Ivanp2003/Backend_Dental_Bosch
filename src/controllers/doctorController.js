const Doctor = require('../models/Doctor');
const Usuario = require('../models/Usuario');
const { enviarEmailAprobacionDoctor, enviarEmailRechazoDoctor } = require('../utils/email');

// @desc    Obtener perfil del doctor autenticado
// @route   GET /api/doctores/perfil/doctor
// @access  Private
exports.obtenerPerfil = async (req, res, next) => {
  try {
    // Buscar doctor por el ID del usuario autenticado
    const doctor = await Doctor.findOne({ usuario: req.usuario.id })
      .populate('usuario', '-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del doctor autenticado
// @route   PUT /api/doctores/perfil/doctor
// @access  Private
exports.actualizarPerfil = async (req, res, next) => {
  try {
    // Buscar doctor por el ID del usuario autenticado
    let doctor = await Doctor.findOne({ usuario: req.usuario.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Actualizar datos del doctor
    const { especialidad, experiencia, consultorio, horarios } = req.body;
    
    if (especialidad) doctor.especialidad = especialidad;
    if (experiencia) doctor.experiencia = experiencia;
    if (consultorio) doctor.consultorio = consultorio;
    if (horarios) doctor.horarios = horarios;

    await doctor.save();

    // Si se subió una foto, actualizarla en el usuario
    if (req.fotoUrl) {
      await Usuario.findByIdAndUpdate(req.usuario.id, {
        foto: req.fotoUrl
      });
    }

    // Obtener doctor actualizado con datos del usuario
    const doctorActualizado = await Doctor.findById(doctor._id)
      .populate('usuario', '-password');

    res.status(200).json({
      success: true,
      mensaje: 'Perfil actualizado exitosamente',
      data: doctorActualizado
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todos los doctores
// @route   GET /api/doctores
// @access  Public
exports.obtenerDoctores = async (req, res, next) => {
  try {
    const doctores = await Doctor.find()
      .populate({
        path: 'usuario',
        select: 'nombre apellido email foto especialidad'
      });

    res.status(200).json({
      success: true,
      count: doctores.length,
      data: doctores
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener doctor por ID
// @route   GET /api/doctores/:id
// @access  Public
exports.obtenerDoctorPorId = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate({
        path: 'usuario',
        select: 'nombre apellido email foto especialidad telefono'
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Cambiar estado de doctor (aprobado/rechazado)
// @route   PUT /api/doctores/:id/estado
// @access  Private (Admin)
exports.cambiarEstadoDoctor = async (req, res, next) => {
  try {
    const { estado } = req.body;
    
    // Validar que el estado sea válido
    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Estado inválido. Debe ser "aprobado" o "rechazado"'
      });
    }

    // Verificar que el usuario autenticado sea admin
    const usuarioAutenticado = await Usuario.findById(req.usuario.id);
    if (!usuarioAutenticado || usuarioAutenticado.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.'
      });
    }

    // Buscar el doctor
    const doctor = await Doctor.findById(req.params.id).populate('usuario');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Actualizar estado del usuario
    const usuarioDoctor = await Usuario.findById(doctor.usuario._id);
    usuarioDoctor.estado = estado;
    await usuarioDoctor.save();

    // Enviar email según el estado
    if (estado === 'aprobado') {
      await enviarEmailAprobacionDoctor(
        usuarioDoctor.email,
        usuarioDoctor.nombre + ' ' + usuarioDoctor.apellido
      );
    } else if (estado === 'rechazado') {
      await enviarEmailRechazoDoctor(
        usuarioDoctor.email,
        usuarioDoctor.nombre + ' ' + usuarioDoctor.apellido,
        req.body.motivo || 'No se proporcionó un motivo específico'
      );
    }

    res.status(200).json({
      success: true,
      mensaje: `Doctor ${estado} exitosamente`,
      data: {
        doctorId: doctor._id,
        nombre: usuarioDoctor.nombre + ' ' + usuarioDoctor.apellido,
        email: usuarioDoctor.email,
        estado: usuarioDoctor.estado
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener doctores pendientes de aprobación
// @route   GET /api/doctores/pendientes
// @access  Private (Admin)
exports.obtenerDoctoresPendientes = async (req, res, next) => {
  try {
    // Verificar que el usuario sea admin
    const usuarioAutenticado = await Usuario.findById(req.usuario.id);
    if (!usuarioAutenticado || usuarioAutenticado.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.'
      });
    }

    // Buscar usuarios con rol 'doctor' y estado 'pendiente'
    const usuariosPendientes = await Usuario.find({
      rol: 'doctor',
      estado: 'pendiente'
    }).select('_id nombre apellido email telefono cedula');

    // Extraer los IDs de los usuarios pendientes
    const usuarioIds = usuariosPendientes.map(usuario => usuario._id);

    // Buscar doctores cuyo usuario esté en la lista de pendientes
    const doctoresPendientes = await Doctor.find({
      usuario: { $in: usuarioIds }
    }).populate({
      path: 'usuario',
      select: 'nombre apellido email telefono cedula'
    });

    res.status(200).json({
      success: true,
      count: doctoresPendientes.length,
      data: doctoresPendientes
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener doctores aprobados
// @route   GET /api/doctores/aprobados
// @access  Public
exports.obtenerDoctoresAprobados = async (req, res, next) => {
  try {
    // Buscar usuarios con rol 'doctor', estado 'aprobado' y confirmado
    const usuariosAprobados = await Usuario.find({
      rol: 'doctor',
      estado: 'aprobado',
      confirmado: true
    }).select('_id nombre apellido email telefono foto especialidad');

    // Extraer los IDs de los usuarios aprobados
    const usuarioIds = usuariosAprobados.map(usuario => usuario._id);

    // Buscar doctores cuyo usuario esté en la lista de aprobados
    const doctoresAprobados = await Doctor.find({
      usuario: { $in: usuarioIds }
    }).populate({
      path: 'usuario',
      select: 'nombre apellido email telefono foto especialidad'
    });

    res.status(200).json({
      success: true,
      count: doctoresAprobados.length,
      data: doctoresAprobados
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar doctor
// @route   DELETE /api/doctores/:id
// @access  Private (Admin)
exports.eliminarDoctor = async (req, res, next) => {
  try {
    // Verificar que el usuario sea admin
    const usuarioAutenticado = await Usuario.findById(req.usuario.id);
    if (!usuarioAutenticado || usuarioAutenticado.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.'
      });
    }

    // Buscar el doctor
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Eliminar el usuario asociado (cascade eliminará el doctor)
    await Usuario.findByIdAndDelete(doctor.usuario);

    res.status(200).json({
      success: true,
      mensaje: 'Doctor eliminado exitosamente',
      data: {
        doctorId: doctor._id
      }
    });

  } catch (error) {
    next(error);
  }
};
