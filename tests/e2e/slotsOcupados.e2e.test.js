const request = require('supertest');
const mongoose = require('mongoose');
const Cita = require('../../src/models/Cita');
const Doctor = require('../../src/models/Doctor');
const Usuario = require('../../src/models/Usuario');
const jwt = require('jsonwebtoken');

// Crear aplicación Express para pruebas
const express = require('express');
const citasRoutes = require('../../src/routers/citasRoutes');

describe('Pruebas E2E - Slots Ocupados', () => {
  let app;
  let token;
  let doctorId;
  let pacienteId;

  beforeAll(async () => {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);

    // Crear app Express para pruebas
    app = express();
    app.use(express.json());
    app.use('/api/citas', citasRoutes);

    // Crear usuario de prueba
    const pacienteUsuario = await Usuario.create({
      nombre: 'Paciente',
      apellido: 'E2E',
      email: 'paciente.e2e@test.com',
      password: 'password123',
      rol: 'paciente',
      activo: true,
      confirmado: true
    });

    const doctorUsuario = await Usuario.create({
      nombre: 'Doctor',
      apellido: 'E2E',
      email: 'doctor.e2e@test.com',
      password: 'password123',
      rol: 'doctor',
      activo: true,
      confirmado: true
    });

    const doctor = await Doctor.create({
      usuario: doctorUsuario._id,
      especialidad: 'Odontología General',
      activo: true,
      horarioAtencion: [
        { dia: 'lunes', horaInicio: '08:00', horaFin: '17:00', disponible: true }
      ]
    });

    doctorId = doctor._id;
    pacienteId = pacienteUsuario._id;

    // Generar token JWT
    token = jwt.sign(
      { id: pacienteUsuario._id, rol: 'paciente' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpiar datos
    await Cita.deleteMany({});
    await Doctor.deleteMany({});
    await Usuario.deleteMany({ email: /e2e@test\.com$/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Cita.deleteMany({});
  });

  test('E2E: Debe obtener slots ocupados desde el endpoint', async () => {
    // Crear cita de prueba
    await Cita.create({
      paciente: pacienteId,
      doctor: doctorId,
      fecha: new Date('2026-06-23'),
      horaInicio: '09:00',
      horaFin: '10:00',
      estado: 'pendiente',
      motivo: 'Consulta general',
      creadoPor: 'paciente'
    });

    const response = await request(app)
      .get('/api/citas/slots-ocupados')
      .query({ doctor: doctorId.toString(), fecha: '2026-06-23' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.datos.slotsOcupados).toContain('09:00');
    expect(response.body.datos.slotsOcupados).toContain('09:30');
  });

  test('E2E: Debe requerir autenticación', async () => {
    const response = await request(app)
      .get('/api/citas/slots-ocupados')
      .query({ doctor: doctorId.toString(), fecha: '2026-06-23' });

    expect(response.status).toBe(401);
  });

  test('E2E: Debe validar parámetros requeridos', async () => {
    const response = await request(app)
      .get('/api/citas/slots-ocupados')
      .query({ fecha: '2026-06-23' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
