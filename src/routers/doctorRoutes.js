const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const {
  obtenerPerfil,
  actualizarPerfil,
  obtenerDoctores,
  obtenerDoctorPorId,
  cambiarEstadoDoctor
} = require('../controllers/doctorController');

// ========== RUTAS PÚBLICAS ==========

// Obtener todos los doctores
router.get('/', obtenerDoctores);

// Obtener doctor por ID
router.get('/:id', obtenerDoctorPorId);

// Endpoint temporal para corregir rol del admin (eliminar en producción)
router.put('/fix-admin-role', async (req, res) => {
  try {
    const Usuario = require('../models/Usuario');
    
    // Buscar y actualizar el admin
    const admin = await Usuario.findOneAndUpdate(
      { email: 'admin@dentalbosch.com' },
      { rol: 'admin' },
      { new: true }
    );
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        mensaje: 'Admin no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      mensaje: 'Rol de admin corregido exitosamente',
      data: {
        id: admin._id,
        email: admin.email,
        rol: admin.rol
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al corregir rol',
      error: error.message
    });
  }
});

// ========== RUTAS PROTEGIDAS ==========

// Aplicar middleware de protección a todas las rutas siguientes
router.use(protegerRuta);

// Obtener perfil del doctor autenticado
router.get('/perfil/doctor', obtenerPerfil);

// Actualizar perfil del doctor autenticado (con opción de subir foto)
router.put('/perfil/doctor', upload.single('foto'), actualizarPerfil);

// Cambiar estado de doctor (solo admin)
router.put('/:id/estado', cambiarEstadoDoctor);

module.exports = router;
