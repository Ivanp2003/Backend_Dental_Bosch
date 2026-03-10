const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');

const createAdminDoctor = async () => {
  try {
    console.log('🔍 Verificando si existe administrador...');
    
    // Verificar si ya existe el admin
    const adminExiste = await Usuario.findOne({ 
      email: 'admin@dentalbosch.com' 
    });

    if (adminExiste) {
      console.log('✅ Doctor Administrador ya existe');
      console.log('   Email: admin@dentalbosch.com');
      return;
    }

    console.log('📝 Creando Doctor Administrador por defecto...');

    // Crear usuario administrador
    console.log('1️⃣ Creando usuario...');
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
    console.log('Usuario creado exitosamente');

    console.log('Creando perfil de doctor...');
    
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
    console.log('Doctor creado exitosamente');

    console.log('Doctor Administrador creado exitosamente');
    console.log('Email: admin@dentalbosch.com');
    console.log('Password: Admin123');
    console.log('Rol: doctor (aprobado)');

  } catch (error) {
    console.error('Error al crear Doctor Administrador:', error.message);
    console.error('Detalles del error:', error);
  }
};

module.exports = createAdminDoctor;
