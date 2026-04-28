const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plugin de paginación
const mongoosePaginate = require('mongoose-paginate-v2');

const pacienteSchema = new mongoose.Schema({
  // Referencia al Usuario (contiene nombre, apellido, email, teléfono, etc.)
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario asociado es obligatorio'],
    unique: true
  },
  
  // Información personal específica del paciente
  fechaNacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria'],
    validate: {
      validator: function(value) {
        return value < new Date();
      },
      message: 'La fecha de nacimiento no puede ser futura'
    }
  },
  genero: {
    type: String,
    required: [true, 'El género es obligatorio'],
    enum: {
      values: ['masculino', 'femenino', 'otro'],
      message: 'El género debe ser: masculino, femenino u otro'
    }
  },
  
  // Dirección
  direccion: {
    calle: {
      type: String,
      required: [true, 'La calle es obligatoria'],
      trim: true,
      maxlength: [100, 'La calle no puede exceder 100 caracteres']
    },
    ciudad: {
      type: String,
      required: [true, 'La ciudad es obligatoria'],
      trim: true,
      maxlength: [50, 'La ciudad no puede exceder 50 caracteres']
    },
    provincia: {
      type: String,
      required: [true, 'La provincia es obligatoria'],
      trim: true,
      maxlength: [50, 'La provincia no puede exceder 50 caracteres']
    }
  },
  
  // Contacto de emergencia
  contactoEmergencia: {
    nombre: {
      type: String,
      required: [true, 'El nombre del contacto de emergencia es obligatorio'],
      trim: true
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono del contacto de emergencia es obligatorio'],
      trim: true,
      match: [/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos numéricos']
    },
    parentesco: {
      type: String,
      required: [true, 'El parentesco es obligatorio'],
      trim: true
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
pacienteSchema.index({ usuario: 1 });
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

// Middleware pre-save
pacienteSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`👤 Nuevo paciente registrado`);
  }
  next();
});

// Aplicar plugin de paginación
pacienteSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Paciente', pacienteSchema);