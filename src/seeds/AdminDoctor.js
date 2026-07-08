const Usuario = require('../models/Usuario');
const Doctor = require('../models/Doctor');
const Paciente = require('../models/Paciente');

const createAdminDoctor = async () => {
  try {
    // ---------------- ADMIN ----------------
    console.log('Verificando si existe administrador...');
    const adminExiste = await Usuario.findOne({ email: 'admin@dentalbosch.com' });
    if (!adminExiste) {
      console.log('Creando Doctor Administrador por defecto...');
      const usuarioAdmin = await Usuario.create({
        nombre: 'Admin',
        apellido: 'Dental Bosch',
        email: 'admin@dentalbosch.com',
        password: 'Admin123',
        rol: 'admin',
        telefono: '8099999999',
        cedula: '0000000000',
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
        nombre: 'Doctor',
        apellido: 'Prueba',
        email: 'doctor@dentalbosch.com',
        password: 'Docdbosch01',
        rol: 'doctor',
        telefono: '0999999991',
        cedula: '1111111111',
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
        nombre: 'Paciente',
        apellido: 'Prueba',
        email: 'paciente@dentalbosch.com',
        password: 'Pac1entedbosch',
        rol: 'paciente',
        telefono: '0999999992',
        cedula: '2222222222',
        confirmado: true,
        estado: 'aprobado',
      });
      await Paciente.create({
        usuario: usuarioPaciente._id,
      });
      console.log('Paciente de prueba creado exitosamente');
    }

  } catch (error) {
    console.error('Error al crear usuarios de prueba:', error.message);
  }
};

module.exports = createAdminDoctor;
