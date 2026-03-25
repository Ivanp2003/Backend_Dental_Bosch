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
    trim: true,
    validate: {
      validator: function(v) {
        // Si está vacío, es válido (sparse: true)
        if (!v) return true;
        
        // Limpiar caracteres no numéricos y verificar longitud
        const cleaned = v.replace(/[^0-9]/g, '');
        
        // Aceptar entre 5 y 13 dígitos (formatos ecuatorianos y otros)
        return cleaned.length >= 5 && cleaned.length <= 13;
      },
      message: 'La cédula debe contener entre 5 y 13 dígitos'
    }
  },
  telefono: {
    type: String,
    trim: true
  },
  foto: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff&size=128'
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

// Encriptar password antes de guardar
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
  // delete obj.tokenConfirmacion; // Comentado para que aparezca en MongoDB
  delete obj.tokenRecuperacion;
  delete obj.tokenExpiracion;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);