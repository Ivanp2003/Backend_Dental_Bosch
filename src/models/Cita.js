const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  // Participantes de la cita
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es obligatorio']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'El doctor es obligatorio']
  },
  
  // Programación de la cita
  fecha: {
    type: Date,
    required: [true, 'La fecha es obligatoria'],
    validate: {
      validator: function(value) {
        return value >= new Date().setHours(0,0,0,0); // No permitir fechas pasadas
      },
      message: 'La fecha no puede ser anterior a hoy'
    }
  },
  horaInicio: {
    type: String,
    required: [true, 'La hora de inicio es obligatoria'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido. Use HH:MM']
  },
  horaFin: {
    type: String,
    required: [true, 'La hora de fin es obligatoria'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido. Use HH:MM']
  },
  
  // Estado y detalles
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'finalizada', 'cancelada'],
    default: 'pendiente'
  },
  motivo: {
    type: String,
    required: [true, 'El motivo de la cita es obligatorio'],
    trim: true,
    maxlength: [200, 'El motivo no puede exceder 200 caracteres']
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    trim: true
  },
  
  // Metadatos
  creadoPor: {
    type: String,
    enum: ['paciente', 'doctor', 'admin'],
    required: [true, 'Es necesario especificar quién creó la cita']
  },
  canceladaPor: {
    type: String,
    enum: ['paciente', 'doctor', 'admin'],
    default: null
  },
  motivoCancelacion: {
    type: String,
    maxlength: [300, 'El motivo de cancelación no puede exceder 300 caracteres'],
    trim: true
  },
  
  // Confirmación
  confirmada: {
    type: Boolean,
    default: false
  },
  fechaConfirmacion: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes y reglas de negocio
citaSchema.index({ paciente: 1, fecha: 1, horaInicio: 1 });
citaSchema.index({ doctor: 1, fecha: 1, horaInicio: 1 });
citaSchema.index({ fecha: 1, estado: 1 });
citaSchema.index({ estado: 1 });

// Índice compuesto para evitar duplicados
citaSchema.index(
  { paciente: 1, fecha: 1, horaInicio: 1, estado: 1 },
  { 
    unique: true,
    partialFilterExpression: { estado: { $in: ['pendiente', 'confirmada'] } }
  }
);

// Virtuals
citaSchema.virtual('duracion').get(function() {
  const inicio = this.horaInicio.split(':');
  const fin = this.horaFin.split(':');
  const inicioMinutos = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
  const finMinutos = parseInt(fin[0]) * 60 + parseInt(fin[1]);
  return finMinutos - inicioMinutos;
});

citaSchema.virtual('fechaHoraInicio').get(function() {
  const fecha = new Date(this.fecha);
  const [hora, minuto] = this.horaInicio.split(':');
  fecha.setHours(parseInt(hora), parseInt(minuto), 0, 0);
  return fecha;
});

citaSchema.virtual('fechaHoraFin').get(function() {
  const fecha = new Date(this.fecha);
  const [hora, minuto] = this.horaFin.split(':');
  fecha.setHours(parseInt(hora), parseInt(minuto), 0, 0);
  return fecha;
});

// Validaciones personalizadas
citaSchema.pre('save', function(next) {
  try {
    // Validar que horaFin sea posterior a horaInicio
    const inicio = this.horaInicio.split(':');
    const fin = this.horaFin.split(':');
    const inicioMinutos = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
    const finMinutos = parseInt(fin[0]) * 60 + parseInt(fin[1]);
    
    if (finMinutos <= inicioMinutos) {
      return next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
    }
    
    // Validar duración máxima (ej: 4 horas)
    if (finMinutos - inicioMinutos > 240) {
      return next(new Error('La cita no puede exceder 4 horas de duración'));
    }
    
    next();
  } catch (error) {
    console.error('Error en validación de cita:', error);
    next(error);
  }
});

// Middleware para logging
citaSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`📅 Nueva cita creada para el ${this.fecha.toISOString().split('T')[0]}`);
  }
  next();
});

// Métodos estáticos para consultas comunes
citaSchema.statics.buscarCitasPaciente = function(pacienteId, opciones = {}) {
  const query = { paciente: pacienteId };
  if (opciones.estado) {
    query.estado = opciones.estado;
  }
  if (opciones.desde) {
    query.fecha = { $gte: new Date(opciones.desde) };
  }
  if (opciones.hasta) {
    query.fecha = { ...query.fecha, $lte: new Date(opciones.hasta) };
  }
  
  return this.find(query)
    .populate('paciente', 'usuario')
    .populate('doctor', 'usuario especialidad')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('doctor.usuario', 'nombre apellido')
    .sort({ fecha: 1, horaInicio: 1 });
};

citaSchema.statics.buscarCitasDoctor = function(doctorId, opciones = {}) {
  const query = { doctor: doctorId };
  if (opciones.estado) {
    query.estado = opciones.estado;
  }
  if (opciones.desde) {
    query.fecha = { $gte: new Date(opciones.desde) };
  }
  if (opciones.hasta) {
    query.fecha = { ...query.fecha, $lte: new Date(opciones.hasta) };
  }
  
  return this.find(query)
    .populate('paciente', 'usuario')
    .populate('doctor', 'usuario especialidad')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('doctor.usuario', 'nombre apellido')
    .sort({ fecha: 1, horaInicio: 1 });
};

citaSchema.statics.verificarDisponibilidad = async function(doctorId, fecha, horaInicio, horaFin, excluirCitaId = null) {
  const query = {
    doctor: doctorId,
    fecha: new Date(fecha),
    estado: { $in: ['pendiente', 'confirmada'] },
    $or: [
      // Cita existente que solapa con el nuevo rango
      {
        horaInicio: { $lt: horaFin },
        horaFin: { $gt: horaInicio }
      }
    ]
  };
  
  if (excluirCitaId) {
    query._id = { $ne: excluirCitaId };
  }
  
  const citaSolapada = await this.findOne(query);
  return !citaSolapada; // Retorna true si está disponible
};

module.exports = mongoose.model('Cita', citaSchema);
