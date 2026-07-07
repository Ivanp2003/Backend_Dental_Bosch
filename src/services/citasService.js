const Cita = require('../models/Cita');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const HistorialClinico = require('../models/HistorialClinico');
const Usuario = require('../models/Usuario');
const CitasDTO = require('../utils/citasDTO');
const mongoose = require('mongoose');

class CitasService {
  // Validar disponibilidad de doctor
  static async validarDisponibilidadDoctor(doctorId, fecha, horaInicio, horaFin, excluirCitaId = null) {
    try {
      // Verificar que el doctor exista y esté activo
      const doctor = await Doctor.findOne({ _id: doctorId, activo: true })
        .populate('usuario', 'nombre apellido');
      
      if (!doctor) {
        throw new Error('Doctor no encontrado o inactivo');
      }

      // Verificar que el doctor trabaje ese día y horario (usando UTC para evitar desfasajes y quitando acentos)
      let diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
      diaSemana = diaSemana.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const horarioDia = doctor.horarioAtencion.find(h => h.dia === diaSemana && h.disponible);
      
      if (!horarioDia) {
        throw new Error(`El doctor no atiende los ${diaSemana}`);
      }

      // Verificar que la hora esté dentro del horario de atención
      if (horaInicio < horarioDia.horaInicio || horaFin > horarioDia.horaFin) {
        throw new Error(`La hora solicitada está fuera del horario de atención (${horarioDia.horaInicio} - ${horarioDia.horaFin})`);
      }

      // Verificar que no haya citas solapadas
      const disponible = await Cita.verificarDisponibilidad(doctorId, fecha, horaInicio, horaFin, excluirCitaId);
      
      if (!disponible) {
        throw new Error('El doctor ya tiene una cita programada en ese horario');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Validar que el paciente no tenga cita duplicada (solo para pacientes)
  static async validarCitaPaciente(pacienteId, fecha, horaInicio, excluirCitaId = null) {
    try {
      const query = {
        paciente: pacienteId,
        fecha: new Date(fecha),
        estado: { $in: ['pendiente'] }
      };

      if (excluirCitaId) {
        query._id = { $ne: excluirCitaId };
      }

      const citaExistente = await Cita.findOne(query);
      
      if (citaExistente) {
        throw new Error('El paciente ya tiene una cita programada para ese día');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Validar restricción diaria solo para pacientes
  static async validarRestriccionDiariaPaciente(pacienteId, fecha, rolUsuario) {
    try {
      // Si es doctor, no aplicar restricción
      if (rolUsuario === 'doctor') {
        return true;
      }

      // Si es paciente, verificar que no tenga más de una cita por día
      const citasDelDia = await Cita.countDocuments({
        paciente: pacienteId,
        fecha: new Date(fecha),
        estado: { $in: ['pendiente'] }
      });

      if (citasDelDia > 0) {
        throw new Error('Solo puedes agendar una cita por día');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Validar que el doctor no agende para hoy si el paciente ya fue atendido hoy
  static async validarAgendamientoDoctorDespuesDeAtencionHoy(pacienteId, fecha, rolUsuario) {
    try {
      if (rolUsuario !== 'doctor') {
        return true;
      }

      const fechaCita = new Date(fecha);
      if (Number.isNaN(fechaCita.getTime())) {
        throw new Error('Fecha de cita inválida');
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const fechaCitaNormalizada = new Date(fechaCita);
      fechaCitaNormalizada.setHours(0, 0, 0, 0);

      // Solo bloquear si la nueva cita también es para hoy
      if (fechaCitaNormalizada.getTime() !== hoy.getTime()) {
        return true;
      }

      const inicioHoy = new Date(hoy);
      const finHoy = new Date(hoy);
      finHoy.setHours(23, 59, 59, 999);

      const historialHoy = await HistorialClinico.findOne({
        paciente: pacienteId,
        activo: true,
        consultas: {
          $elemMatch: {
            fecha: { $gte: inicioHoy, $lte: finHoy }
          }
        }
      }).select('_id');

      if (historialHoy) {
        throw new Error('No se puede agendar una cita para hoy si el paciente ya fue atendido hoy. Debe programarse para una fecha posterior.');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Crear nueva cita
  static async crearCita(datosCita, rolUsuario) {
    try {
      const { paciente, doctor, fecha, horaInicio, horaFin, motivo, creadoPor } = datosCita;

      console.log(`🔍 Creando cita - Rol: ${rolUsuario}, Paciente: ${paciente}, Doctor: ${doctor}`);

      // Validar IDs
      if (!mongoose.Types.ObjectId.isValid(paciente) || !mongoose.Types.ObjectId.isValid(doctor)) {
        throw new Error('IDs de paciente o doctor inválidos');
      }

      // Validar fecha futura
      const fechaCita = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaCita < hoy) {
        throw new Error('No se pueden programar citas en fechas pasadas');
      }

      // Validar que el paciente exista y tenga cuenta activa
      const pacienteExistente = await Paciente.findById(paciente).populate('usuario');
      if (!pacienteExistente) {
        throw new Error('Paciente no encontrado');
      }

      // Validar que el paciente tenga cuenta de usuario activa
      if (!pacienteExistente.usuario) {
        throw new Error('El paciente debe tener una cuenta de usuario para agendar citas');
      }

      if (!pacienteExistente.usuario.activo) {
        throw new Error('La cuenta del paciente está inactiva');
      }

      // Validar restricción diaria solo para pacientes
      await this.validarRestriccionDiariaPaciente(paciente, fecha, rolUsuario);

      // Validar regla especial para doctores: si el paciente ya fue atendido hoy, la cita debe ser para otra fecha
      await this.validarAgendamientoDoctorDespuesDeAtencionHoy(paciente, fecha, rolUsuario);

      // Validar que el doctor exista y esté aprobado
      const doctorExistente = await Doctor.findOne({ 
        _id: doctor, 
        activo: true 
      }).populate('usuario');
      
      if (!doctorExistente) {
        throw new Error('Doctor no encontrado o inactivo');
      }

      // Validar disponibilidad
      await this.validarDisponibilidadDoctor(doctor, fecha, horaInicio, horaFin);
      
      // Solo validar cita duplicada para pacientes y admin (no para doctor)
      if (rolUsuario !== 'doctor') {
        await this.validarCitaPaciente(paciente, fecha, horaInicio);
      }

      // Todas las citas se crean como pendiente
      const estadoCita = 'pendiente';
      console.log('📋 Cita creada - estado: pendiente');

      // Crear cita
      const nuevaCita = new Cita({
        paciente,
        doctor,
        fecha: fechaCita,
        horaInicio,
        horaFin,
        motivo,
        estado: estadoCita,
        creadoPor: creadoPor || rolUsuario
      });

      console.log('📅 Datos de cita a guardar:', {
        paciente,
        doctor,
        fecha: fechaCita,
        horaInicio,
        horaFin,
        motivo,
        creadoPor: creadoPor || rolUsuario
      });

      // Validaciones antes de guardar (movidas desde el middleware)
      console.log('🔍 Validando horas...');
      const inicio = horaInicio.split(':');
      const fin = horaFin.split(':');
      const inicioMinutos = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
      const finMinutos = parseInt(fin[0]) * 60 + parseInt(fin[1]);
      
      if (finMinutos <= inicioMinutos) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      
      // Validar duración según rol del usuario
      const duracion = finMinutos - inicioMinutos;
      
      if (rolUsuario === 'paciente') {
        // Para pacientes: exactamente 1 hora (60 minutos)
        if (duracion !== 60) {
          throw new Error('Los pacientes solo pueden agendar citas de 1 hora de duración');
        }
      } else {
        // Para doctores y admin: máximo 4 horas (240 minutos)
        if (duracion > 240) {
          throw new Error('La cita no puede exceder 4 horas de duración');
        }
      }
      
      console.log('✅ Validaciones pasadas');
      console.log('🔍 Guardando cita...');

      await nuevaCita.save();
      console.log('✅ Cita guardada exitosamente');
      console.log(`📅 Nueva cita creada para el ${fechaCita.toISOString().split('T')[0]}`);

      // Poblar datos para respuesta
      await nuevaCita.populate([
        {
          path: 'paciente',
          populate: {
            path: 'usuario',
            select: 'nombre apellido email telefono'
          }
        },
        {
          path: 'doctor',
          populate: {
            path: 'usuario',
            select: 'nombre apellido'
          }
        }
      ]);

      // Notificar a la contraparte via push notification
      try {
        const { enviarNotificacionPush } = require('../utils/pushNotifications');
        const fechaFormateada = fechaCita.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        let receptorId = null;
        let tituloNotif = '';
        let mensajeNotif = '';

        if (rolUsuario === 'paciente') {
            // Notificar al doctor
            receptorId = doctorExistente.usuario._id || doctorExistente.usuario;
            const nombrePaciente = `${pacienteExistente.usuario.nombre} ${pacienteExistente.usuario.apellido}`;
            tituloNotif = 'Nueva cita agendada';
            mensajeNotif = `${nombrePaciente} agendó una cita para el ${fechaFormateada} a las ${horaInicio}`;
        } else {
            // Notificar al paciente (doctor o admin crearon la cita)
            receptorId = pacienteExistente.usuario._id || pacienteExistente.usuario;
            const nombreDoctor = `${doctorExistente.usuario.nombre} ${doctorExistente.usuario.apellido}`;
            tituloNotif = 'Nueva cita agendada';
            mensajeNotif = `El Dr(a). ${nombreDoctor} agendó una cita para ti el ${fechaFormateada} a las ${horaInicio}`;
        }

        if (receptorId) {
            const receptorUsuario = await Usuario.findById(receptorId);
            if (receptorUsuario && receptorUsuario.pushToken) {
                await enviarNotificacionPush(
                    receptorUsuario.pushToken,
                    tituloNotif,
                    mensajeNotif,
                    { citaId: nuevaCita._id.toString(), tipo: 'NUEVA_CITA' }
                );
            }
        }
      } catch (pushError) {
        console.error('Error enviando push (no crítico):', pushError.message);
      }

      return nuevaCita;
    } catch (error) {
      throw error;
    }
  }

  // Obtener citas de un paciente
  static async obtenerCitasPaciente(pacienteId, opciones = {}) {
    try {
      const { estado, desde, hasta, page = 1, limit = 10 } = opciones;

      const query = { paciente: pacienteId };
      
      if (estado) {
        query.estado = estado;
      }

      if (desde || hasta) {
        query.fecha = {};
        if (desde) query.fecha.$gte = new Date(desde);
        if (hasta) query.fecha.$lte = new Date(hasta);
      }

      const citas = await Cita.find(query)
        .populate('doctor', 'usuario especialidad')
        .populate('doctor.usuario', 'nombre apellido')
        .sort({ fecha: 1, horaInicio: 1 })
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

  // Obtener citas de un doctor
  static async obtenerCitasDoctor(doctorId, opciones = {}) {
    try {
      console.log('🔍 Service obtenerCitasDoctor - doctorId:', doctorId);
      console.log('🔍 Service obtenerCitasDoctor - opciones:', opciones);
      
      const { estado, desde, hasta, page = 1, limit = 10 } = opciones;

      const query = { doctor: doctorId };
      console.log('🔍 Query base:', query);
      
      if (estado) {
        query.estado = estado;
        console.log('🔍 Query con estado:', query);
      }

      if (desde || hasta) {
        query.fecha = {};
        if (desde) {
          query.fecha.$gte = new Date(desde);
          console.log('🔍 Query con desde:', query);
        }
        if (hasta) {
          query.fecha.$lte = new Date(hasta);
          console.log('🔍 Query con hasta:', query);
        }
      }

      console.log('🔍 Query final:', JSON.stringify(query, null, 2));
      
      const citas = await Cita.find(query)
        .populate({
          path: 'paciente',
          populate: {
            path: 'usuario',
            select: 'nombre apellido email telefono'
          }
        })
        .sort({ fecha: 1, horaInicio: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      console.log('🔍 Citas encontradas (crudas):', citas.length);
      console.log('🔍 Primera cita (cruda):', citas[0]);

      const total = await Cita.countDocuments(query);
      console.log('🔍 Total de documentos:', total);

      // Transformar las citas con el DTO para eliminar IDs y formatear datos
      const citasFormateadas = citas.map(cita => {
        console.log('🔍 Transformando cita:', cita._id);
        return CitasDTO.transformarCitaDoctor(cita);
      });
      
      console.log('🔍 Citas formateadas:', citasFormateadas.length);

      const resultado = {
        citas: citasFormateadas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDocs: total,
          limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
      
      console.log('🔍 Resultado final del service:', resultado);
      return resultado;
    } catch (error) {
      console.error('❌ Error en obtenerCitasDoctor:', error);
      throw error;
    }
  }

  // Cancelar cita
  static async cancelarCita(citaId, motivoCancelacion, canceladoPor) {
    try {
      const cita = await Cita.findById(citaId)
        .populate('paciente', 'usuario')
        .populate('doctor', 'usuario');

      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      if (cita.estado === 'cancelada') {
        throw new Error('La cita ya está cancelada');
      }

      if (cita.estado === 'finalizada') {
        throw new Error('No se puede cancelar una cita finalizada');
      }

      // Validar tiempo mínimo de cancelación (24 horas)
      const fechaCita = new Date(cita.fecha);
      const [hora, minuto] = cita.horaInicio.split(':');
      fechaCita.setHours(parseInt(hora), parseInt(minuto), 0, 0);
      
      const ahora = new Date();
      const diferenciaHoras = (fechaCita - ahora) / (1000 * 60 * 60);

      if (diferenciaHoras < 24) {
        throw new Error('Las citas deben cancelarse con al menos 24 horas de anticipación');
      }

      // Actualizar cita
      cita.estado = 'cancelada';
      cita.canceladaPor = canceladoPor;
      cita.motivoCancelacion = motivoCancelacion;

      await cita.save();

      // Notificar a la contraparte via push notification
      try {
        const { enviarNotificacionPush } = require('../utils/pushNotifications');
        
        let receptorId = null;
        let tituloNotif = 'Cita cancelada';
        let mensajeNotif = `Una cita ha sido cancelada. Motivo: ${motivoCancelacion}`;

        if (canceladoPor === 'paciente') {
            // Notificar al doctor
            const doctorData = await Doctor.findById(cita.doctor._id || cita.doctor);
            if (doctorData) {
                receptorId = doctorData.usuario._id || doctorData.usuario;
            }
        } else {
            // Notificar al paciente
            const pacienteData = await Paciente.findById(cita.paciente._id || cita.paciente);
            if (pacienteData) {
                receptorId = pacienteData.usuario._id || pacienteData.usuario;
            }
        }

        if (receptorId) {
            const receptorUsuario = await Usuario.findById(receptorId);
            if (receptorUsuario && receptorUsuario.pushToken) {
                await enviarNotificacionPush(
                    receptorUsuario.pushToken,
                    tituloNotif,
                    mensajeNotif,
                    { citaId: cita._id.toString(), tipo: 'CITA_CANCELADA' }
                );
            }
        }
      } catch (pushError) {
        console.error('Error enviando push de cancelación (no crítico):', pushError.message);
      }

      return cita;
    } catch (error) {
      throw error;
    }
  }

  // Confirmar cita (eliminado - ya no se usa el estado confirmada)
  // static async confirmarCita(citaId) {
  //   Este método ha sido eliminado ya que el estado 'confirmada' ya no existe
  //   Las citas ahora van directamente de 'pendiente' a 'finalizada' o 'cancelada'
  // }

  // Actualizar estado de cita
  static async actualizarEstadoCita(citaId, nuevoEstado, observaciones = '', rolUsuario) {
    try {
      const cita = await Cita.findById(citaId)
        .populate('paciente', 'usuario')
        .populate('doctor', 'usuario');

      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      // Validaciones según el estado actual y nuevo
      if (cita.estado === 'finalizada' && nuevoEstado !== 'cancelada') {
        throw new Error('No se puede modificar una cita finalizada');
      }

      if (cita.estado === 'cancelada') {
        throw new Error('No se puede modificar una cita cancelada');
      }

      // Validaciones específicas según el nuevo estado
      if (nuevoEstado === 'finalizada') {
        // Validar que la cita sea hoy o anterior
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);
        
        if (cita.fecha > hoy) {
          throw new Error('No se pueden finalizar citas futuras');
        }

        if (cita.estado !== 'pendiente') {
          throw new Error('Solo se pueden finalizar citas pendientes');
        }
      }

      // Actualizar estado
      cita.estado = nuevoEstado;
      
      if (observaciones) {
        cita.notas = observaciones;
      }

      await cita.save();

      console.log(`🔄 Cita ${citaId} actualizada a estado: ${nuevoEstado} por ${rolUsuario}`);
      
      return cita;
    } catch (error) {
      throw error;
    }
  }

  // Finalizar cita
  static async finalizarCita(citaId, notas = '') {
    try {
      const cita = await Cita.findById(citaId);

      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      if (cita.estado !== 'pendiente') {
        throw new Error('Solo se pueden finalizar citas pendientes');
      }

      // Validar que la cita sea hoy o anterior
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      
      if (cita.fecha > hoy) {
        throw new Error('No se pueden finalizar citas futuras');
      }

      cita.estado = 'finalizada';
      cita.notas = notas;

      await cita.save();

      // Notificar al paciente via push notification
      try {
        const { enviarNotificacionPush } = require('../utils/pushNotifications');
        const pacienteData = await Paciente.findById(cita.paciente._id || cita.paciente);
        if (pacienteData) {
            const receptorUsuario = await Usuario.findById(pacienteData.usuario._id || pacienteData.usuario);
            if (receptorUsuario && receptorUsuario.pushToken) {
                await enviarNotificacionPush(
                    receptorUsuario.pushToken,
                    'Cita finalizada',
                    'Tu cita ha concluido. ¡Gracias por tu visita!',
                    { citaId: cita._id.toString(), tipo: 'CITA_FINALIZADA' }
                );
            }
        }
      } catch (pushError) {
        console.error('Error enviando push de finalización (no crítico):', pushError.message);
      }

      return cita;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las citas (para admin)
  static async obtenerTodasLasCitas(opciones = {}) {
    try {
      const { estado, desde, hasta, doctor, paciente, page = 1, limit = 10 } = opciones;

      const query = {};
      
      if (estado) query.estado = estado;
      if (doctor) query.doctor = doctor;
      if (paciente) query.paciente = paciente;

      if (desde || hasta) {
        query.fecha = {};
        if (desde) query.fecha.$gte = new Date(desde);
        if (hasta) query.fecha.$lte = new Date(hasta);
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

  // Obtener disponibilidad de doctor en una fecha específica
  static async obtenerDisponibilidadDoctor(doctorId, fecha) {
    try {
      const doctor = await Doctor.findOne({ _id: doctorId, activo: true });
      
      if (!doctor) {
        throw new Error('Doctor no encontrado o inactivo');
      }

      let diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
      diaSemana = diaSemana.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const horarioDia = doctor.horarioAtencion.find(h => h.dia === diaSemana && h.disponible);
      
      if (!horarioDia) {
        return { disponible: false, motivo: `El doctor no atiende los ${diaSemana}` };
      }

      // Obtener citas existentes ese día
      const citas = await Cita.find({
        doctor: doctorId,
        fecha: new Date(fecha),
        estado: { $in: ['pendiente'] }
      }).sort({ horaInicio: 1 });

      return {
        disponible: true,
        horarioAtencion: horarioDia,
        citasOcupadas: citas.map(c => ({
          horaInicio: c.horaInicio,
          horaFin: c.horaFin,
          estado: c.estado
        }))
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CitasService;
