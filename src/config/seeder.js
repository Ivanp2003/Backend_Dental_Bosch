const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');

const crearDoctorAdmin = async () => {
  try {
    // Verificar si ya existe el admin
    const adminExiste = await Usuario.findOne({ 
      email: 'admin@dentalbosch.com' 
    });

    if (adminExiste) {
      console.log(' Doctor Administrador ya existe');
      return;
    }

    console.log(' Creando Doctor Administrador por defecto...');

    // Crear usuario administrador
    const usuarioAdmin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Dental Bosch',
      email: 'admin@dentalbosch.com',
      password: 'Admin123', // Se hasheará automáticamente
      rol: 'doctor',
      cedula: '0000000000',
      telefono: '0999999999',
      confirmado: true, // Ya confirmado
      estado: 'aprobado', // Ya aprobado
      foto: 'https://res.cloudinary.com/dpk1tw1us/image/upload/v1/avatars/admin-avatar.jpg'
    });

    // Crear registro de doctor
    await Doctor.create({
      usuario: usuarioAdmin._id,
      especialidad: 'Administración',
      horarioAtencion: [
        {
          dia: 'lunes',
          horaInicio: '08:00',
          horaFin: '18:00',
          disponible: true
        },
        {
          dia: 'martes',
          horaInicio: '08:00',
          horaFin: '18:00',
          disponible: true
        },
        {
          dia: 'miercoles',
          horaInicio: '08:00',
          horaFin: '18:00',
          disponible: true
        },
        {
          dia: 'jueves',
          horaInicio: '08:00',
          horaFin: '18:00',
          disponible: true
        },
        {
          dia: 'viernes',
          horaInicio: '08:00',
          horaFin: '18:00',
          disponible: true
        }
      ],
      calificacionPromedio: 5,
      totalCalificaciones: 0
    });

    console.log('Doctor Administrador creado exitosamente');
    console.log('Email: admin@dentalbosch.com');
    console.log('Password: Admin123');

  } catch (error) {
    console.error(' Error al crear Doctor Administrador:', error.message);
  }
};

module.exports = crearDoctorAdmin;