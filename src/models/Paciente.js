const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plugin de paginación
const mongoosePaginate = require('mongoose-paginate-v2');

const pacienteSchema = new mongoose.Schema({
  // Referencia al Usuario (contiene nombre, apellido, email, teléfono, etc.)
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false,
    unique: true
  },
  
  // Información personal específica del paciente
  fechaNacimiento: {
    type: Date,
    required: false,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: 'La fecha de nacimiento no puede ser futura'
    }
  },
  genero: {
    type: String,
    required: false,
    enum: {
      values: ['masculino', 'femenino', 'otro'],
      message: 'El género debe ser: masculino, femenino u otro'
    }
  },
  
  // Dirección
  direccion: {
    calle: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'La calle no puede exceder 100 caracteres']
    },
    ciudad: {
      type: String,
      required: false,
      trim: true,
      maxlength: [50, 'La ciudad no puede exceder 50 caracteres']
    },
    provincia: {
      type: String,
      required: false,
      trim: true,
      maxlength: [50, 'La provincia no puede exceder 50 caracteres']
    }
  },
  
  // Contacto de emergencia
  contactoEmergencia: {
    nombre: {
      type: String,
      required: false,
      trim: true,
      match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre del contacto de emergencia solo puede contener letras y espacios']
    },
    telefono: {
      type: String,
      required: false,
      trim: true,
      match: [/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos numéricos']
    },
    parentesco: {
      type: String,
      required: false,
      trim: true,
      match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El parentesco solo puede contener letras y espacios']
    }
  },
  
  // Información médica simplificada
  infoMedica: {
    alergias: [String],
    condiciones: [String],
    notas: {
      type: String,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
      trim: true
    }
  },
  
  // Relaciones
  doctorAsignado: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes
// usuario ya tiene unique: true en el schema
pacienteSchema.index({ doctorAsignado: 1 });

// Virtuals
pacienteSchema.virtual('edad').get(function() {
  if (!this.fechaNacimiento) return null;
  const hoy = new Date();
  const fechaNac = new Date(this.fechaNacimiento);
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  return edad;
});

// Aplicar plugin de paginación
pacienteSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Paciente', pacienteSchema);