# SKILL: Agendamiento de citas desde doctor

## Objetivo
Permitir que un doctor cree citas para pacientes.

## Flujo esperado

Doctor:
1. crea cita
2. cita queda en estado:
   "pendiente_confirmacion_paciente"
3. paciente recibe notificación
4. paciente confirma o rechaza

## Estados nuevos requeridos

Agregar estado:
```js
pendiente_confirmacion_paciente
Solo doctor puede:
crear múltiples citas para un paciente
reagendar múltiples veces
Paciente NO puede:
agendar más de una cita por día
Validación requerida

Cuando rol = paciente:

const citasHoy = await Cita.countDocuments({
  paciente: pacienteId,
  fecha: fechaSeleccionada,
  estado: {
    $in: ['pendiente', 'confirmada']
  }
});

Si existe:

throw new Error(
  'Solo puedes agendar una cita por día'
);
Excepción

Si quien crea la cita es doctor:

NO aplicar restricción diaria
Confirmación del paciente

Nuevo endpoint:

PUT /api/citas/:id/confirmar
PUT /api/citas/:id/rechazar
Lógica

Paciente:

if (accion === 'confirmar') {
  cita.estado = 'confirmada';
}
if (accion === 'rechazar') {
  cita.estado = 'cancelada';
}