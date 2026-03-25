const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const { generarJWT, generarToken, hashToken } = require('../utils/tokens');
const { 
  enviarEmailConfirmacion, 
  enviarEmailRecuperacion, 
  enviarEmailBienvenida 
} = require('../utils/email');
const { validarEmail, validarCedula } = require('../utils/validators');
const { generarAvatarPorRol } = require('../utils/avatarUtils');

// @desc    Registro de usuario (Doctor o Paciente)
// @route   POST /api/auth/registro
// @access  Public
exports.registro = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rol, cedula, telefono, especialidad } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos son requeridos'
      });
    }

    // Validar email
    if (!validarEmail(email)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email inválido'
      });
    }

    // Validar cédula si se proporciona
    if (cedula && !validarCedula(cedula)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Cédula inválida'
      });
    }

    // Si es doctor, requerir especialidad
    if (rol === 'doctor' && !especialidad) {
      return res.status(400).json({
        success: false,
        mensaje: 'La especialidad es requerida para doctores'
      });
    }

    // Verificar si el email ya existe
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya está registrado'
      });
    }

    // Generar token de confirmación
    const tokenConfirmacion = generarToken();
    console.log('Token generado:', tokenConfirmacion);

    // Generar avatar automático si no se proporciona
    const avatar = generarAvatarPorRol(rol || 'paciente', nombre, apellido);

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password,
      rol: rol || 'paciente',
      cedula,
      telefono,
      foto: avatar, // Avatar generado automáticamente
      tokenConfirmacion: tokenConfirmacion // Guardar token original, no hasheado
    });
    
    console.log(' Usuario creado con tokenConfirmacion:', !!usuario.tokenConfirmacion);

    // Crear registro adicional según el rol
    if (usuario.rol === 'doctor') {
      await Doctor.create({
        usuario: usuario._id,
        especialidad
      });
    } else {
      await Paciente.create({
        usuario: usuario._id
      });
    }

    // Enviar email de confirmación
    await enviarEmailConfirmacion(email, nombre, tokenConfirmacion);

    res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado. Revisa tu email para confirmar tu cuenta.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Confirmar cuenta mediante token
// @route   GET /api/auth/confirmar/:token
// @access  Public
exports.confirmarCuenta = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Buscar usuario por token original (no hasheado)
    const usuario = await Usuario.findOne({
      tokenConfirmacion: token
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'Token inválido o expirado'
      });
    }

    // Confirmar cuenta
    usuario.confirmado = true;
    usuario.tokenConfirmacion = undefined;
    await usuario.save();

    // Enviar email de bienvenida
    await enviarEmailBienvenida(usuario.email, usuario.nombre, usuario.rol);

    res.status(200).json({
      success: true,
      mensaje: 'Cuenta confirmada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Solicitar recuperación de contraseña
// @route   POST /api/auth/recuperar-password
// @access  Public
exports.recuperarPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'No existe un usuario con ese email'
      });
    }

    // Generar token de recuperación
    const tokenRecuperacion = generarToken();

    // Guardar token original con expiración de 1 hora
    usuario.tokenRecuperacion = tokenRecuperacion; // Token original, no hasheado
    usuario.tokenExpiracion = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // Enviar email
    await enviarEmailRecuperacion(email, usuario.nombre, tokenRecuperacion);

    res.status(200).json({
      success: true,
      mensaje: 'Revisa tu email para restablecer tu contraseña'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Restablecer contraseña
// @route   POST /api/auth/restablecer-password/:token
// @access  Public
exports.restablecerPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Buscar usuario por token original (no hasheado)
    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      tokenExpiracion: { $gt: Date.now() }
    }).select('+password');

    if (!usuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'Token inválido o expirado'
      });
    }

    // Establecer nueva contraseña
    usuario.password = password;
    usuario.tokenRecuperacion = undefined;
    usuario.tokenExpiracion = undefined;
    await usuario.save();

    res.status(200).json({
      success: true,
      mensaje: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Por favor ingrese email y contraseña'
      });
    }

    // Buscar usuario con password
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        success: false,
        token: null,
        mensaje: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordValido = await usuario.compararPassword(password);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        token: null,
        mensaje: 'Credenciales inválidas'
      });
    }

    // Verificar que la cuenta esté confirmada
    if (!usuario.confirmado) {
      return res.status(403).json({
        success: false,
        token: null,
        mensaje: 'Debes confirmar tu cuenta antes de iniciar sesión'
      });
    }

    // Generar token
    const token = generarJWT(usuario._id);

    // Remover password de la respuesta
    usuario.password = undefined;

    res.status(200).json({
      success: true,
      token,
      usuario,
      mensaje: 'Login exitoso'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener perfil del usuario (genérico)
// @route   GET /api/auth/perfil
// @access  Private
exports.obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: usuario
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Actualizar contraseña
// @route   PUT /api/auth/actualizar-password
// @access  Private
exports.actualizarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        success: false,
        mensaje: 'Por favor ingrese la contraseña actual y la nueva'
      });
    }

    // Obtener usuario con password
    const usuario = await Usuario.findById(req.usuario.id).select('+password');

    // Verificar contraseña actual
    const passwordValido = await usuario.compararPassword(passwordActual);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        mensaje: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    usuario.password = passwordNuevo;
    await usuario.save();

    res.status(200).json({
      success: true,
      mensaje: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login con Google - Callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res, next) => {
  try {
    // El usuario ya fue autenticado por Passport
    const usuario = req.user;

    // Generar token JWT
    const token = generarJWT(usuario._id);

    // Redirigir al frontend con el token
    res.redirect(`${process.env.URL_FRONTEND}auth/google/callback?token=${token}`);

  } catch (error) {
    next(error);
  }
};

// @desc    Verificar token
// @route   GET /api/auth/verificar-token
// @access  Private
exports.verificarToken = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      mensaje: 'Token válido',
      usuario: req.usuario
    });
  } catch (error) {
    next(error);
  }
};

