require('dotenv').config();



const express = require('express');

const cors = require('cors');

const passport = require('passport');

const connectDB = require('./database');

const createAdminDoctor = require('./seeds/AdminDoctor'); // Nuevo sistema de seeds

require('./config/passport'); // Cargar configuración de Passport

const { errorHandler, notFound } = require('./middlewares/errorHandler');



// Importar rutas

const authRoutes = require('./routers/authRoutes');

const doctorRoutes = require('./routers/doctorRoutes');

const pacienteRoutes = require('./routers/pacienteRoutes');



// Conectar a la base de datos

connectDB().then(() => {

  // Crear doctor administrador por defecto con manejo de errores

  createAdminDoctor().catch(error => {

    console.error('Error en el sistema de seeds:', error.message);

  });

}).catch(error => {

  console.error('Error al conectar a la base de datos:', error.message);

  process.exit(1);

});



// Crear aplicación Express

const app = express();



// Middlewares globales

// Configuración de orígenes permitidos
const getAllowedOrigins = () => {
  // Si hay orígenes configurados en variables de entorno, usarlos
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
  }
  
  // Sino, usar configuración por defecto según entorno
  if (process.env.NODE_ENV === 'production') {
    // En producción permitir tanto Vercel como localhost para desarrollo
    return [
      'https://dental-bosch.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173'
    ];
  } else {
    // En desarrollo permitir todos los puertos comunes
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8000'
    ];
  }
};

const allowedOrigins = getAllowedOrigins();

// Log de orígenes permitidos para debugging
console.log(' Orígenes CORS permitidos:', allowedOrigins);
console.log(' Entorno:', process.env.NODE_ENV);

// Configuración CORS dinámica
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));



// Inicializar Passport

app.use(passport.initialize());



// Middleware de logging en desarrollo

if (process.env.NODE_ENV === 'development') {

  app.use((req, res, next) => {

    console.log(`${req.method} ${req.path}`);

    next();

  });

}



// Ruta de bienvenida

app.get('/', (req, res) => {

  res.json({

    success: true,

    mensaje: 'API Sistema de Gestión Odontológica - Dental Bosch',

    version: '1.0.0',

    sprint: 'Sprint 2 - Gestión de Doctores',

    entorno: process.env.NODE_ENV,

    baseDatos: process.env.NODE_ENV === 'production' ? 'MongoDB Atlas' : 'MongoDB Local',

    endpoints: {

      auth: {

        registro: 'POST /api/auth/registro',

        login: 'POST /api/auth/login',

        confirmar: 'GET /api/auth/confirmar/:token',

        recuperarPassword: 'POST /api/auth/recuperar-password',

        restablecerPassword: 'POST /api/auth/restablecer-password/:token',

        actualizarPassword: 'PUT /api/auth/actualizar-password',

        perfil: 'GET /api/auth/perfil',

        verificarToken: 'GET /api/auth/verificar-token',

        google: {

          iniciar: 'GET /api/auth/google',

          callback: 'GET /api/auth/google/callback'

        }

      },

      doctores: {

        todos: 'GET /api/doctores',

        porId: 'GET /api/doctores/:id',

        perfil: 'GET /api/doctores/perfil/doctor',

        actualizarPerfil: 'PUT /api/doctores/perfil/doctor',

        pendientes: 'GET /api/doctores/pendientes (Admin)',

        aprobados: 'GET /api/doctores/aprobados/lista (Público)',

        cambiarEstado: 'PUT /api/doctores/:id/estado (Admin)',

        eliminar: 'DELETE /api/doctores/:id (Admin)'

      },

      pacientes: {

        todos: 'GET /api/pacientes',

        porId: 'GET /api/pacientes/:id',

        perfil: 'GET /api/pacientes/perfil/paciente',

        actualizarPerfil: 'PUT /api/pacientes/perfil/paciente'

      }

    }

  });

});



// Health check

app.get('/health', (req, res) => {

  res.status(200).json({

    success: true,

    mensaje: 'Servidor saludable',

    uptime: process.uptime(),

    timestamp: new Date().toISOString(),

    database: process.env.NODE_ENV === 'production' ? 'Atlas' : 'Local'

  });

});



// ========== RUTAS DE LA API ==========

app.use('/api/auth', authRoutes);

app.use('/api/doctores', doctorRoutes);

app.use('/api/pacientes', pacienteRoutes);



// ========== SPRINT 2, 3, 4, 5, 6 (Próximamente) ==========

// app.use('/api/citas', citaRoutes);

// app.use('/api/horarios', horarioRoutes);

// app.use('/api/historias-clinicas', historiaClinicaRoutes);

// app.use('/api/odontogramas', odontogramaRoutes);

// app.use('/api/tratamientos', tratamientoRoutes);

// app.use('/api/inventario', inventarioRoutes);

// app.use('/api/notificaciones', notificacionRoutes);



// Manejo de rutas no encontradas

app.use(notFound);



// Manejador global de errores

app.use(errorHandler);



// Iniciar servidor

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {

  console.log(`

                                                           

SISTEMA DE GESTIÓN ODONTOLÓGICA - DENTAL BOSCH    

                                                            

    Servidor: http://localhost:${PORT}                      

    Entorno: ${process.env.NODE_ENV}                              

    Base de datos: ${process.env.NODE_ENV === 'production' ? 'MongoDB Atlas' : 'MongoDB Local'}                

    Sprint: Sprint 2 - Gestión de Doctores

  `);

});



// Manejo de promesas no capturadas

process.on('unhandledRejection', (err) => {

  console.error(`Error no manejado: ${err.message}`);

  server.close(() => process.exit(1));

});



// Manejo de señales de terminación

process.on('SIGTERM', () => {

  console.log(' Cerrando servidor...');

  server.close(() => {

    console.log(' Servidor cerrado');

    process.exit(0);

  });

});

// Force deploy for CORS fix - v3