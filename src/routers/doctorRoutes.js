const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const {
  obtenerPerfil,
  actualizarPerfil,
  obtenerDoctores,
  obtenerDoctorPorId
} = require('../controllers/doctorController');

// ========== RUTAS PÚBLICAS ==========

// Obtener todos los doctores
router.get('/', obtenerDoctores);

// Obtener doctor por ID
router.get('/:id', obtenerDoctorPorId);

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Obtener perfil del doctor autenticado
router.get('/perfil/doctor', obtenerPerfil);

// Actualizar perfil del doctor autenticado (con opción de subir foto)
router.put('/perfil/doctor', upload.single('foto'), actualizarPerfil);

module.exports = router;
