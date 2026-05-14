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

// 🗑️ Eliminar historial completo (SOFT DELETE)
// DELETE /api/historial-clinico/:pacienteId
// Roles: admin
// NOTA: Según Skill 1, NO se permite eliminación física
router.delete('/:pacienteId', 
  autorizarRoles('admin'), 
  historialClinicoController.eliminarHistorial
);

module.exports = router;