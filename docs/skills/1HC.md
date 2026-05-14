# SKILL: Campos oficiales del formato de Historia Clínica Dental Bosch

# Objetivo

Analizar el formato físico real de Historia Clínica
y mapear TODOS los campos importantes
a una estructura digital compatible con el backend actual.

Este documento define:
- campos reales del formulario
- integración lógica
- estructura backend
- restricciones
- campos automáticos
- excepciones
- preparación futura

---

# Estructura general del documento físico

El documento tiene:

1. Información general paciente
2. Motivo de consulta
3. Enfermedad actual
4. Antecedentes personales y familiares
5. Signos vitales
6. Examen sistema estomatognático
7. Odontograma (pendiente)
8. Indicadores de salud bucal
9. Diagnóstico
10. Plan diagnóstico terapéutico
11. Tratamiento
12. Evolución clínica


## Auditoría requerida

Todos los registros deben guardar:

createdBy
updatedBy
createdAt
updatedAt
## Restricción crítica

NO permitir eliminación física de:

diagnósticos
tratamientos
consultas
historiales

Usar:

activo: false
Relaciones obligatorias
Historia Clínica debe relacionarse con
Paciente
Doctor
Cita
Usuario
## Restricción de integridad

NO permitir:

- historiales huérfanos
- consultas sin doctor
- consultas sin paciente
## Campos automáticos derivados del sistema
Deben generarse automáticamente
motivoConsulta ← cita
doctor ← usuario autenticado
fecha ← timestamp
paciente ← token/ruta
grupoEtario ← fecha nacimiento
edad ← fecha nacimiento
## Endpoints recomendados
Crear historial
POST /api/historial-clinico/:pacienteId
Agregar consulta
POST /api/historial-clinico/:pacienteId/consulta
Agregar tratamiento
POST /api/historial-clinico/:pacienteId/tratamiento
Obtener historial
GET /api/historial-clinico/:pacienteId
Actualizar consulta
PUT /api/historial-clinico/:pacienteId/consulta/:consultaId
## Restricciones finales
NO romper sistema actual

NO modificar:

JWT
login
modelo usuario
modelo citas
roles existentes
Estrategia recomendada

Integrar módulo:

de forma incremental
Orden sugerido
1. modelo historial
2. endpoints básicos
3. integración citas
4. diagnósticos
5. tratamientos
6. archivos clínicos
7. métricas
8. odontograma (futuro)
## Objetivo final

Construir un módulo de Historia Clínica
- profesional
- auditable
- escalable
- integrado
- compatible con el formato físico oficial
- sin afectar la estabilidad del backend actual.