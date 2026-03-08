const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./database');
const errorHandler = require('./middlewares/errorHandler');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Crear la app de Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Importar rutas
const authRoutes = require('./routers/authRoutes');
const doctorRoutes = require('./routers/doctorRoutes');
const pacienteRoutes = require('./routers/pacienteRoutes');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/doctores', doctorRoutes);
app.use('/api/pacientes', pacienteRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;