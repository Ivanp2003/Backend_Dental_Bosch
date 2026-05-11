
---

# Recomendaciones generales para no romper funcionamiento

```md
## Estrategia segura

1. NO modificar estructura principal de modelos existentes.
2. Agregar nuevos estados de citas de forma incremental.
3. Mantener compatibilidad con frontend actual.
4. Usar soft delete en vez de eliminación física.
5. Centralizar lógica en services.
6. NO duplicar validaciones entre controller y service.
7. Mantener responses existentes:
```json
{
  "success": true,
  "mensaje": "",
  "datos": {}
}

Testing recomendado

Probar:

login
registro
creación de citas
reasignación
eliminación doctor
actualización perfil
actualización password
Riesgos a evitar
romper populate()
romper índices únicos
eliminar referencias históricas
invalidar citas antiguas
dañar autenticación JWT