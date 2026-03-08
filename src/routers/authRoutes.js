const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  registro,
  confirmarCuenta,
  recuperarPassword,
  restablecerPassword,
  login,
  obtenerPerfil,
  actualizarPassword,
  googleCallback,
  verificarToken
} = require('../controllers/authController');
const { protegerRuta } = require('../middlewares/authMiddleware');

// ========== RUTAS PÚBLICAS ==========

// Registro
router.post('/registro', registro);

// Confirmación de cuenta
router.get('/confirmar/:token', confirmarCuenta);

// Recuperación de contraseña
router.post('/recuperar-password', recuperarPassword);

// Restablecer contraseña
router.post('/restablecer-password/:token', restablecerPassword);

// Login
router.post('/login', login);

// Login con Google - Iniciar autenticación
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Login con Google - Callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.URL_FRONTEND}login`,
    session: false 
  }),
  googleCallback
);

// ========== RUTAS PROTEGIDAS ==========

// Verificar token
router.get('/verificar-token', protegerRuta, verificarToken);

// Obtener perfil genérico
router.get('/perfil', protegerRuta, obtenerPerfil);

// Actualizar contraseña
router.put('/actualizar-password', protegerRuta, actualizarPassword);

module.exports = router;
