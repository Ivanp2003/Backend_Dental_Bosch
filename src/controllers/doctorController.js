const Doctor = require('../models/Doctor');
const Usuario = require('../models/Usuario');
const { validarCedula } = require('../utils/validators');
const cloudinary = require('../config/cloudinary');
const { enviarEmailAprobacionDoctor, enviarEmailRechazoDoctor } = require('../utils/email');

// @desc    Obtener perfil del doctor
// @route   GET /api/doctores/perfil
// @access  Private (Doctor)
exports.obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario || usuario.rol !== 'doctor') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de doctor.'
      });
    }

    const doctor = await Doctor.findOne({ usuario: usuario._id });
    
    const perfilDoctor = usuario.toObject();
    perfilDoctor.infoDoctor = doctor;

    res.status(200).json({
      success: true,
      data: perfilDoctor
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del doctor
// @route   PUT /api/doctores/perfil
// @access  Private (Doctor)
exports.actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, apellido, telefono, cedula, especialidad } = req.body;

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario || usuario.rol !== 'doctor') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de doctor.'
      });
    }

    // Validar cédula si se proporciona
    if (cedula && !validarCedula(cedula)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Cédula inválida'
      });
    }

    // Actualizar campos básicos
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (telefono) usuario.telefono = telefono;
    if (cedula) usuario.cedula = cedula;

    // Subir foto si se proporciona
    if (req.file) {
      try {
        // Subir a Cloudinary
        const resultado = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'dental-bosch/avatars',
              transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        usuario.foto = resultado.secure_url;
      } catch (error) {
        console.error('Error al subir imagen:', error);
        return res.status(500).json({
          success: false,
          mensaje: 'Error al subir la imagen'
        });
      }
    }

    await usuario.save();

    // Actualizar especialidad del doctor
    if (especialidad) {
      await Doctor.findOneAndUpdate(
        { usuario: usuario._id },
        { especialidad },
        { new: true }
      );
    }

    // Obtener datos actualizados del doctor
    const doctor = await Doctor.findOne({ usuario: usuario._id });
    const perfilActualizado = usuario.toObject();
    perfilActualizado.infoDoctor = doctor;

    res.status(200).json({
      success: true,
      mensaje: 'Perfil de doctor actualizado exitosamente',
      data: perfilActualizado
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
        select: 'nombre apellido email foto'
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
        select: 'nombre apellido email foto telefono cedula'
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
