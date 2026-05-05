# 🏥 Historial Clínico Digital - API Documentation

## 📋 Overview

El módulo de Historial Clínico Digital permite gestionar de manera estructurada y completa el historial médico de los pacientes, con soporte para múltiples consultas, diagnósticos, tratamientos y seguimiento.

## 🏗️ Arquitectura del Modelo

### Estructura Principal
```javascript
{
  paciente: ObjectId,           // Referencia al paciente
  informacionGeneral: {         // Datos médicos generales
    grupoSanguineo: String,
    alergias: [],
    condicionesMedicas: [],
    medicamentosActuales: [],
    habitos: {}
  },
  registros: [                 // Array de consultas médicas
    {
      fecha: Date,
      doctor: ObjectId,
      motivoConsulta: String,
      sintomasPrincipales: [],
      examenFisico: {
        signosVitales: {},
        examenCabezaCuello: {},
        examenCavidadOral: {},
        examenDental: {}
      },
      diagnostico: {
        principal: {},
        secundarios: []
      },
      planTratamiento: {},
      tratamientoRealizado: [],
      recetas: [],
      indicaciones: [],
      seguimiento: {},
      archivos: [],
      consentimientos: []
    }
  ],
  metricas: {}                // Estadísticas del historial
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
  "informacionGeneral": {
    "grupoSanguineo": "O+",
    "factorRH": "positivo",
    "alergias": [
      {
        "tipo": "medicamento",
        "nombre": "Penicilina",
        "reaccion": "Anafilaxis",
        "gravedad": "severa"
      }
    ],
    "condicionesMedicas": [
      {
        "nombre": "Hipertensión",
        "diagnosticada": "2020-01-15",
        "tratamientoActual": "Losartán 50mg",
        "controlada": true
      }
    ],
    "medicamentosActuales": [
      {
        "nombre": "Losartán",
        "dosis": "50mg",
        "frecuencia": "1 vez al día",
        "motivo": "Hipertensión",
        "medico": "Dr. Cardiólogo"
      }
    ],
    "habitos": {
      "fuma": false,
      "consumeAlcohol": true,
      "frecuencia": "Ocasionalmente",
      "notas": "2 copas de vino semanal"
    }
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
    "paciente": "60f7b3b3b3b3b3b3b3b3b3b4",
    "informacionGeneral": {...},
    "registros": [],
    "metricas": {
      "totalConsultas": 0,
      "ultimaVisita": null,
      "proximaVisita": null,
      "costoTotalTratamientos": 0,
      "tratamientosCompletados": 0,
      "emergenciasAtendidas": 0
    },
    "createdAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### 2. 📋 Agregar Registro al Historial (Endpoint Principal)
**POST** `/api/historial-clinico/:pacienteId/registro`

Agrega una nueva consulta/registro al historial del paciente.

**Roles:** admin, doctor

**Request Body:**
```json
{
  "tipoConsulta": "consulta",
  "motivoConsulta": "Dolor molar inferior derecho",
  "sintomasPrincipales": [
    {
      "descripcion": "Dolor agudo al masticar",
      "duracion": "3 días",
      "intensidad": 7,
      "inicio": "2024-01-17"
    }
  ],
  "evaluacionInicial": {
    "estadoGeneral": "bueno",
    "observaciones": "Paciente alerta y orientado"
  },
  "examenFisico": {
    "signosVitales": {
      "presionArterial": {
        "sistolica": 120,
        "diastolica": 80
      },
      "frecuenciaCardiaca": 72,
      "temperatura": 36.5,
      "peso": 70
    },
    "examenCavidadOral": {
      "labios": "Normales",
      "encias": "Ligeramente inflamadas en zona inferior derecha",
      "lengua": "Normal",
      "paladar": "Normal"
    },
    "examenDental": {
      "dientesAfectados": ["4.6", "4.7"],
      "caries": [
        {
          "diente": "4.6",
          "superficie": "oclusal",
          "gravedad": "moderada"
        }
      ]
    }
  },
  "diagnostico": {
    "principal": {
      "codigoCIE": "K04.7",
      "descripcion": "Caries dental con pulpa expuesta",
      "certeza": "confirmado"
    },
    "secundarios": [
      {
        "codigoCIE": "K05.1",
        "descripcion": "Gingivitis crónica",
        "certeza": "probable"
      }
    ]
  },
  "planTratamiento": {
    "inmediato": [
      {
        "procedimiento": "Endodoncia molar 4.6",
        "urgencia": "urgente",
        "descripcion": "Tratamiento de conducto completo",
        "costoEstimado": 3000
      }
    ],
    "medianoPlazo": [
      {
        "procedimiento": "Restauración coronaria",
        "descripcion": "Corona de porcelana",
        "costoEstimado": 5000
      }
    ]
  },
  "tratamientoRealizado": [
    {
      "procedimiento": "Endodoncia parcial",
      "dientes": ["4.6"],
      "materiales": ["Gutta-percha", "Cemento endodóntico"],
      "duracion": 90,
      "exito": true
    }
  ],
  "recetas": [
    {
      "medicamento": "Ibuprofeno 400mg",
      "dosis": "1 tableta",
      "frecuencia": "cada 8 horas",
      "duracion": "5 días",
      "viaAdministracion": "oral",
      "instrucciones": "Tomar con alimentos"
    }
  ],
  "indicaciones": [
    {
      "tipo": "medica",
      "descripcion": "Completar tratamiento endodóntico en próxima cita"
    },
    {
      "tipo": "higienica",
      "descripcion": "Cepillado suave en zona afectada"
    }
  ],
  "seguimiento": {
    "proximaCita": "2024-01-27T10:00:00.000Z",
    "motivoSeguimiento": "Control post-tratamiento"
  },
  "observaciones": "Paciente colaborador, buen pronóstico"
}
```

### 3. 📄 Obtener Historial Completo
**GET** `/api/historial-clinico/:pacienteId`

Obtiene el historial clínico completo de un paciente con todos sus registros.

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
    "informacionGeneral": {...},
    "registros": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
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
        "diagnostico": {...},
        "tratamientoRealizado": [...],
        "recetas": [...]
      }
    ],
    "metricas": {
      "totalConsultas": 1,
      "ultimaVisita": "2024-01-20T10:30:00.000Z",
      "costoTotalTratamientos": 3000,
      "tratamientosCompletados": 1
    }
  }
}
```

### 4. 🔍 Obtener Registros Filtrados
**GET** `/api/historial-clinico/:pacienteId/registros`

Obtiene registros con filtros avanzados y paginación.

**Query Parameters:**
- `fechaDesde`: Fecha inicial (YYYY-MM-DD)
- `fechaHasta`: Fecha final (YYYY-MM-DD)
- `doctor`: ID del doctor
- `tipoConsulta`: Tipo de consulta
- `diagnostico`: Búsqueda por diagnóstico
- `page`: Número de página (default: 1)
- `limit`: Límite por página (default: 10)

**Ejemplo:**
```
GET /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/registros?fechaDesde=2024-01-01&tipoConsulta=consulta&page=1&limit=5
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
    "consultasPorTipo": {
      "consulta": 3,
      "urgencia": 1,
      "control": 1
    },
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
        "procedimiento": "Endodoncia",
        "fecha": "2024-01-20",
        "doctor": "Dr. Carlos Rodríguez"
      }
    ],
    "evolucionMensual": {
      "enero 2024": 3,
      "febrero 2024": 2
    },
    "alergias": [...],
    "condicionesMedicas": [...],
    "metricas": {...}
  }
}
```

### 6. ✏️ Actualizar Registro Específico
**PUT** `/api/historial-clinico/:pacienteId/registro/:registroId`

Actualiza un registro específico del historial.

**Roles:** admin, doctor

### 7. 🗑️ Eliminar Registro Específico
**DELETE** `/api/historial-clinico/:pacienteId/registro/:registroId`

Elimina un registro específico del historial.

**Roles:** admin, doctor

## 🔧 Servicios Disponibles

### HistorialClinicoService

Clase de servicio con métodos estáticos para operaciones complejas:

```javascript
// Crear historial inicial
await HistorialClinicoService.crearHistorialInicial(pacienteId, datosAdicionales);

// Agregar consulta completa
await HistorialClinicoService.agregarConsulta(pacienteId, datosConsulta, doctorId);

// Buscar con filtros avanzados
await HistorialClinicoService.buscarRegistrosAvanzado(pacienteId, filtros);

// Generar estadísticas completas
await HistorialClinicoService.generarEstadisticasCompletas(pacienteId);

// Actualizar información general
await HistorialClinicoService.actualizarInformacionGeneral(pacienteId, informacion);
```

## 📊 Índices de Base de Datos

El modelo incluye índices optimizados para rendimiento:

```javascript
// Índices principales
historialClinicoSchema.index({ paciente: 1 });
historialClinicoSchema.index({ 'registros.fecha': -1 });
historialClinicoSchema.index({ 'registros.doctor': 1 });
historialClinicoSchema.index({ 'registros.tipoConsulta': 1 });
historialClinicoSchema.index({ 'registros.diagnostico.principal.descripcion': 'text' });
```

## 🔐 Permisos y Seguridad

### Control de Acceso
- **Pacientes**: Solo pueden ver y modificar su propio historial
- **Doctores**: Pueden acceder a historiales de sus pacientes asignados
- **Admin**: Acceso completo a todos los historiales

### Validaciones
- Un historial por paciente (único)
- Validación de datos médicos obligatorios
- Auditoría de cambios (timestamps)
- Eliminación lógica (no se eliminan datos permanentemente)

## 📝 Ejemplos de Uso

### Flujo Completo de Paciente

1. **Crear historial inicial**
```bash
POST /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4
```

2. **Agregar primera consulta**
```bash
POST /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/registro
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
GET /api/historial-clinico/60f7b3b3b3b3b3b3b3b3b3b4/registros?fechaDesde=2024-01-01&fechaHasta=2024-12-31&diagnostico=caries&tipoConsulta=urgencia&page=1&limit=10
```

## 🚀 Características Avanzadas

### Virtuals Útiles
- `ultimaConsulta`: Último registro del historial
- `consultasRecientes`: Consultas del último mes

### Métricas Automáticas
- Total de consultas
- Costo acumulado de tratamientos
- Días entre consultas promedio
- Evolución temporal

### Análisis de Datos
- Patrones de consultas por tipo
- Diagnósticos más frecuentes
- Tratamientos realizados
- Evolución por trimestre

## 📱 Integración con Frontend

### Estados de Carga
```javascript
const [historial, setHistorial] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Ejemplo de Fetch
```javascript
const fetchHistorial = async (pacienteId) => {
  try {
    setLoading(true);
    const response = await fetch(`/api/historial-clinico/${pacienteId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setHistorial(data.datos);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## 🔍 Consideraciones Importantes

1. **Privacidad**: Cumplimiento con HIPAA y leyes de protección de datos
2. **Auditabilidad**: Todos los cambios quedan registrados
3. **Escalabilidad**: Diseñado para manejar miles de pacientes
4. **Interoperabilidad**: Compatible con estándares médicos (HL7, FHIR)
5. **Backup**: Implementar estrategia de respaldo regular

## 📞 Soporte

Para dudas o soporte técnico:
- **Documentación completa**: Ver API Reference
- **Ejemplos de código**: Ver repositorio de ejemplos
- **Testing**: Suite de pruebas disponible
- **Monitorización**: Logs y métricas en tiempo real
