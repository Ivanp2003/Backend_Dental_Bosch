const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const { generarJWT, generarToken, hashToken, generarCodigoRecuperacion } = require('../utils/tokens');
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
    const { 
  nombre, 
  apellido, 
  email, 
  password, 
  rol, 
  cedula, 
  telefono, 
  especialidad,
  fechaNacimiento,
  genero,
  direccion,
  contactoEmergencia,
  infoMedica
} = req.body;

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

    // No generar token de confirmación - auto-confirmar
    console.log('Creando usuario sin confirmación por token');

    // Generar avatar automático si no se proporciona
    const avatar = generarAvatarPorRol(rol || 'paciente', nombre, apellido);

    // Encriptar contraseña antes de crear el usuario
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario - los doctores quedan pendientes de aprobación
    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password: passwordHash,
      rol: rol || 'paciente',
      cedula,
      telefono,
      foto: avatar, // Avatar generado automáticamente
      // Los doctores quedan pendientes de aprobación por admin pero confirmados
      estado: rol === 'doctor' ? 'pendiente' : 'aprobado',
      confirmado: true // Auto-confirmar todas las cuentas
    });
    
    console.log(' Usuario creado sin tokenConfirmacion:', !!usuario.confirmado);

    // Crear registro adicional según el rol
    if (usuario.rol === 'doctor') {
      await Doctor.create({
        usuario: usuario._id,
        especialidad
      });
    } else {
      // Validar campos requeridos para paciente
      if (!fechaNacimiento || !genero || !direccion || !contactoEmergencia) {
        return res.status(400).json({
          success: false,
          mensaje: [
            !fechaNacimiento ? "La fecha de nacimiento es obligatoria" : null,
            !genero ? "El género es obligatorio" : null,
            !direccion?.calle ? "La calle es obligatoria" : null,
            !direccion?.ciudad ? "La ciudad es obligatoria" : null,
            !direccion?.provincia ? "La provincia es obligatoria" : null,
            !contactoEmergencia?.nombre ? "El nombre del contacto de emergencia es obligatorio" : null,
            !contactoEmergencia?.telefono ? "El teléfono del contacto de emergencia es obligatorio" : null,
            !contactoEmergencia?.parentesco ? "El parentesco es obligatorio" : null
          ].filter(Boolean)
        });
      }

      await Paciente.create({
        usuario: usuario._id,
        fechaNacimiento,
        genero,
        direccion,
        contactoEmergencia,
        infoMedica: infoMedica || {}
      });
    }

    // Enviar email de bienvenida directamente (sin confirmación)
    await enviarEmailBienvenida(email, nombre, rol);

    // Mensaje diferente según el rol
    let mensaje = 'Usuario registrado exitosamente';
    if (rol === 'doctor') {
      mensaje = 'Solicitud de registro de doctor enviada. Tu cuenta está pendiente de aprobación por el administrador.';
    }

    res.status(201).json({
      success: true,
      mensaje
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Confirmar cuenta (deprecated - ya no se usa)
// @route   GET /api/auth/confirmar/:token
// @access  Public
exports.confirmarCuenta = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      mensaje: 'La confirmación por email ya no es necesaria. Las cuentas se confirman automáticamente al registrarse.'
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

    console.log('📧 Solicitud de recuperación de contraseña para:', email);

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      console.log('❌ Usuario no encontrado con email:', email);
      return res.status(404).json({
        success: false,
        mensaje: 'No existe un usuario con ese email'
      });
    }

    // Generar código de 6 dígitos
    const codigoRecuperacion = generarCodigoRecuperacion();
    console.log('🔐 Código generado:', codigoRecuperacion);

    // Guardar código con expiración de 15 minutos
    usuario.tokenRecuperacion = codigoRecuperacion;
    usuario.tokenExpiracion = Date.now() + 900000; // 15 minutos
    await usuario.save();
    console.log('✅ Código guardado en BD para usuario:', email);

    // Enviar email con código
    console.log('📤 Enviando email de recuperación a:', email);
    await enviarEmailRecuperacion(email, usuario.nombre, codigoRecuperacion);
    console.log('✅ Email enviado exitosamente a:', email);

    res.status(200).json({
      success: true,
      mensaje: 'Revisa tu email para obtener el código de recuperación',
      // Solo para desarrollo, remover en producción
      ...(process.env.NODE_ENV === 'development' && { codigoRecuperacion })
    });

  } catch (error) {
    console.error('❌ Error en recuperarPassword:', error.message);
    next(error);
  }
};

// @desc    Verificar código de recuperación
// @route   POST /api/auth/verificar-codigo
// @access  Public
exports.verificarCodigoRecuperacion = async (req, res, next) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El código de verificación es requerido'
      });
    }

    // Buscar usuario con el código de recuperación
    const usuario = await Usuario.findOne({
      tokenRecuperacion: codigo
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'Código de verificación inválido'
      });
    }

    // Verificar que el código no haya expirado
    if (Date.now() > usuario.tokenExpiracion) {
      return res.status(400).json({
        success: false,
        mensaje: 'El código de verificación ha expirado'
      });
    }

    // Código válido pero no expirado
    res.status(200).json({
      success: true,
      mensaje: 'Código verificado correctamente',
      datos: {
        email: usuario.email,
        nombre: usuario.nombre,
        verificado: true
      }
    });

  } catch (error) {
    console.error('❌ Error en verificarCodigoRecuperacion:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al verificar el código'
    });
  }
};

// @desc    Restablecer contraseña con código
// @route   POST /api/auth/restablecer-password
// @access  Public
exports.restablecerPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const codigo = req.params.codigo || req.body.codigo;

    if (!codigo || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'El código y la nueva contraseña son requeridos'
      });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario por código y verificar que no esté expirado
    const usuario = await Usuario.findOne({
      tokenRecuperacion: codigo,
      tokenExpiracion: { $gt: Date.now() }
    }).select('+password');

    if (!usuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'Código inválido o expirado'
      });
    }

    // Encriptar nueva contraseña antes de guardar
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Establecer nueva contraseña encriptada
    usuario.password = passwordHash;
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

    // Verificar que los doctores estén aprobados
    if (usuario.rol === 'doctor' && usuario.estado !== 'aprobado') {
      let mensaje = 'Tu cuenta de doctor está pendiente de aprobación por el administrador.';
      if (usuario.estado === 'rechazado') {
        mensaje = 'Tu cuenta de doctor ha sido rechazada. Por favor contacta al administrador.';
      }
      return res.status(403).json({
        success: false,
        token: null,
        mensaje
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

    // Si es paciente, obtener datos adicionales
    if (usuario.rol === 'paciente') {
      const paciente = await Paciente.findOne({ usuario: usuario._id })
        .populate('doctorAsignado', 'nombre apellido especialidad telefono email');

      if (paciente) {
        // Combinar datos de usuario con datos específicos de paciente
        const perfilCompleto = {
          ...usuario.toObject(),
          // Datos específicos del paciente
          fechaNacimiento: paciente.fechaNacimiento,
          genero: paciente.genero,
          direccion: paciente.direccion,
          contactoEmergencia: paciente.contactoEmergencia,
          doctorAsignado: paciente.doctorAsignado,
          infoMedica: paciente.infoMedica,
          // Datos adicionales útiles
          edad: paciente.edad
        };

        return res.status(200).json({
          success: true,
          data: perfilCompleto
        });
      }
    }

    // Si es doctor, obtener datos adicionales
    if (usuario.rol === 'doctor') {
      const doctor = await Doctor.findOne({ usuario: usuario._id });

      if (doctor) {
        const perfilCompleto = {
          ...usuario.toObject(),
          // Datos específicos del doctor
          especialidad: doctor.especialidad,
          experiencia: doctor.experiencia,
          consultorio: doctor.consultorio,
          horarioAtencion: doctor.horarioAtencion
        };

        return res.status(200).json({
          success: true,
          data: perfilCompleto
        });
      }
    }

    // Para admin o si no encuentra datos específicos
    res.status(200).json({
      success: true,
      data: usuario
    });

  } catch (error) {
    console.error('❌ Error en obtenerPerfil:', error);
    next(error);
  }
};


// @desc    Actualizar contraseña
// @route   PUT /api/auth/actualizar-password
// @access  Private
exports.actualizarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    console.log('🔐 Iniciando actualización de contraseña para usuario:', req.usuario.id);

    // Usar validaciones mejoradas
    const { validarActualizacionPassword } = require('../utils/validators');
    const validacion = validarActualizacionPassword(passwordActual, passwordNuevo);

    if (!validacion.esValido) {
      return res.status(400).json({
        success: false,
        mensaje: 'Error en la validación de contraseñas',
        errores: validacion.errores
      });
    }

    // Obtener usuario con password
    const usuario = await Usuario.findById(req.usuario.id).select('+password');
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const passwordValido = await usuario.compararPassword(passwordActual);

    if (!passwordValido) {
      console.log('❌ Contraseña actual incorrecta para usuario:', req.usuario.id);
      return res.status(401).json({
        success: false,
        mensaje: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña antes de actualizar
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordNuevo, salt);

    // Actualizar contraseña encriptada
    usuario.password = passwordHash;
    await usuario.save();

    console.log('✅ Contraseña actualizada exitosamente para usuario:', req.usuario.id);

    res.status(200).json({
      success: true,
      mensaje: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en actualizarPassword:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar la contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

// @desc    Login con Google desde React Native / Expo (mobile)
// @route   POST /api/auth/google/mobile
// @access  Public
// El cliente móvil envía el { id_token } obtenido con expo-auth-session
exports.googleMobileLogin = async (req, res, next) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({
        success: false,
        mensaje: 'Se requiere el id_token de Google'
      });
    }

    // Verificar el id_token con Google (sin librerías extra)
    const fetch = require('node-fetch');
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );

    if (!googleRes.ok) {
      return res.status(401).json({
        success: false,
        mensaje: 'id_token de Google inválido o expirado'
      });
    }

    const payload = await googleRes.json();

    // Verificar que el token fue emitido para nuestra app
    // (acepta el Web Client ID y los clients Android/iOS del mismo proyecto)
    const allowedClients = [
      process.env.GOOGLE_CLIENT_ID,           // Web Client ID (ya existente)
      process.env.GOOGLE_CLIENT_ID_ANDROID,   // Android Client ID (nuevo)
      process.env.GOOGLE_CLIENT_ID_IOS,       // iOS Client ID (nuevo, opcional)
    ].filter(Boolean); // ignora los que no estén definidos

    if (!allowedClients.includes(payload.aud)) {
      return res.status(401).json({
        success: false,
        mensaje: 'id_token no pertenece a esta aplicación'
      });
    }

    const emailGoogle = payload.email;
    if (!emailGoogle) {
      return res.status(400).json({
        success: false,
        mensaje: 'No se pudo obtener el email de la cuenta de Google'
      });
    }

    const nombre   = payload.given_name  || emailGoogle.split('@')[0];
    const apellido = payload.family_name || 'Google';
    const googleId = payload.sub;
    const foto     = payload.picture || null;

    // --- Misma lógica que passport.js ---

    // 1. Buscar por googleId
    let usuario = await Usuario.findOne({ googleId });
    if (usuario) {
      const token = generarJWT(usuario._id);
      return res.status(200).json({ success: true, token, usuario, esNuevo: false });
    }

    // 2. Buscar por email y vincular
    usuario = await Usuario.findOne({ email: emailGoogle });
    if (usuario) {
      usuario.googleId  = googleId;
      usuario.confirmado = true;
      if (foto) usuario.foto = foto;
      await usuario.save();

      const pacienteExiste = await Paciente.findOne({ usuario: usuario._id });
      if (!pacienteExiste && usuario.rol === 'paciente') {
        await Paciente.create({ usuario: usuario._id });
      }

      const token = generarJWT(usuario._id);
      return res.status(200).json({ success: true, token, usuario, esNuevo: false });
    }

    // 3. Crear nuevo usuario
    usuario = await Usuario.create({
      nombre,
      apellido,
      email: emailGoogle,
      googleId,
      foto,
      rol: 'paciente',
      confirmado: true,
      estado: 'aprobado'
    });

    try {
      await Paciente.create({ usuario: usuario._id });
    } catch (pacienteError) {
      if (pacienteError.code !== 11000) {
        console.error('Error al crear Paciente (Google Mobile):', pacienteError.message);
      }
    }

    const token = generarJWT(usuario._id);
    return res.status(201).json({ success: true, token, usuario, esNuevo: true });

  } catch (error) {
    console.error('❌ Error en googleMobileLogin:', error.message);
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

    // Normalizar URL_FRONTEND: asegurar que siempre tenga "/" al final
    const frontendUrl = (process.env.URL_FRONTEND || '').replace(/\/$/, '');

    // Si el usuario se acaba de crear con Google, redirigirlo al perfil
    // para que actualice su nombre, apellido y datos personales
    if (usuario.esNuevo) {
      return res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&nuevo=true`);
    }

    // Usuario existente: redirección normal al callback del frontend
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);

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

// @desc    Guardar push token de Expo para notificaciones
// @route   PATCH /api/auth/push-token
// @access  Private (cualquier usuario autenticado)
exports.guardarPushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({
        success: false,
        mensaje: 'Push token es requerido'
      });
    }

    if (!pushToken.startsWith('ExponentPushToken[')) {
      return res.status(400).json({
        success: false,
        mensaje: 'Push token inválido. Debe ser un ExponentPushToken válido'
      });
    }

    await Usuario.findByIdAndUpdate(req.usuario.id, { pushToken });

    res.status(200).json({
      success: true,
      mensaje: 'Push token guardado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del usuario (genérico: nombre, apellido, telefono)
// @route   PUT /api/auth/perfil
// @access  Private
exports.actualizarPerfil = async (req, res, next) => {
  try {
    const { sanitizarDatosPerfil, validarActualizacionPerfil } = require('../utils/validators');
    const datosSanitizados = sanitizarDatosPerfil(req.body);
    
    const validacion = validarActualizacionPerfil(datosSanitizados, req.usuario.rol);
    if (!validacion.esValido) {
      return res.status(400).json({
        success: false,
        mensaje: 'Error en la validación de datos del perfil',
        errores: validacion.errores
      });
    }

    const camposActualizables = {};
    if (datosSanitizados.nombre) camposActualizables.nombre = datosSanitizados.nombre;
    if (datosSanitizados.apellido) camposActualizables.apellido = datosSanitizados.apellido;
    if (datosSanitizados.telefono) camposActualizables.telefono = datosSanitizados.telefono;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      camposActualizables,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuarioActualizado) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Perfil actualizado exitosamente',
      data: usuarioActualizado
    });

  } catch (error) {
    console.error('Error en actualizarPerfil:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};


