const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { protegerRuta, autorizarRoles } = require('../middlewares/authMiddleware');

// 🔐 Todas las rutas requieren autenticación
router.use(protegerRuta);

// ==============================
// 📅 GESTIÓN DE CITAS
// ==============================

// 📅 Crear cita (paciente, doctor, admin)
// POST /api/citas
router.post('/', citasController.crearCita);

// 📋 Obtener mis citas (paciente autenticado)
// GET /api/citas/mis-citas?estado=pendiente&desde=2024-01-01&hasta=2024-12-31&page=1&limit=10
router.get('/mis-citas', autorizarRoles('paciente'), citasController.obtenerMisCitas);

// 👨‍⚕️ Obtener citas del doctor autenticado
// GET /api/citas/doctor?estado=pendiente&desde=2024-01-01&hasta=2024-12-31&page=1&limit=10
router.get('/doctor', autorizarRoles('doctor'), citasController.obtenerCitasDoctor);

// 👁️ Obtener todas las citas (admin)
// GET /api/citas?estado=pendiente&desde=2024-01-01&hasta=2024-12-31&doctor=doctorId&paciente=pacienteId&page=1&limit=10
router.get('/', autorizarRoles('admin'), citasController.obtenerTodasLasCitas);

// ❌ Cancelar cita
// DELETE /api/citas/:id
// Body: { motivoCancelacion: "Motivo de la cancelación" }
router.delete('/:id', citasController.cancelarCita);

// ✅ Confirmar cita (doctor, admin)
// PUT /api/citas/:id/confirmar
router.put('/:id/confirmar', autorizarRoles('doctor', 'admin'), citasController.confirmarCita);

// 🏁 Finalizar cita (doctor, admin)
// PUT /api/citas/:id/finalizar
// Body: { notas: "Notas de la cita" }
router.put('/:id/finalizar', autorizarRoles('doctor', 'admin'), citasController.finalizarCita);

// 📅 Obtener disponibilidad de doctor
// GET /api/citas/disponibilidad?doctorId=doctorId&fecha=2024-01-01
router.get('/disponibilidad', citasController.obtenerDisponibilidadDoctor);

module.exports = router;
