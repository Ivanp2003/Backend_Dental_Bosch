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