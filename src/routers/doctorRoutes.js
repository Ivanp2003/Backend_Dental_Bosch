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
  eliminarDoctor
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

// Obtener doctor por ID - GENÉRICA 
router.get('/:id', obtenerDoctorPorId);

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Obtener perfil del doctor autenticado
router.get('/perfil/doctor', obtenerPerfil);

// Actualizar perfil del doctor autenticado 
router.put('/perfil/doctor', actualizarPerfil);

// ========== RUTAS DE ADMINISTRADOR ==========

// Cambiar estado de doctor (aprobar/rechazar) 
router.put('/:id/estado', autorizarRoles('admin'), cambiarEstadoDoctor);

// Eliminar doctor 
router.delete('/:id', autorizarRoles('admin'), eliminarDoctor);

module.exports = router;
