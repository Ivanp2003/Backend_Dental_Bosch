const Doctor = require('../models/Doctor');
const Usuario = require('../models/Usuario');
const mongoose = require('mongoose');
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
    console.log('🔍 Iniciando actualización de perfil para doctor:', req.usuario.id);
    
    // Buscar doctor por el ID del usuario autenticado
    let doctor = await Doctor.findOne({ usuario: req.usuario.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Sanitizar y validar datos de entrada
    const { sanitizarDatosPerfil, validarActualizacionPerfil } = require('../utils/validators');
    const datosSanitizados = sanitizarDatosPerfil(req.body);
    
    // Validar datos del perfil para rol 'doctor'
    const validacion = validarActualizacionPerfil(datosSanitizados, 'doctor');
    
    if (!validacion.esValido) {
      return res.status(400).json({
        success: false,
        mensaje: 'Error en la validación de datos del perfil',
        errores: validacion.errores
      });
    }

    // Actualizar datos del doctor
    const { especialidad, experiencia, consultorio, horarios } = datosSanitizados;
    
    if (especialidad) doctor.especialidad = especialidad.trim();
    if (experiencia) doctor.experiencia = experiencia.trim();
    if (consultorio) doctor.consultorio = consultorio.trim();
    if (horarios) doctor.horarios = horarios;

    await doctor.save();

    // Actualizar datos del usuario si se proporcionaron
    const usuarioActualizado = {};
    if (datosSanitizados.nombre) usuarioActualizado.nombre = datosSanitizados.nombre;
    if (datosSanitizados.apellido) usuarioActualizado.apellido = datosSanitizados.apellido;
    if (datosSanitizados.email) usuarioActualizado.email = datosSanitizados.email;
    if (datosSanitizados.telefono) usuarioActualizado.telefono = datosSanitizados.telefono;

    if (Object.keys(usuarioActualizado).length > 0) {
      await Usuario.findByIdAndUpdate(req.usuario.id, usuarioActualizado);
      console.log('✅ Datos de usuario actualizados:', Object.keys(usuarioActualizado));
    }

    // Si se subió una foto válida, actualizarla en el usuario
    if (req.fotoUrl && req.fotoUrl.trim() !== '') {
      console.log('📸 Actualizando foto del doctor:', req.fotoUrl);
      await Usuario.findByIdAndUpdate(req.usuario.id, {
        foto: req.fotoUrl
      });
    } else {
      console.log('📷 No se proporcionó foto válida, manteniendo la actual');
    }

    // Obtener doctor actualizado con datos del usuario
    const doctorActualizado = await Doctor.findById(doctor._id)
      .populate('usuario', '-password');

    console.log('✅ Perfil de doctor actualizado exitosamente');

    res.status(200).json({
      success: true,
      mensaje: 'Perfil actualizado exitosamente',
      data: doctorActualizado
    });

  } catch (error) {
    console.error('❌ Error en actualizarPerfil doctor:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

// @desc    Obtener todos los doctores
// @route   GET /api/doctores
// @access  Public
exports.obtenerDoctores = async (req, res, next) => {
  try {
    console.log('🔍 Buscando todos los doctores...');
    
    // Primero ver todos los doctores sin filtro
    const todosDoctores = await Doctor.find({})
      .populate({
        path: 'usuario',
        select: 'nombre apellido email foto especialidad estado'
      });
    
    console.log(`📋 Total doctores en BD: ${todosDoctores.length}`);
    todosDoctores.forEach((doc, index) => {
      console.log(`${index + 1}. Doctor ID: ${doc._id}, Activo: ${doc.activo}, Usuario: ${doc.usuario?.nombreCompleto || 'NULL'}, Estado Usuario: ${doc.usuario?.estado || 'NULL'}`);
    });

    // Ahora aplicar filtros
    const doctores = await Doctor.find({ activo: true })
      .populate({
        path: 'usuario',
        select: 'nombre apellido email foto especialidad estado'
      });

    console.log(`📋 Doctores activos: ${doctores.length}`);

    // Filtrar doctores que tienen usuario (sin importar el estado)
    const doctoresValidos = doctores.filter(doctor => 
      doctor.usuario !== null
    );

    console.log(`📋 Doctores con usuario: ${doctoresValidos.length}`);

    // Limpiar campos obsoletos y formatear para frontend
    const doctoresLimpios = doctoresValidos.map(doctor => {
      const doctorObj = doctor.toObject();
      delete doctorObj.calificacionPromedio;
      delete doctorObj.totalCalificaciones;
      
      // Formatear para que coincida con lo que espera el frontend
      return {
        ...doctorObj,
        nombreCompleto: doctor.usuario?.nombreCompleto || `${doctor.usuario?.nombre || ''} ${doctor.usuario?.apellido || ''}`.trim(),
        nombre: doctor.usuario?.nombre || '',
        apellido: doctor.usuario?.apellido || '',
        email: doctor.usuario?.email,
        telefono: doctor.usuario?.telefono,
        cedula: doctor.usuario?.cedula,
        estado: doctor.usuario?.estado,
        createdAt: doctor.usuario?.createdAt,
        // Eliminar campos anidados que el frontend no necesita
        usuario: undefined
      };
    });

    res.status(200).json({
      success: true,
      count: doctoresLimpios.length,
      data: doctoresLimpios
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
        select: 'nombre apellido email telefono cedula estado confirmado createdAt'
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Limpiar campos obsoletos si existen
    const doctorObj = doctor.toObject();
    delete doctorObj.calificacionPromedio;
    delete doctorObj.totalCalificaciones;

    // Formatear respuesta para el ModalDetalle y frontend
    const respuesta = {
      ...doctorObj,
      // Información del usuario para el modal (formato que espera el frontend)
      nombreCompleto: doctor.usuario?.nombreCompleto || `${doctor.usuario?.nombre || ''} ${doctor.usuario?.apellido || ''}`.trim(),
      nombre: doctor.usuario?.nombre || '',
      apellido: doctor.usuario?.apellido || '',
      email: doctor.usuario?.email,
      telefono: doctor.usuario?.telefono,
      cedula: doctor.usuario?.cedula,
      estado: doctor.usuario?.estado,
      confirmado: doctor.usuario?.confirmado,
      createdAt: doctor.usuario?.createdAt, // Para compatibilidad con frontend
      fechaRegistro: doctor.usuario?.createdAt, // Para el modal
      // Información del doctor
      especialidad: doctor.especialidad,
      horarioAtencion: doctor.horarioAtencion || [],
      activo: doctor.activo,
      // Eliminar campos que el frontend no necesita
      usuario: undefined // No enviar el objeto usuario anidado
    };

    res.status(200).json({
      success: true,
      data: respuesta
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
    console.log(' Iniciando obtenerDoctoresPendientes...');
    console.log(' Usuario autenticado:', req.usuario);
    
    // Verificar que el usuario sea admin
    const usuarioAutenticado = await Usuario.findById(req.usuario.id);
    console.log('Usuario de BD:', usuarioAutenticado);
    
    if (!usuarioAutenticado || usuarioAutenticado.rol !== 'admin') {
      console.log('Usuario no es admin o no encontrado');
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.'
      });
    }

    console.log(' Usuario admin verificado, buscando usuarios pendientes...');

    // Buscar usuarios con rol 'doctor' y estado 'pendiente'
    const usuariosPendientes = await Usuario.find({
      rol: 'doctor',
      estado: 'pendiente'
    }).select('_id nombre apellido email telefono cedula');

    console.log('Usuarios pendientes encontrados:', usuariosPendientes.length);
    console.log('IDs de usuarios pendientes:', usuariosPendientes.map(u => u._id));

    // Extraer los IDs de los usuarios pendientes
    const usuarioIds = usuariosPendientes.map(usuario => usuario._id);

    // Buscar doctores cuyo usuario esté en la lista de pendientes
    const doctoresPendientes = await Doctor.find({
      usuario: { $in: usuarioIds }
    }).populate({
      path: 'usuario',
      select: 'nombre apellido email telefono cedula'
    });

    console.log(' Doctores pendientes encontrados:', doctoresPendientes.length);

    // Formatear doctores pendientes para el frontend
    const doctoresFormateados = doctoresPendientes.map(doctor => {
      const doctorObj = doctor.toObject();
      delete doctorObj.calificacionPromedio;
      delete doctorObj.totalCalificaciones;
      
      return {
        ...doctorObj,
        nombreCompleto: doctor.usuario?.nombreCompleto || `${doctor.usuario?.nombre || ''} ${doctor.usuario?.apellido || ''}`.trim(),
        nombre: doctor.usuario?.nombre || '',
        apellido: doctor.usuario?.apellido || '',
        email: doctor.usuario?.email,
        telefono: doctor.usuario?.telefono,
        cedula: doctor.usuario?.cedula,
        estado: doctor.usuario?.estado,
        createdAt: doctor.usuario?.createdAt,
        // Eliminar campos anidados
        usuario: undefined
      };
    });

    res.status(200).json({
      success: true,
      count: doctoresPendientes.length,
      datos: { doctores: doctoresFormateados }, // Formato que espera el frontend
      data: doctoresFormateados // Para compatibilidad
    });

  } catch (error) {
    console.log(' Error en obtenerDoctoresPendientes:', error);
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

// @desc    Desactivar doctor (cambiar estado activo a false)
// @route   DELETE /api/doctores/:id
// @access  Private (Admin)
exports.eliminarDoctor = async (req, res, next) => {
  try {
    console.log('🔍 Iniciando eliminarDoctor');
    console.log('ID del doctor a eliminar:', req.params.id);
    console.log('Usuario autenticado:', req.usuario.id);
    
    // Verificar que el usuario sea admin
    const usuarioAutenticado = await Usuario.findById(req.usuario.id);
    if (!usuarioAutenticado || usuarioAutenticado.rol !== 'admin') {
      console.log('❌ Usuario no es admin:', usuarioAutenticado?.rol);
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.'
      });
    }

    console.log('✅ Usuario verificado como admin');

    // Buscar el doctor con su usuario
    const doctor = await Doctor.findById(req.params.id).populate('usuario');
    if (!doctor) {
      console.log('❌ Doctor no encontrado con ID:', req.params.id);
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    console.log('✅ Doctor encontrado:', doctor._id);

    // Verificar si el doctor ya está inactivo
    if (!doctor.activo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El doctor ya se encuentra inactivo'
      });
    }

    // Verificar si tiene citas activas (pendientes o confirmadas)
    const Cita = require('../models/Cita');
    console.log('🔍 Buscando citas del doctor:', doctor._id);
    
    const citasActivas = await Cita.find({
      doctor: doctor._id,
      fecha: { $gte: new Date() },
      estado: { $in: ['pendiente', 'pendiente_confirmacion_paciente', 'confirmada'] }
    }).populate('paciente', 'nombre apellido');

    console.log('📊 Citas activas encontradas:', citasActivas.length);
    console.log('📅 Detalles de citas:', citasActivas.map(c => ({
      id: c._id,
      estado: c.estado,
      fecha: c.fecha,
      horaInicio: c.horaInicio
    })));

    if (citasActivas.length > 0) {
      console.log('❌ Doctor tiene citas activas, no se puede desactivar');
      return res.status(409).json({
        success: false,
        mensaje: 'No se puede desactivar el doctor. Tiene citas activas (pendientes o confirmadas).',
        datos: {
          totalCitasActivas: citasActivas.length,
          citas: citasActivas.map(cita => ({
            id: cita._id,
            fecha: cita.fecha,
            horaInicio: cita.horaInicio,
            estado: cita.estado
          }))
        }
      });
    }

    // Cambiar estado activo del doctor a false
    doctor.activo = false;
    await doctor.save();

    // Cambiar estado del usuario a inactivo
    const usuarioDoctor = await Usuario.findById(doctor.usuario._id);
    usuarioDoctor.estado = 'inactivo';
    await usuarioDoctor.save();

    res.status(200).json({
      success: true,
      mensaje: 'Doctor desactivado exitosamente',
      data: {
        doctorId: doctor._id,
        nombre: `${usuarioDoctor.nombre} ${usuarioDoctor.apellido}`,
        email: usuarioDoctor.email,
        activo: doctor.activo,
        estadoUsuario: usuarioDoctor.estado // 'inactivo'
      }
    });

  } catch (error) {
    console.error('❌ Error en eliminarDoctor:', error);
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    next(error);
  }
};

// @desc    Reactivar doctor (cambiar estado activo a true)
// @route   PUT /api/doctores/:id/reactivar
// @access  Private (Admin)
exports.reactivarDoctor = async (req, res, next) => {
  try {
    // Verificar que el usuario sea admin
    const usuarioAutenticado = await Usuario.findById(req.usuario.id);
    if (!usuarioAutenticado || usuarioAutenticado.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.'
      });
    }

    // Buscar el doctor con su usuario
    const doctor = await Doctor.findById(req.params.id).populate('usuario');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Verificar si el doctor ya está activo
    if (doctor.activo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El doctor ya se encuentra activo'
      });
    }

    // Cambiar estado activo del doctor a true
    doctor.activo = true;
    await doctor.save();

    // También cambiar estado del usuario a aprobado
    const usuarioDoctor = await Usuario.findById(doctor.usuario._id);
    usuarioDoctor.estado = 'aprobado';
    await usuarioDoctor.save();

    res.status(200).json({
      success: true,
      mensaje: 'Doctor reactivado exitosamente',
      data: {
        doctorId: doctor._id,
        nombre: `${usuarioDoctor.nombre} ${usuarioDoctor.apellido}`,
        email: usuarioDoctor.email,
        activo: doctor.activo,
        estadoUsuario: usuarioDoctor.estado
      }
    });

  } catch (error) {
    console.error('❌ Error en reactivarDoctor:', error);
    next(error);
  }
};

// @desc    Obtener pacientes del doctor autenticado
// @route   GET /api/doctores/mis-pacientes
// @access  Private (Doctor)
exports.obtenerMisPacientes = async (req, res, next) => {
  try {
    // Obtener doctor del usuario autenticado
    const doctor = await Doctor.findOne({ usuario: req.usuario.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de doctor no encontrado'
      });
    }

    // Buscar citas del doctor para obtener sus pacientes
    const Cita = require('../models/Cita');
    const citas = await Cita.find({ doctor: doctor._id })
      .populate('paciente')
      .populate('paciente.usuario', 'nombre apellido email telefono')
      .sort({ fecha: -1 });

    // Extraer pacientes únicos de las citas
    const pacientesUnicos = new Map();
    citas.forEach(cita => {
      if (cita.paciente && cita.paciente.usuario) {
        const pacienteId = cita.paciente._id.toString();
        if (!pacientesUnicos.has(pacienteId)) {
          pacientesUnicos.set(pacienteId, {
            _id: cita.paciente._id,
            nombre: cita.paciente.usuario.nombre,
            apellido: cita.paciente.usuario.apellido,
            email: cita.paciente.usuario.email,
            telefono: cita.paciente.usuario.telefono,
            fechaUltimaCita: cita.fecha,
            totalCitas: 1
          });
        } else {
          // Actualizar última fecha y contar citas
          const paciente = pacientesUnicos.get(pacienteId);
          if (cita.fecha > paciente.fechaUltimaCita) {
            paciente.fechaUltimaCita = cita.fecha;
          }
          paciente.totalCitas++;
        }
      }
    });

    const pacientes = Array.from(pacientesUnicos.values());

    res.status(200).json({
      success: true,
      mensaje: 'Pacientes obtenidos exitosamente',
      count: pacientes.length,
      data: pacientes
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener citas del doctor autenticado (versión simplificada para el perfil)
// @route   GET /api/doctores/mis-citas
// @access  Private (Doctor)
exports.obtenerMisCitas = async (req, res, next) => {
  try {
    // Obtener doctor del usuario autenticado
    const doctor = await Doctor.findOne({ usuario: req.usuario.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de doctor no encontrado'
      });
    }

    const { estado, desde, hasta, page = 1, limit = 10 } = req.query;
    
    // Usar el servicio existente para obtener citas
    const CitasService = require('../services/citasService');
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
    next(error);
  }
};

// @desc    Cambiar estado de cita (finalizar o cancelar)
// @route   PUT /api/doctores/citas/:id/estado
// @access  Private (Doctor)
exports.cambiarEstadoCita = async (req, res, next) => {
  try {
    // Obtener doctor del usuario autenticado
    const doctor = await Doctor.findOne({ usuario: req.usuario.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Perfil de doctor no encontrado'
      });
    }

    const { id } = req.params;
    const { estado, motivoCancelacion, notas } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cita inválido'
      });
    }

    // Validar estados permitidos (solo pendiente, finalizada, cancelada)
    const estadosPermitidos = ['pendiente', 'finalizada', 'cancelada'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Estado no válido. Estados permitidos: ' + estadosPermitidos.join(', ')
      });
    }

    // Verificar que la cita pertenezca al doctor
    const Cita = require('../models/Cita');
    const cita = await Cita.findById(id);
    
    if (!cita) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cita no encontrada'
      });
    }

    if (cita.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        mensaje: 'Solo puedes modificar el estado de tus propias citas'
      });
    }

    // Usar el servicio para actualizar el estado
    const CitasService = require('../services/citasService');
    let citaActualizada;

    if (estado === 'cancelada') {
      if (!motivoCancelacion || motivoCancelacion.trim().length === 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'El motivo de cancelación es obligatorio'
        });
      }
      citaActualizada = await CitasService.cancelarCita(id, motivoCancelacion, 'doctor');
    } else if (estado === 'finalizada') {
      citaActualizada = await CitasService.finalizarCita(id, notas);
    } else {
      citaActualizada = await CitasService.actualizarEstadoCita(id, estado, notas, 'doctor');
    }

    res.status(200).json({
      success: true,
      mensaje: `Cita ${estado === 'finalizada' ? 'finalizada' : estado === 'cancelada' ? 'cancelada' : 'actualizada'} exitosamente`,
      datos: citaActualizada
    });

  } catch (error) {
    console.error('❌ Error en cambiarEstadoCita:', error);
    
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

// @desc    Actualizar doctor (solo admin)
// @route   PUT /api/doctores/:id
// @access  Private/Admin
exports.actualizarDoctor = async (req, res, next) => {
  try {
    console.log('🔧 Actualizando doctor con ID:', req.params.id);
    console.log('📋 Datos a actualizar:', req.body);

    // Buscar el doctor
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Doctor no encontrado'
      });
    }

    // Actualizar campos del doctor
    const camposActualizar = {};
    
    // Actualizar especialidad si se proporciona
    if (req.body.especialidad) {
      camposActualizar.especialidad = req.body.especialidad;
    }
    
    // Actualizar horario de atención si se proporciona
    if (req.body.horarioAtencion) {
      camposActualizar.horarioAtencion = req.body.horarioAtencion;
    }
    
    // Actualizar estado activo si se proporciona
    if (req.body.activo !== undefined) {
      camposActualizar.activo = req.body.activo;
    }

    // Actualizar doctor
    doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      camposActualizar,
      { new: true, runValidators: true }
    ).populate('usuario', 'nombre apellido email telefono');

    console.log('✅ Doctor actualizado exitosamente');

    res.status(200).json({
      success: true,
      mensaje: 'Doctor actualizado exitosamente',
      data: doctor
    });

  } catch (error) {
    console.error('❌ Error actualizando doctor:', error);
    next(error);
  }
};

// Las funciones ya están exportadas con exports.nombreFuncion
// No se necesita module.exports adicional
