const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protegerRuta, autorizarRoles } = require('../middlewares/authMiddleware');

// 🔐 Todas las rutas requieren rol de admin
router.use(protegerRuta);
router.use(autorizarRoles('admin'));

// ==============================
// 🦷 GESTIÓN DE DOCTORES
// ==============================

// ✅ Crear doctor
// POST /api/admin/doctores
router.post('/doctores', adminController.crearDoctor);

// 📋 Listar doctores con filtros
// GET /api/admin/doctores?estado=true&especialidad=odontologia&page=1&limit=10
router.get('/doctores', adminController.listarDoctores);

// 🔍 Ver detalle de doctor
// GET /api/admin/doctores/:id
router.get('/doctores/:id', adminController.obtenerDetalleDoctor);

// ✏️ Editar/actualizar doctor
// PUT /api/admin/doctores/:id
// Body: { datosUsuario: { nombre, apellido, email, telefono }, datosDoctor: { especialidad, activo } }
router.put('/doctores/:id', adminController.actualizarDoctor);

// 🔄 Cambiar estado de doctor (activar/desactivar)
// PUT /api/admin/doctores/:id/estado
// Body: { activo: false, reasignarA: "doctorId" } o { activo: false, reasignacionAutomatica: true }
router.put('/doctores/:id/estado', adminController.cambiarEstadoDoctor);

// 🕐 Actualizar horario de trabajo
// PUT /api/admin/doctores/:id/horario
// Body: { horarioAtencion: [{ dia: "lunes", horaInicio: "08:00", horaFin: "17:00" }] }
router.put('/doctores/:id/horario', adminController.actualizarHorarioDoctor);

// ==============================
// 📅 GESTIÓN DE CITAS (ADMIN)
// ==============================

// 👁️ Ver todas las citas del sistema
// GET /api/admin/citas?doctor=doctorId&fecha=2024-01-01&estado=pendiente&page=1&limit=10
router.get('/citas', adminController.obtenerTodasLasCitas);

// ==============================
// 🧑‍⚕️ GESTIÓN DE PACIENTES
// ==============================

// 👁️ Ver pacientes
// GET /api/admin/pacientes?page=1&limit=10&busqueda=juan
router.get('/pacientes', adminController.listarPacientes);

// 🔍 Ver detalle de paciente
// GET /api/admin/pacientes/:id
router.get('/pacientes/:id', adminController.obtenerDetallePaciente);

// 🔗 Cambiar doctor asignado a paciente
// PUT /api/admin/pacientes/:id/doctor
// Body: { doctorId: "doctorId" }
router.put('/pacientes/:id/doctor', adminController.cambiarDoctorAsignado);

// ==============================
// 📊 ESTADÍSTICAS DEL SISTEMA
// ==============================

// 📊 Obtener estadísticas generales
// GET /api/admin/estadisticas
router.get('/estadisticas', adminController.obtenerEstadisticas);

module.exports = router;
