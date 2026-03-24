const express = require('express');
const router = express.Router();
const { protegerRuta, autorizarRoles } = require('../middlewares/authMiddleware');
const { uploadPhotoToCloudinary } = require('../middlewares/upload');
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

// ========== RUTAS PÚBLICAS ==========

// Obtener todos los doctores
router.get('/', obtenerDoctores);

// Obtener doctor por ID
router.get('/:id', obtenerDoctorPorId);

// Obtener doctores aprobados (público)
router.get('/aprobados/lista', obtenerDoctoresAprobados);

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Obtener perfil del doctor autenticado
router.get('/perfil/doctor', obtenerPerfil);

// Actualizar perfil del doctor autenticado (con opción de subir foto)
router.put('/perfil/doctor', uploadPhotoToCloudinary, actualizarPerfil);

// ========== RUTAS DE ADMINISTRADOR ==========

// Obtener doctores pendientes de aprobación (Admin)
router.get('/pendientes', autorizarRoles('admin'), (req, res, next) => {
  console.log('🔍 Accediendo a /pendientes');
  console.log('👤 Usuario autenticado:', req.usuario);
  console.log('🔐 Rol del usuario:', req.usuario?.rol || req.usuario?.usuario?.rol);
  obtenerDoctoresPendientes(req, res, next);
});

// Cambiar estado de doctor (aprobar/rechazar) (Admin)
router.put('/:id/estado', autorizarRoles('admin'), cambiarEstadoDoctor);

// Eliminar doctor (Admin)
router.delete('/:id', autorizarRoles('admin'), eliminarDoctor);

module.exports = router;
