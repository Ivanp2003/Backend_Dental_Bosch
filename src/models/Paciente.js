const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  fechaNacimiento: {
    type: Date
  },
  genero: {
    type: String,
    enum: ['masculino', 'femenino', 'otro']
  },
  direccion: {
    type: String,
    trim: true
  },
  alergias: [{
    type: String,
    trim: true
  }],
  enfermedadesCronicas: [{
    type: String,
    trim: true
  }],
  contactoEmergencia: {
    nombre: String,
    telefono: String,
    relacion: String
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices
pacienteSchema.index({ usuario: 1 });

module.exports = mongoose.model('Paciente', pacienteSchema);