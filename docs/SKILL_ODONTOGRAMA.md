# SKILL: Implementación de Odontograma Completo para Clínica Dental

> **Versión:** 1.0  
> **Fecha:** Mayo 2026  
> **Proyecto:** Backend Dental Bosch  
> **Contexto:** Sistema real para clínica dental profesional en Ecuador

---

## 🎯 OBJETIVO

Implementar un sistema de odontograma digital completo y profesional que cumpla con estándares clínicos reales, utilizando la nomenclatura FDI (ISO 3950) y permitiendo el registro detallado del estado de cada pieza dental con sus 5 superficies, estados patológicos y tratamientos realizados/planificados.

**El odontograma debe:**
- Ser parte integral del Historial Clínico del paciente
- Seguir la nomenclatura FDI (Federación Dental Internacional / ISO 3950)
- Registrar 32 dientes permanentes + 20 dientes temporales (niños)
- Permitir anotar estados en 5 superficies por diente
- Diferenciar visualmente entre patologías (rojo) y tratamientos (azul)
- Ser actualizable en cada consulta
- Integrarse sin romper el código existente

---

## 📚 CONTEXTO DEL PROYECTO ACTUAL

### Estructura existente

```
src/
├── models/
│   ├── HistorialClinico.js    ← EL MODELO YA TIENE odontograma: { pendiente, data }
│   ├── Paciente.js
│   └── Doctor.js
├── controllers/
│   └── historialClinicoController.js    ← Funciones: crear, agregar consulta, actualizar
├── services/
│   └── historialClinicoService.js       ← Existe pero NO se usa (issue conocido)
├── routers/
│   └── historialClinicoRoutes.js        ← Rutas: POST, GET, PUT /consulta
└── middlewares/
    └── authMiddleware.js                 ← protegerRuta, autorizarRoles
```

### Schema actual de HistorialClinico.consultas[].odontograma

```javascript
// LÍNEA 266-274 de HistorialClinico.js — YA EXISTE pero vacío
odontograma: {
  pendiente: {
    type: Boolean,
    default: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}
```

**IMPORTANTE:** El schema ya tiene el campo `odontograma` dentro de cada consulta. Solo está marcado como `pendiente: true` y `data: null`. Nuestra tarea es **definir la estructura de `data`** y crear endpoints para manejarlo.

---

## 🦷 FUNDAMENTOS DEL ODONTOGRAMA CLÍNICO

### Sistema de nomenclatura FDI (ISO 3950)

Cada diente se identifica con **2 dígitos**:
- **Primer dígito:** cuadrante (1-4 permanentes, 5-8 temporales)
- **Segundo dígito:** posición del diente en el cuadrante (1-8 o 1-5)

#### Dientes permanentes (adultos — 32 piezas)

```
        Cuadrante 1              Cuadrante 2
        (Superior Der.)          (Superior Izq.)
    18 17 16 15 14 13 12 11  |  21 22 23 24 25 26 27 28
    ─────────────────────────┼─────────────────────────
    48 47 46 45 44 43 42 41  |  31 32 33 34 35 36 37 38
        Cuadrante 4              Cuadrante 3
        (Inferior Der.)          (Inferior Izq.)
```

**Cuadrantes:**
- **1:** Superior derecho (11-18)
- **2:** Superior izquierdo (21-28)
- **3:** Inferior izquierdo (31-38)
- **4:** Inferior derecho (41-48)

**Posiciones (segundo dígito):**
- 1, 2: Incisivos (central, lateral)
- 3: Canino
- 4, 5: Premolares (primero, segundo)
- 6, 7, 8: Molares (primero, segundo, tercero/muela del juicio)

#### Dientes temporales (niños — 20 piezas)

```
        Cuadrante 5              Cuadrante 6
        (Superior Der.)          (Superior Izq.)
    55 54 53 52 51           |  61 62 63 64 65
    ─────────────────────────┼─────────────────
    85 84 83 82 81           |  71 72 73 74 75
        Cuadrante 8              Cuadrante 7
        (Inferior Der.)          (Inferior Izq.)
```

Solo 5 dientes por cuadrante (no hay premolares en dentición temporal).

### Las 5 superficies dentales

Cada diente tiene **5 caras o superficies**:

```
         [Vestibular]
              ↑
    [Mesial] [Oclusal/Incisal] [Distal]
              ↓
      [Lingual/Palatina]
```

1. **Vestibular:** cara externa (hacia labios/mejillas)
2. **Lingual/Palatina:** cara interna (hacia lengua/paladar)
3. **Oclusal/Incisal:** superficie de masticación (oclusal en molares/premolares, incisal en incisivos/caninos)
4. **Mesial:** superficie lateral más cercana a la línea media
5. **Distal:** superficie lateral más alejada de la línea media

### Código de colores clínico estándar

| Color | Significado | Cuándo usar |
|-------|-------------|-------------|
| **ROJO** | Patología / Problema | Caries, fracturas, restos radiculares, extracción indicada |
| **AZUL** | Tratamiento realizado | Obturaciones (empastes), coronas, puentes, endodoncia previa |
| **VERDE** | Temporal / Pendiente | Obturaciones temporales, caries en radiografía |
| **NEGRO** | Definitivo / Finalizado | Extracción realizada, ausencia congénita |

### Estados dentales clínicos

#### Patologías (se marcan en ROJO)

1. **Caries:** Lesión por destrucción de tejido dental
   - Se pinta la superficie afectada (oclusal, mesial, etc.)
   - Puede afectar múltiples superficies
   
2. **Resto radicular:** Corona destruida, solo queda raíz
   - Se marca toda la corona en rojo o con "RR"
   
3. **Extracción indicada:** Diente que debe extraerse
   - Cruz roja (X) sobre la corona
   
4. **Fractura:** Rotura parcial o total del diente
   - Se marca con "FR" o línea de fractura

5. **Diente en erupción:** Pieza que está saliendo
   - Flecha hacia arriba (inf) o abajo (sup) en azul

#### Tratamientos (se marcan en AZUL)

1. **Obturación / Empaste:** Restauración con composite/amalgama
   - Se sombrea en azul la superficie restaurada
   
2. **Corona / Funda:** Recubrimiento completo del diente
   - Toda la corona sombreada en azul
   
3. **Endodoncia:** Tratamiento de conductos
   - Cruz azul en la raíz o "E" azul
   
4. **Puente fijo:** Prótesis fija que une varios dientes
   - Se rodean los pilares con círculo azul y se unen con línea
   
5. **Implante:** Raíz artificial de titanio
   - Se marca con "I" o símbolo especial
   
6. **Diente ausente:** Extracción previa o agenesia
   - Cruz azul (X) sobre toda la pieza

#### Estados especiales

1. **Diente sano:** No se marca nada (se deja en blanco)
2. **Obturación temporal:** Verde
3. **Caries radiográfica:** Verde (detectada en RX pero no visible)
4. **Movilidad dental:** Se anota el grado (I, II, III)
5. **Sellante:** Se puede marcar con "S" en azul

---

## 🏗️ ARQUITECTURA DE LA IMPLEMENTACIÓN

### Principio de diseño: NO crear colección separada

El odontograma NO será un modelo independiente. Será un **subdocumento enriquecido dentro de `HistorialClinico.consultas[].odontograma`**. Esto mantiene la coherencia con la arquitectura actual y evita problemas de sincronización.

### Estructura de datos propuesta

#### Schema detallado del odontograma

```javascript
// REEMPLAZO de las líneas 266-274 en HistorialClinico.js

odontograma: {
  // Fecha de última actualización del odontograma en esta consulta
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  
  // Tipo de dentición
  tipoDenticion: {
    type: String,
    enum: ['permanente', 'temporal', 'mixta'],
    default: 'permanente',
    required: true
  },
  
  // Observaciones generales del odontograma
  observaciones: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres']
  },
  
  // DIENTES — Array de 32 o 20 elementos según tipo
  dientes: [{
    // Código FDI (ej: "11", "26", "55")
    codigoFDI: {
      type: String,
      required: true,
      match: [/^[1-8][1-8]$/, 'Código FDI inválido']
    },
    
    // Estado general del diente
    estadoGeneral: {
      type: String,
      enum: [
        'sano',           // Diente sin patología
        'cariado',        // Tiene caries
        'obturado',       // Tiene obturación/empaste
        'coronado',       // Tiene corona
        'endodonciado',   // Tiene endodoncia
        'ausente',        // Extraído o agenesia
        'implante',       // Es un implante
        'protesis',       // Parte de prótesis fija/removible
        'resto_radicular',// Solo queda raíz
        'fracturado',     // Tiene fractura
        'en_erupcion'     // Está saliendo
      ],
      default: 'sano'
    },
    
    // SUPERFICIES — Estado detallado por cara
    superficies: {
      vestibular: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'desgaste', 'mancha'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      palatina: {  // o lingual (se usa el mismo campo)
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'desgaste', 'mancha'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      oclusal: {  // o incisal (se usa el mismo campo)
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'desgaste', 'sellante'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      mesial: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'contacto_defectuoso'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      distal: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'contacto_defectuoso'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      }
    },
    
    // Movilidad dental (periodontal)
    movilidad: {
      type: String,
      enum: [null, 'grado_I', 'grado_II', 'grado_III'],
      default: null
    },
    
    // Tratamientos pendientes en este diente
    tratamientosPendientes: [{
      tipo: {
        type: String,
        enum: [
          'extraccion',
          'endodoncia',
          'obturacion',
          'corona',
          'limpieza',
          'cirugia',
          'otro'
        ]
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
    
    // Observaciones específicas del diente
    observaciones: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }]
}
```

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### PASO 1: Modificar el modelo HistorialClinico.js

**Archivo:** `src/models/HistorialClinico.js`  
**Líneas a modificar:** 266-274 (el bloque actual de `odontograma`)

```javascript
// REEMPLAZAR las líneas 266-274 con:

odontograma: {
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  tipoDenticion: {
    type: String,
    enum: ['permanente', 'temporal', 'mixta'],
    default: 'permanente',
    required: true
  },
  observaciones: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres']
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
        'sano', 'cariado', 'obturado', 'coronado', 'endodonciado',
        'ausente', 'implante', 'protesis', 'resto_radicular',
        'fracturado', 'en_erupcion'
      ],
      default: 'sano'
    },
    superficies: {
      vestibular: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'desgaste', 'mancha'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      palatina: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'desgaste', 'mancha'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      oclusal: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'desgaste', 'sellante'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      mesial: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'contacto_defectuoso'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      },
      distal: {
        estado: {
          type: String,
          enum: ['sano', 'caries', 'obturado', 'fractura', 'contacto_defectuoso'],
          default: 'sano'
        },
        observacion: { type: String, trim: true, maxlength: 200 }
      }
    },
    movilidad: {
      type: String,
      enum: [null, 'grado_I', 'grado_II', 'grado_III'],
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
      descripcion: { type: String, trim: true, maxlength: 300 }
    }],
    observaciones: { type: String, trim: true, maxlength: 500 }
  }]
},
```

**NO modificar nada más del modelo.** El resto del schema (metricas, métodos estáticos, índices) se queda tal cual está.

---

### PASO 2: Crear utilidad para generar odontograma inicial

**Archivo nuevo:** `src/utils/odontogramaUtils.js`

```javascript
/**
 * Utilidades para manejo de odontogramas
 */

/**
 * Genera un odontograma inicial vacío con todos los dientes en estado sano
 * @param {String} tipoDenticion - 'permanente', 'temporal' o 'mixta'
 * @returns {Object} Estructura de odontograma inicial
 */
function generarOdontogramaInicial(tipoDenticion = 'permanente') {
  const dientes = [];

  if (tipoDenticion === 'permanente' || tipoDenticion === 'mixta') {
    // Generar 32 dientes permanentes
    for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
      for (let posicion = 1; posicion <= 8; posicion++) {
        dientes.push({
          codigoFDI: `${cuadrante}${posicion}`,
          estadoGeneral: 'sano',
          superficies: {
            vestibular: { estado: 'sano', observacion: '' },
            palatina: { estado: 'sano', observacion: '' },
            oclusal: { estado: 'sano', observacion: '' },
            mesial: { estado: 'sano', observacion: '' },
            distal: { estado: 'sano', observacion: '' }
          },
          movilidad: null,
          tratamientosPendientes: [],
          observaciones: ''
        });
      }
    }
  }

  if (tipoDenticion === 'temporal' || tipoDenticion === 'mixta') {
    // Generar 20 dientes temporales (cuadrantes 5-8, posiciones 1-5)
    for (let cuadrante = 5; cuadrante <= 8; cuadrante++) {
      for (let posicion = 1; posicion <= 5; posicion++) {
        dientes.push({
          codigoFDI: `${cuadrante}${posicion}`,
          estadoGeneral: tipoDenticion === 'mixta' ? 'sano' : 'sano',
          superficies: {
            vestibular: { estado: 'sano', observacion: '' },
            palatina: { estado: 'sano', observacion: '' },
            oclusal: { estado: 'sano', observacion: '' },
            mesial: { estado: 'sano', observacion: '' },
            distal: { estado: 'sano', observacion: '' }
          },
          movilidad: null,
          tratamientosPendientes: [],
          observaciones: ''
        });
      }
    }
  }

  return {
    fechaActualizacion: new Date(),
    tipoDenticion,
    observaciones: '',
    dientes
  };
}

/**
 * Valida que un código FDI sea válido según el tipo de dentición
 * @param {String} codigoFDI - Código a validar (ej: "11", "55")
 * @param {String} tipoDenticion - Tipo de dentición
 * @returns {Boolean} true si es válido
 */
function validarCodigoFDI(codigoFDI, tipoDenticion) {
  if (!/^[1-8][1-8]$/.test(codigoFDI)) return false;

  const cuadrante = parseInt(codigoFDI[0]);
  const posicion = parseInt(codigoFDI[1]);

  // Permanentes: cuadrantes 1-4, posiciones 1-8
  if (tipoDenticion === 'permanente' || tipoDenticion === 'mixta') {
    if (cuadrante >= 1 && cuadrante <= 4 && posicion >= 1 && posicion <= 8) {
      return true;
    }
  }

  // Temporales: cuadrantes 5-8, posiciones 1-5
  if (tipoDenticion === 'temporal' || tipoDenticion === 'mixta') {
    if (cuadrante >= 5 && cuadrante <= 8 && posicion >= 1 && posicion <= 5) {
      return true;
    }
  }

  return false;
}

/**
 * Obtiene el nombre descriptivo de un diente según su código FDI
 * @param {String} codigoFDI - Código FDI del diente
 * @returns {String} Nombre descriptivo
 */
function obtenerNombreDiente(codigoFDI) {
  const posicion = parseInt(codigoFDI[1]);
  const cuadrante = parseInt(codigoFDI[0]);

  let nombre = '';
  
  // Nombre según posición
  if (cuadrante <= 4) {
    // Permanente
    switch (posicion) {
      case 1: nombre = 'Incisivo central'; break;
      case 2: nombre = 'Incisivo lateral'; break;
      case 3: nombre = 'Canino'; break;
      case 4: nombre = 'Primer premolar'; break;
      case 5: nombre = 'Segundo premolar'; break;
      case 6: nombre = 'Primer molar'; break;
      case 7: nombre = 'Segundo molar'; break;
      case 8: nombre = 'Tercer molar'; break;
    }
  } else {
    // Temporal
    switch (posicion) {
      case 1: nombre = 'Incisivo central temporal'; break;
      case 2: nombre = 'Incisivo lateral temporal'; break;
      case 3: nombre = 'Canino temporal'; break;
      case 4: nombre = 'Primer molar temporal'; break;
      case 5: nombre = 'Segundo molar temporal'; break;
    }
  }

  // Ubicación
  const ubicaciones = {
    1: 'superior derecho',
    2: 'superior izquierdo',
    3: 'inferior izquierdo',
    4: 'inferior derecho',
    5: 'temporal superior derecho',
    6: 'temporal superior izquierdo',
    7: 'temporal inferior izquierdo',
    8: 'temporal inferior derecho'
  };

  return `${nombre} ${ubicaciones[cuadrante]} (${codigoFDI})`;
}

module.exports = {
  generarOdontogramaInicial,
  validarCodigoFDI,
  obtenerNombreDiente
};
```

---

### PASO 3: Crear funciones del controller

**Archivo:** `src/controllers/historialClinicoController.js`

**Agregar al final del archivo (antes de `module.exports`):**

```javascript
// ==============================
// ODONTOGRAMA - FUNCIONES ESPECÍFICAS
// ==============================

const { generarOdontogramaInicial, validarCodigoFDI, obtenerNombreDiente } = require('../utils/odontogramaUtils');

/**
 * Inicializar odontograma en una consulta existente
 * POST /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/inicializar
 */
const inicializarOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;
    const { tipoDenticion } = req.body;

    // Validar tipo de dentición
    if (!['permanente', 'temporal', 'mixta'].includes(tipoDenticion)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Tipo de dentición inválido. Debe ser: permanente, temporal o mixta'
      });
    }

    // Buscar el historial y la consulta
    const historial = await HistorialClinico.findOne({
      paciente: pacienteId,
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    const consulta = historial.consultas.id(consultaId);

    // Verificar si ya tiene odontograma
    if (consulta.odontograma && consulta.odontograma.dientes && consulta.odontograma.dientes.length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Esta consulta ya tiene un odontograma inicializado'
      });
    }

    // Generar odontograma inicial
    consulta.odontograma = generarOdontogramaInicial(tipoDenticion);
    await historial.save();

    res.status(200).json({
      success: true,
      mensaje: 'Odontograma inicializado correctamente',
      odontograma: consulta.odontograma
    });

  } catch (error) {
    console.error('Error en inicializarOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al inicializar el odontograma',
      error: error.message
    });
  }
};

/**
 * Actualizar un diente específico del odontograma
 * PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/diente/:codigoFDI
 */
const actualizarDienteOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId, codigoFDI } = req.params;
    const datosActualizacion = req.body;

    // Buscar historial y consulta
    const historial = await HistorialClinico.findOne({
      paciente: pacienteId,
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    const consulta = historial.consultas.id(consultaId);

    // Verificar que el odontograma esté inicializado
    if (!consulta.odontograma || !consulta.odontograma.dientes) {
      return res.status(400).json({
        success: false,
        mensaje: 'Odontograma no inicializado. Debe inicializarlo primero.'
      });
    }

    // Validar código FDI
    if (!validarCodigoFDI(codigoFDI, consulta.odontograma.tipoDenticion)) {
      return res.status(400).json({
        success: false,
        mensaje: `Código FDI ${codigoFDI} inválido para dentición ${consulta.odontograma.tipoDenticion}`
      });
    }

    // Buscar el diente en el array
    const diente = consulta.odontograma.dientes.find(d => d.codigoFDI === codigoFDI);

    if (!diente) {
      return res.status(404).json({
        success: false,
        mensaje: `Diente ${codigoFDI} no encontrado en el odontograma`
      });
    }

    // Actualizar campos permitidos
    if (datosActualizacion.estadoGeneral) diente.estadoGeneral = datosActualizacion.estadoGeneral;
    if (datosActualizacion.superficies) {
      Object.keys(datosActualizacion.superficies).forEach(superficie => {
        if (diente.superficies[superficie]) {
          if (datosActualizacion.superficies[superficie].estado) {
            diente.superficies[superficie].estado = datosActualizacion.superficies[superficie].estado;
          }
          if (datosActualizacion.superficies[superficie].observacion !== undefined) {
            diente.superficies[superficie].observacion = datosActualizacion.superficies[superficie].observacion;
          }
        }
      });
    }
    if (datosActualizacion.movilidad !== undefined) diente.movilidad = datosActualizacion.movilidad;
    if (datosActualizacion.tratamientosPendientes) diente.tratamientosPendientes = datosActualizacion.tratamientosPendientes;
    if (datosActualizacion.observaciones !== undefined) diente.observaciones = datosActualizacion.observaciones;

    // Actualizar fecha de modificación del odontograma
    consulta.odontograma.fechaActualizacion = new Date();

    await historial.save();

    res.status(200).json({
      success: true,
      mensaje: `Diente ${obtenerNombreDiente(codigoFDI)} actualizado correctamente`,
      diente
    });

  } catch (error) {
    console.error('Error en actualizarDienteOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el diente',
      error: error.message
    });
  }
};

/**
 * Obtener odontograma completo de una consulta
 * GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma
 */
const obtenerOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;

    const historial = await HistorialClinico.findOne({
      paciente: pacienteId,
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada en el historial'
      });
    }

    const consulta = historial.consultas.id(consultaId);

    if (!consulta.odontograma || !consulta.odontograma.dientes) {
      return res.status(404).json({
        success: false,
        mensaje: 'Odontograma no inicializado para esta consulta'
      });
    }

    res.status(200).json({
      success: true,
      odontograma: consulta.odontograma
    });

  } catch (error) {
    console.error('Error en obtenerOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el odontograma',
      error: error.message
    });
  }
};

/**
 * Actualizar observaciones generales del odontograma
 * PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/observaciones
 */
const actualizarObservacionesOdontograma = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.params;
    const { observaciones } = req.body;

    const historial = await HistorialClinico.findOne({
      paciente: pacienteId,
      activo: true,
      'consultas._id': consultaId
    });

    if (!historial) {
      return res.status(404).json({
        success: false,
        mensaje: 'Consulta no encontrada'
      });
    }

    const consulta = historial.consultas.id(consultaId);

    if (!consulta.odontograma || !consulta.odontograma.dientes) {
      return res.status(400).json({
        success: false,
        mensaje: 'Odontograma no inicializado'
      });
    }

    consulta.odontograma.observaciones = observaciones;
    consulta.odontograma.fechaActualizacion = new Date();

    await historial.save();

    res.status(200).json({
      success: true,
      mensaje: 'Observaciones actualizadas correctamente',
      observaciones: consulta.odontograma.observaciones
    });

  } catch (error) {
    console.error('Error en actualizarObservacionesOdontograma:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar observaciones',
      error: error.message
    });
  }
};
```

**Actualizar el `module.exports` al final del archivo:**

```javascript
module.exports = {
  crearHistorialClinico,
  agregarConsulta,
  obtenerHistorialCompleto,
  obtenerConsultasFiltradas,
  actualizarConsulta,
  eliminarConsulta,
  eliminarHistorial,
  obtenerEstadisticasHistorial,
  // Nuevas funciones de odontograma
  inicializarOdontograma,
  actualizarDienteOdontograma,
  obtenerOdontograma,
  actualizarObservacionesOdontograma
};
```

---

### PASO 4: Registrar rutas

**Archivo:** `src/routers/historialClinicoRoutes.js`

**Agregar antes de `module.exports`:**

```javascript
// ==============================
// RUTAS DE ODONTOGRAMA
// ==============================

const {
  inicializarOdontograma,
  actualizarDienteOdontograma,
  obtenerOdontograma,
  actualizarObservacionesOdontograma
} = require('../controllers/historialClinicoController');

// Inicializar odontograma en una consulta
router.post('/:pacienteId/consulta/:consultaId/odontograma/inicializar',
  protegerRuta,
  autorizarRoles('doctor', 'admin'),
  inicializarOdontograma
);

// Obtener odontograma completo
router.get('/:pacienteId/consulta/:consultaId/odontograma',
  protegerRuta,
  autorizarRoles('doctor', 'admin', 'paciente'),
  obtenerOdontograma
);

// Actualizar un diente específico
router.put('/:pacienteId/consulta/:consultaId/odontograma/diente/:codigoFDI',
  protegerRuta,
  autorizarRoles('doctor', 'admin'),
  actualizarDienteOdontograma
);

// Actualizar observaciones generales
router.put('/:pacienteId/consulta/:consultaId/odontograma/observaciones',
  protegerRuta,
  autorizarRoles('doctor', 'admin'),
  actualizarObservacionesOdontograma
);
```

---

## 🧪 TESTING Y VALIDACIÓN

### Casos de prueba con Postman / Thunder Client

#### 1. Inicializar odontograma permanente

```http
POST /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/inicializar
Authorization: Bearer <token_doctor>
Content-Type: application/json

{
  "tipoDenticion": "permanente"
}
```

**Respuesta esperada:** 200 OK con 32 dientes en estado sano.

#### 2. Marcar caries oclusal en diente 16 (primer molar superior derecho)

```http
PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/diente/16
Authorization: Bearer <token_doctor>
Content-Type: application/json

{
  "estadoGeneral": "cariado",
  "superficies": {
    "oclusal": {
      "estado": "caries",
      "observacion": "Caries profunda con dolor a la percusión"
    }
  },
  "tratamientosPendientes": [
    {
      "tipo": "obturacion",
      "prioridad": "alta",
      "descripcion": "Obturación oclusal con composite"
    }
  ]
}
```

#### 3. Marcar diente ausente (extracción previa)

```http
PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/diente/46
Authorization: Bearer <token_doctor>
Content-Type: application/json

{
  "estadoGeneral": "ausente",
  "observaciones": "Extraído hace 2 años por caries avanzada"
}
```

#### 4. Obtener odontograma completo

```http
GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma
Authorization: Bearer <token_doctor>
```

---

## 🎨 INTEGRACIÓN CON FRONTEND (Guía para el equipo)

### Datos que el frontend recibirá

```json
{
  "success": true,
  "odontograma": {
    "fechaActualizacion": "2026-05-18T15:30:00.000Z",
    "tipoDenticion": "permanente",
    "observaciones": "",
    "dientes": [
      {
        "codigoFDI": "11",
        "estadoGeneral": "sano",
        "superficies": {
          "vestibular": { "estado": "sano", "observacion": "" },
          "palatina": { "estado": "sano", "observacion": "" },
          "oclusal": { "estado": "sano", "observacion": "" },
          "mesial": { "estado": "sano", "observacion": "" },
          "distal": { "estado": "sano", "observacion": "" }
        },
        "movilidad": null,
        "tratamientosPendientes": [],
        "observaciones": ""
      },
      // ... 31 dientes más
    ]
  }
}
```

### Recomendaciones para la UI

1. **Vista principal:** Esquema gráfico de las 2 arcadas dentales
   - Superior: dientes 11-18 (derecha) y 21-28 (izquierda)
   - Inferior: dientes 41-48 (derecha) y 31-38 (izquierda)

2. **Representación por diente:**
   - Forma geométrica (cuadrado/círculo) dividida en 5 secciones
   - Color según estado: rojo (patología), azul (tratamiento), blanco (sano)

3. **Interacción:**
   - Click en un diente → abrir modal con detalles y edición
   - Dropdown de estado general
   - Grid de 5 superficies (cada una editable)
   - Sección de tratamientos pendientes

4. **Validación en el frontend:**
   - Solo doctores y admins pueden editar
   - Pacientes solo pueden ver (modo lectura)

---

## ⚠️ CONSIDERACIONES CRÍTICAS

### 1. Compatibilidad con código existente

✅ **NO rompe nada:** El campo `odontograma` ya existe en el schema, solo lo estamos enriqueciendo.  
✅ **Consultas existentes:** Tendrán `odontograma.dientes = null` hasta que se inicialice.  
✅ **Rutas nuevas:** No colisionan con las existentes.

### 2. Permisos y roles

- **Doctor:** Puede inicializar y editar odontograma
- **Admin:** Puede inicializar y editar odontograma
- **Paciente:** Solo puede VER su odontograma (modo lectura)

### 3. Validación de datos

- Los enums del schema evitan valores inválidos
- `validarCodigoFDI()` impide códigos inexistentes
- Longitud máxima en observaciones (500-1000 chars)

### 4. Rendimiento

- El odontograma NO es una colección aparte → sin JOIN adicional
- Los 32 dientes caben perfectamente en un documento (< 16MB de MongoDB)
- Índice en `consultas._id` ya existe

### 5. Historial y auditoría

- Cada consulta tiene su propio odontograma (snapshot)
- `fechaActualizacion` registra última modificación
- Los bloqueos de edición del Req. 2 y 3 (del agent.md) aplican también al odontograma

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

```
[ ] PASO 1: Modificar HistorialClinico.js (líneas 266-274)
[ ] PASO 2: Crear src/utils/odontogramaUtils.js
[ ] PASO 3: Agregar funciones al historialClinicoController.js
[ ] PASO 4: Agregar rutas en historialClinicoRoutes.js
[ ] PASO 5: Probar inicialización con Postman
[ ] PASO 6: Probar actualización de dientes
[ ] PASO 7: Probar obtención de odontograma
[ ] PASO 8: Verificar permisos por rol
[ ] PASO 9: Documentar endpoints en server.js (opcional)
[ ] PASO 10: Commit con mensaje: "feat: implementación completa de odontograma digital FDI"
```

---

## 🔮 FUTURAS MEJORAS (NO implementar ahora)

1. **Periodontograma:** Registrar profundidad de bolsas periodontales (6 puntos por diente)
2. **Imágenes radiográficas:** Vincular RX a dientes específicos
3. **Historial evolutivo:** Comparar odontogramas entre consultas
4. **Exportación PDF:** Generar reporte imprimible con gráfico del odontograma
5. **Alertas automáticas:** Notificar tratamientos pendientes de alta prioridad

---

## 📚 REFERENCIAS Y ESTÁNDARES

- **ISO 3950:2016** — Dentistry: Designation system for teeth and areas of the oral cavity
- **FDI World Dental Federation** — Sistema de numeración dental internacional
- **Normativa española:** Ley 41/2002 — Odontograma obligatorio en historia clínica

---

## 🤝 SOPORTE Y MANTENIMIENTO

**Autor del skill:** Sistema de IA Claude  
**Fecha de creación:** Mayo 2026  
**Versión del backend:** Node.js + Express 5 + MongoDB (Mongoose 9)  

**Contacto para dudas de implementación:**  
Este skill fue diseñado para ser autocontenido. Si encuentras errores o necesitas extensiones, revisa primero:
1. La estructura del schema en `HistorialClinico.js`
2. Los logs del backend con `npm run dev`
3. La documentación de Mongoose sobre subdocumentos

---

**FIN DEL SKILL.MD**
