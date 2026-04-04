const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

// ✅ REGISTRAR PACIENTE
const registrarPaciente = async (req, res) => {
  try {
    console.log('🆕 Iniciando registro de paciente');
    
    // Validar campos obligatorios
    const { 
      nombre, 
      apellido, 
      cedula, 
      telefono, 
      email, 
      fechaNacimiento, 
      genero,
      direccion 
    } = req.body;

    if (!nombre || !apellido || !cedula || !telefono || !email || !fechaNacimiento || !genero || !direccion) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos obligatorios deben ser completados',
        camposObligatorios: [
          'nombre', 'apellido', 'cedula', 'telefono', 
          'email', 'fechaNacimiento', 'genero', 'direccion'
        ]
      });
    }

    // Validar que el usuario no exista
    const usuarioExistente = await Usuario.findOne({ 
      $or: [{ email }, { cedula }] 
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        mensaje: 'El email o cédula ya están registrados',
        tipo: email === usuarioExistente.email ? 'email' : 'cedula'
      });
    }

    // Validar que el paciente no exista
    const pacienteExistente = await Paciente.findOne({ 
      $or: [{ email }, { cedula }] 
    });

    if (pacienteExistente) {
      return res.status(400).json({
        success: false,
        mensaje: 'El paciente ya está registrado en el sistema',
        tipo: email === pacienteExistente.email ? 'email' : 'cedula'
      });
    }

    // Crear usuario primero
    const password = Math.random().toString(36).slice(-8); // Contraseña temporal
    const hashedPassword = await require('bcryptjs').hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      cedula,
      telefono,
      email,
      password: hashedPassword,
      rol: 'paciente',
      confirmado: true, // Pacientes se confirman automáticamente
      foto: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombre[0] + apellido[0]) + '&background=10B981&color=ffffff&size=200&bold=true'
    });

    // Crear paciente asociado
    const nuevoPaciente = await Paciente.create({
      ...req.body,
      usuario: nuevoUsuario._id,
      fechaRegistro: new Date()
    });

    // Poblar datos para respuesta
    const pacienteCompleto = await Paciente.findById(nuevoPaciente._id)
      .populate('usuario', 'nombre apellido email telefono cedula foto')
      .populate('doctorAsignado', 'nombre apellido especialidad');

    // Enviar email con credenciales (opcional)
    try {
      const { enviarEmailBienvenida } = require('../utils/email');
      await enviarEmailBienvenida(email, `${nombre} ${apellido}`, 'paciente');
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError);
    }

    res.status(201).json({
      success: true,
      mensaje: 'Paciente registrado exitosamente',
      datos: {
        paciente: pacienteCompleto,
        credenciales: {
          email,
          passwordTemporal: password
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en registrarPaciente:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        mensaje: 'Error de validación',
        errores
      });
    }

    // Manejar error de duplicado
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        mensaje: `El ${campo} ya está registrado`,
        campo
      });
    }

    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ LISTAR PACIENTES
const listarPacientes = async (req, res) => {
  try {
    console.log('📋 Iniciando listado de pacientes');
    
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      doctorAsignado,
      busqueda,
      sortBy = 'fechaRegistro',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado) {
      filtros.estado = estado;
    }
    
    if (doctorAsignado) {
      filtros.doctorAsignado = doctorAsignado;
    }

    // Búsqueda avanzada
    if (busqueda) {
      const criterios = Paciente.buscarPorTermino(busqueda).getQuery();
      Object.assign(filtros, criterios);
    }

    // Opciones de paginación
    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'usuario', select: 'nombre apellido email telefono cedula foto' },
        { path: 'doctorAsignado', select: 'nombre apellido especialidad' }
      ]
    };

    const pacientes = await Paciente.paginate(filtros, opciones);

    res.status(200).json({
      success: true,
      mensaje: 'Pacientes listados exitosamente',
      datos: {
        pacientes: pacientes.docs,
        pagination: {
          currentPage: pacientes.page,
          totalPages: pacientes.totalPages,
          totalDocs: pacientes.totalDocs,
          limit: pacientes.limit,
          hasNextPage: pacientes.hasNextPage,
          hasPrevPage: pacientes.hasPrevPage
        }
      }
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

// ✅ VISUALIZAR DETALLE DEL PACIENTE
const obtenerPacientePorId = async (req, res) => {
  try {
    console.log('🔍 Obteniendo detalle del paciente:', req.params.id);
    
    const { id } = req.params;

    // Validar ID de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    const paciente = await Paciente.findById(id)
      .populate('usuario', 'nombre apellido email telefono cedula foto')
      .populate('doctorAsignado', 'nombre apellido especialidad telefono email')
      .populate('historialClinico', 'fecha diagnostico tratamiento')
      .populate('citas', 'fecha hora estado motivo')
      .populate('tratamientos', 'nombre estado fechaInicio fechaFin');

    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Paciente encontrado exitosamente',
      datos: paciente
    });

  } catch (error) {
    console.error('❌ Error en obtenerPacientePorId:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ ACTUALIZAR INFORMACIÓN DEL PACIENTE
const actualizarPaciente = async (req, res) => {
  try {
    console.log('🔄 Actualizando paciente:', req.params.id);
    
    const { id } = req.params;

    // Validar ID de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Verificar que el paciente exista
    const pacienteExistente = await Paciente.findById(id);
    if (!pacienteExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    // Validar duplicados en email y cédula
    if (req.body.email || req.body.cedula) {
      const pacienteDuplicado = await Paciente.findOne({
        _id: { $ne: id },
        $or: [
          ...(req.body.email ? [{ email: req.body.email }] : []),
          ...(req.body.cedula ? [{ cedula: req.body.cedula }] : [])
        ]
      });

      if (pacienteDuplicado) {
        return res.status(400).json({
          success: false,
          mensaje: 'El email o cédula ya están registrados en otro paciente',
          tipo: pacienteDuplicado.email === req.body.email ? 'email' : 'cedula'
        });
      }
    }

    // Actualizar usuario asociado si se modifican campos de usuario
    if (req.body.email || req.body.telefono || req.body.nombre || req.body.apellido) {
      const usuarioActualizado = {};
      if (req.body.email) usuarioActualizado.email = req.body.email;
      if (req.body.telefono) usuarioActualizado.telefono = req.body.telefono;
      if (req.body.nombre) usuarioActualizado.nombre = req.body.nombre;
      if (req.body.apellido) usuarioActualizado.apellido = req.body.apellido;

      await Usuario.findByIdAndUpdate(pacienteExistente.usuario, usuarioActualizado);
    }

    // Actualizar paciente
    const pacienteActualizado = await Paciente.findByIdAndUpdate(
      id,
      { ...req.body, ultimaVisita: new Date() },
      { new: true, runValidators: true }
    ).populate('usuario', 'nombre apellido email telefono cedula foto')
     .populate('doctorAsignado', 'nombre apellido especialidad');

    res.status(200).json({
      success: true,
      mensaje: 'Paciente actualizado exitosamente',
      datos: pacienteActualizado
    });

  } catch (error) {
    console.error('❌ Error en actualizarPaciente:', error);
    
    // Manejar errores de validación
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        mensaje: 'Error de validación',
        errores
      });
    }

    // Manejar error de duplicado
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        mensaje: `El ${campo} ya está registrado`,
        campo
      });
    }

    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ ELIMINAR PACIENTE
const eliminarPaciente = async (req, res) => {
  try {
    console.log('🗑️ Eliminando paciente:', req.params.id);
    
    const { id } = req.params;

    // Validar ID de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente inválido'
      });
    }

    // Verificar que el paciente exista
    const pacienteExistente = await Paciente.findById(id);
    if (!pacienteExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Paciente no encontrado'
      });
    }

    // Eliminar usuario asociado
    await Usuario.findByIdAndDelete(pacienteExistente.usuario);

    // Eliminar paciente (esto también eliminará las referencias en otras colecciones si se configuran correctamente)
    await Paciente.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      mensaje: 'Paciente eliminado exitosamente',
      datos: {
        id,
        nombreCompleto: `${pacienteExistente.nombre} ${pacienteExistente.apellido}`
      }
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

// ✅ CONSULTAR PERFIL DEL PACIENTE (para el paciente autenticado)
const obtenerPerfilPaciente = async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil del paciente autenticado');
    
    // Buscar paciente por el usuario autenticado
    const paciente = await Paciente.findOne({ usuario: req.usuario.id })
      .populate('usuario', 'nombre apellido email telefono cedula foto')
      .populate('doctorAsignado', 'nombre apellido especialidad telefono email')
      .populate('citas', 'fecha hora estado motivo')
      .populate('tratamientos', 'nombre estado fechaInicio');

    if (!paciente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de paciente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Perfil obtenido exitosamente',
      datos: paciente
    });

  } catch (error) {
    console.error('❌ Error en obtenerPerfilPaciente:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ BÚSQUEDA AVANZADA DE PACIENTES
const buscarPacientes = async (req, res) => {
  try {
    console.log('🔍 Búsqueda avanzada de pacientes');
    
    const {
      nombre,
      apellido,
      cedula,
      email,
      estado,
      doctorAsignado,
      fechaNacimientoDesde,
      fechaNacimientoHasta,
      page = 1,
      limit = 10,
      sortBy = 'fechaRegistro',
      sortOrder = 'desc'
    } = req.query;

    // Construir criterios de búsqueda
    const criterios = {};
    
    if (nombre) criterios.nombre = nombre;
    if (apellido) criterios.apellido = apellido;
    if (cedula) criterios.cedula = cedula;
    if (email) criterios.email = email;
    if (estado) criterios.estado = estado;
    if (doctorAsignado) criterios.doctorAsignado = doctorAsignado;

    // Búsqueda por rango de fechas
    if (fechaNacimientoDesde || fechaNacimientoHasta) {
      criterios.fechaNacimiento = {};
      if (fechaNacimientoDesde) {
        criterios.fechaNacimiento.$gte = new Date(fechaNacimientoDesde);
      }
      if (fechaNacimientoHasta) {
        criterios.fechaNacimiento.$lte = new Date(fechaNacimientoHasta);
      }
    }

    // Realizar búsqueda
    const pacientes = await Paciente.buscarPorCriterios(criterios)
      .populate('usuario', 'nombre apellido email telefono cedula foto')
      .populate('doctorAsignado', 'nombre apellido especialidad')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Contar total para paginación
    const total = await Paciente.buscarPorCriterios(criterios).countDocuments();

    res.status(200).json({
      success: true,
      mensaje: 'Búsqueda realizada exitosamente',
      datos: {
        pacientes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalDocs: total,
          limit: parseInt(limit),
          hasNextPage: (parseInt(page) * parseInt(limit)) < total,
          hasPrevPage: parseInt(page) > 1
        },
        criteriosBusqueda: criterios
      }
    });

  } catch (error) {
    console.error('❌ Error en buscarPacientes:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ ASIGNAR DOCTOR A PACIENTE
const asignarDoctor = async (req, res) => {
  try {
    console.log('👨‍⚕️ Asignando doctor a paciente');
    
    const { id } = req.params;
    const { doctorId } = req.body;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de paciente o doctor inválido'
      });
    }

    // Verificar que el doctor exista y esté aprobado
    const doctor = await Doctor.findOne({ 
      _id: doctorId, 
      estado: 'aprobado' 
    }).populate('usuario', 'nombre apellido');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado o no está aprobado'
      });
    }

    // Actualizar paciente
    const pacienteActualizado = await Paciente.findByIdAndUpdate(
      id,
      { doctorAsignado: doctorId },
      { new: true }
    ).populate('doctorAsignado', 'nombre apellido especialidad');

    res.status(200).json({
      success: true,
      mensaje: 'Doctor asignado exitosamente',
      datos: pacienteActualizado
    });

  } catch (error) {
    console.error('❌ Error en asignarDoctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registrarPaciente,
  listarPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  eliminarPaciente,
  obtenerPerfilPaciente,
  buscarPacientes,
  asignarDoctor,
  // Mantener compatibilidad con código existente
  obtenerPerfil: obtenerPerfilPaciente,
  actualizarPerfil: actualizarPaciente
};
