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

// 📋 Agregar registro al historial (endpoint más importante)
// POST /api/historial-clinico/:pacienteId/registro
// Roles: admin, doctor
router.post('/:pacienteId/registro', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.agregarRegistroHistorial
);

// 📄 Obtener historial completo de paciente
// GET /api/historial-clinico/:pacienteId
// Roles: admin, doctor, paciente (solo su propio historial)
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

// 🔍 Obtener registros filtrados
// GET /api/historial-clinico/:pacienteId/registros?fechaDesde=2024-01-01&fechaHasta=2024-12-31&doctor=doctorId&tipoConsulta=consulta&page=1&limit=10
// Roles: admin, doctor, paciente (solo su propio historial)
router.get('/:pacienteId/registros', 
  (req, res, next) => {
    // Si es paciente, solo puede ver su propio historial
    if (req.usuario.rol === 'paciente') {
      return verificarAccesoPropio(req, res, next);
    }
    next();
  },
  autorizarRoles('admin', 'doctor', 'paciente'), 
  historialClinicoController.obtenerRegistrosFiltrados
);

// 📊 Obtener estadísticas del historial
// GET /api/historial-clinico/:pacienteId/estadisticas
// Roles: admin, doctor, paciente (solo su propio historial)
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

// ✏️ Actualizar registro específico
// PUT /api/historial-clinico/:pacienteId/registro/:registroId
// Roles: admin, doctor (solo sus propios registros)
router.put('/:pacienteId/registro/:registroId', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.actualizarRegistro
);

// 🗑️ Eliminar registro específico
// DELETE /api/historial-clinico/:pacienteId/registro/:registroId
// Roles: admin, doctor (solo sus propios registros)
router.delete('/:pacienteId/registro/:registroId', 
  autorizarRoles('admin', 'doctor'), 
  historialClinicoController.eliminarRegistro
);

module.exports = router;
