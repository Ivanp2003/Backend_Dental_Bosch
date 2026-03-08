const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const { validarCedula } = require('../utils/validators');
const cloudinary = require('../config/cloudinary');

// @desc    Obtener perfil del paciente
// @route   GET /api/pacientes/perfil
// @access  Private (Paciente)
exports.obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario || usuario.rol !== 'paciente') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de paciente.'
      });
    }

    const paciente = await Paciente.findOne({ usuario: usuario._id });
    
    const perfilPaciente = usuario.toObject();
    perfilPaciente.infoPaciente = paciente;

    res.status(200).json({
      success: true,
      data: perfilPaciente
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del paciente
// @route   PUT /api/pacientes/perfil
// @access  Private (Paciente)
exports.actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, apellido, telefono, cedula } = req.body;

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario || usuario.rol !== 'paciente') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de paciente.'
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

    // Obtener datos actualizados del paciente
    const paciente = await Paciente.findOne({ usuario: usuario._id });
    const perfilActualizado = usuario.toObject();
    perfilActualizado.infoPaciente = paciente;

    res.status(200).json({
      success: true,
      mensaje: 'Perfil de paciente actualizado exitosamente',
      data: perfilActualizado
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todos los pacientes
// @route   GET /api/pacientes
// @access  Private (Doctor/Admin)
exports.obtenerPacientes = async (req, res, next) => {
  try {
    const pacientes = await Paciente.find()
      .populate({
        path: 'usuario',
        select: 'nombre apellido email foto telefono cedula'
      });

    res.status(200).json({
      success: true,
      count: pacientes.length,
      data: pacientes
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener paciente por ID
// @route   GET /api/pacientes/:id
// @access  Private (Doctor/Admin)
exports.obtenerPacientePorId = async (req, res, next) => {
  try {
    const paciente = await Paciente.findById(req.params.id)
      .populate({
        path: 'usuario',
        select: 'nombre apellido email foto telefono cedula'
      });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: paciente
    });

  } catch (error) {
    next(error);
  }
};
