const express = require('express');
const router = express.Router();
const historialClinicoController = require('../controllers/historialClinicoController');
const { protegerRuta, autorizarRoles, verificarAccesoPropio } = require('../middlewares/authMiddleware');

// 🔐 Todas las rutas requieren autenticación
router.use(protegerRuta);

// ==============================
// 💊 TRATAMIENTOS
// ==============================

// 💊 Obtener tratamientos de un paciente
// GET /api/tratamientos/paciente/:pacienteId
// Roles: admin, doctor, paciente (solo sus propios tratamientos)
router.get('/paciente/:pacienteId',
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

module.exports = router;
