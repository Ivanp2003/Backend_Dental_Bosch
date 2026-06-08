const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const emailGoogle = profile.emails?.[0]?.value;

      if (!emailGoogle) {
        return done(new Error('No se pudo obtener el email de la cuenta de Google'), null);
      }

      // Fix #1: familyName puede ser null/undefined en algunas cuentas Google
      const nombre   = profile.name?.givenName  || emailGoogle.split('@')[0];
      const apellido = profile.name?.familyName || 'Google';
      const foto     = profile.photos?.[0]?.value || null;

      // Buscar si ya existe un usuario con este Google ID
      let usuario = await Usuario.findOne({ googleId: profile.id });

      if (usuario) {
        return done(null, usuario);
      }

      // Buscar si existe un usuario con el mismo email
      usuario = await Usuario.findOne({ email: emailGoogle });

      if (usuario) {
        // Vincular cuenta de Google al usuario existente
        usuario.googleId  = profile.id;
        usuario.confirmado = true;
        if (foto) usuario.foto = foto;
        await usuario.save();

        // Fix #2: Crear Paciente si por alguna razón no existe todavía
        const pacienteExiste = await Paciente.findOne({ usuario: usuario._id });
        if (!pacienteExiste && usuario.rol === 'paciente') {
          await Paciente.create({ usuario: usuario._id });
        }

        return done(null, usuario);
      }

      // Crear nuevo usuario con Google
      usuario = await Usuario.create({
        nombre,
        apellido,
        email: emailGoogle,
        googleId: profile.id,
        foto,
        rol: 'paciente',
        confirmado: true,
        estado: 'aprobado'
      });

      // Fix #2: Crear registro de paciente (separado para mejor manejo de errores)
      try {
        await Paciente.create({ usuario: usuario._id });
      } catch (pacienteError) {
        // Si el paciente ya existe (unique constraint), no es un error fatal
        if (pacienteError.code !== 11000) {
          console.error('Error al crear Paciente para usuario Google:', pacienteError.message);
        }
      }

      return done(null, usuario);
    } catch (error) {
      console.error('Error en GoogleStrategy:', error.message);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Usuario.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;