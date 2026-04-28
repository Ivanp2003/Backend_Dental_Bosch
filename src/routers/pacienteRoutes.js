const express = require('express');
const router = express.Router();
const { protegerRuta, autorizarRoles } = require('../middlewares/authMiddleware');
const {
  registrarPaciente,
  listarPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  eliminarPaciente,
  obtenerPerfilPaciente,
  buscarPacientes,
  asignarDoctor,
  // Mantener compatibilidad con código existente
  obtenerPerfil,
  actualizarPerfil
} = require('../controllers/pacienteController');

// ========== RUTAS PÚBLICAS ==========

// Búsqueda avanzada de pacientes
router.get('/buscar', buscarPacientes);

// Obtener paciente por ID (público)
router.get('/:id', obtenerPacientePorId);

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Listar todos los pacientes (solo doctores y admin)
router.get('/', autorizarRoles(['doctor', 'admin']), listarPacientes);

// Registrar nuevo paciente (solo doctores y admin)
router.post('/', autorizarRoles(['doctor', 'admin']), registrarPaciente);

// Obtener perfil del paciente autenticado
router.get('/perfil/paciente', obtenerPerfilPaciente);

// Actualizar perfil del paciente autenticado
router.put('/perfil/paciente', actualizarPerfil);

// Actualizar información del paciente (solo doctores y admin)
router.put('/:id', autorizarRoles(['doctor', 'admin']), actualizarPaciente);

// Eliminar paciente (solo admin)
router.delete('/:id', autorizarRoles(['admin']), eliminarPaciente);

// Asignar doctor a paciente (solo doctores y admin)
router.put('/:id/asignar-doctor', autorizarRoles(['doctor', 'admin']), asignarDoctor);

module.exports = router;
