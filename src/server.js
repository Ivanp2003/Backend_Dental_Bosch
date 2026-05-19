require('dotenv').config();

// Verificar variables críticas para producción
if (process.env.NODE_ENV === 'production') {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ VARIABLES DE ENTORNO FALTANTES EN PRODUCCIÓN:');
    console.error(missingVars.map(varName => `- ${varName}`).join('\n'));
    console.error('\n🔧 Configura estas variables en el panel de Render.');
    process.exit(1);
  }
}

// Verificar configuración de SendGrid al inicio
const { configurarEmail } = require('./config/emailConfig');
const sendgridConfigurado = configurarEmail();
if (!sendgridConfigurado) {
  console.warn('⚠️ ADVERTENCIA: SendGrid no está configurado. Los emails de recuperación de contraseña NO se enviarán.');
}

const express = require('express');





const cors = require('cors');



const fileUpload = require('express-fileupload'); 



const passport = require('passport');



const connectDB = require('./database');



const createAdminDoctor = require('./seeds/AdminDoctor'); // Nuevo sistema de seeds



require('./config/passport'); // Cargar configuración de Passport



const { errorHandler, notFound } = require('./middlewares/errorHandler');







// Importar rutas



const authRoutes = require('./routers/authRoutes');



const doctorRoutes = require('./routers/doctorRoutes');



const pacienteRoutes = require('./routers/pacienteRoutes');



const adminRoutes = require('./routers/adminRoutes');



const citasRoutes = require('./routers/citasRoutes');







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

      'https://frontend-dental-bosch.vercel.app',

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



// Middleware para manejo de archivos (basado en tu proyecto de referencia)

app.use(fileUpload({

  useTempFiles: true,

  tempFileDir: './uploads' // Usa archivos temporales

}));







// Inicializar Passport



app.use(passport.initialize());







// Middleware de logging en desarrollo



if (process.env.NODE_ENV === 'development') {



  app.use((req, res, next) => {



    console.log(`${req.method} ${req.path}`);



    next();



  });



}







// 🛡️ Middleware de seguridad mejorado

app.use((req, res, next) => {

  // Seguridad de headers

  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader('X-Frame-Options', 'DENY');

  res.setHeader('X-XSS-Protection', '1; mode=block');

  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  

  // Prevenir ataques de inyección de dependencias

  if (req.url.includes('..')) {

    return res.status(400).json({

      success: false,

      mensaje: 'Solicitud no válida'

    });

  }

  

  next();

});

// Ruta de bienvenida actualizada

app.get('/', (req, res) => {

  res.json({

    success: true,

    mensaje: ' API Sistema de Gestión Odontológica - Dental Bosch v3.0',

    version: '3.0.0',

    sprint: 'Sprint 5 - Gestión Segura de Doctores y Mejoras en Citas',

    seguridad: {

      headersSeguros: true,

      proteccionXSS: true,

      prevencionInyeccion: true,

      softDelete: true,

      validacionCitas: true

    },

    proyecto: {

      nombre: 'Dental Bosch Management System',

      descripcion: 'Sistema integral de gestión odontológica con módulos de pacientes, doctores, citas y administración',

      tecnologias: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Passport', 'Bcrypt', 'Multer'],

      caracteristicas: [

        ' Autenticación y autorización por roles',

        ' Gestión de pacientes y doctores',

        ' Sistema de citas con disponibilidad',

        ' Panel de administración',

        ' Email notifications',

        ' File upload para avatares',

        ' Soft Delete para doctores (seguro)',

        ' Verificación de citas pendientes antes de desactivar',

        ' Agendado automático de citas para pacientes',

        ' Reactivación de doctores',

        ' Gestión mejorada de historial clínico'

      ]

    },

    entorno: process.env.NODE_ENV,

    baseDatos: process.env.NODE_ENV === 'production' ? 'MongoDB Atlas' : 'MongoDB Local',

    estado: {

      servidor: ' Activo',

      database: ' Conectada',

      api: ' Operativa',

      seguridad: ' Habilitada'

    },

    novedades: [

      ' Soft Delete para doctores con verificación de citas',

      ' Pacientes pueden agendar citas sin especificar su ID',

      ' Reactivación de doctores desactivados',

      ' Validaciones de seguridad reforzadas',

      ' Mejoras en gestión de historial clínico'

    ],

    endpoints: {

      auth: {

        registro: 'POST /api/auth/registro',

        login: 'POST /api/auth/login',

        recuperarPassword: 'POST /api/auth/recuperar-password',

        restablecerPassword: 'POST /api/auth/restablecer-password/:token',

        actualizarPassword: 'PUT /api/auth/actualizar-password',

        perfil: 'GET /api/auth/perfil',

        verificarToken: 'GET /api/auth/verificar-token'

      },

      doctor: {

        todos: 'GET /api/doctores',

        porId: 'GET /api/doctores/:id',

        perfil: 'GET /api/doctores/perfil/doctor',

        actualizarPerfil: 'PUT /api/doctores/perfil/doctor',

        misPacientes: 'GET /api/doctores/mis-pacientes (Doctor)',

        misCitas: 'GET /api/doctores/mis-citas (Doctor)',

        cambiarEstadoCita: 'PUT /api/doctores/citas/:id/estado (Doctor)',

        pendientes: 'GET /api/doctores/pendientes (Admin)',

        aprobados: 'GET /api/doctores/aprobados/lista (Público)',

        cambiarEstado: 'PUT /api/doctores/:id/estado (Admin)',

        ' desactivar': 'DELETE /api/doctores/:id (Admin - Soft Delete)',

        ' reactivar': 'PUT /api/doctores/:id/reactivar (Admin)'

      },

      pacientes: {

        registro: 'POST /api/auth/registro (rol: paciente)',

        todos: 'GET /api/pacientes',

        porId: 'GET /api/pacientes/:id',

        porCedula: 'GET /api/pacientes/cedula/:cedula',

        perfil: 'GET /api/pacientes/perfil/paciente',

        actualizarPerfil: 'PUT /api/pacientes/perfil/paciente',

        buscar: 'GET /api/pacientes/buscar',

        actualizar: 'PUT /api/pacientes/:id',

        eliminar: 'DELETE /api/pacientes/:id',

        asignarDoctor: 'PUT /api/pacientes/:id/asignar-doctor'

      },

      admin: {

        doctores: {

          crear: 'POST /api/admin/doctores',

          listar: 'GET /api/admin/doctores',

          detalle: 'GET /api/admin/doctores/:id',

          actualizar: 'PUT /api/admin/doctores/:id',

          estado: 'PUT /api/admin/doctores/:id/estado',

          horario: 'PUT /api/admin/doctores/:id/horario',

          horariosTodos: 'GET /api/admin/doctores/horarios'

        },

        citas: {

          todas: 'GET /api/admin/citas'

        },

        pacientes: {

          listar: 'GET /api/admin/pacientes',

          detalle: 'GET /api/admin/pacientes/:id',

          asignarDoctor: 'PUT /api/admin/pacientes/:id/doctor',

          eliminar: 'DELETE /api/admin/pacientes/:id'

        },

        estadisticas: 'GET /api/admin/estadisticas'

      },

      citas: {

        ' crear': 'POST /api/citas (Pacientes, Doctores, Admin)',

        misCitas: 'GET /api/citas/mis-citas (Pacientes)',

        citasDoctor: 'GET /api/citas/doctor (Doctores)',

        todas: 'GET /api/citas (Admin)',

        cancelar: 'DELETE /api/citas/:id',

        actualizarEstado: 'PUT /api/citas/:id/estado (Doctores, Admin)',

        finalizar: 'PUT /api/citas/:id/finalizar (Doctores, Admin)',

        disponibilidad: 'GET /api/citas/disponibilidad',

        confirmar: 'PUT /api/citas/:id/confirmar (Pacientes)',

        rechazar: 'PUT /api/citas/:id/rechazar (Pacientes)'

      },

      historialClinico: {

        crear: 'POST /api/historial-clinico/:pacienteId (Admin, Doctor)',

        agregarRegistro: 'POST /api/historial-clinico/:pacienteId/registro (Admin, Doctor)',

        completo: 'GET /api/historial-clinico/:pacienteId (Admin, Doctor, Paciente)',

        registros: 'GET /api/historial-clinico/:pacienteId/registros (Admin, Doctor, Paciente)',

        estadisticas: 'GET /api/historial-clinico/:pacienteId/estadisticas (Admin, Doctor, Paciente)',

        actualizarRegistro: 'PUT /api/historial-clinico/:pacienteId/registro/:registroId (Admin, Doctor)',

        eliminarRegistro: 'DELETE /api/historial-clinico/:pacienteId/registro/:registroId (Admin, Doctor)'

      }

    },

    documentacion: {

      health: 'GET /health',

      api: 'GET / (esta página)',

      docs: '/docs/skills/ (documentación de habilidades)'

    },

    contacto: {

      desarrollador: 'Andrés P.',

      proyecto: 'Dental Bosch',

      version: '3.0.0',

      ultimasActualizaciones: [

        'Soft Delete para doctores',

        'Mejoras en agendado de citas',

        'Validaciones de seguridad reforzadas'

      ]

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



// Middleware de logging para debuggear rutas

app.use((req, res, next) => {

  console.log(`🔍 ${req.method} ${req.originalUrl}`);

  console.log('Headers:', req.headers);

  next();

});

app.use('/api/auth', authRoutes);

app.use('/api/doctores', doctorRoutes);

app.use('/api/pacientes', pacienteRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/citas', citasRoutes);

app.use('/api/historial-clinico', require('./routers/historialClinicoRoutes'));





// ========== SPRINT 2, 3, 4, 5, 6 (Próximamente) ==========





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
