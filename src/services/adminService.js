const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const Cita = require('../models/Cita');
const bcrypt = require('bcryptjs');

class AdminService {
  // 📝 NOTA: Los doctores ahora crean sus propias cuentas a través del endpoint de registro
// El administrador solo aprueba/rechaza las solicitudes pendientes

  // ✏️ ACTUALIZAR DOCTOR CON TRANSACCIÓN
  static async actualizarDoctor(doctorId, datosActualizacion) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { datosUsuario, datosDoctor } = datosActualizacion;

      // Verificar que el doctor exista
      const doctor = await Doctor.findById(doctorId).populate('usuario').session(session);
      if (!doctor) {
        throw new Error('Doctor no encontrado');
      }

      // Actualizar datos de usuario si se proporcionan
      if (datosUsuario) {
        if (datosUsuario.email && datosUsuario.email !== doctor.usuario.email) {
          const emailExistente = await Usuario.findOne({ 
            email: datosUsuario.email, 
            _id: { $ne: doctor.usuario._id } 
          }).session(session);
          
          if (emailExistente) {
            throw new Error('El email ya está registrado');
          }
        }

        await Usuario.findByIdAndUpdate(doctor.usuario._id, datosUsuario, { session });
      }

      // Actualizar datos de doctor si se proporcionan
      if (datosDoctor) {
        await Doctor.findByIdAndUpdate(doctorId, datosDoctor, { session });
      }

      await session.commitTransaction();

      // Obtener datos actualizados
      const doctorActualizado = await Doctor.findById(doctorId)
        .populate('usuario', 'nombre apellido email telefono estado activo');

      return doctorActualizado;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 🔄 CAMBIAR ESTADO DE DOCTOR CON REASIGNACIÓN DE CITAS
  static async cambiarEstadoDoctor(doctorId, nuevoEstado, opciones = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const doctor = await Doctor.findById(doctorId).populate('usuario').session(session);
      if (!doctor) {
        throw new Error('Doctor no encontrado');
      }

      const estadoAnterior = doctor.activo;
      doctor.activo = nuevoEstado;
      await doctor.save({ session });

      // También actualizar el estado del usuario si es necesario
      if (doctor.usuario) {
        await Usuario.findByIdAndUpdate(
          doctor.usuario._id,
          { estado: nuevoEstado ? 'aprobado' : 'rechazado' },
          { session }
        );
      }

      let citasReasignadas = 0;

      // Si se desactiva el doctor, reasignar citas pendientes
      if (!nuevoEstado && estadoAnterior) {
        const { reasignarA, reasignacionAutomatica } = opciones;
        
        const citasPendientes = await Cita.find({
          doctor: doctorId,
          estado: { $in: ['pendiente', 'confirmada'] },
          fecha: { $gte: new Date() }
        }).session(session);

        if (citasPendientes.length > 0) {
          if (reasignarA) {
            // Reasignación manual
            await this._reasignarCitasInternas(citasPendientes, reasignarA, session);
          } else if (reasignacionAutomatica) {
            // Reasignación automática
            await this._reasignacionAutomaticaCitasInternas(citasPendientes, doctor.especialidad, session);
          } else {
            throw new Error('Hay citas pendientes. Debe especificar una reasignación');
          }
          citasReasignadas = citasPendientes.length;
        }
      }

      await session.commitTransaction();

      // Obtener datos actualizados fuera de la transacción
      const doctorActualizado = await Doctor.findById(doctorId)
        .populate('usuario', 'nombre apellido email telefono estado');

      // Si se está aprobando al doctor, enviar correo de bienvenida
      if (nuevoEstado && doctorActualizado.usuario) {
        try {
          const { enviarEmailAprobacionDoctor } = require('../utils/email');
          await enviarEmailAprobacionDoctor(
            doctorActualizado.usuario.email,
            `${doctorActualizado.usuario.nombre} ${doctorActualizado.usuario.apellido}`,
            doctorActualizado.especialidad
          );
          console.log('📧 Correo de aprobación enviado al doctor:', doctorActualizado.usuario.email);
        } catch (emailError) {
          console.error('⚠️ Error enviando correo de aprobación:', emailError.message);
          // No fallar la operación principal si el correo falla
        }
      }

      return {
        doctor: doctorActualizado,
        citasReasignadas
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 🔁 REASIGNAR CITAS A OTRO DOCTOR (FUNCIÓN PÚBLICA CON TRANSACCIÓN)
  static async reasignarCitas(citas, nuevoDoctorId, session) {
    try {
      // Verificar que el nuevo doctor exista y esté activo
      const nuevoDoctor = await Doctor.findOne({ 
        _id: nuevoDoctorId, 
        activo: true 
      }).session(session);

      if (!nuevoDoctor) {
        throw new Error('El doctor de destino no existe o está inactivo');
      }

      // Actualizar todas las citas
      const citaIds = citas.map(cita => cita._id);
      await Cita.updateMany(
        { _id: { $in: citaIds } },
        { 
          doctor: nuevoDoctorId,
          estado: 'pendiente', // Resetear a pendiente
          confirmada: false,
          notas: `Cita reasignada automáticamente. ${citas[0]?.notas || ''}`
        },
        { session }
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  // 🔁 REASIGNAR CITAS INTERNAS (SIN TRANSACCIÓN PROPIA)
  static async _reasignarCitasInternas(citas, nuevoDoctorId, session) {
    // Verificar que el nuevo doctor exista y esté activo
    const nuevoDoctor = await Doctor.findOne({ 
      _id: nuevoDoctorId, 
      activo: true 
    }).session(session);

    if (!nuevoDoctor) {
      throw new Error('El doctor de destino no existe o está inactivo');
    }

    // Actualizar todas las citas
    const citaIds = citas.map(cita => cita._id);
    await Cita.updateMany(
      { _id: { $in: citaIds } },
      { 
        doctor: nuevoDoctorId,
        estado: 'pendiente', // Resetear a pendiente
        confirmada: false,
        notas: `Cita reasignada automáticamente. ${citas[0]?.notas || ''}`
      },
      { session }
    );
  }

  // 🤖 REASIGNACIÓN AUTOMÁTICA DE CITAS (FUNCIÓN PÚBLICA CON TRANSACCIÓN)
  static async reasignacionAutomaticaCitas(citas, especialidad, session) {
    try {
      // Buscar doctores disponibles con la misma especialidad
      const doctoresDisponibles = await Doctor.find({
        especialidad,
        activo: true,
        _id: { $ne: citas[0].doctor } // Excluir doctor original
      }).session(session);

      if (doctoresDisponibles.length === 0) {
        throw new Error('No hay doctores disponibles para la reasignación automática');
      }

      // Distribuir citas equitativamente entre doctores disponibles
      const citasPorDoctor = Math.ceil(citas.length / doctoresDisponibles.length);
      
      for (let i = 0; i < citas.length; i++) {
        const doctorIndex = Math.floor(i / citasPorDoctor);
        const doctorAsignado = doctoresDisponibles[doctorIndex] || doctoresDisponibles[0];
        
        await Cita.findByIdAndUpdate(
          citas[i]._id,
          {
            doctor: doctorAsignado._id,
            estado: 'pendiente',
            confirmada: false,
            notas: `Cita reasignada automáticamente. ${citas[i].notas || ''}`
          },
          { session }
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // 🤖 REASIGNACIÓN AUTOMÁTICA DE CITAS (FUNCIÓN INTERNA SIN TRANSACCIÓN PROPIA)
  static async _reasignacionAutomaticaCitasInternas(citas, especialidad, session) {
    // Buscar doctores disponibles con la misma especialidad
    const doctoresDisponibles = await Doctor.find({
      especialidad,
      activo: true,
      _id: { $ne: citas[0].doctor } // Excluir doctor original
    }).session(session);

    if (doctoresDisponibles.length === 0) {
      throw new Error('No hay doctores disponibles para la reasignación automática');
    }

    // Distribuir citas equitativamente entre doctores disponibles
    const citasPorDoctor = Math.ceil(citas.length / doctoresDisponibles.length);
    
    for (let i = 0; i < citas.length; i++) {
      const doctorIndex = Math.floor(i / citasPorDoctor);
      const doctorAsignado = doctoresDisponibles[doctorIndex] || doctoresDisponibles[0];
      
      await Cita.findByIdAndUpdate(
        citas[i]._id,
        {
          doctor: doctorAsignado._id,
          estado: 'pendiente',
          confirmada: false,
          notas: `Cita reasignada automáticamente. ${citas[i].notas || ''}`
        },
        { session }
      );
    }
  }

  // 🕐 ACTUALIZAR HORARIO DE DOCTOR
  static async actualizarHorarioDoctor(doctorId, horarioAtencion) {
    try {
      // Validaciones de formato
      for (const horario of horarioAtencion) {
        const { dia, horaInicio, horaFin } = horario;
        
        // Validar formato de hora
        const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
          throw new Error('Formato de hora inválido. Use HH:MM');
        }

        // Validar que horaFin sea posterior a horaInicio
        const inicio = horaInicio.split(':');
        const fin = horaFin.split(':');
        const inicioMinutos = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
        const finMinutos = parseInt(fin[0]) * 60 + parseInt(fin[1]);
        
        if (finMinutos <= inicioMinutos) {
          throw new Error('La hora de fin debe ser posterior a la hora de inicio');
        }
      }

      // Verificar que no haya solapamiento interno
      const dias = horarioAtencion.map(h => h.dia);
      const diasUnicos = [...new Set(dias)];
      
      if (dias.length !== diasUnicos.length) {
        throw new Error('No se puede definir más de un horario para el mismo día');
      }

      const doctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { horarioAtencion },
        { new: true, runValidators: true }
      ).populate('usuario', 'nombre apellido email');

      if (!doctor) {
        throw new Error('Doctor no encontrado');
      }

      return doctor;

    } catch (error) {
      throw error;
    }
  }

  // 📋 LISTAR DOCTORES CON FILTROS
  static async listarDoctores(filtros = {}) {
    try {
      const { estado, especialidad, page = 1, limit = 10 } = filtros;

      const query = {};
      if (estado !== undefined) query.activo = estado === 'true';
      if (especialidad) query.especialidad = new RegExp(especialidad, 'i');

      const doctores = await Doctor.find(query)
        .populate('usuario', 'nombre apellido email telefono estado')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Doctor.countDocuments(query);

      return {
        doctores,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDocs: total,
          limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // 🔍 OBTENER DETALLE DE DOCTOR
  static async obtenerDetalleDoctor(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId)
        .populate('usuario', 'nombre apellido email telefono estado createdAt')
        .lean();

      if (!doctor) {
        throw new Error('Doctor no encontrado');
      }

      // Obtener estadísticas de citas
      const statsCitas = await Cita.aggregate([
        { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const citasStats = statsCitas.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      // Obtener citas próximas
      const citasProximas = await Cita.find({
        doctor: doctorId,
        fecha: { $gte: new Date() },
        estado: { $in: ['pendiente', 'confirmada'] }
      })
      .populate('paciente', 'usuario')
      .populate('paciente.usuario', 'nombre apellido')
      .sort({ fecha: 1, horaInicio: 1 })
      .limit(5);

      return {
        ...doctor,
        citasStats,
        citasProximas
      };

    } catch (error) {
      throw error;
    }
  }

  // 👁️ OBTENER TODAS LAS CITAS DEL SISTEMA
  static async obtenerTodasLasCitas(filtros = {}) {
    try {
      const { doctor, fecha, estado, page = 1, limit = 10 } = filtros;

      const query = {};
      if (doctor) query.doctor = doctor;
      if (estado) query.estado = estado;
      if (fecha) {
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);
        query.fecha = { $gte: fechaInicio, $lt: fechaFin };
      }

      const citas = await Cita.find(query)
        .populate('paciente', 'usuario')
        .populate('doctor', 'usuario especialidad')
        .populate('paciente.usuario', 'nombre apellido email')
        .populate('doctor.usuario', 'nombre apellido')
        .sort({ fecha: -1, horaInicio: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Cita.countDocuments(query);

      return {
        citas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDocs: total,
          limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // 🧑‍⚕️ GESTIÓN DE PACIENTES
  static async listarPacientes(filtros = {}) {
    try {
      const { page = 1, limit = 10, busqueda } = filtros;

      let query = {};
      
      if (busqueda) {
        const usuarios = await Usuario.find({
          $or: [
            { nombre: new RegExp(busqueda, 'i') },
            { apellido: new RegExp(busqueda, 'i') },
            { email: new RegExp(busqueda, 'i') }
          ],
          rol: 'paciente'
        }).select('_id');
        
        query.usuario = { $in: usuarios.map(u => u._id) };
      }

      const pacientes = await Paciente.find(query)
        .populate('usuario', 'nombre apellido email telefono createdAt')
        .populate('doctorAsignado', 'usuario especialidad')
        .populate('doctorAsignado.usuario', 'nombre apellido')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Paciente.countDocuments(query);

      return {
        pacientes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDocs: total,
          limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // 🔍 OBTENER DETALLE DE PACIENTE
  static async obtenerDetallePaciente(pacienteId) {
    try {
      const paciente = await Paciente.findById(pacienteId)
        .populate('usuario', 'nombre apellido email telefono createdAt estado')
        .populate('doctorAsignado', 'usuario especialidad')
        .populate('doctorAsignado.usuario', 'nombre apellido email')
        .lean();

      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }

      // Obtener historial de citas
      const historialCitas = await Cita.find({
        paciente: pacienteId
      })
      .populate('doctor', 'usuario especialidad')
      .populate('doctor.usuario', 'nombre apellido')
      .sort({ fecha: -1, horaInicio: -1 })
      .limit(10);

      // Estadísticas de citas
      const statsCitas = await Cita.aggregate([
        { $match: { paciente: new mongoose.Types.ObjectId(pacienteId) } },
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const citasStats = statsCitas.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      return {
        ...paciente,
        historialCitas,
        citasStats
      };

    } catch (error) {
      throw error;
    }
  }

  // 🔗 CAMBIAR DOCTOR ASIGNADO A PACIENTE
  static async cambiarDoctorAsignado(pacienteId, nuevoDoctorId) {
    try {
      // Validar paciente
      const paciente = await Paciente.findById(pacienteId);
      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }

      // Validar doctor
      const doctor = await Doctor.findOne({ _id: nuevoDoctorId, activo: true });
      if (!doctor) {
        throw new Error('Doctor no encontrado o inactivo');
      }

      // Actualizar paciente
      const pacienteActualizado = await Paciente.findByIdAndUpdate(
        pacienteId,
        { doctorAsignado: nuevoDoctorId },
        { new: true }
      ).populate('doctorAsignado', 'usuario especialidad')
       .populate('doctorAsignado.usuario', 'nombre apellido');

      return pacienteActualizado;

    } catch (error) {
      throw error;
    }
  }

  // 📊 OBTENER ESTADÍSTICAS DEL SISTEMA
  static async obtenerEstadisticas() {
    try {
      const [
        totalUsuarios,
        totalDoctores,
        totalPacientes,
        totalCitas,
        doctoresActivos,
        citasHoy,
        citasEstaSemana
      ] = await Promise.all([
        Usuario.countDocuments(),
        Doctor.countDocuments(),
        Paciente.countDocuments(),
        Cita.countDocuments(),
        Doctor.countDocuments({ activo: true }),
        Cita.countDocuments({
          fecha: new Date(new Date().setHours(0,0,0,0)),
          estado: { $in: ['pendiente', 'confirmada'] }
        }),
        Cita.countDocuments({
          fecha: {
            $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
            $lte: new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay())))
          },
          estado: { $in: ['pendiente', 'confirmada'] }
        })
      ]);

      // Estadísticas por especialidad
      const statsEspecialidad = await Doctor.aggregate([
        {
          $group: {
            _id: '$especialidad',
            count: { $sum: 1 },
            activos: {
              $sum: { $cond: ['$activo', 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        generales: {
          totalUsuarios,
          totalDoctores,
          totalPacientes,
          totalCitas,
          doctoresActivos
        },
        citas: {
          citasHoy,
          citasEstaSemana
        },
        especialidades: statsEspecialidad
      };

    } catch (error) {
      throw error;
    }
  }

  // 🗑️ ELIMINAR DOCTOR (SOFT DELETE)
  static async eliminarDoctor(doctorId) {
    try {
      console.log('🗑️ Eliminando doctor:', doctorId);

      // Buscar doctor
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor no encontrado');
      }

      // Soft delete: marcar como inactivo
      await Doctor.findByIdAndUpdate(doctorId, { activo: false });

      // Opcional: también marcar usuario como inactivo
      await Usuario.findByIdAndUpdate(doctor.usuario, { activo: false });

      console.log('✅ Doctor eliminado (soft delete)');
      return { doctorId, eliminado: true };

    } catch (error) {
      console.error('❌ Error eliminando doctor:', error);
      throw error;
    }
  }

  // 🔄 REASIGNAR CITAS DE DOCTOR
  static async reasignarCitasDoctor(doctorId, opciones) {
    try {
      console.log('🔄 Reasignando citas del doctor:', doctorId);

      const { doctorDestino, reasignarTodas = false } = opciones;

      // Buscar citas del doctor
      const filtro = { doctor: doctorId };
      if (!reasignarTodas) {
        filtro.estado = { $in: ['pendiente', 'confirmada'] };
      }

      const citas = await Cita.find(filtro);
      console.log(`📋 Encontradas ${citas.length} citas para reasignar`);

      // Reasignar citas
      const resultado = await Cita.updateMany(
        filtro,
        { doctor: doctorDestino }
      );

      console.log('✅ Citas reasignadas exitosamente');
      return {
        citasReasignadas: resultado.modifiedCount,
        doctorOrigen: doctorId,
        doctorDestino
      };

    } catch (error) {
      console.error('❌ Error reasignando citas:', error);
      throw error;
    }
  }

  // 🔍 VER DETALLE DE CITA
  static async obtenerDetalleCita(citaId) {
    try {
      console.log('🔍 Obteniendo detalle de cita:', citaId);

      const cita = await Cita.findById(citaId)
        .populate('doctor', 'especialidad')
        .populate('paciente', 'nombre apellido email telefono')
        .populate('doctor.usuario', 'nombre apellido');

      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      return cita;

    } catch (error) {
      console.error('❌ Error obteniendo detalle de cita:', error);
      throw error;
    }
  }

  // 🔄 REASIGNAR CITA MANUALMENTE
  static async reasignarCita(citaId, datos) {
    try {
      console.log('🔄 Reasignando cita:', citaId);

      const { doctorId, fecha, horaInicio } = datos;

      // Buscar cita
      const cita = await Cita.findById(citaId);
      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      // Actualizar datos de la cita
      const actualizacion = {};
      if (doctorId) actualizacion.doctor = doctorId;
      if (fecha) actualizacion.fecha = new Date(fecha);
      if (horaInicio) actualizacion.horaInicio = horaInicio;

      const citaActualizada = await Cita.findByIdAndUpdate(
        citaId,
        actualizacion,
        { new: true }
      ).populate('doctor', 'especialidad')
       .populate('paciente', 'nombre apellido email');

      console.log('✅ Cita reasignada exitosamente');
      return citaActualizada;

    } catch (error) {
      console.error('❌ Error reasignando cita:', error);
      throw error;
    }
  }

  // 🗑️ ELIMINAR PACIENTE (SOFT DELETE)
  static async eliminarPaciente(pacienteId) {
    try {
      console.log('🗑️ Eliminando paciente:', pacienteId);

      // Buscar paciente
      const paciente = await Paciente.findById(pacienteId);
      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }

      // Soft delete: marcar como inactivo
      await Paciente.findByIdAndUpdate(pacienteId, { activo: false });

      // Opcional: también marcar usuario como inactivo
      await Usuario.findByIdAndUpdate(paciente.usuario, { activo: false });

      console.log('✅ Paciente eliminado (soft delete)');
      return { pacienteId, eliminado: true };

    } catch (error) {
      console.error('❌ Error eliminando paciente:', error);
      throw error;
    }
  }
}

module.exports = AdminService;
