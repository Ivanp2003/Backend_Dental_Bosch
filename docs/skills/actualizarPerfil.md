
```md
# SKILL: Validación de actualización de perfil y contraseña

## Objetivo
Revisar seguridad y consistencia en:
- doctor
- paciente

## Endpoints a revisar

### Perfil
```txt
PUT /api/doctores/perfil/doctor
PUT /api/pacientes/perfil/paciente

# Contraseña
Flujo correcto
validar contraseña actual
comparar con bcrypt
validar nueva contraseña
hashear nueva contraseña
guardar
Validaciones mínimas
- mínimo 6 caracteres
- diferente a contraseña actual
- no vacía