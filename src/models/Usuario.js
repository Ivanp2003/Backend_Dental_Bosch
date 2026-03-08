const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  rol: {
    type: String,
    enum: ['doctor', 'paciente', 'admin'],
    default: 'paciente'
  },
  cedula: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  foto: {
    type: String,
    default: 'https://res.cloudinary.com/dpk1tw1us/image/upload/v1/avatars/default-avatar.jpg'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: function() {
      return this.rol === 'doctor' ? 'pendiente' : 'aprobado';
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  confirmado: {
    type: Boolean,
    default: false
  },
  tokenConfirmacion: String,
  tokenRecuperacion: String,
  tokenExpiracion: Date,
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ cedula: 1 });
usuarioSchema.index({ googleId: 1 });

// Encriptar password antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener datos públicos
usuarioSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokenConfirmacion;
  delete obj.tokenRecuperacion;
  delete obj.tokenExpiracion;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);