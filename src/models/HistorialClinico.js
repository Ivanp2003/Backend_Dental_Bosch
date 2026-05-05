const mongoose = require('mongoose');

const historialClinicoSchema = new mongoose.Schema({
  // Paciente al que pertenece el historial
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es obligatorio'],
    unique: true // Un historial por paciente
  },

  // Información general del paciente (redundancia para rendimiento)
  informacionGeneral: {
    grupoSanguineo: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: null
    },
    factorRH: {
      type: String,
      enum: ['positivo', 'negativo'],
      default: null
    },
    alergias: [{
      tipo: {
        type: String,
        enum: ['medicamento', 'alimento', 'material', 'ambiental', 'otro'],
        required: true
      },
      nombre: {
        type: String,
        required: true,
        trim: true
      },
      reaccion: {
        type: String,
        required: true,
        trim: true
      },
      gravedad: {
        type: String,
        enum: ['leve', 'moderada', 'severa', 'anafilaxis'],
        default: 'moderada'
      }
    }],
    condicionesMedicas: [{
      nombre: {
        type: String,
        required: true,
        trim: true
      },
      diagnosticada: Date,
      tratamientoActual: String,
      controlada: {
        type: Boolean,
        default: false
      }
    }],
    medicamentosActuales: [{
      nombre: {
        type: String,
        required: true,
        trim: true
      },
      dosis: String,
      frecuencia: String,
      motivo: String,
      medico: String
    }],
    habitos: {
      fuma: {
        type: Boolean,
        default: false
      },
      consumeAlcohol: {
        type: Boolean,
        default: false
      },
      frecuencia: String,
      notas: String
    }
  },

  // Registros de cada consulta/visita
  registros: [{
    // Metadata del registro
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    tipoConsulta: {
      type: String,
      enum: ['consulta', 'urgencia', 'control', 'procedimiento', 'cirugia', 'revision'],
      default: 'consulta'
    },

    // Motivo y evaluación
    motivoConsulta: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    sintomasPrincipales: [{
      descripcion: {
        type: String,
        required: true,
        trim: true
      },
      duracion: String,
      intensidad: {
        type: Number,
        min: 1,
        max: 10
      },
      inicio: Date
    }],
    evaluacionInicial: {
      estadoGeneral: {
        type: String,
        enum: ['excelente', 'bueno', 'regular', 'malo'],
        default: 'bueno'
      },
      observaciones: String
    },

    // Examen físico y signos vitales
    examenFisico: {
      signosVitales: {
        presionArterial: {
          sistolica: Number,
          diastolica: Number
        },
        frecuenciaCardiaca: {
          type: Number,
          min: 40,
          max: 200
        },
        frecuenciaRespiratoria: {
          type: Number,
          min: 8,
          max: 40
        },
        temperatura: {
          type: Number,
          min: 35,
          max: 42
        },
        saturacionOxigeno: {
          type: Number,
          min: 70,
          max: 100
        },
        peso: {
          type: Number,
          min: 0,
          max: 300
        },
        altura: {
          type: Number,
          min: 50,
          max: 250
        }
      },
      examenCabezaCuello: {
        normal: {
          type: Boolean,
          default: true
        },
        hallazgos: String
      },
      examenCavidadOral: {
        labios: String,
        encias: String,
        lengua: String,
        paladar: String,
        pisoBoca: String,
        saliva: String,
        oclusion: String,
        observaciones: String
      },
      examenDental: {
        dientesAfectados: [String], // ej: 1.1, 2.3, etc.
        caries: [{
          diente: String,
          superficie: String,
          gravedad: {
            type: String,
            enum: ['incipiente', 'moderada', 'severa']
          }
        }],
        restauraciones: [{
          diente: String,
          material: String,
          estado: {
            type: String,
            enum: ['buena', 'regular', 'mala']
          }
        }],
        protesis: [{
          tipo: {
            type: String,
            enum: ['fija', 'removible', 'parcial', 'total']
          },
          localizacion: String,
          estado: String
        }],
        ortodoncia: {
          tratamiento: Boolean,
          tipo: String,
          observaciones: String
        }
      }
    },

    // Diagnóstico y tratamiento
    diagnostico: {
      principal: {
        codigoCIE: String, // Clasificación Internacional de Enfermedades
        descripcion: {
          type: String,
          required: true,
          trim: true
        },
        certeza: {
          type: String,
          enum: ['confirmado', 'probable', 'posible', 'diferencial'],
          default: 'confirmado'
        }
      },
      secundarios: [{
        codigoCIE: String,
        descripcion: String,
        certeza: {
          type: String,
          enum: ['confirmado', 'probable', 'posible', 'diferencial'],
          default: 'probable'
        }
      }]
    },

    planTratamiento: {
      inmediato: [{
        procedimiento: {
          type: String,
          required: true,
          trim: true
        },
        urgencia: {
          type: String,
          enum: ['inmediato', 'muy urgente', 'urgente', 'poco urgente'],
          default: 'urgente'
        },
        descripcion: String,
        costoEstimado: Number
      }],
      medianoPlazo: [{
        procedimiento: String,
        descripcion: String,
        costoEstimado: Number
      }],
      largoPlazo: [{
        procedimiento: String,
        descripcion: String,
        costoEstimado: Number
      }],
      observaciones: String
    },

    // Tratamiento realizado en esta consulta
    tratamientoRealizado: [{
      procedimiento: {
        type: String,
        required: true,
        trim: true
      },
      dientes: [String],
      materiales: [String],
      tecnica: String,
      complicaciones: String,
      duracion: Number, // minutos
      exito: {
        type: Boolean,
        default: true
      }
    }],

    // Medicación y recetas
    recetas: [{
      medicamento: {
        type: String,
        required: true,
        trim: true
      },
      dosis: {
        type: String,
        required: true
      },
      frecuencia: {
        type: String,
        required: true
      },
      duracion: String,
      viaAdministracion: {
        type: String,
        enum: ['oral', 'topica', 'intramuscular', 'intravenosa', 'otra'],
        default: 'oral'
      },
      instrucciones: String,
      cantidad: Number,
      observaciones: String
    }],

    // Indicaciones y seguimiento
    indicaciones: [{
      tipo: {
        type: String,
        enum: ['medica', 'higienica', 'dietetica', 'actividad', 'otra'],
        required: true
      },
      descripcion: {
        type: String,
        required: true,
        trim: true
      }
    }],

    seguimiento: {
      proximaCita: Date,
      motivoSeguimiento: String,
      controles: [{
        fecha: Date,
        resultado: String,
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Doctor'
        }
      }]
    },

    // Documentación adjunta
    archivos: [{
      tipo: {
        type: String,
        enum: ['radiografia', 'foto', 'documento', 'laboratorio', 'consentimiento'],
        required: true
      },
      nombre: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      descripcion: String,
      fechaSubida: {
        type: Date,
        default: Date.now
      }
    }],

    // Observaciones generales
    observaciones: {
      type: String,
      maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres']
    },

    // Consentimientos
    consentimientos: [{
      tipo: {
        type: String,
        enum: ['tratamiento', 'anestesia', 'fotografias', 'investigacion'],
        required: true
      },
      firmado: {
        type: Boolean,
        default: false
      },
      fechaFirma: Date,
      testigo: String,
      observaciones: String
    }]
  }],

  // Estadísticas y métricas
  metricas: {
    totalConsultas: {
      type: Number,
      default: 0
    },
    ultimaVisita: Date,
    proximaVisita: Date,
    costoTotalTratamientos: {
      type: Number,
      default: 0
    },
    tratamientosCompletados: {
      type: Number,
      default: 0
    },
    emergenciasAtendidas: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes
historialClinicoSchema.index({ paciente: 1 });
historialClinicoSchema.index({ 'registros.fecha': -1 });
historialClinicoSchema.index({ 'registros.doctor': 1 });
historialClinicoSchema.index({ 'registros.tipoConsulta': 1 });
historialClinicoSchema.index({ 'registros.diagnostico.principal.descripcion': 'text' });

// Virtuals
historialClinicoSchema.virtual('ultimaConsulta').get(function() {
  if (this.registros.length === 0) return null;
  return this.registros[this.registros.length - 1];
});

historialClinicoSchema.virtual('consultasRecientes').get(function() {
  const unMesAtras = new Date();
  unMesAtras.setMonth(unMesAtras.getMonth() - 1);
  return this.registros.filter(registro => 
    new Date(registro.fecha) >= unMesAtras
  );
});

// Métodos estáticos
historialClinicoSchema.statics.buscarPorPaciente = function(pacienteId) {
  return this.findOne({ paciente: pacienteId })
    .populate('paciente', 'usuario')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('registros.doctor', 'usuario especialidad')
    .populate('registros.doctor.usuario', 'nombre apellido')
    .sort({ 'registros.fecha': -1 });
};

historialClinicoSchema.statics.agregarRegistro = async function(pacienteId, registroData) {
  const historial = await this.findOneAndUpdate(
    { paciente: pacienteId },
    { 
      $push: { registros: registroData },
      $inc: { 'metricas.totalConsultas': 1 }
    },
    { new: true, upsert: true }
  );
  
  // Actualizar métricas
  historial.metricas.ultimaVisita = registroData.fecha;
  if (registroData.tipoConsulta === 'urgencia') {
    historial.metricas.emergenciasAtendidas += 1;
  }
  
  await historial.save();
  return historial;
};

// Middleware para actualizar métricas
historialClinicoSchema.pre('save', function(next) {
  if (this.registros.length > 0) {
    this.metricas.totalConsultas = this.registros.length;
    this.metricas.ultimaVisita = this.registros[this.registros.length - 1].fecha;
  }
  next();
});

module.exports = mongoose.model('HistorialClinico', historialClinicoSchema);
