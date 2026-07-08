const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres'],
    match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios']
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
  cedula: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true;
        if (value.trim() === '') return true;
        if (!/^[0-9]{10}$/.test(value)) return false;
        
        // Excepciones para usuarios de prueba
        if (['0000000000', '1111111111', '2222222222'].includes(value)) return true;

        // Algoritmo Módulo 10 para cédulas ecuatorianas
        const provincia = parseInt(value.substring(0, 2), 10);
        if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

        const tercerDigito = parseInt(value.substring(2, 3), 10);
        if (tercerDigito >= 6) return false; // Personas naturales

        const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        const verificador = parseInt(value.substring(9, 10), 10);
        
        let suma = 0;
        for (let i = 0; i < 9; i++) {
          let valor = parseInt(value.substring(i, i + 1), 10) * coeficientes[i];
          if (valor >= 10) valor -= 9;
          suma += valor;
        }
        
        const decenaSuperior = Math.ceil(suma / 10) * 10;
        let digitoCalculado = decenaSuperior - suma;
        if (digitoCalculado === 10) digitoCalculado = 0;

        return digitoCalculado === verificador;
      },
      message: 'La cédula no es válida o no corresponde al formato ecuatoriano'
    }
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
    enum: ['pendiente', 'aprobado', 'rechazado', 'inactivo'],
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
  tokenExpiracion: Date,
  
  // Push notifications (Expo)
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices adicionales para búsquedas eficientes
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ estado: 1 });
usuarioSchema.index({ activo: 1 });

// Virtuals
usuarioSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

// Middleware de encriptación eliminado - movido al controller
// para evitar problemas con next() en algunas versiones de Mongoose

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