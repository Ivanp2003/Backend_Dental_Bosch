const express = require('express');
const router = express.Router();
const historialClinicoController = require('../controllers/historialClinicoController');
const { protegerRuta, autorizarRoles, verificarAccesoPropio } = require('../middlewares/authMiddleware');

// 🔐 Todas las rutas requieren autenticación
router.use(protegerRuta);

// ==============================
// 🏥 HISTORIAL CLÍNICO
// ==============================

// 🏥 Crear historial clínico (solo una vez por paciente)
// POST /api/historial-clinico/:pacienteId
// Roles: admin, doctor
router.post('/:pacienteId', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.crearHistorialClinico
);

// 📋 Agregar consulta al historial (endpoint más importante)
// POST /api/historial-clinico/:pacienteId/consulta
// Roles: admin, doctor
router.post('/:pacienteId/consulta', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.agregarConsulta
);

// 🔍 Obtener consultas filtradas
// GET /api/historial-clinico/:pacienteId/consultas?fechaDesde=2024-01-01&fechaHasta=2024-12-31&doctor=doctorId&diagnostico=caries&page=1&limit=10
// Roles: admin, doctor, paciente (solo su propio historial)
router.get('/:pacienteId/consultas', 
  (req, res, next) => {
    // Si es paciente, solo puede ver sus propias consultas
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('admin', 'doctor', 'paciente'), 
  historialClinicoController.obtenerConsultasFiltradas
);

// 📊 Obtener estadísticas del historial
// GET /api/historial-clinico/:pacienteId/estadisticas
// Roles: admin, doctor, paciente (solo sus propias estadísticas)
router.get('/:pacienteId/estadisticas', 
  (req, res, next) => {
    // Si es paciente, solo puede ver sus propias estadísticas
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('admin', 'doctor', 'paciente'), 
  historialClinicoController.obtenerEstadisticasHistorial
);

// ✏️ Actualizar consulta específica
// PUT /api/historial-clinico/:pacienteId/consulta/:consultaId
// Roles: admin, doctor
router.put('/:pacienteId/consulta/:consultaId', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.actualizarConsulta
);

// 🗑️ Eliminar consulta específica (SOFT DELETE)
// DELETE /api/historial-clinico/:pacienteId/consulta/:consultaId
// Roles: admin, doctor
// NOTA: Según Skill 1, NO se permite eliminación física
router.delete('/:pacienteId/consulta/:consultaId', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.eliminarConsulta
);

// ==============================
// 🦷 ODONTOGRAMA (OPCIONAL)
// ==============================

// Inicializar odontograma en una consulta
// POST /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/inicializar
// Roles: doctor, admin
router.post('/:pacienteId/consulta/:consultaId/odontograma/inicializar',
  autorizarRoles('doctor', 'admin'),
  historialClinicoController.inicializarOdontograma
);

// Obtener odontograma visual (enriquecido con metadata para renderizado frontend)
// GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/visual
// Roles: doctor, admin, paciente
// IMPORTANTE: Debe estar ANTES de la ruta GET /odontograma para evitar conflictos de matching
router.get('/:pacienteId/consulta/:consultaId/odontograma/visual',
  (req, res, next) => {
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('doctor', 'admin', 'paciente'),
  historialClinicoController.obtenerOdontogramaVisual
);

// Obtener odontograma completo de una consulta
// GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma
// Roles: doctor, admin, paciente
router.get('/:pacienteId/consulta/:consultaId/odontograma',
  (req, res, next) => {
    // Si es paciente, solo puede ver sus propios odontogramas
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('doctor', 'admin', 'paciente'),
  historialClinicoController.obtenerOdontograma
);

// Actualizar un diente específico del odontograma
// PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/diente/:codigoFDI
// Roles: doctor, admin
router.put('/:pacienteId/consulta/:consultaId/odontograma/diente/:codigoFDI',
  autorizarRoles('doctor', 'admin'),
  historialClinicoController.actualizarDienteOdontograma
);

// Actualizar observaciones generales del odontograma
// PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/observaciones
// Roles: doctor, admin
router.put('/:pacienteId/consulta/:consultaId/odontograma/observaciones',
  autorizarRoles('doctor', 'admin'),
  historialClinicoController.actualizarObservacionesOdontograma
);

// 📄 Obtener historial completo de paciente
// GET /api/historial-clinico/:pacienteId
// Roles: admin, doctor, paciente (solo su propio historial)
// IMPORTANTE: Debe estar DESPUÉS de las rutas específicas (/consultas, /estadisticas, /consulta/:consultaId)
router.get('/:pacienteId',
  (req, res, next) => {
    // Si es paciente, solo puede ver su propio historial
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('admin', 'doctor', 'paciente'),
  historialClinicoController.obtenerHistorialCompleto
);

// 💊 Obtener tratamientos de un paciente
// GET /api/historial-clinico/:pacienteId/tratamientos
// Roles: admin, doctor, paciente (solo sus propios tratamientos)
router.get('/:pacienteId/tratamientos',
  (req, res, next) => {
    // Si es paciente, solo puede ver sus propios tratamientos
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('admin', 'doctor', 'paciente'),
  historialClinicoController.obtenerTratamientosPaciente
);

// 🗑️ ELIMINACIÓN BLOQUEADA - Una HC nunca debe eliminarse
// DELETE /api/historial-clinico/:pacienteId
// Razón: Una historia clínica es un registro médico-legal y no debe eliminarse
// router.delete('/:pacienteId', 
//   autorizarRoles('admin'), 
//   historialClinicoController.eliminarHistorial
// );

module.exports = router;