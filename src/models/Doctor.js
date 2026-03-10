const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  especialidad: {
    type: String,
    required: [true, 'La especialidad es requerida'],
    trim: true
  },
  horarioAtencion: [{
    dia: {
      type: String,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    },
    horaInicio: String, // Formato: "08:00"
    horaFin: String,    // Formato: "17:00"
    disponible: {
      type: Boolean,
      default: true
    }
  }],
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
  versionKey: false
});

module.exports = mongoose.model('Doctor', doctorSchema);