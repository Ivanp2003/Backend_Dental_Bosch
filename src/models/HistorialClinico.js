const mongoose = require('mongoose');

const historialClinicoSchema = new mongoose.Schema({
  // ==============================
  // INFORMACIÓN BÁSICA
  // ==============================
  
  // Paciente al que pertenece el historial (único por paciente)
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es obligatorio'],
    unique: true
  },
  
  // Número de historia clínica (único, autogenerado, inmutable)
  // Formato: HC-YYYY-NNNNNN (ej: HC-2025-000001)
  numeroHistoriaClinica: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    match: [/^HC-\d{4}-\d{6}$/, 'Formato inválido para número de historia clínica']
  },
  
  // ==============================
  // AUDITORÍA (Obligatorio según Skill 1)
  // ==============================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // ==============================
  // CONTROL DE ELIMINACIÓN LÓGICA
  // ==============================
  // Restricción crítica: NO eliminación física (Skill 1)
  activo: {
    type: Boolean,
    default: true
  },
  fechaInactivacion: {
    type: Date,
    default: null
  },
  inactivadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  
  // ==============================
  // CONSULTAS (antes "registros")
  // ==============================
  consultas: [{
    // Relación opcional con cita (para heredar motivo)
    cita: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      default: null
    },
    
    // Metadata de la consulta
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'El doctor es obligatorio']
    },
    
    // ==============================
    // 1. MOTIVO DE CONSULTA (Skill 3)
    // ==============================
    // Debe heredarse automáticamente desde Cita.motivo si existe cita asociada
    motivoConsulta: {
      type: String,
      required: [true, 'El motivo de consulta es obligatorio'],
      trim: true,
      maxlength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    
    // ==============================
    // 2. ENFERMEDAD O PROBLEMA ACTUAL (Skill 4)
    // ==============================
    enfermedadActual: {
      descripcion: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
      },
      tiempoEvolucion: {
        type: String,
        trim: true
      },
      sintomas: [String],
      intensidadDolor: {
        type: Number,
        min: [0, 'La intensidad mínima es 0'],
        max: [10, 'La intensidad máxima es 10']
      },
      observaciones: {
        type: String,
        trim: true
      }
    },
    
    // ==============================
    // 3. ANTECEDENTES (Skill 5)
    // ==============================
    // ¡IMPORTANTE! Usar booleanos, NO strings "sí/no"
    antecedentes: {
      alergias: {
        antibioticos: {
          type: Boolean,
          default: false
        },
        anestesia: {
          type: Boolean,
          default: false
        }
      },
      enfermedades: {
        hemorragias: {
          type: Boolean,
          default: false
        },
        vih: {
          type: Boolean,
          default: false
        },
        tuberculosis: {
          type: Boolean,
          default: false
        },
        asma: {
          type: Boolean,
          default: false
        },
        diabetes: {
          type: Boolean,
          default: false
        },
        hipertension: {
          type: Boolean,
          default: false
        },
        cardiacas: {
          type: Boolean,
          default: false
        }
      },
      otros: {
        type: Boolean,
        default: false
      },
      observaciones: {
        type: String,
        trim: true,
        maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres']
      }
    },
    
    // ==============================
    // 4. SIGNOS VITALES (Skill 6)
    // ==============================
    // Registrar por consulta, NO globalmente
    signosVitales: {
      presionArterial: {
        type: String,
        trim: true,
        match: [/^\d{2,3}\/\d{2,3}$/, 'Formato inválido. Use ej: 120/80']
      },
      frecuenciaCardiaca: {
        type: Number,
        min: [40, 'Frecuencia cardíaca muy baja'],
        max: [200, 'Frecuencia cardíaca muy alta']
      },
      temperatura: {
        type: Number,
        min: [35, 'Temperatura muy baja'],
        max: [42, 'Temperatura muy alta']
      },
      frecuenciaRespiratoria: {
        type: Number,
        min: [8, 'Frecuencia respiratoria muy baja'],
        max: [40, 'Frecuencia respiratoria muy alta']
      }
    },
    
    // ==============================
    // 5. EXAMEN DEL SISTEMA ESTOMATOGNÁTICO (Skill 7)
    // ==============================
    examenEstomatognatico: {
      labios: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      mejillas: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      maxilarSuperior: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      maxilarInferior: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      lengua: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      paladar: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      pisoBoca: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      carrillos: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      glandulasSalivales: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      oroFaringe: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      atm: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      ganglios: {
        estado: {
          type: String,
          enum: ['normal', 'patológico'],
          default: 'normal'
        },
        observacion: {
          type: String,
          trim: true
        }
      },
      observaciones: {
        type: String,
        trim: true,
        maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres']
      }
    },
    
    // ==============================
    // 6. ODONTOGRAMA (Skill 8)
    // ==============================
    // Odontograma completo pero OPCIONAL (puede ser null)
    // Estados clínicos según estándares profesionales
    // Caras: M=Mesial, D=Distal, O=Oclusal/Incisal, V=Vestibular, L=Lingual, P=Palatina
    odontograma: {
      fechaActualizacion: {
        type: Date,
        default: null
      },
      tipoDenticion: {
        type: String,
        enum: ['permanente', 'temporal', 'mixta'],
        default: null
      },
      observaciones: {
        type: String,
        trim: true,
        maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres'],
        default: null
      },
      dientes: [{
        codigoFDI: {
          type: String,
          required: true,
          match: [/^[1-8][1-8]$/, 'Código FDI inválido']
        },
        estadoGeneral: {
          type: String,
          enum: [
            'SANO',
            'CARIES',
            'OBTURADO',
            'SELLANTE_NECESARIO',
            'SELLANTE_REALIZADO',
            'EXTRACCION_INDICADA',
            'PERDIDA_POR_CARIES',
            'PERDIDA_OTRA_CAUSA',
            'ENDODONCIA',
            'CORONA',
            'PROTESIS_FIJA',
            'PROTESIS_REMOVIBLE',
            'PROTESIS_TOTAL'
          ],
          default: 'SANO'
        },
        superficies: {
          // M = Mesial
          M: {
            estado: {
              type: String,
              enum: ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'],
              default: 'SANO'
            },
            observacion: { type: String, trim: true, maxlength: 200, default: '' }
          },
          // D = Distal
          D: {
            estado: {
              type: String,
              enum: ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'],
              default: 'SANO'
            },
            observacion: { type: String, trim: true, maxlength: 200, default: '' }
          },
          // O = Oclusal/Incisal
          O: {
            estado: {
              type: String,
              enum: ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'],
              default: 'SANO'
            },
            observacion: { type: String, trim: true, maxlength: 200, default: '' }
          },
          // V = Vestibular
          V: {
            estado: {
              type: String,
              enum: ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'],
              default: 'SANO'
            },
            observacion: { type: String, trim: true, maxlength: 200, default: '' }
          },
          // L = Lingual
          L: {
            estado: {
              type: String,
              enum: ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'],
              default: 'SANO'
            },
            observacion: { type: String, trim: true, maxlength: 200, default: '' }
          },
          // P = Palatina
          P: {
            estado: {
              type: String,
              enum: ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'],
              default: 'SANO'
            },
            observacion: { type: String, trim: true, maxlength: 200, default: '' }
          }
        },
        movilidad: {
          type: String,
          enum: [null, '0', 'I', 'II', 'III'],
          default: null
        },
        recesion: {
          type: String,
          enum: [null, '0', 'I', 'II', 'III'],
          default: null
        },
        tratamientosPendientes: [{
          tipo: {
            type: String,
            enum: ['extraccion', 'endodoncia', 'obturacion', 'corona', 'limpieza', 'cirugia', 'otro']
          },
          prioridad: {
            type: String,
            enum: ['alta', 'media', 'baja'],
            default: 'media'
          },
          descripcion: {
            type: String,
            trim: true,
            maxlength: 300
          }
        }],
        observaciones: {
          type: String,
          trim: true,
          maxlength: 500,
          default: ''
        }
      }]
    },
    
    // ==============================
    // 7. INDICADORES DE SALUD BUCAL (Skill 9)
    // ==============================
    // Todos los indicadores son opcionales (no siempre aplican)
    indicadoresSaludBucal: {
      higieneOral: {
        placa: {
          type: String,
          trim: true,
          default: null
        },
        calculo: {
          type: String,
          trim: true,
          default: null
        },
        gingivitis: {
          type: String,
          trim: true,
          default: null
        }
      },
      enfermedadPeriodontal: {
        type: String,
        enum: [null, 'leve', 'moderada', 'severa'],
        default: null
      },
      maloclusion: {
        type: String,
        enum: [null, 'angle I', 'angle II', 'angle III'],
        default: null
      },
      fluorosis: {
        type: String,
        enum: [null, 'leve', 'moderada', 'severa'],
        default: null
      },
      indiceCPO: {
        // C: Cariados, P: Perdidos, O: Obturados
        C: {
          type: Number,
          min: [0, 'No puede ser negativo'],
          default: 0
        },
        P: {
          type: Number,
          min: [0, 'No puede ser negativo'],
          default: 0
        },
        O: {
          type: Number,
          min: [0, 'No puede ser negativo'],
          default: 0
        },
        total: {
          type: Number,
          min: [0, 'No puede ser negativo'],
          default: 0
        }
      }
    },
    
    // ==============================
    // 8. PLAN DIAGNÓSTICO TERAPÉUTICO (Skill 10)
    // ==============================
    planDiagnostico: {
      biometria: {
        solicitado: {
          type: Boolean,
          default: false
        },
        realizado: {
          type: Boolean,
          default: false
        },
        pendiente: {
          type: Boolean,
          default: false
        }
      },
      quimicaSanguinea: {
        solicitado: {
          type: Boolean,
          default: false
        },
        realizado: {
          type: Boolean,
          default: false
        },
        pendiente: {
          type: Boolean,
          default: false
        }
      },
      rayosX: {
        solicitado: {
          type: Boolean,
          default: false
        },
        realizado: {
          type: Boolean,
          default: false
        },
        pendiente: {
          type: Boolean,
          default: false
        }
      },
      otros: {
        type: String,
        trim: true,
        maxlength: [500, 'No puede exceder 500 caracteres']
      },
      observaciones: {
        type: String,
        trim: true,
        maxlength: [500, 'No puede exceder 500 caracteres']
      }
    },
    
    // ==============================
    // 9. DIAGNÓSTICOS (Skill 11)
    // ==============================
    // Debe permitir múltiples diagnósticos
    diagnosticos: [{
      descripcion: {
        type: String,
        required: [true, 'La descripción del diagnóstico es obligatoria'],
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
      },
      cie10: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]\d{2}(\.\d{1,4})?$/, 'Formato CIE-10 inválido']
      },
      tipo: {
        type: String,
        enum: ['presuntivo', 'definitivo'],
        required: [true, 'El tipo de diagnóstico es obligatorio'],
        default: 'presuntivo'
      }
    }],
    
    // ==============================
    // 10. TRATAMIENTOS (Skill 12)
    // ==============================
    // Cada sesión debe ser independiente
    // Relacionar con cita y doctor
    tratamientos: [{
      sesion: {
        type: Number,
        required: [true, 'El número de sesión es obligatorio'],
        min: [1, 'La sesión debe ser mayor a 0']
      },
      fecha: {
        type: Date,
        default: Date.now,
        required: true
      },
      diagnosticosComplicaciones: {
        type: String,
        trim: true,
        maxlength: [1000, 'No puede exceder 1000 caracteres']
      },
      procedimientos: {
        type: [String],
        default: []
      },
      prescripciones: {
        type: [String],
        default: []
      },
      codigo: {
        type: String,
        trim: true,
        maxlength: [50, 'El código no puede exceder 50 caracteres']
      },
      // Firma del doctor (temporal - NO firma digital aún)
      firmaDoctor: {
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Doctor'
        },
        nombreDoctor: {
          type: String,
          trim: true
        },
        fecha: {
          type: Date
        }
      }
    }]
  }],
  
  // ==============================
  // MÉTRICAS (automáticas)
  // ==============================
  metricas: {
    totalConsultas: {
      type: Number,
      default: 0
    },
    ultimaVisita: {
      type: Date,
      default: null
    },
    proximaVisita: {
      type: Date,
      default: null
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
  toJSON: { virtuals: false },
  toObject: { virtuals: false }
});

// ==============================
// ÍNDICES PARA BÚSQUEDAS EFICIENTES
// ==============================
historialClinicoSchema.index({ paciente: 1 });
historialClinicoSchema.index({ numeroHistoriaClinica: 1 });
historialClinicoSchema.index({ 'consultas.fecha': -1 });
historialClinicoSchema.index({ 'consultas.doctor': 1 });
historialClinicoSchema.index({ 'consultas.diagnosticos.descripcion': 'text' });
historialClinicoSchema.index({ activo: 1 });

// ==============================
// VIRTUALS
// ==============================

// Última consulta del historial
historialClinicoSchema.virtual('ultimaConsulta').get(function() {
  if (this.consultas.length === 0) return null;
  return this.consultas[this.consultas.length - 1];
});

// Consultas recientes (último mes)
historialClinicoSchema.virtual('consultasRecientes').get(function() {
  const unMesAtras = new Date();
  unMesAtras.setMonth(unMesAtras.getMonth() - 1);
  return this.consultas.filter(consulta => 
    new Date(consulta.fecha) >= unMesAtras
  );
});

// ==============================
// MÉTODOS ESTÁTICOS
// ==============================

// Buscar historial por paciente
historialClinicoSchema.statics.buscarPorPaciente = function(pacienteId) {
  return this.findOne({ paciente: pacienteId, activo: true })
    .populate('paciente', 'usuario')
    .populate('paciente.usuario', 'nombre apellido email')
    .populate('consultas.doctor', 'usuario especialidad')
    .populate('consultas.doctor.usuario', 'nombre apellido')
    .populate({
      path: 'consultas.cita',
      select: 'motivo fecha estado',
      model: 'Cita'
    })
    .sort({ 'consultas.fecha': -1 });
};

// Agregar consulta al historial
historialClinicoSchema.statics.agregarConsulta = async function(pacienteId, consultaData, usuarioId) {
  const updateOps = {
    $push: { consultas: consultaData },
    $set: { 
      updatedBy: usuarioId,
      'metricas.ultimaVisita': consultaData.fecha 
    },
    $inc: { 'metricas.totalConsultas': 1 }
  };

  if (consultaData.tipoConsulta === 'urgencia') {
    updateOps.$inc['metricas.emergenciasAtendidas'] = 1;
  }

  const historial = await this.findOneAndUpdate(
    { paciente: pacienteId, activo: true },
    updateOps,
    { returnDocument: 'after', new: true, runValidators: true }
  );

  return historial;
};

// ==============================
// MIDDLEWARE
// ==============================

// Actualizar métricas antes de guardar
historialClinicoSchema.pre('save', async function() {
  if (this.consultas.length > 0) {
    this.metricas.totalConsultas = this.consultas.length;
    this.metricas.ultimaVisita = this.consultas[this.consultas.length - 1].fecha;
  }
});

// ==============================
// MIDDLEWARE: FIRMA AUTOMÁTICA EN TRATAMIENTOS
// ==============================
// Llenar firmaDoctor automáticamente si está vacío
historialClinicoSchema.pre('save', async function() {
  // Verificar si hay consultas antes de iterar
  if (!this.consultas || !Array.isArray(this.consultas) || this.consultas.length === 0) {
    return;
  }

  // Iterar sobre todas las consultas
  for (const consulta of this.consultas) {
    // Si la consulta tiene doctor y tratamientos
    if (consulta.doctor && consulta.tratamientos && Array.isArray(consulta.tratamientos)) {
      // Iterar sobre los tratamientos
      for (const tratamiento of consulta.tratamientos) {
        // Si el tratamiento no tiene firmaDoctor, llenarla
        if (!tratamiento.firmaDoctor || !tratamiento.firmaDoctor.doctorId) {
          tratamiento.firmaDoctor = {
            doctorId: consulta.doctor,
            nombreDoctor: '', // Se llena en el controller con el nombre completo
            fecha: tratamiento.fecha || new Date()
          };
        }
      }
    }
  }
});

// Prevenir eliminación física (soft delete)
historialClinicoSchema.methods.eliminar = async function(usuarioId) {
  this.activo = false;
  this.fechaInactivacion = new Date();
  this.inactivadoPor = usuarioId;
  await this.save();
  return this;
};

module.exports = mongoose.model('HistorialClinico', historialClinicoSchema);