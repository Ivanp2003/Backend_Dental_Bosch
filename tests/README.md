# Pruebas del Backend Dental Bosch

Este proyecto contiene tres tipos de pruebas:

## 1. Pruebas Unitarias de Lógica (Sin MongoDB)

Archivos:
- `tests/slotsLogic.test.js` - Pruebas de lógica de cálculo de slots ocupados
- `tests/historialLogic.test.js` - Pruebas de lógica de historial clínico

**Ejecutar:**
```bash
npm test
```

**Características:**
- No requieren conexión a MongoDB
- Prueban la lógica pura de los algoritmos
- Rápidas de ejecutar (< 1 segundo)
- 15 pruebas en total

## 2. Pruebas End-to-End (E2E)

Archivos:
- `tests/e2e/slotsOcupados.e2e.test.js` - Pruebas E2E del endpoint de slots ocupados
- `tests/e2e/historialClinico.e2e.test.js` - Pruebas E2E del endpoint de historial clínico

**Ejecutar:**
```bash
npm run test:e2e
```

**Requisitos:**
- Conexión a MongoDB (MONGODB_URI en .env)
- JWT_SECRET en .env
- Las pruebas crean datos de prueba y los limpian automáticamente

**Nota:** Las pruebas E2E requieren que las variables de entorno estén configuradas correctamente en el archivo `.env`. Si `MONGODB_URI` no se carga, las pruebas fallarán.

## 3. Pruebas en modo Watch

**Ejecutar:**
```bash
npm run test:watch
```

Ejecuta las pruebas en modo watch, re-ejecutando automáticamente cuando cambian los archivos.

## Estructura de pruebas

```
tests/
├── setup.js                    # Configuración global de Jest
├── slotsLogic.test.js          # Pruebas unitarias de slots
├── historialLogic.test.js      # Pruebas unitarias de historial
├── e2e/                        # Pruebas E2E
│   ├── slotsOcupados.e2e.test.js
│   └── historialClinico.e2e.test.js
└── README.md                   # Este archivo
```

## Configuración de Jest

Archivo: `jest.config.js`

- `testEnvironment: node` - Entorno de pruebas Node.js
- `testMatch: **/tests/**/*.test.js` - Patrón para encontrar archivos de prueba
- `setupFilesAfterEnv: tests/setup.js` - Archivo de configuración inicial

## Solución de problemas

### Error: "MONGODB_URI is undefined"

Las pruebas E2E requieren que el archivo `.env` esté configurado correctamente. Asegúrate de:

1. Tener un archivo `.env` en la raíz del proyecto
2. Que contenga `MONGODB_URI=mongodb://...`
3. Que contenga `JWT_SECRET=tu_secreto`

### Las pruebas unitarias funcionan pero las E2E no

Esto es normal. Las pruebas unitarias no requieren MongoDB, mientras que las E2E sí lo requieren. Verifica tu configuración de variables de entorno.
