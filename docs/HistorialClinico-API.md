# 🏥 Historial Clínico Digital - API Documentation

## 📋 Overview

El módulo de Historial Clínico Digital permite gestionar de manera estructurada y completa el historial médico de los pacientes, cumpliendo con el formato físico oficial de Dental Bosch. Incluye soporte para múltiples consultas, diagnósticos CIE-10, tratamientos y seguimiento.

### Características Principales

- ✅ **Auditoría completa**: createdBy, updatedBy, createdAt, updatedAt
- ✅ **Soft delete**: No eliminación física de datos (Skill 1)
- ✅ **Número único**: HC-YYYY-NNNNNN autogenerado e inmutable (Skill 2)
- ✅ **Integración con citas**: Herencia automática de motivo (Skill 3)
- ✅ **Campos automáticos**: Edad, grupo etario calculados automáticamente
- ✅ **Validación CIE-10**: Formato oficial de diagnósticos
- ✅ **Múltiples diagnósticos**: Presuntivos y definitivos (Skill 11)
- ✅ **Tratamientos por sesión**: Independientes y firmados (Skill 12)

## 🏗️ Arquitectura del Modelo

### Estructura Principal

```javascript
{
  _id: ObjectId,
  paciente: ObjectId,                    // Referencia única al paciente
  numeroHistoriaClinica: String,         // HC-2025-000001 (único, inmutable)
  createdBy: ObjectId,                   // Usuario que creó
  updatedBy: ObjectId,                   // Usuario que actualizó
  activo: Boolean,                       // Soft delete (default: true)
  fechaInactivacion: Date,               // Fecha de eliminación lógica
  inactivadoPor: ObjectId,               // Usuario que eliminó
  
  consultas: [                           // Array de consultas
    {
      // Metadata
      cita: ObjectId,                    // Relación con cita (opcional)
      fecha: Date,
      doctor: ObjectId,
      
      // 1. Motivo de consulta (Skill 3)
      motivoConsulta: String,            // Heredado de cita.motivo si existe
      
      // 2. Enfermedad actual (Skill 4)
      enfermedadActual: {
        descripcion: String,
        tiempoEvolucion: String,
        sintomas: [String],
        intensidadDolor: Number,         // 0-10
        observaciones: String
      },
      
      // 3. Antecedentes (Skill 5) - Booleanos, NO strings
      antecedentes: {
        alergias: {
          antibioticos: Boolean,
          anestesia: Boolean
        },
        enfermedades: {
          hemorragias: Boolean,
          vih: Boolean,
          tuberculosis: Boolean,
          asma: Boolean,
          diabetes: Boolean,
          hipertension: Boolean,
          cardiacas: Boolean
        },
        otros: Boolean,
        observaciones: String
      },
      
      // 4. Signos vitales (Skill 6)
      signosVitales: {
        presionArterial: String,         // "120/80"
        frecuenciaCardiaca: Number,      // 40-200
        temperatura: Number,             // 35-42
        frecuenciaRespiratoria: Number   // 8-40
      },
      
      // 5. Examen sistema estomatognático (Skill 7)
      examenEstomatognatico: {
        labios: { estado: 'normal'|'patológico', observacion: String },
        mejillas: { estado: 'normal'|'patológico', observacion: String },
        maxilarSuperior: { estado: 'normal'|'patológico', observacion: String },
        maxilarInferior: { estado: 'normal'|'patológico', observacion: String },
        lengua: { estado: 'normal'|'patológico', observacion: String },
        paladar: { estado: 'normal'|'patológico', observacion: String },
        pisoBoca: { estado: 'normal'|'patológico', observacion: String },
        carrillos: { estado: 'normal'|'patológico', observacion: String },
        glandulasSalivales: { estado: 'normal'|'patológico', observacion: String },
        oroFaringe: { estado: 'normal'|'patológico', observacion: String },
        atm: { estado: 'normal'|'patológico', observacion: String },
        ganglios: { estado: 'normal'|'patológico', observacion: String },
        observaciones: String
      },
      
      // 6. Odontograma (Skill 8) - PENDIENTE
      odontograma: {
        pendiente: Boolean,              // default: true
        data: null                       // Para implementación futura
      },
      
      // 7. Indicadores salud bucal (Skill 9) - Todos opcionales
      indicadoresSaludBucal: {
        higieneOral: {
          placa: String,                 // null, 'leve', 'moderada', 'severa'
          calculo: String,
          gingivitis: String
        },
        enfermedadPeriodontal: String,   // null, 'leve', 'moderada', 'severa'
        maloclusion: String,             // null, 'angle I', 'angle II', 'angle III'
        fluorosis: String,               // null, 'leve', 'moderada', 'severa'
        indiceCPO: {
          C: Number,                     // Cariados
          P: Number,                     // Perdidos
          O: Number,                     // Obturados
          total: Number                  // C+P+O (calculado automáticamente)
        }
      },
      
      // 8. Plan diagnóstico (Skill 10)
      planDiagnostico: {
        biometria: { solicitado: Boolean, realizado: Boolean, pendiente: Boolean },
        quimicaSanguinea: { solicitado: Boolean, realizado: Boolean, pendiente: Boolean },
        rayosX: { solicitado: Boolean, realizado: Boolean, pendiente: Boolean },
        otros: String,
        observaciones: String
      },
      
      // 9. Diagnósticos (Skill 11) - Múltiples
      diagnosticos: [
        {
          descripcion: String,           // Requerido
          cie10: String,                 // Formato: A00.0, K04.7, etc.
          tipo: 'presuntivo'|'definitivo'
        }
      ],
      
      // 10. Tratamientos (Skill 12) - Por sesión
      tratamientos: [
        {
          sesion: Number,                // 1, 2, 3...
          fecha: Date,
          diagnosticosComplicaciones: String,
          procedimientos: [String],
          prescripciones: [String],
          codigo: String,
          firmaDoctor: {
            doctorId: ObjectId,
            nombreDoctor: String,
            fecha: Date
          }
        }
      ]
    }
  ],
  
  metricas: {
    totalConsultas: Number,
    ultimaVisita: Date,
    proximaVisita: Date,
    tratamientosCompletados: Number,
    emergenciasAtendidas: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Endpoints

### 1. 🏥 Crear Historial Clínico
**POST** `/api/historial-clinico/:pacienteId`

Crea un historial clínico inicial para un paciente (solo una vez por paciente).

**Roles:** admin, doctor

**Request Body:**
```json
{
  "datosAdicionales": {
    // Campos adicionales si se necesitan
  }
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Historial clínico creado exitosamente",
  "datos": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "paciente": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "usuario": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan.perez@email.com"
      }
    },
    "numeroHistoriaClinica": "HC-2025-000001",
    "createdBy": { "nombre": "Admin", "apellido": "Usuario" },
    "updatedBy": { "nombre": "Admin", "apellido": "Usuario" },
    "activo": true,
    "consultas": [],
    "metricas": {
      "totalConsultas": 0,
      "ultimaVisita": null,
      "proximaVisita": null,
      "tratamientosCompletados": 0,
      "emergenciasAtendidas": 0
    },
    "informacionComplementaria": {
      "grupoEtario": "20-64 años",
      "edad": 35,
      "nombreCompleto": "Juan Pérez"
    },
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### 2. 📋 Agregar Consulta al Historial
**POST** `/api/historial-clinico/:pacienteId/consulta`

Agrega una nueva consulta al historial del paciente.

**Roles:** admin, doctor

**Request Body:**
```json
{
  "citaId": "60f7b3b3b3b3b3b3b3b3b3b5",  // Opcional: si viene de una cita
  "motivoConsulta": "Dolor molar inferior derecho",
  "enfermedadActual": {
    "descripcion": "Caries profunda en pieza 4.6",
    "tiempoEvolucion": "3 días",
    "sintomas": ["Dolor agudo al masticar", "Sensibilidad al frío"],
    "intensidadDolor": 7,
    "observaciones": "Paciente refiere dolor nocturno"
  },
  "antecedentes": {
    "alergias": {
      "antibioticos": false,
      "anestesia": false
    },
    "enfermedades": {
      "hemorragias": false,
      "vih": false,
      "tuberculosis": false,
      "asma": false,
      "diabetes": false,
      "hipertension": false,
      "cardiacas": false
    },
    "otros": false,
    "observaciones": "Sin antecedentes de importancia"
  },
  "signosVitales": {
    "presionArterial": "120/80",
    "frecuenciaCardiaca": 72,
    "temperatura": 36.5,
    "frecuenciaRespiratoria": 16
  },
  "examenEstomatognatico": {
    "labios": { "estado": "normal", "observacion": "" },
    "mejillas": { "estado": "normal", "observacion": "" },
    "maxilarSuperior": { "estado": "normal", "observacion": "" },
    "maxilarInferior": { "estado": "patológico", "observacion": "Inflamación en zona de pieza 4.6" },
    "lengua": { "estado": "normal", "observacion": "" },
    "paladar": { "estado": "normal", "observacion": "" },
    "pisoBoca": { "estado": "normal", "observacion": "" },
    "carrillos": { "estado": "normal", "observacion": "" },
    "glandulasSalivales": { "estado": "normal", "observacion": "" },
    "oroFaringe": { "estado": "normal", "observacion": "" },
    "atm": { "estado": "normal", "observacion": "" },
    "ganglios": { "estado": "normal", "observacion": "" },
    "observaciones": "Paciente colaborador"
  },
  "indicadoresSaludBucal": {
    "higieneOral": {
      "placa": "moderada",
      "calculo": "leve",
      "gingivitis": "leve"
    },
    "enfermedadPeriodontal": "leve",
    "maloclusion": null,
    "fluorosis": null,
    "indiceCPO": {
      "C": 2,
      "P": 0,
      "O": 3,
      "total": 5
    }
  },
  "planDiagnostico": {
    "biometria": { "solicitado": false, "realizado": false, "pendiente": false },
    "quimicaSanguinea": { "solicitado": false, "realizado": false, "pendiente": false },
    "rayosX": { "solicitado": true, "realizado": false, "pendiente": true },
    "otros": "",
    "observaciones": "Se solicita radiografía periapical"
  },
  "diagnosticos": [
    {
      "descripcion": "Caries dental con pulpa expuesta",
      "cie10": "K04.7",
      "tipo": "definitivo"
    },
    {
      "descripcion": "Gingivitis crónica",
      "cie10": "K05.1",
      "tipo": "presuntivo"
    }
  ],
  "tratamientos": [
    {
      "sesion": 1,
      "fecha": "2024-01-20T10:30:00.000Z",
      "diagnosticosComplicaciones": "Sin complicaciones",
      "procedimientos": ["Endodoncia parcial pieza 4.6"],
      "prescripciones": ["Ibuprofeno 400mg cada 8 horas por 5 días"],
      "codigo": "END001",
      "firmaDoctor": {
        "doctorId": "60f7b3b3b3b3b3b3b3b3b3b6",
        "nombreDoctor": "Dr. Carlos Rodríguez",
        "fecha": "2024-01-20T10:30:00.000Z"
      }
    }
  ]
}
```

**Notas importantes:**
- Si se proporciona `citaId`, el `motivoConsulta` se hereda automáticamente de `Cita.motivo` (Skill 3)
- El `doctor` y `fecha` se establecen automáticamente desde el usuario autenticado
- Los campos de auditoría se generan automáticamente

**Response:**
```json
{
  "success": true,
  "mensaje": "Consulta agregada exitosamente al historial clínico",
  "datos": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "paciente": {...},
    "numeroHistoriaClinica": "HC-2025-000001",
    "consultas": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "fecha": "2024-01-20T10:30:00.000Z",
        "doctor": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
          "usuario": {
            "nombre": "Dr. Carlos",
            "apellido": "Rodríguez"
          },
          "especialidad": "Endodoncia"
        },
        "motivoConsulta": "Dolor molar inferior derecho",
        "enfermedadActual": {...},
        "antecedentes": {...},
        "signosVitales": {...},
        "examenEstomatognatico": {...},
        "indicadoresSaludBucal": {...},
        "planDiagnostico": {...},
        "diagnosticos": [...],
        "tratamientos": [...]
      }
    ],
    "metricas": {
      "totalConsultas": 1,
      "ultimaVisita": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

### 3. 📄 Obtener Historial Completo
**GET** `/api/historial-clinico/:pacienteId`

Obtiene el historial clínico completo de un paciente con todas sus consultas.

**Roles:** admin, doctor, paciente (solo su propio historial)

**Response:**
```json
{
  "success": true,
  "mensaje": "Historial clínico obtenido exitosamente",
  "datos": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "paciente": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "usuario": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan.perez@email.com"
      }
    },
    "numeroHistoriaClinica": "HC-2025-000001",
    "activo": true,
    "consultas": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "fecha": "2024-01-20T10:30:00.000Z",
        "doctor": {...},
        "motivoConsulta": "Dolor molar inferior derecho",
        "diagnosticos": [...],
        "tratamientos": [...]
      }
    ],
    "metricas": {
      "totalConsultas": 1,
      "ultimaVisita": "2024-01-20T10:30:00.000Z"
    },
    "informacionComplementaria": {
      "grupoEtario": "20-64 años",
      "edad": 35,
      "nombreCompleto": "Juan Pérez"
    }
  }
}
```

### 4. 🔍 Obtener Consultas Filtradas
**GET** `/api/historial-clinico/:pacienteId/consultas`

Obtiene consultas con filtros avanzados y paginación.

**Query Parameters:**
- `fechaDesde`: Fecha inicial (YYYY-MM-DD)
- `fechaHasta`: Fecha final (YYYY-MM-DD)
- `doctor`: ID del doctor
- `diagnostico`: Búsqueda por descripción de diagnóstico
- `page`: Número de página (default: 1)
- `limit`: Límite por página (default: 10)

**Ejemplo:**
```
GET /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/consultas?fechaDesde=2024-01-01&diagnostico=caries&page=1&limit=5
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Consultas filtradas obtenidas exitosamente",
  "datos": {
    "consultas": [...],
    "total": 10,
    "page": 1,
    "limit": 5,
    "totalPages": 2
  }
}
```

### 5. 📊 Obtener Estadísticas del Historial
**GET** `/api/historial-clinico/:pacienteId/estadisticas`

Genera estadísticas completas del historial del paciente.

**Roles:** admin, doctor, paciente (solo sus propias estadísticas)

**Response:**
```json
{
  "success": true,
  "mensaje": "Estadísticas obtenidas exitosamente",
  "datos": {
    "totalConsultas": 5,
    "consultasPorDoctor": {
      "Dr. Carlos Rodríguez": 3,
      "Dra. María González": 2
    },
    "diagnosticosFrecuentes": {
      "Caries dental": 4,
      "Gingivitis": 2
    },
    "tratamientosRealizados": [
      {
        "sesion": 1,
        "fecha": "2024-01-20",
        "procedimientos": ["Endodoncia"],
        "doctor": "Dr. Carlos Rodríguez"
      }
    ],
    "evolucionMensual": {
      "enero 2024": 3,
      "febrero 2024": 2
    },
    "metricas": {...}
  }
}
```

### 6. ✏️ Actualizar Consulta Específica
**PUT** `/api/historial-clinico/:pacienteId/consulta/:consultaId`

Actualiza un registro específico del historial.

**Roles:** admin, doctor

**Request Body:** Enviar solo los campos a actualizar
```json
{
  "motivoConsulta": "Nuevo motivo actualizado",
  "diagnosticos": [
    {
      "descripcion": "Diagnóstico actualizado",
      "cie10": "K04.8",
      "tipo": "definitivo"
    }
  ]
}
```

### 7. 🗑️ Eliminar Consulta (SOFT DELETE)
**DELETE** `/api/historial-clinico/:pacienteId/consulta/:consultaId`

Elimina una consulta específica (soft delete - solo la remueve del array).

**Roles:** admin, doctor

**NOTA:** Según Skill 1, NO se permite eliminación física de datos clínicos.

### 8. 🗑️ Eliminar Historial (SOFT DELETE)
**DELETE** `/api/historial-clinico/:pacienteId`

Elimina todo el historial clínico (soft delete - marca como inactivo).

**Roles:** admin

**NOTA:** Según Skill 1, NO se permite eliminación física de historiales.

## 🔧 Helpers y Utilidades

### Cálculos Automáticos

El sistema incluye helpers para cálculos automáticos:

```javascript
const {
  calcularGrupoEtario,      // Calcula grupo etario desde fechaNacimiento
  calcularEdad,             // Calcula edad desde fechaNacimiento
  generarNumeroHistoriaClinica,  // Genera HC-YYYY-NNNNNN
  obtenerProximoNumeroHistoriaClinica,  // Obtiene próximo número
  validarCIE10,             // Valida formato CIE-10
  calcularTotalCPO          // Calcula total C+P+O
} = require('./src/helpers/historialClinicoHelper');
```

### Grupos Etarios (Skill 2)

- `menor de 1 año`
- `1-4 años`
- `5-9 años`
- `10-14 años`
- `15-19 años`
- `20-64 años`
- `65 años o más`

### Formato Número Historia Clínica

- Formato: `HC-YYYY-NNNNNN`
- Ejemplo: `HC-2025-000001`
- Único por paciente
- Autogenerado
- Inmutable

## 📊 Índices de Base de Datos

El modelo incluye índices optimizados para rendimiento:

```javascript
historialClinicoSchema.index({ paciente: 1 });
historialClinicoSchema.index({ numeroHistoriaClinica: 1 });
historialClinicoSchema.index({ 'consultas.fecha': -1 });
historialClinicoSchema.index({ 'consultas.doctor': 1 });
historialClinicoSchema.index({ 'consultas.diagnosticos.descripcion': 'text' });
historialClinicoSchema.index({ activo: 1 });
```

## 🔐 Permisos y Seguridad

### Control de Acceso
- **Pacientes**: Solo pueden ver y modificar su propio historial
- **Doctores**: Pueden acceder a historiales de sus pacientes
- **Admin**: Acceso completo a todos los historiales

### Validaciones
- Un historial por paciente (único)
- Auditoría de cambios (createdBy, updatedBy, timestamps)
- Eliminación lógica (soft delete) - NO eliminación física
- Validación de formato CIE-10
- Validación de relaciones obligatorias (paciente, doctor)

## 🔄 Migración de Datos

Si existen datos en la estructura antigua, se puede usar el script de migración:

```bash
node scripts/migrar-historial-clinico.js
```

Este script:
- Transforma `registros` a `consultas`
- Mapea campos antiguos a nueva estructura
- Mantiene la integridad de los datos
- Reporta errores y éxitos

## 📝 Ejemplos de Uso

### Flujo Completo de Paciente

1. **Crear historial inicial**
```bash
POST /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4
```

2. **Agregar primera consulta**
```bash
POST /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/consulta
```

3. **Ver historial completo**
```bash
GET /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4
```

4. **Obtener estadísticas**
```bash
GET /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/estadisticas
```

### Búsqueda Avanzada

```bash
GET /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/consultas?fechaDesde=2024-01-01&fechaHasta=2024-12-31&diagnostico=caries&page=1&limit=10
```

## ⚠️ Consideraciones Importantes

1. **Privacidad**: Cumplimiento con leyes de protección de datos médicos
2. **Auditabilidad**: Todos los cambios quedan registrados (createdBy, updatedBy)
3. **Escalabilidad**: Diseñado para manejar miles de pacientes
4. **Integridad**: Validación de relaciones obligatorias
5. **No eliminación**: Los datos clínicos nunca se eliminan físicamente

## 📞 Soporte

Para dudas o soporte técnico:
- Revisar documentación de skills en `docs/skills/`
- Ver ejemplos en `scripts/`
- Consultar modelos en `src/models/`