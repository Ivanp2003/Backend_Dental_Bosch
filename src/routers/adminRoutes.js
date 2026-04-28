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

// 📝 NOTA: Los doctores ahora crean sus propias cuentas a través del endpoint de registro
// El administrador solo aprueba/rechaza las solicitudes pendientes

// 📋 Listar doctores con filtros
// GET /api/admin/doctores?estado=true&especialidad=odontologia&page=1&limit=10
router.get('/doctores', adminController.listarDoctores);

// ⏳ Listar doctores pendientes de aprobación
// GET /api/admin/doctores-pendientes
router.get('/doctores-pendientes', adminController.listarDoctores);

// 🔍 Ver detalle de doctor
// GET /api/admin/doctores/:id
router.get('/doctores/:id', adminController.obtenerDetalleDoctor);

// 🔄 Cambiar estado de doctor (activar/desactivar)
// PUT /api/admin/doctores/:id/estado
// Body: { activo: false, reasignarA: "doctorId" } o { activo: false, reasignacionAutomatica: true }
router.put('/doctores/:id/estado', adminController.cambiarEstadoDoctor);

// 🕐 Actualizar horario de trabajo
// PUT /api/admin/doctores/:id/horario
// Body: { horarioAtencion: [{ dia: "lunes", horaInicio: "08:00", horaFin: "17:00" }] }
router.put('/doctores/:id/horario', adminController.actualizarHorarioDoctor);

// ✏️ Editar/actualizar doctor
// PUT /api/admin/doctores/:id
// Body: { datosUsuario: { nombre, apellido, email, telefono }, datosDoctor: { especialidad, activo } }
router.put('/doctores/:id', adminController.actualizarDoctor);

//  Reasignar citas de doctor
// PUT /api/admin/doctores/:id/reasignar-citas
// Body: { doctorDestino: "doctorId", reasignarTodas: true }
router.put('/doctores/:id/reasignar-citas', adminController.reasignarCitasDoctor);

// 🗑️ Eliminar doctor (soft delete)
// DELETE /api/admin/doctores/:id
router.delete('/doctores/:id', adminController.eliminarDoctor);

// ==============================
// 📅 GESTIÓN DE CITAS (ADMIN)
// ==============================

// 👁️ Ver todas las citas del sistema
// GET /api/admin/citas?doctor=doctorId&fecha=2024-01-01&estado=pendiente&page=1&limit=10
router.get('/citas', adminController.obtenerTodasLasCitas);

// 🔍 Ver detalle de cita
// GET /api/admin/citas/:id
router.get('/citas/:id', adminController.obtenerDetalleCita);

// 🔄 Reasignar cita manualmente
// PATCH /api/admin/citas/:id/reasignar
// Body: { doctorId: "doctorId", fecha: "2024-01-01", horaInicio: "10:00" }
router.patch('/citas/:id/reasignar', adminController.reasignarCita);

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

// 🗑️ Eliminar paciente (soft delete)
// DELETE /api/admin/pacientes/:id
router.delete('/pacientes/:id', adminController.eliminarPaciente);

// ==============================
// 📊 ESTADÍSTICAS DEL SISTEMA
// ==============================

// 📊 Obtener estadísticas generales
// GET /api/admin/estadisticas
router.get('/estadisticas', adminController.obtenerEstadisticas);

module.exports = router;
