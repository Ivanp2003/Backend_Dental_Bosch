const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
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
    enum: ['admin', 'doctor', 'paciente'],
    default: 'paciente'
  },
  telefono: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos numéricos']
  },
  foto: {
    type: String,
    default: function() {
      const iniciales = `${this.nombre ? this.nombre[0] : 'U'}${this.apellido ? this.apellido[0] : 'U'}`;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=8b5cf6&color=fff&size=128`;
    }
  },
  
  // Estados unificados y normalizados
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: function() {
      return this.rol === 'doctor' ? 'pendiente' : 'aprobado';
    }
  },
  activo: {
    type: Boolean,
    default: true
  },
  confirmado: {
    type: Boolean,
    default: false
  },
  
  // Autenticación Google
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Tokens de seguridad
  tokenConfirmacion: String,
  tokenRecuperacion: String,
  tokenExpiracion: Date
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ estado: 1 });
usuarioSchema.index({ activo: 1 });
usuarioSchema.index({ googleId: 1 });

// Virtuals
usuarioSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

// Middleware pre-save
usuarioSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  if (!this.password) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener datos públicos
usuarioSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokenRecuperacion;
  delete obj.tokenExpiracion;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);