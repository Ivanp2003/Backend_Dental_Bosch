# SKILL: Eliminación segura de doctores

## Objetivo
Evitar que un doctor sea eliminado si tiene pacientes asignados.

## Comportamiento esperado
- Un doctor NO puede eliminarse si existen pacientes con:
  paciente.doctorAsignado = doctor._id
- Se debe pbligar a reasignar de doctor para que esté sin citas pendientes
- Debe retornarse un error controlado.
- El doctor eliminado debe seguir visible en frontend.

## Implementación requerida

### Backend
Antes de ejecutar eliminación:

1. Buscar pacientes asignados:
```js
const pacientesAsignados = await Paciente.countDocuments({
  doctorAsignado: doctorId
});

Si existen pacientes:
if (pacientesAsignados > 0) {
  throw new Error(
    'No se puede eliminar el doctor porque tiene pacientes asignados'
  );
}
NO eliminar físicamente el doctor.
Usar soft delete:
doctor.activo = false;
doctor.eliminado = true;
await doctor.save();
Restricciones
NO usar deleteOne()
NO usar findByIdAndDelete()
Debe mantenerse integridad histórica de:
citas
historial clínico
pacientes
El doctor debe seguir apareciendo en frontend como:
"Inactivo" o "Eliminado"

# Gestión de Doctores - Desactivación y Reactivación 

## Descripción
El sistema ahora permite desactivar y reactivar doctores de forma segura, en lugar de eliminarlos permanentemente de la base de datos.

## Endpoints Implementados

### 1. Desactivar Doctor (DELETE)
**Endpoint**: `DELETE /api/doctores/:id`

**Descripción**: Desactiva un doctor cambiando su estado `activo` a `false` y su estado de usuario a `inactivo`.

**Autenticación**: Requiere token de administrador.

**Validaciones Implementadas**:
- Verifica que el usuario autenticado sea administrador
- Verifica que el doctor exista
- Verifica que el doctor no esté ya inactivo
- **Verifica que no tenga citas pendientes o futuras**

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "mensaje": "Doctor desactivado exitosamente",
  "data": {
    "doctorId": "6a029c85570629a705bf5ada",
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "activo": false,
    "estadoUsuario": "inactivo"
  }
}
```

**Error si tiene citas pendientes (409)**:
```json
{
  "success": false,
  "mensaje": "No se puede desactivar el doctor. Tiene citas pendientes o futuras.",
  "datos": {
    "totalCitasPendientes": 3,
    "citas": [
      {
        "id": "6a029d1f570629a705bf5ae2",
        "fecha": "2026-05-15",
        "horaInicio": "10:00",
        "estado": "pendiente"
      }
    ]
  }
}
```

### 2. Reactivar Doctor (PUT)
**Endpoint**: `PUT /api/doctores/:id/reactivar`

**Descripción**: Reactiva un doctor cambiando su estado `activo` a `true` y su estado de usuario a `aprobado`.

**Autenticación**: Requiere token de administrador.

**Validaciones Implementadas**:
- Verifica que el usuario autenticado sea administrador
- Verifica que el doctor exista
- Verifica que el doctor no esté ya activo

## Cambios Realizados

### Antes (Borrado Físico):
- Eliminaba permanentemente el usuario
- Dejaba registros huérfanos en la colección de doctores
- Podía romper relaciones con citas y pacientes
- No había forma de recuperar el doctor

### Ahora (Soft Delete Implementado):
- Cambia estado `activo` a `false` en el doctor
- Cambia estado del usuario a `inactivo`
- Preserva todas las relaciones y datos históricos
- Permite reactivar el doctor cuando sea necesario
- Verifica que no tenga citas pendientes antes de desactivar

## Flujo de Desactivación Segura

1. **Verificación de Citas**: El sistema busca citas con estado `pendiente` o `confirmada` con fecha futura
2. **Bloqueo Preventivo**: Si hay citas pendientes, rechaza la desactivación y muestra las citas conflictivas
3. **Desactivación Controlada**: Si no hay conflictos, cambia los estados del doctor y usuario
4. **Preservación de Datos**: Mantiene todo el historial y relaciones intactas

## Ejemplos de Uso

### Desactivar Doctor con cURL
```bash
curl -X DELETE https://backend-dental-bosch-vr8o.onrender.com/api/doctores/6a029c85570629a705bf5ada \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Reactivar Doctor con cURL
```bash
curl -X PUT https://backend-dental-bosch-vr8o.onrender.com/api/doctores/6a029c85570629a705bf5ada/reactivar \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

## Archivos Modificados

1. **src/controllers/doctorController.js**:
   - Modificada función `eliminarDoctor` para soft delete
   - Agregada función `reactivarDoctor`
   - Verificación de citas pendientes antes de desactivar

2. **src/routers/doctorRoutes.js**:
   - Agregada ruta `PUT /:id/reactivar`
   - Actualizada documentación de ruta `DELETE /:id`

## Beneficios

1. **Integridad de Datos**: No se pierde información histórica
2. **Recuperación**: Los doctores pueden ser reactivados fácilmente
3. **Seguridad**: Previene desactivaciones accidentales con citas activas
4. **Auditoría**: Mantiene un registro completo de todos los doctores
5. **Consistencia**: No deja referencias rotas en el sistema