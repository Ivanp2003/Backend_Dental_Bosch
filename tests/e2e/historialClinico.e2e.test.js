const request = require('supertest');
const mongoose = require('mongoose');
const HistorialClinico = require('../../src/models/HistorialClinico');
const Paciente = require('../../src/models/Paciente');
const Usuario = require('../../src/models/Usuario');
const jwt = require('jsonwebtoken');

// Crear aplicación Express para pruebas
const express = require('express');
const historialClinicoRoutes = require('../../src/routers/historialClinicoRoutes');

describe('Pruebas E2E - Historial Clínico', () => {
  let app;
  let doctorToken;
  let pacienteToken;
  let pacienteId;
  let historialId;

  beforeAll(async () => {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);

    // Crear app Express para pruebas
    app = express();
    app.use(express.json());
    app.use('/api/historial-clinico', historialClinicoRoutes);

    // Crear usuario doctor
    const doctorUsuario = await Usuario.create({
      nombre: 'Doctor',
      apellido: 'E2E',
      email: 'doctor.e2e@test.com',
      password: 'password123',
      rol: 'doctor',
      activo: true,
      confirmado: true
    });

    // Crear usuario paciente
    const pacienteUsuario = await Usuario.create({
      nombre: 'Paciente',
      apellido: 'E2E',
      email: 'paciente.e2e@test.com',
      password: 'password123',
      rol: 'paciente',
      activo: true,
      confirmado: true
    });

    // Crear paciente
    const paciente = await Paciente.create({
      usuario: pacienteUsuario._id,
      cedula: '1234567890',
      telefono: '0987654321',
      direccion: 'Dirección de prueba E2E'
    });

    pacienteId = paciente._id;

    // Crear historial clínico
    const historial = await HistorialClinico.create({
      paciente: pacienteId,
      activo: true,
      consultas: [
        {
          fecha: new Date('2026-06-20'),
          doctor: doctorUsuario._id,
          motivoConsulta: 'Dolor dental',
          diagnostico: 'Caries',
          tratamiento: 'Obturación',
          observaciones: 'Consulta de rutina'
        }
      ]
    });

    historialId = historial._id;

    // Generar tokens
    doctorToken = jwt.sign(
      { id: doctorUsuario._id, rol: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    pacienteToken = jwt.sign(
      { id: pacienteUsuario._id, rol: 'paciente' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpiar datos
    await HistorialClinico.deleteMany({});
    await Paciente.deleteMany({});
    await Usuario.deleteMany({ email: /e2e@test\.com$/ });
    await mongoose.connection.close();
  });

  test('E2E: Debe obtener historial completo del paciente (doctor)', async () => {
    const response = await request(app)
      .get(`/api/historial-clinico/${pacienteId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.datos.paciente).toBeDefined();
    expect(response.body.datos.consultas).toBeDefined();
    expect(response.body.datos.consultas.length).toBeGreaterThan(0);
  });

  test('E2E: Debe requerir autenticación', async () => {
    const response = await request(app)
      .get(`/api/historial-clinico/${pacienteId}`);

    expect(response.status).toBe(401);
  });

  test('E2E: Debe incluir metadatos de consultas', async () => {
    const response = await request(app)
      .get(`/api/historial-clinico/${pacienteId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(response.status).toBe(200);
    const consulta = response.body.datos.consultas[0];
    expect(consulta.motivoConsulta).toBe('Dolor dental');
    expect(consulta.diagnostico).toBe('Caries');
    expect(consulta.tratamiento).toBe('Obturación');
  });
});
