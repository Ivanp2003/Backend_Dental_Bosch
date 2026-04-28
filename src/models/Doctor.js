const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Referencia al Usuario (contiene nombre, apellido, email, etc.)
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario asociado es obligatorio'],
    unique: true
  },
  
  // Información profesional
  especialidad: {
    type: String,
    required: [true, 'La especialidad es requerida'],
    trim: true,
    maxlength: [100, 'La especialidad no puede exceder 100 caracteres']
  },
  
  // Horario de atención
  horarioAtencion: [{
    dia: {
      type: String,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      required: true
    },
    horaInicio: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido. Use HH:MM']
    },
    horaFin: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido. Use HH:MM']
    },
    disponible: {
      type: Boolean,
      default: true
    }
  }],
  
  // Estado del doctor
  activo: {
    type: Boolean,
    default: true
  },
  
  // Calificaciones (opcional para futuras implementaciones)
  calificacionPromedio: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalCalificaciones: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes
doctorSchema.index({ especialidad: 1 });
doctorSchema.index({ activo: 1 });
// usuario ya tiene unique: true en el schema

// Virtuals
doctorSchema.virtual('nombreCompleto').get(function() {
  // Este virtual se poblará cuando se haga populate con usuario
  return this.usuario?.nombreCompleto || 'Doctor';
});

// Middleware pre-save
doctorSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`👨‍⚕️ Nuevo doctor registrado`);
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);