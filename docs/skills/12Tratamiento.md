# Tratamiento
# Campos detectados
- sesion
- fecha
- diagnosticosComplicaciones
- procedimientos
- prescripciones
- codigo
- firma
## Objetivo

Registrar evolución clínica y tratamientos.

## Estructura recomendada
tratamientos: [
  {
    sesion,
    fecha,
    diagnosticosComplicaciones,
    procedimientos,
    prescripciones,
    codigo,
    firmaDoctor
  }
]
## Restricción importante

Cada sesión debe ser:

independiente
Integración con citas

Cada tratamiento debe relacionarse con:

cita
doctor
## Firma
## Restricción actual

NO implementar firma digital todavía.(EN TODO CASO MARCAR UN CHECK )

Temporalmente usar:
firmaDoctor: {
  doctorId,
  nombreDoctor,
  fecha
}
