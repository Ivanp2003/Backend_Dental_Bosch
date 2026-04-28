const Cita = require('../models/Cita');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
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

      // Verificar que el doctor trabaje ese día y horario
      const diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
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

  // Validar que el paciente no tenga cita duplicada
  static async validarCitaPaciente(pacienteId, fecha, horaInicio, excluirCitaId = null) {
    try {
      const query = {
        paciente: pacienteId,
        fecha: new Date(fecha),
        horaInicio: horaInicio,
        estado: { $in: ['pendiente', 'confirmada'] }
      };

      if (excluirCitaId) {
        query._id = { $ne: excluirCitaId };
      }

      const citaExistente = await Cita.findOne(query);
      
      if (citaExistente) {
        throw new Error('El paciente ya tiene una cita programada para ese día y hora');
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

      // Los pacientes se aprueban automáticamente, no necesitan aprobación de admin
      // Solo doctores necesitan aprobación explícita

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
      await this.validarCitaPaciente(paciente, fecha, horaInicio);

      // Crear cita
      const nuevaCita = new Cita({
        paciente,
        doctor,
        fecha: fechaCita,
        horaInicio,
        horaFin,
        motivo,
        creadoPor: creadoPor || rolUsuario
      });

      await nuevaCita.save();

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
      const { estado, desde, hasta, page = 1, limit = 10 } = opciones;

      const query = { doctor: doctorId };
      
      if (estado) {
        query.estado = estado;
      }

      if (desde || hasta) {
        query.fecha = {};
        if (desde) query.fecha.$gte = new Date(desde);
        if (hasta) query.fecha.$lte = new Date(hasta);
      }

      const citas = await Cita.find(query)
        .populate('paciente', 'usuario')
        .populate('paciente.usuario', 'nombre apellido email telefono')
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
      cita.confirmada = false;

      await cita.save();

      return cita;
    } catch (error) {
      throw error;
    }
  }

  // Confirmar cita
  static async confirmarCita(citaId) {
    try {
      const cita = await Cita.findById(citaId);

      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      if (cita.estado !== 'pendiente') {
        throw new Error('Solo se pueden confirmar citas pendientes');
      }

      cita.estado = 'confirmada';
      cita.confirmada = true;
      cita.fechaConfirmacion = new Date();

      await cita.save();

      return cita;
    } catch (error) {
      throw error;
    }
  }

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

        if (cita.estado !== 'confirmada') {
          throw new Error('Solo se pueden finalizar citas confirmadas');
        }
      }

      if (nuevoEstado === 'confirmada' && cita.estado !== 'pendiente') {
        throw new Error('Solo se pueden confirmar citas pendientes');
      }

      // Actualizar estado
      cita.estado = nuevoEstado;
      
      if (observaciones) {
        cita.notas = observaciones;
      }

      // Si se confirma, marcar como confirmada
      if (nuevoEstado === 'confirmada') {
        cita.confirmada = true;
        cita.fechaConfirmacion = new Date();
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

      if (cita.estado !== 'confirmada') {
        throw new Error('Solo se pueden finalizar citas confirmadas');
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

      const diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      const horarioDia = doctor.horarioAtencion.find(h => h.dia === diaSemana && h.disponible);
      
      if (!horarioDia) {
        return { disponible: false, motivo: `El doctor no atiende los ${diaSemana}` };
      }

      // Obtener citas existentes ese día
      const citas = await Cita.find({
        doctor: doctorId,
        fecha: new Date(fecha),
        estado: { $in: ['pendiente', 'confirmada'] }
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
