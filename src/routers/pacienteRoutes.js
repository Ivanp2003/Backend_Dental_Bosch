const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const {
  obtenerPerfil,
  actualizarPerfil,
  obtenerPacientes,
  obtenerPacientePorId
} = require('../controllers/pacienteController');

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas
router.use(protegerRuta);

// Rutas para administración de pacientes (doctores/admins)
router.get('/', obtenerPacientes);
router.get('/:id', obtenerPacientePorId);

// Rutas para pacientes (solo el paciente puede acceder a su propio perfil)
router.get('/perfil/paciente', obtenerPerfil);
router.put('/perfil/paciente', upload.single('foto'), actualizarPerfil);

module.exports = router;
