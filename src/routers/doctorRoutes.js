const express = require('express');
const router = express.Router();
const { protegerRuta, autorizarRoles } = require('../middlewares/authMiddleware');
const {
  obtenerPerfil,
  actualizarPerfil,
  obtenerDoctores,
  obtenerDoctorPorId,
  cambiarEstadoDoctor,
  obtenerDoctoresPendientes,
  obtenerDoctoresAprobados,
  eliminarDoctor,
  reactivarDoctor,
  actualizarDoctor,
  obtenerMisPacientes,
  obtenerMisCitas,
  cambiarEstadoCita,
  obtenerDetallePaciente
} = require('../controllers/doctorController');

// Middleware de logging para todas las solicitudes a doctores
router.use((req, res, next) => {
  console.log(`🔍 Doctor Routes: ${req.method} ${req.originalUrl}`);
  console.log('Query params:', req.query);
  console.log('Params:', req.params);
  next();
});

// ========== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ==========

// Obtener todos los doctores
router.get('/', obtenerDoctores);

// Obtener doctores aprobados (público) 
router.get('/aprobados/lista', obtenerDoctoresAprobados);

// Obtener doctores pendientes de aprobación (Admin) 
router.get(
  '/pendientes',
  protegerRuta,
  autorizarRoles('admin'),
  (req, res, next) => {
    console.log('Entrando a /pendientes');
    console.log('Usuario autenticado:', req.usuario);
    console.log('Rol:', req.usuario?.rol);
    obtenerDoctoresPendientes(req, res, next);
  }
);

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Obtener perfil del doctor autenticado
router.get('/perfil/doctor', obtenerPerfil);

// Actualizar perfil del doctor autenticado 
router.put('/perfil/doctor', actualizarPerfil);

// Obtener pacientes del doctor autenticado
// GET /api/doctores/mis-pacientes
router.get('/mis-pacientes', autorizarRoles('doctor'), obtenerMisPacientes);

// Obtener detalle de un paciente específico
// GET /api/doctores/pacientes/:id
router.get('/pacientes/:id', autorizarRoles('doctor'), obtenerDetallePaciente);

// Obtener citas del doctor autenticado (desde su perfil)
// GET /api/doctores/mis-citas?estado=pendiente&desde=2024-01-01&hasta=2024-12-31&page=1&limit=10
router.get('/mis-citas', autorizarRoles('doctor'), obtenerMisCitas);

// Cambiar estado de cita (finalizar o cancelar)
// PUT /api/doctores/citas/:id/estado
// Body: { estado: "finalizada|cancelada", motivoCancelacion: "si se cancela", notas: "si se finaliza" }
router.put('/citas/:id/estado', autorizarRoles('doctor'), cambiarEstadoCita);

// ========== RUTAS DE ADMINISTRADOR ==========

// Cambiar estado de doctor (aprobar/rechazar) 
router.put('/:id/estado', autorizarRoles('admin'), cambiarEstadoDoctor);

// Eliminar doctor (desactivar)
router.delete('/:id', autorizarRoles('admin'), eliminarDoctor);

// Reactivar doctor 
router.put('/:id/reactivar', autorizarRoles('admin'), reactivarDoctor);

// Actualizar doctor (solo admin) 
router.put('/:id', autorizarRoles('admin'), actualizarDoctor);

// ========== RUTA DINÁMICA (AL FINAL) ==========

// Obtener doctor por ID - DEBE estar al final para no interferir con rutas específicas
router.get('/:id', obtenerDoctorPorId);

module.exports = router;
