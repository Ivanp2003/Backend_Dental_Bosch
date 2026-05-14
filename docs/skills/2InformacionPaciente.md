# 0. Información General del Paciente
## Campos detectados
establecimiento: Dental Bosch
nombre
apellido
sexo
número historia clínica

grupo etario
Grupo etario detectado
menor de 1 año
1-4 años
5-9 años
10-14 años
15-19 años
20-64 años
65 años o más
embarazada
Integración con backend actual
NO duplicar datos

Estos datos deben provenir automáticamente desde:

- Usuario
- Paciente
Campos automáticos
{
  paciente,
  nombre,
  apellido,
  sexo,
  fechaNacimiento,
  edad,
  grupoEtario
}
## Cálculo automático de grupo etario
### Restricción

NO guardar manualmente.

Debe calcularse automáticamente:
grupoEtario = calcularGrupoEtario(fechaNacimiento)
## Número de historia clínica
### Restricción crítica

Debe ser:

- único
- autogenerado
- inmutable
### Recomendación
HC-2025-000001