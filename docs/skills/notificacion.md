# SKILL: Notificación por reasignación de doctor

## Objetivo
Enviar correos automáticos cuando un paciente es reasignado a otro doctor.

## Eventos que disparan correo
- cambio de doctor asignado
- reasignación manual
- reasignación automática

## Destinatarios
1. Paciente
2. Nuevo doctor asignado

## Información requerida en correo
- nombre paciente
- doctor anterior
- nuevo doctor
- fecha de cambio
- mensaje institucional

## Implementación

### Servicio recomendado
```txt
utils/email.js
Restricciones
NO bloquear flujo principal si falla email
manejar try/catch independiente

Logs

Registrar:

envío exitoso
error de envío