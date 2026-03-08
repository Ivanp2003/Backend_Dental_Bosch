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
      // Buscar si ya existe un usuario con este Google ID
      let usuario = await Usuario.findOne({ googleId: profile.id });

      if (usuario) {
        return done(null, usuario);
      }

      // Buscar si existe un usuario con el mismo email
      usuario = await Usuario.findOne({ email: profile.emails[0].value });

      if (usuario) {
        // Vincular cuenta de Google
        usuario.googleId = profile.id;
        usuario.confirmado = true;
        usuario.foto = profile.photos[0]?.value || usuario.foto;
        await usuario.save();
        return done(null, usuario);
      }

      // Crear nuevo usuario con Google
      usuario = await Usuario.create({
        nombre: profile.name.givenName,
        apellido: profile.name.familyName,
        email: profile.emails[0].value,
        googleId: profile.id,
        foto: profile.photos[0]?.value,
        rol: 'paciente',
        confirmado: true,
        estado: 'aprobado'
      });

      // Crear registro de paciente
      await Paciente.create({
        usuario: usuario._id
      });

      done(null, usuario);
    } catch (error) {
      done(error, null);
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