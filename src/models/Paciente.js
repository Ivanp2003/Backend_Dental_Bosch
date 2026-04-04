const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plugin de paginación
const mongoosePaginate = require('mongoose-paginate-v2');

const pacienteSchema = new mongoose.Schema({
  // Información personal
  nombre: {
    type: String,
    required: [true, 'El nombre del paciente es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido del paciente es obligatorio'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  cedula: {
    type: String,
    required: [true, 'La cédula del paciente es obligatoria'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'La cédula debe tener 10 dígitos numéricos']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono del paciente es obligatorio'],
    trim: true,
    match: [/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos numéricos']
  },
  email: {
    type: String,
    required: [true, 'El email del paciente es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
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
    },
    codigoPostal: {
      type: String,
      required: [true, 'El código postal es obligatorio'],
      trim: true,
      maxlength: [10, 'El código postal no puede exceder 10 caracteres']
    }
  },
  
  // Información médica
  alergias: [{
    tipo: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    gravedad: {
      type: String,
      enum: ['leve', 'moderada', 'severa'],
      default: 'leve'
    }
  }],
  enfermedadesCronicas: [{
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    medicacion: {
      type: String,
      trim: true,
      maxlength: [200, 'La medicación no puede exceder 200 caracteres']
    }
  }],
  medicamentosActuales: [{
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    dosis: {
      type: String,
      required: true,
      trim: true
    },
    frecuencia: {
      type: String,
      required: true,
      trim: true
    }
  }],
  tipoSangre: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    trim: true
  },
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
  
  // Información del sistema
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario asociado es obligatorio'],
    unique: true
  },
  doctorAsignado: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  historialClinico: [{
    type: Schema.Types.ObjectId,
    ref: 'HistoriaClinica'
  }],
  citas: [{
    type: Schema.Types.ObjectId,
    ref: 'Cita'
  }],
  tratamientos: [{
    type: Schema.Types.ObjectId,
    ref: 'Tratamiento'
  }],
  
  // Estado y control
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'suspendido'],
    default: 'activo'
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimaVisita: {
    type: Date
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes
pacienteSchema.index({ nombre: 'text', apellido: 'text', cedula: 'text', email: 'text' });
pacienteSchema.index({ cedula: 1 });
pacienteSchema.index({ email: 1 });
pacienteSchema.index({ usuario: 1 });
pacienteSchema.index({ doctorAsignado: 1 });
pacienteSchema.index({ estado: 1 });

// Virtuals
pacienteSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

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
    console.log(`👤 Nuevo paciente registrado: ${this.nombreCompleto}`);
  }
  next();
});

// Middleware pre-remove
pacienteSchema.pre('remove', function(next) {
  console.log(`🗑️ Paciente eliminado: ${this.nombreCompleto}`);
  next();
});

// Métodos estáticos
pacienteSchema.statics.buscarPorTermino = function(termino) {
  return this.find({
    $or: [
      { nombre: { $regex: termino, $options: 'i' } },
      { apellido: { $regex: termino, $options: 'i' } },
      { cedula: { $regex: termino, $options: 'i' } },
      { email: { $regex: termino, $options: 'i' } }
    ]
  });
};

pacienteSchema.statics.buscarPorCriterios = function(criterios) {
  const query = {};
  
  if (criterios.nombre) {
    query.nombre = { $regex: criterios.nombre, $options: 'i' };
  }
  if (criterios.apellido) {
    query.apellido = { $regex: criterios.apellido, $options: 'i' };
  }
  if (criterios.cedula) {
    query.cedula = { $regex: criterios.cedula, $options: 'i' };
  }
  if (criterios.email) {
    query.email = { $regex: criterios.email, $options: 'i' };
  }
  if (criterios.estado) {
    query.estado = criterios.estado;
  }
  if (criterios.doctorAsignado) {
    query.doctorAsignado = criterios.doctorAsignado;
  }
  
  return this.find(query);
};

// Aplicar plugin de paginación
pacienteSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Paciente', pacienteSchema);