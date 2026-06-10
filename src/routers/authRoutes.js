const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  registro,
  confirmarCuenta,
  recuperarPassword,
  verificarCodigoRecuperacion,
  restablecerPassword,
  login,
  obtenerPerfil,
  actualizarPassword,
  googleCallback,
  googleMobileLogin,
  verificarToken,
  guardarPushToken
} = require('../controllers/authController');
const { protegerRuta } = require('../middlewares/authMiddleware');

// ========== RUTAS PÚBLICAS ==========

// Registro
router.post('/registro', registro);

// Confirmación de cuenta
router.get('/confirmar/:token', confirmarCuenta);

// Recuperación de contraseña
router.post('/recuperar-password', recuperarPassword);

// Verificar código de recuperación
router.post('/verificar-codigo', verificarCodigoRecuperacion);

// Restablecer contraseña con código
router.post('/restablecer-password', restablecerPassword);

// Login
router.post('/login', login);

// Login con Google - Iniciar autenticación (flujo web)
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Login con Google - Callback (flujo web)
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.URL_FRONTEND}login`,
    session: false 
  }),
  googleCallback
);

// Login con Google desde React Native / Expo (flujo móvil)
// El cliente envía { id_token } obtenido con expo-auth-session
router.post('/google/mobile', googleMobileLogin);

// ========== RUTAS PROTEGIDAS ==========

// Verificar token
router.get('/verificar-token', protegerRuta, verificarToken);

// Obtener perfil genérico
router.get('/perfil', protegerRuta, obtenerPerfil);

// Actualizar contraseña
router.put('/actualizar-password', protegerRuta, actualizarPassword);

// Guardar push token (Expo notifications)
router.patch('/push-token', protegerRuta, guardarPushToken);

module.exports = router;
