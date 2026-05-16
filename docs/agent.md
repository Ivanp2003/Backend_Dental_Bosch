# agent.md — Instrucciones para implementar 3 requerimientos en Backend Dental Bosch

> Este documento le indica a la IA exactamente qué cambiar, en qué archivos y cómo hacerlo.
> Leer todo antes de escribir código. No modificar nada que no esté explícitamente mencionado aquí.

---

## Contexto del proyecto

- **Stack:** Node.js + Express 5 + MongoDB (Mongoose 9) + JWT
- **Patrón:** MVCS (Model → Service → Controller → Router)
- **Ruta base del código:** `src/`
- **Modelos relevantes:** `src/models/Cita.js`, `src/models/HistorialClinico.js`
- **Servicios relevantes:** `src/services/citasService.js`
- **Scripts de utilidad:** `scripts/` (ejecutables con `node scripts/nombre.js`)

---

## REQUERIMIENTO 1 — Auto-cancelación de citas vencidas

### Qué hacer

Cuando una cita llega a su `fecha` + `horaFin` y el doctor **no** cambió el estado a `finalizada` ni `cancelada`, el sistema debe marcarla automáticamente como `cancelada` con un motivo estándar.

Estados que deben auto-cancelarse: `pendiente`, `pendiente_confirmacion_paciente`, `confirmada`.
Estados que **no** se tocan: `finalizada`, `cancelada` (ya cerradas).

### Estrategia: script manual + cron opcional

Crear **dos artefactos**:

1. `scripts/cancelarCitasVencidas.js` — script Node.js autónomo, ejecutable manualmente con `node scripts/cancelarCitasVencidas.js`
2. `src/jobs/autoCancelarCitas.js` — módulo que exporta la función para poder montarlo como cron con `node-cron` si se desea en el futuro

### Cómo construir la query de "cita vencida"

Una cita está vencida cuando `fecha + horaFin < ahora` y `estado` es activo.

El modelo `Cita` almacena `fecha` (tipo `Date`, solo la parte de día con hora 00:00 UTC) y `horaFin` (tipo `String` en formato `"HH:MM"`). Para reconstruir el datetime de fin:

```js
// Dentro de la función, construir fechaHoraFin de cada cita:
const [hora, minuto] = cita.horaFin.split(':');
const fechaFin = new Date(cita.fecha);
fechaFin.setHours(parseInt(hora), parseInt(minuto), 0, 0);
// Si fechaFin < new Date() → la cita está vencida
```

No usar el virtual `fechaHoraFin` del modelo porque no funciona en queries de Mongoose — calcularlo en memoria tras el `.find()`.

### Query inicial para traer candidatas

```js
const ahora = new Date();

// Traer citas activas cuya fecha sea de hoy o anterior
// (el filtro fino por horaFin se hace en JS después)
const citasCandidatas = await Cita.find({
  estado: { $in: ['pendiente', 'pendiente_confirmacion_paciente', 'confirmada'] },
  fecha: { $lte: ahora }   // fecha del día <= hoy
});
```

Luego filtrar en memoria:

```js
const citasVencidas = citasCandidatas.filter(cita => {
  const [hora, minuto] = cita.horaFin.split(':');
  const fechaFin = new Date(cita.fecha);
  fechaFin.setHours(parseInt(hora), parseInt(minuto), 0, 0);
  return fechaFin < ahora;
});
```

### Actualización masiva

```js
const ids = citasVencidas.map(c => c._id);

const resultado = await Cita.updateMany(
  { _id: { $in: ids } },
  {
    $set: {
      estado: 'cancelada',
      canceladaPor: 'sistema',        // IMPORTANTE: agregar 'sistema' al enum (ver abajo)
      motivoCancelacion: 'Cita auto-cancelada: el horario transcurrió sin que el doctor registrara el resultado.',
      fechaCancelacion: new Date()    // IMPORTANTE: agregar este campo al schema (ver abajo)
    }
  }
);
```

### Cambios necesarios en `src/models/Cita.js`

**1. Agregar `'sistema'` al enum de `canceladaPor`:**

```js
// ANTES:
canceladaPor: {
  type: String,
  enum: ['paciente', 'doctor', 'admin'],
  default: null
},

// DESPUÉS:
canceladaPor: {
  type: String,
  enum: ['paciente', 'doctor', 'admin', 'sistema'],
  default: null
},
```

**2. Agregar campo `fechaCancelacion`** (no existe en el schema actual):

```js
fechaCancelacion: {
  type: Date,
  default: null
},
```

Agregar este campo después de `motivoCancelacion`.

### Estructura del script `scripts/cancelarCitasVencidas.js`

```js
require('dotenv').config();
const mongoose = require('mongoose');
const Cita = require('../src/models/Cita');

async function cancelarCitasVencidas() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const ahora = new Date();

  const candidatas = await Cita.find({
    estado: { $in: ['pendiente', 'pendiente_confirmacion_paciente', 'confirmada'] },
    fecha: { $lte: ahora }
  });

  const vencidas = candidatas.filter(cita => {
    const [hora, minuto] = cita.horaFin.split(':');
    const fechaFin = new Date(cita.fecha);
    fechaFin.setHours(parseInt(hora), parseInt(minuto), 0, 0);
    return fechaFin < ahora;
  });

  if (vencidas.length === 0) {
    console.log('No hay citas vencidas pendientes.');
    await mongoose.disconnect();
    return;
  }

  const ids = vencidas.map(c => c._id);

  const resultado = await Cita.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        estado: 'cancelada',
        canceladaPor: 'sistema',
        motivoCancelacion: 'Cita auto-cancelada: el horario transcurrió sin que el doctor registrara el resultado.',
        fechaCancelacion: ahora
      }
    }
  );

  console.log(`Auto-canceladas: ${resultado.modifiedCount} citas`);
  console.log('IDs afectadas:', ids.map(id => id.toString()));

  await mongoose.disconnect();
}

cancelarCitasVencidas().catch(err => {
  console.error('Error en cancelarCitasVencidas:', err);
  process.exit(1);
});
```

### Estructura del módulo `src/jobs/autoCancelarCitas.js`

Misma lógica pero exportada como función reutilizable:

```js
const Cita = require('../models/Cita');

async function autoCancelarCitasVencidas() {
  const ahora = new Date();

  const candidatas = await Cita.find({
    estado: { $in: ['pendiente', 'pendiente_confirmacion_paciente', 'confirmada'] },
    fecha: { $lte: ahora }
  });

  const vencidas = candidatas.filter(cita => {
    const [hora, minuto] = cita.horaFin.split(':');
    const fechaFin = new Date(cita.fecha);
    fechaFin.setHours(parseInt(hora), parseInt(minuto), 0, 0);
    return fechaFin < ahora;
  });

  if (vencidas.length === 0) return { canceladas: 0 };

  const ids = vencidas.map(c => c._id);
  const resultado = await Cita.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        estado: 'cancelada',
        canceladaPor: 'sistema',
        motivoCancelacion: 'Cita auto-cancelada: el horario transcurrió sin que el doctor registrara el resultado.',
        fechaCancelacion: ahora
      }
    }
  );

  console.log(`[autoCancelarCitas] ${resultado.modifiedCount} citas canceladas automáticamente`);
  return { canceladas: resultado.modifiedCount, ids };
}

module.exports = { autoCancelarCitasVencidas };
```

### Agregar script al package.json

```json
"cancelar-vencidas": "node scripts/cancelarCitasVencidas.js"
```

---

## REQUERIMIENTO 2 — Bloquear edición de consultas pasada la duración de la cita

### Regla de negocio

Una consulta en `HistorialClinico.consultas[]` **solo puede editarse mientras la cita asociada aún está en curso**. La ventana de edición es: desde que se crea la consulta hasta que llega la `fecha + horaFin` de la cita vinculada.

Si la cita ya terminó → la consulta es **inmutable** (ningún campo puede modificarse).

Esta es la regla más realista: el médico puede corregir datos mientras está atendiendo, pero una vez que el paciente se fue, el registro queda cerrado.

### Dónde aplicar el bloqueo

En `src/controllers/historialClinicoController.js`, función `actualizarConsulta()`.

Actualmente esa función solo valida que el historial exista y aplica el update directamente. Hay que agregar la verificación de ventana temporal **antes** del `findOneAndUpdate`.

### Lógica a agregar en `actualizarConsulta()`

Insertar este bloque **después** de encontrar el historial y **antes** del `findOneAndUpdate`:

```js
// --- BLOQUEO DE EDICIÓN POR VENTANA TEMPORAL ---

// 1. Encontrar la consulta específica dentro del historial
const consultaExistente = historial.consultas.id(consultaId);
// (historial ya fue buscado en el paso anterior con findOne)

// 2. Si la consulta tiene cita asociada, verificar que la cita aún esté en curso
if (consultaExistente?.cita) {
  const Cita = require('../models/Cita');
  const citaAsociada = await Cita.findById(consultaExistente.cita)
    .select('fecha horaFin');

  if (citaAsociada) {
    const [hora, minuto] = citaAsociada.horaFin.split(':');
    const fechaFinCita = new Date(citaAsociada.fecha);
    fechaFinCita.setHours(parseInt(hora), parseInt(minuto), 0, 0);

    if (new Date() > fechaFinCita) {
      return res.status(403).json({
        success: false,
        mensaje: 'Esta consulta ya no puede modificarse. El período de edición terminó al finalizar la cita.',
        detalle: `La cita asociada finalizó el ${fechaFinCita.toLocaleString('es-EC')}.`
      });
    }
  }
}

// 3. Si no tiene cita asociada: usar la fecha de la consulta + 24h como ventana de gracia
if (!consultaExistente?.cita) {
  const fechaConsulta = new Date(consultaExistente.fecha);
  const ventanaGracia = new Date(fechaConsulta.getTime() + 24 * 60 * 60 * 1000); // +24h

  if (new Date() > ventanaGracia) {
    return res.status(403).json({
      success: false,
      mensaje: 'Esta consulta ya no puede modificarse. Han pasado más de 24 horas desde su creación.',
    });
  }
}
// --- FIN BLOQUEO ---
```

### Nota sobre `historial.consultas.id()`

El método `.id()` es un helper de Mongoose para arrays de subdocumentos. Solo funciona si `historial` fue obtenido con `.findOne()` (no con `.lean()`). El código actual en `actualizarConsulta()` ya hace `findOne()` sin `.lean()`, por lo que `.id()` funciona correctamente.

### Respuesta HTTP a usar

- Código: `403 Forbidden`
- Mensaje claro indicando cuándo terminó la ventana de edición

---

## REQUERIMIENTO 3 — Campos de tratamiento inmutables pasado el día de atención

### Qué campos son inmutables

Dentro de cada elemento de `consultas[].tratamientos[]`, los siguientes campos **no pueden modificarse una vez que el día de la cita ha terminado**:

| Campo en el modelo | Nombre visible |
|---|---|
| `sesion` | Número de sesión |
| `fecha` | Fecha del tratamiento |
| `diagnosticosComplicaciones` | Diagnósticos/complicaciones |
| `procedimientos` | Procedimientos realizados |
| `prescripciones` | Prescripciones |
| `codigo` | Código del tratamiento |
| `firmaDoctor.doctorId` | ID del doctor |
| `firmaDoctor.nombreDoctor` | Nombre del doctor |
| `firmaDoctor.fecha` | Fecha de firma |

**Sí puede modificarse** después del día: cualquier campo fuera de este grupo (por ejemplo `observaciones` si se agrega en el futuro, o campos de seguimiento).

### Estrategia

No bloquear la consulta completa (eso lo hace el Req. 2). Aquí el bloqueo es más fino: si el body de la actualización intenta modificar alguno de los campos protegidos de un tratamiento ya pasado, rechazarlo.

### Dónde aplicar

En `src/controllers/historialClinicoController.js`, función `actualizarConsulta()`.

Agregar **después del bloqueo del Req. 2** y **antes del `findOneAndUpdate`**:

```js
// --- BLOQUEO DE CAMPOS INMUTABLES EN TRATAMIENTOS ---
const CAMPOS_INMUTABLES_TRATAMIENTO = [
  'sesion',
  'fecha',
  'diagnosticosComplicaciones',
  'procedimientos',
  'prescripciones',
  'codigo',
  'firmaDoctor'
];

// Solo aplica si el body trae tratamientos
if (datosActualizacion.tratamientos && Array.isArray(datosActualizacion.tratamientos)) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // inicio del día actual

  for (const tratamientoNuevo of datosActualizacion.tratamientos) {
    // Buscar el tratamiento original por número de sesión
    const tratamientoOriginal = consultaExistente.tratamientos?.find(
      t => t.sesion === tratamientoNuevo.sesion
    );

    if (!tratamientoOriginal) continue; // tratamiento nuevo, no aplica bloqueo

    // Verificar si el día de atención ya pasó
    const fechaTratamiento = new Date(tratamientoOriginal.fecha);
    fechaTratamiento.setHours(0, 0, 0, 0);

    if (fechaTratamiento < hoy) {
      // El tratamiento es de un día anterior — verificar si intenta cambiar campos protegidos
      const camposIntentados = Object.keys(tratamientoNuevo).filter(
        campo => CAMPOS_INMUTABLES_TRATAMIENTO.includes(campo)
      );

      if (camposIntentados.length > 0) {
        return res.status(403).json({
          success: false,
          mensaje: `No se pueden modificar los campos de registro del tratamiento pasado la fecha de atención.`,
          camposBloqueados: camposIntentados,
          sesion: tratamientoOriginal.sesion,
          fechaAtencion: tratamientoOriginal.fecha
        });
      }
    }
  }
}
// --- FIN BLOQUEO TRATAMIENTOS ---
```

### Dónde colocar `consultaExistente` para compartirla entre Req. 2 y Req. 3

`consultaExistente` se declara en el bloque del Req. 2. Para que el Req. 3 también la use, asegurarse de que la variable esté en el mismo scope (declarar con `let` si el bloque del Req. 2 la encierra en `if`). Lo más limpio es declarar `consultaExistente` antes del bloque del Req. 2:

```js
// Declarar ANTES de ambos bloques de bloqueo
const consultaExistente = historial.consultas.id(consultaId);

if (!consultaExistente) {
  return res.status(404).json({
    success: false,
    mensaje: 'Consulta no encontrada en el historial'
  });
}

// ... luego bloques de Req. 2 y Req. 3 usando consultaExistente ...
```

---

## Orden de implementación recomendado

1. **Primero:** Modificar `src/models/Cita.js` (agregar `'sistema'` al enum y campo `fechaCancelacion`) — es el cambio más pequeño y los siguientes dependen de él.
2. **Segundo:** Crear `src/jobs/autoCancelarCitas.js` y `scripts/cancelarCitasVencidas.js`.
3. **Tercero:** Agregar script `"cancelar-vencidas"` en `package.json`.
4. **Cuarto:** Modificar `src/controllers/historialClinicoController.js` → función `actualizarConsulta()`, agregando en orden: `consultaExistente`, bloque Req. 2, bloque Req. 3.
5. **Quinto:** Hacer commit con todos los cambios juntos. Sugerencia de mensaje: `feat: auto-cancelacion de citas, bloqueo edicion de consultas y campos inmutables en tratamientos`

---

## Archivos que NO deben tocarse

- `src/models/HistorialClinico.js` — no requiere cambios para estos requerimientos
- `src/routers/` — no se agregan endpoints nuevos
- Cualquier archivo de tests existente
- Archivos de configuración (`.env`, `src/config/`)

---

## Verificación rápida post-implementación

Para cada requerimiento, probar con un cliente HTTP (Postman, Thunder Client):

**Req. 1:** Ejecutar `node scripts/cancelarCitasVencidas.js` con la BD conectada. Verificar en MongoDB que las citas candidatas cambiaron a `estado: "cancelada"` y tienen `canceladaPor: "sistema"`.

**Req. 2:** Crear una consulta asociada a una cita cuya `horaFin` ya pasó. Intentar `PUT /api/historial-clinico/:pacienteId/consulta/:consultaId` → debe responder `403` con el mensaje de ventana expirada.

**Req. 3:** Con una consulta que tiene tratamientos de días anteriores, enviar un body con `tratamientos[0].sesion = <valor_existente>` → debe responder `403` con `camposBloqueados: ["sesion"]`.
