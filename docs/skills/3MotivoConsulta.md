# 1. Motivo de Consulta
## Campo detectado
motivoConsulta
## Integración obligatoria con citas

Este campo debe heredarse desde:

Cita.motivo
## Restricción

NO escribir manualmente si existe cita asociada.

## Flujo correcto
Paciente agenda cita
→ cita guarda motivo
→ doctor abre consulta
→ historia clínica reutiliza motivo
## Excepción

Solo permitir edición manual si:

- consulta creada sin cita