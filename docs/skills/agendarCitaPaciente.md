# Agendar Cita como Paciente

## Endpoint
`POST /api/citas`

## Descripción
Los pacientes ahora pueden agendar citas para sí mismos sin necesidad de especificar su propio ID de paciente. El sistema automáticamente asigna el ID del paciente autenticado.

## Autenticación
Requiere token de autenticación con rol `paciente`.

## Body de la Petición

### Opción 1: Sin especificar ID de paciente (recomendado)
```json
{
  "doctor": "6a029c85570629a705bf5ada", 
  "fecha": "2026-05-12",
  "horaInicio": "10:00",
  "horaFin": "11:00",
  "motivo": "Limpieza dental y revisión general"
}
```

### Opción 2: Especificando su propio ID de paciente
```json
{
  "paciente": "6a029caf570629a705bf5ae1",
  "doctor": "6a029c85570629a705bf5ada", 
  "fecha": "2026-05-12",
  "horaInicio": "10:00",
  "horaFin": "11:00",
  "motivo": "Limpieza dental y revisión general"
}
```

## Respuesta Exitosa (201)
```json
{
  "success": true,
  "mensaje": "Cita creada exitosamente",
  "datos": {
    "_id": "6a029d1f570629a705bf5ae2",
    "paciente": "6a029caf570629a705bf5ae1",
    "doctor": "6a029c85570629a705bf5ada",
    "fecha": "2026-05-12",
    "horaInicio": "10:00",
    "horaFin": "11:00",
    "motivo": "Limpieza dental y revisión general",
    "estado": "pendiente",
    "creadoPor": "paciente",
    "createdAt": "2026-05-11T22:30:00.000Z",
    "__v": 0
  }
}
```

## Errores Posibles

### 400 - Campos Faltantes
```json
{
  "success": false,
  "mensaje": "Todos los campos son obligatorios",
  "camposRequeridos": ["doctor", "fecha", "horaInicio", "horaFin", "motivo"],
  "camposFaltantes": ["doctor", "fecha"]
}
```

### 404 - Paciente no encontrado
```json
{
  "success": false,
  "mensaje": "Perfil de paciente no encontrado"
}
```

### 409 - Conflicto de horario
```json
{
  "success": false,
  "mensaje": "El doctor ya tiene una cita agendada en este horario"
}
```

## Validaciones
- **Formato de hora**: HH:MM (ej: 09:00, 14:30)
- **Fecha**: No puede ser pasada
- **Disponibilidad**: Verifica que el doctor esté disponible en el horario solicitado
- **Estado del doctor**: Solo se pueden agendar citas con doctores activos

## Cambios Recientes
✅ **Corregido**: Los pacientes ya no necesitan especificar su ID de paciente en el body de la petición. El sistema automáticamente asigna el ID correspondiente al paciente autenticado.

## Ejemplo de Uso con cURL
```bash
curl -X POST https://backend-dental-bosch-vr8o.onrender.com/api/citas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DEL_PACIENTE" \
  -d '{
    "doctor": "6a029c85570629a705bf5ada",
    "fecha": "2026-05-12",
    "horaInicio": "10:00",
    "horaFin": "11:00",
    "motivo": "Limpieza dental y revisión general"
  }'
```
