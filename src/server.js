require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/database');
const crearDoctorAdmin = require('./config/seeder'); //Dr ADMINISTRADOR
require('./config/passport'); // Cargar configuración de Passport
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Importar rutas
const authRoutes = require('./routers/authRoutes');
const doctorRoutes = require('./routers/doctorRoutes');
const pacienteRoutes = require('./routers/pacienteRoutes');

// Conectar a la base de datos
connectDB().then(() => {
  // Crear doctor administrador por defecto
  crearDoctorAdmin(); // ← AGREGAR
});

// Crear aplicación Express
const app = express();

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

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
    sprint: 'Sprint 1 - Autenticación y Usuarios',
    entorno: process.env.NODE_ENV,
    baseDatos: process.env.NODE_ENV === 'production' ? 'MongoDB Atlas' : 'MongoDB Local',
    endpoints: {
      auth: '/api/auth',
      documentacion: 'Próximamente'
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
                                                           
🦷  SISTEMA DE GESTIÓN ODONTOLÓGICA - DENTAL BOSCH  🦷   
                                                            
    Servidor: http://localhost:${PORT}                      
    Entorno: ${process.env.NODE_ENV}                              
    Base de datos: ${process.env.NODE_ENV === 'production' ? 'MongoDB Atlas' : 'MongoDB Local'}                
    Sprint: Sprint 1 - Autenticación y Usuarios
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