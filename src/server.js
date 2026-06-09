require('dotenv').config();

// Verificar variables críticas para producción
if (process.env.NODE_ENV === 'production') {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(' VARIABLES DE ENTORNO FALTANTES EN PRODUCCIÓN:');
    console.error(missingVars.map(varName => `- ${varName}`).join('\n'));
    console.error('\n Configura estas variables en el panel de Render.');
    process.exit(1);
  }
}

// Verificar configuración de SendGrid al inicio
const { configurarEmail } = require('./config/emailConfig');
const sendgridConfigurado = configurarEmail();
if (!sendgridConfigurado) {
  console.warn(' ADVERTENCIA: SendGrid no está configurado. Los emails de recuperación de contraseña NO se enviarán.');
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
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  // Siempre incluir el frontend de Vercel y los puertos de desarrollo
  return [
    'https://frontend-dental-bosch.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8000'
  ];
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

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

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







//  Middleware de seguridad mejorado

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

    sprint: 'Sprint 6 - Notificaciones Push y Slots Ocupados',

    seguridad: {

      headersSeguros: true,

      proteccionXSS: true,

      prevencionInyeccion: true,

      softDelete: true,

      validacionCitas: true,

      pushNotifications: true,

      slotsOcupados: true

    },

    proyecto: {

      nombre: 'Dental Bosch Management System',

      descripcion: 'Sistema integral de gestión odontológica con módulos de pacientes, doctores, citas y administración',

      tecnologias: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Passport', 'Bcrypt', 'Multer', 'node-fetch'],

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

        ' Gestión mejorada de historial clínico',

        ' Notificaciones push con Expo',

        ' Endpoint de slots ocupados para disponibilidad en tiempo real'

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

      ' Mejoras en gestión de historial clínico',

      ' Notificaciones push con Expo para doctores',

      ' Endpoint de slots ocupados para disponibilidad en tiempo real'

    ],

    endpoints: {

      // ==============================
      //  MÓDULO DE AUTENTICACIÓN
      // ==============================
      auth: {
        publicas: {
          registro: 'POST /api/auth/registro',
          confirmarCuenta: 'GET /api/auth/confirmar/:token',
          recuperarPassword: 'POST /api/auth/recuperar-password',
          verificarCodigo: 'POST /api/auth/verificar-codigo',
          restablecerPassword: 'POST /api/auth/restablecer-password',
          login: 'POST /api/auth/login',
          googleAuth: 'GET /api/auth/google',
          googleCallback: 'GET /api/auth/google/callback'
        },
        protegidas: {
          verificarToken: 'GET /api/auth/verificar-token',
          perfil: 'GET /api/auth/perfil',
          actualizarPassword: 'PUT /api/auth/actualizar-password',
          guardarPushToken: 'PATCH /api/auth/push-token'
        }
      },

      // ==============================
      //  MÓDULO DE DOCTORES
      // ==============================
      doctores: {
        publicas: {
          listarTodos: 'GET /api/doctores',
          listarAprobados: 'GET /api/doctores/aprobados/lista',
          obtenerPorId: 'GET /api/doctores/:id'
        },
        protegidas: {
          perfil: 'GET /api/doctores/perfil/doctor',
          actualizarPerfil: 'PUT /api/doctores/perfil/doctor',
          misPacientes: 'GET /api/doctores/mis-pacientes (Doctor)',
          detallePaciente: 'GET /api/doctores/pacientes/:id (Doctor)',
          misCitas: 'GET /api/doctores/mis-citas (Doctor)',
          cambiarEstadoCita: 'PUT /api/doctores/citas/:id/estado (Doctor)',
          crearCita: 'POST /api/doctores/citas (Doctor)'
        },
        admin: {
          listarPendientes: 'GET /api/doctores/pendientes',
          cambiarEstado: 'PUT /api/doctores/:id/estado',
          desactivar: 'DELETE /api/doctores/:id (Soft Delete)',
          reactivar: 'PUT /api/doctores/:id/reactivar',
          actualizar: 'PUT /api/doctores/:id'
        }
      },

      // ==============================
      //  MÓDULO DE PACIENTES
      // ==============================
      pacientes: {
        publicas: {
          horariosDoctores: 'GET /api/pacientes/doctores/horarios',
          buscar: 'GET /api/pacientes/buscar',
          porCedula: 'GET /api/pacientes/cedula/:cedula',
          porId: 'GET /api/pacientes/:id'
        },
        protegidas: {
          listar: 'GET /api/pacientes (Doctor, Admin)',
          registrar: 'POST /api/pacientes (Doctor, Admin)',
          perfil: 'GET /api/pacientes/perfil/paciente',
          actualizarPerfil: 'PUT /api/pacientes/perfil/paciente',
          actualizar: 'PUT /api/pacientes/:id (Doctor, Admin)',
          eliminar: 'DELETE /api/pacientes/:id (Admin)',
          asignarDoctor: 'PUT /api/pacientes/:id/asignar-doctor (Doctor, Admin)'
        }
      },

      // ==============================
      //  MÓDULO DE ADMINISTRACIÓN
      // ==============================
      admin: {
        doctores: {
          listar: 'GET /api/admin/doctores',
          listarPendientes: 'GET /api/admin/doctores-pendientes',
          listarInactivos: 'GET /api/admin/doctores-inactivos',
          horarios: 'GET /api/admin/doctores/horarios',
          detalle: 'GET /api/admin/doctores/:id',
          cambiarEstado: 'PUT /api/admin/doctores/:id/estado',
          actualizarHorario: 'PUT /api/admin/doctores/:id/horario',
          actualizar: 'PUT /api/admin/doctores/:id',
          reasignarCitas: 'PUT /api/admin/doctores/:id/reasignar-citas',
          eliminar: 'DELETE /api/admin/doctores/:id',
          aprobar: 'PUT /api/admin/doctores/:id/aprobar',
          rechazar: 'PUT /api/admin/doctores/:id/rechazar',
          limpiarHuerfanos: 'POST /api/admin/doctores/limpiar-huerfanos'
        },
        citas: {
          listarTodas: 'GET /api/admin/citas',
          detalle: 'GET /api/admin/citas/:id',
          reasignar: 'PATCH /api/admin/citas/:id/reasignar'
        },
        pacientes: {
          listar: 'GET /api/admin/pacientes',
          detalle: 'GET /api/admin/pacientes/:id',
          cambiarDoctor: 'PUT /api/admin/pacientes/:id/doctor',
          eliminar: 'DELETE /api/admin/pacientes/:id'
        },
        estadisticas: {
          generales: 'GET /api/admin/estadisticas'
        }
      },

      // ==============================
      //  MÓDULO DE CITAS
      // ==============================
      citas: {
        crear: 'POST /api/citas (Paciente, Doctor, Admin)',
        misCitas: 'GET /api/citas/mis-citas (Paciente)',
        citasDoctor: 'GET /api/citas/doctor (Doctor)',
        listarTodas: 'GET /api/citas (Admin)',
        actualizarEstado: 'PUT /api/citas/:id/estado (Doctor, Admin)',
        finalizar: 'PUT /api/citas/:id/finalizar (Doctor, Admin)',
        cancelar: 'DELETE /api/citas/:id',
        disponibilidad: 'GET /api/citas/disponibilidad',
        slotsOcupados: 'GET /api/citas/slots-ocupados?doctor=ID&fecha=YYYY-MM-DD'
      },

      // ==============================
      //  MÓDULO DE HISTORIAL CLÍNICO
      // ==============================
      historialClinico: {
        crear: 'POST /api/historial-clinico/:pacienteId (Admin, Doctor)',
        agregarConsulta: 'POST /api/historial-clinico/:pacienteId/consulta (Admin, Doctor)',
        consultasFiltradas: 'GET /api/historial-clinico/:pacienteId/consultas (Admin, Doctor, Paciente)',
        estadisticas: 'GET /api/historial-clinico/:pacienteId/estadisticas (Admin, Doctor, Paciente)',
        actualizarConsulta: 'PUT /api/historial-clinico/:pacienteId/consulta/:consultaId (Admin, Doctor)',
        eliminarConsulta: 'DELETE /api/historial-clinico/:pacienteId/consulta/:consultaId (Admin, Doctor)',
        historialCompleto: 'GET /api/historial-clinico/:pacienteId (Admin, Doctor, Paciente)',
        tratamientos: 'GET /api/historial-clinico/:pacienteId/tratamientos (Admin, Doctor, Paciente)',
        odontograma: {
          inicializar: 'POST /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/inicializar (Admin, Doctor)',
          visual: 'GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/visual (Admin, Doctor, Paciente)',
          completo: 'GET /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma (Admin, Doctor, Paciente)',
          actualizarDiente: 'PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/diente/:codigoFDI (Admin, Doctor)',
          actualizarObservaciones: 'PUT /api/historial-clinico/:pacienteId/consulta/:consultaId/odontograma/observaciones (Admin, Doctor)'
        }
      },

      // ==============================
      //  MÓDULO DE TRATAMIENTOS
      // ==============================
      tratamientos: {
        paciente: 'GET /api/tratamientos/paciente/:pacienteId (Admin, Doctor, Paciente)',
        detalle: 'GET /api/tratamientos/paciente/:pacienteId/consulta/:consultaId/sesion/:sesion (Admin, Doctor, Paciente)'
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

        'Validaciones de seguridad reforzadas',

        'Notificaciones push con Expo',

        'Endpoint de slots ocupados'

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

  console.log(` ${req.method} ${req.originalUrl}`);

  console.log('Headers:', req.headers);

  next();

});

app.use('/api/auth', authRoutes);

app.use('/api/doctores', doctorRoutes);

app.use('/api/pacientes', pacienteRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/citas', citasRoutes);

app.use('/api/historial-clinico', require('./routers/historialClinicoRoutes'));
app.use('/api/tratamientos', require('./routers/tratamientosRoutes'));





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



    Sprint: Sprint 6 - Notificaciones Push y Slots Ocupados



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
