const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');
const bcrypt = require('bcryptjs');

const createAdminDoctor = async () => {
  try {
    // ---------------- ADMIN ----------------
    console.log('Verificando si existe administrador...');
    const adminExiste = await Usuario.findOne({ email: 'admin@dentalbosch.com' });
    if (!adminExiste) {
      console.log('Creando Doctor Administrador por defecto...');
      const usuarioAdmin = await Usuario.create({
        nombre: 'Elisabel',
        apellido: 'Bosch',
        email: 'admin@dentalbosch.com',
        password: await bcrypt.hash('Admin123', 10),
        rol: 'admin',
        telefono: '0987654321',
        cedula: '1710034065',
        confirmado: true,
        estado: 'aprobado',
      });
      await Doctor.create({
        usuario: usuarioAdmin._id,
        especialidad: 'Administración',
        activo: true,
        horarioAtencion: [
          { dia: 'lunes', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'martes', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'miercoles', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'jueves', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'viernes', horaInicio: '08:00', horaFin: '18:00', disponible: true }
        ],
        calificacionPromedio: 5,
        totalCalificaciones: 0
      });
      console.log('Doctor Administrador creado exitosamente');
    }

    // ---------------- DOCTOR DE PRUEBA ----------------
    console.log('Verificando si existe doctor de prueba...');
    const doctorExiste = await Usuario.findOne({ email: 'doctor@dentalbosch.com' });
    if (!doctorExiste) {
      console.log('Creando Doctor de prueba por defecto...');
      const usuarioDoctor = await Usuario.create({
        nombre: 'Ana',
        apellido: 'Gomez',
        email: 'doctor@dentalbosch.com',
        password: await bcrypt.hash('Docdbosch01', 10),
        rol: 'doctor',
        telefono: '0991234567',
        cedula: '0923456784',
        confirmado: true,
        estado: 'aprobado',
      });
      await Doctor.create({
        usuario: usuarioDoctor._id,
        especialidad: 'Odontología General',
        activo: true,
        horarioAtencion: [
          { dia: 'lunes', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'martes', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'miercoles', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'jueves', horaInicio: '08:00', horaFin: '18:00', disponible: true },
          { dia: 'viernes', horaInicio: '08:00', horaFin: '18:00', disponible: true }
        ],
        calificacionPromedio: 5,
        totalCalificaciones: 0
      });
      console.log('Doctor de prueba creado exitosamente');
    }

    // ---------------- PACIENTE DE PRUEBA ----------------
    console.log('Verificando si existe paciente de prueba...');
    const pacienteExiste = await Usuario.findOne({ email: 'paciente@dentalbosch.com' });
    if (!pacienteExiste) {
      console.log('Creando Paciente de prueba por defecto...');
      const usuarioPaciente = await Usuario.create({
        nombre: 'Luis',
        apellido: 'Herrera',
        email: 'paciente@dentalbosch.com',
        password: await bcrypt.hash('Pac1entedbosch', 10),
        rol: 'paciente',
        telefono: '0981122334',
        cedula: '1725489635',
        confirmado: true,
        estado: 'aprobado',
      });
      await Paciente.create({
        usuario: usuarioPaciente._id,
        fechaNacimiento: new Date('1990-05-15'),
        genero: 'masculino',
        direccion: {
          calle: 'Av Principal 123',
          ciudad: 'Quito',
          provincia: 'Pichincha'
        },
        contactoEmergencia: {
          nombre: 'Maria Herrera',
          telefono: '0998877665',
          parentesco: 'Madre'
        },
        infoMedica: {
          alergias: ['Penicilina'],
          condiciones: ['Ninguna'],
          notas: 'Paciente de prueba para desarrollo'
        }
      });
      console.log('Paciente de prueba creado exitosamente');
    }

  } catch (error) {
    console.error('Error al crear usuarios de prueba:', error.message);
  }
};

module.exports = createAdminDoctor;
