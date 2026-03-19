const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/authMiddleware');
const { uploadPhotoToCloudinary } = require('../middlewares/upload');
const {
  obtenerPerfil,
  actualizarPerfil,
  obtenerPacientes,
  obtenerPacientePorId
} = require('../controllers/pacienteController');

// ========== RUTAS PÚBLICAS ==========

// Obtener todos los pacientes
router.get('/', obtenerPacientes);

// Obtener paciente por ID
router.get('/:id', obtenerPacientePorId);

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Obtener perfil del paciente autenticado
router.get('/perfil/paciente', obtenerPerfil);

// Actualizar perfil del paciente autenticado (con opción de subir foto)
router.put('/perfil/paciente', uploadPhotoToCloudinary, actualizarPerfil);

module.exports = router;
