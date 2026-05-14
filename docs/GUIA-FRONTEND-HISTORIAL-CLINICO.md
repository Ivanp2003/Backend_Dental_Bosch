# 📱 Guía Práctica para Consumir Historia Clínica desde el Frontend

Esta guía proporciona ejemplos prácticos y código listo para usar para integrar el módulo de Historia Clínica en tu aplicación frontend.

## 📋 **Tabla de Contenidos**
1. [Configuración Inicial](#configuración-inicial)
2. [Servicio API](#servicio-api)
3. [Ejemplos de Componentes](#ejemplos-de-componentes)
4. [Manejo de Errores](#manejo-de-errores)
5. [Validaciones](#validaciones)
6. [Ejemplos de Peticiones](#ejemplos-de-peticiones)

---

## Configuración Inicial

### Variables de Entorno
```javascript
// .env o config.js
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};
```

### Instalación de Dependencias (React)
```bash
npm install axios react-query
# o
yarn add axios react-query
```

---

## Servicio API

### `src/services/historialClinicoService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Interceptor para agregar token automáticamente
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const historialClinicoService = {
  /**
   * Crear historial clínico para un paciente
   * POST /api/historial-clinico/:pacienteId
   */
  async crearHistorial(pacienteId) {
    try {
      const response = await api.post(`/historial-clinico/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Agregar consulta al historial
   * POST /api/historial-clinico/:pacienteId/consulta
   */
  async agregarConsulta(pacienteId, consultaData) {
    try {
      const response = await api.post(
        `/historial-clinico/${pacienteId}/consulta`,
        consultaData
      );
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Obtener historial clínico completo
   * GET /api/historial-clinico/:pacienteId
   */
  async obtenerHistorial(pacienteId) {
    try {
      const response = await api.get(`/historial-clinico/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Obtener consultas filtradas con paginación
   * GET /api/historial-clinico/:pacienteId/consultas
   */
  async obtenerConsultasFiltradas(pacienteId, filtros = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: filtros.page || 1,
        limit: filtros.limit || 10,
        ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta }),
        ...(filtros.doctor && { doctor: filtros.doctor }),
        ...(filtros.diagnostico && { diagnostico: filtros.diagnostico })
      }).toString();

      const response = await api.get(
        `/historial-clinico/${pacienteId}/consultas?${queryParams}`
      );
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Obtener estadísticas del historial
   * GET /api/historial-clinico/:pacienteId/estadisticas
   */
  async obtenerEstadisticas(pacienteId) {
    try {
      const response = await api.get(`/historial-clinico/${pacienteId}/estadisticas`);
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Actualizar consulta específica
   * PUT /api/historial-clinico/:pacienteId/consulta/:consultaId
   */
  async actualizarConsulta(pacienteId, consultaId, datosActualizacion) {
    try {
      const response = await api.put(
        `/historial-clinico/${pacienteId}/consulta/${consultaId}`,
        datosActualizacion
      );
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Eliminar consulta (soft delete)
   * DELETE /api/historial-clinico/:pacienteId/consulta/:consultaId
   */
  async eliminarConsulta(pacienteId, consultaId) {
    try {
      const response = await api.delete(
        `/historial-clinico/${pacienteId}/consulta/${consultaId}`
      );
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Eliminar historial completo (soft delete)
   * DELETE /api/historial-clinico/:pacienteId
   */
  async eliminarHistorial(pacienteId) {
    try {
      const response = await api.delete(`/historial-clinico/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw this.manejarError(error);
    }
  },

  /**
   * Manejador centralizado de errores
   */
  manejarError(error) {
    if (error.response) {
      // El servidor respondió con código de estado fuera del rango 2xx
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.mensaje || 'Datos inválidos');
        case 401:
          return new Error('No autorizado. Por favor inicie sesión.');
        case 403:
          return new Error('No tiene permisos para realizar esta acción.');
        case 404:
          return new Error(data.mensaje || 'Recurso no encontrado');
        case 409:
          return new Error('El paciente ya tiene un historial clínico');
        case 500:
          return new Error('Error interno del servidor');
        default:
          return new Error(data.mensaje || 'Error en la comunicación con el servidor');
      }
    } else if (error.request) {
      // La solicitud se hizo pero no hubo respuesta
      return new Error('No se recibió respuesta del servidor. Verifique su conexión.');
    } else {
      // Error en la configuración de la solicitud
      return new Error(error.message || 'Error en la solicitud');
    }
  }
};

export default historialClinicoService;
```

---

## Ejemplos de Componentes

### 1. Componente Principal de Historial Clínico

```jsx
// src/components/HistorialClinico/HistorialClinico.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import historialClinicoService from '../../services/historialClinicoService';
import ListaConsultas from './ListaConsultas';
import FormularioConsulta from './FormularioConsulta';
import './HistorialClinico.css';

const HistorialClinico = () => {
  const { pacienteId } = useParams();
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, [pacienteId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await historialClinicoService.obtenerHistorial(pacienteId);
      if (response.success) {
        setHistorial(response.datos);
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearHistorial = async () => {
    try {
      setLoading(true);
      const response = await historialClinicoService.crearHistorial(pacienteId);
      if (response.success) {
        setHistorial(response.datos);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarConsulta = async (consultaData) => {
    try {
      setLoading(true);
      const response = await historialClinicoService.agregarConsulta(pacienteId, consultaData);
      if (response.success) {
        setHistorial(response.datos);
        setMostrarFormulario(false);
      }
    } catch (err) {
      throw err; // El formulario manejará el error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando historial clínico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        {error.includes('no tiene un historial clínico') && (
          <button onClick={handleCrearHistorial} className="btn btn-primary">
            Crear Historial Clínico
          </button>
        )}
      </div>
    );
  }

  if (!historial) {
    return (
      <div className="no-data">
        <p>No hay historial clínico disponible para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="historial-clinico-container">
      <header className="historial-header">
        <h1>Historia Clínica</h1>
        <div className="historial-info">
          <p><strong>Número:</strong> {historial.numeroHistoriaClinica}</p>
          <p><strong>Paciente:</strong> {historial.informacionComplementaria?.nombreCompleto}</p>
          <p><strong>Edad:</strong> {historial.informacionComplementaria?.edad} años</p>
          <p><strong>Grupo etario:</strong> {historial.informacionComplementaria?.grupoEtario}</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? 'Cancelar' : 'Nueva Consulta'}
        </button>
      </header>

      {mostrarFormulario && (
        <FormularioConsulta
          pacienteId={pacienteId}
          onSubmit={handleAgregarConsulta}
          onCancel={() => setMostrarFormulario(false)}
        />
      )}

      <ListaConsultas
        consultas={historial.consultas}
        pacienteId={pacienteId}
        onActualizacion={cargarHistorial}
      />

      <footer className="historial-footer">
        <p>Total de consultas: {historial.metricas?.totalConsultas || 0}</p>
        <p>Última visita: {historial.metricas?.ultimaVisita ? new Date(historial.metricas.ultimaVisita).toLocaleDateString() : 'N/A'}</p>
      </footer>
    </div>
  );
};

export default HistorialClinico;
```

### 2. Formulario de Nueva Consulta

```jsx
// src/components/HistorialClinico/FormularioConsulta.jsx
import React, { useState } from 'react';
import './FormularioConsulta.css';

const FormularioConsulta = ({ pacienteId, citaId, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    citaId: citaId || null,
    motivoConsulta: '',
    enfermedadActual: {
      descripcion: '',
      tiempoEvolucion: '',
      sintomas: [],
      intensidadDolor: 0,
      observaciones: ''
    },
    antecedentes: {
      alergias: {
        antibioticos: false,
        anestesia: false
      },
      enfermedades: {
        hemorragias: false,
        vih: false,
        tuberculosis: false,
        asma: false,
        diabetes: false,
        hipertension: false,
        cardiacas: false
      },
      otros: false,
      observaciones: ''
    },
    signosVitales: {
      presionArterial: '',
      frecuenciaCardiaca: '',
      temperatura: '',
      frecuenciaRespiratoria: ''
    },
    examenEstomatognatico: {
      labios: { estado: 'normal', observacion: '' },
      mejillas: { estado: 'normal', observacion: '' },
      maxilarSuperior: { estado: 'normal', observacion: '' },
      maxilarInferior: { estado: 'normal', observacion: '' },
      lengua: { estado: 'normal', observacion: '' },
      paladar: { estado: 'normal', observacion: '' },
      pisoBoca: { estado: 'normal', observacion: '' },
      carrillos: { estado: 'normal', observacion: '' },
      glandulasSalivales: { estado: 'normal', observacion: '' },
      oroFaringe: { estado: 'normal', observacion: '' },
      atm: { estado: 'normal', observacion: '' },
      ganglios: { estado: 'normal', observacion: '' },
      observaciones: ''
    },
    indicadoresSaludBucal: {
      higieneOral: { placa: null, calculo: null, gingivitis: null },
      enfermedadPeriodontal: null,
      maloclusion: null,
      fluorosis: null,
      indiceCPO: { C: 0, P: 0, O: 0, total: 0 }
    },
    planDiagnostico: {
      biometria: { solicitado: false, realizado: false, pendiente: false },
      quimicaSanguinea: { solicitado: false, realizado: false, pendiente: false },
      rayosX: { solicitado: false, realizado: false, pendiente: false },
      otros: '',
      observaciones: ''
    },
    diagnosticos: [
      {
        descripcion: '',
        cie10: '',
        tipo: 'presuntivo'
      }
    ],
    tratamientos: [
      {
        sesion: 1,
        diagnosticosComplicaciones: '',
        procedimientos: [],
        prescripciones: [],
        codigo: '',
        firmaDoctor: {
          doctorId: '',
          nombreDoctor: '',
          fecha: new Date()
        }
      }
    ]
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEnfermedadActualChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      enfermedadActual: {
        ...prev.enfermedadActual,
        [field]: value
      }
    }));
  };

  const handleAntecedentesChange = (categoria, campo, value) => {
    setFormData(prev => ({
      ...prev,
      antecedentes: {
        ...prev.antecedentes,
        [categoria]: {
          ...prev.antecedentes[categoria],
          [campo]: value
        }
      }
    }));
  };

  const handleSignosVitalesChange = (campo, value) => {
    setFormData(prev => ({
      ...prev,
      signosVitales: {
        ...prev.signosVitales,
        [campo]: value
      }
    }));
  };

  const handleExamenChange = (campo, estado, observacion = '') => {
    setFormData(prev => ({
      ...prev,
      examenEstomatognatico: {
        ...prev.examenEstomatognatico,
        [campo]: { estado, observacion }
      }
    }));
  };

  const handleDiagnosticoChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diag, i) => 
        i === index ? { ...diag, [field]: value } : diag
      )
    }));
  };

  const agregarDiagnostico = () => {
    setFormData(prev => ({
      ...prev,
      diagnosticos: [
        ...prev.diagnosticos,
        { descripcion: '', cie10: '', tipo: 'presuntivo' }
      ]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="formulario-consulta" onSubmit={handleSubmit}>
      <h2>Nueva Consulta</h2>
      
      {error && <div className="error-message">{error}</div>}

      <section className="seccion">
        <h3>Motivo de Consulta</h3>
        <textarea
          value={formData.motivoConsulta}
          onChange={(e) => handleChange('motivoConsulta', e.target.value)}
          placeholder="Motivo de la consulta"
          required
          rows="3"
        />
      </section>

      <section className="seccion">
        <h3>Enfermedad Actual</h3>
        <div className="form-group">
          <label>Descripción:</label>
          <textarea
            value={formData.enfermedadActual.descripcion}
            onChange={(e) => handleEnfermedadActualChange('descripcion', e.target.value)}
            rows="3"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tiempo de evolución:</label>
            <input
              type="text"
              value={formData.enfermedadActual.tiempoEvolucion}
              onChange={(e) => handleEnfermedadActualChange('tiempoEvolucion', e.target.value)}
              placeholder="Ej: 3 días"
            />
          </div>
          <div className="form-group">
            <label>Intensidad del dolor (0-10):</label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.enfermedadActual.intensidadDolor}
              onChange={(e) => handleEnfermedadActualChange('intensidadDolor', parseInt(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="seccion">
        <h3>Antecedentes</h3>
        <div className="antecedentes-grid">
          <div className="antecedentes-group">
            <h4>Alergias</h4>
            <label>
              <input
                type="checkbox"
                checked={formData.antecedentes.alergias.antibioticos}
                onChange={(e) => handleAntecedentesChange('alergias', 'antibioticos', e.target.checked)}
              />
              Alergia a antibióticos
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.antecedentes.alergias.anestesia}
                onChange={(e) => handleAntecedentesChange('alergias', 'anestesia', e.target.checked)}
              />
              Alergia a anestesia
            </label>
          </div>
          <div className="antecedentes-group">
            <h4>Enfermedades</h4>
            {['hemorragias', 'vih', 'tuberculosis', 'asma', 'diabetes', 'hipertension', 'cardiacas'].map(enfermedad => (
              <label key={enfermedad}>
                <input
                  type="checkbox"
                  checked={formData.antecedentes.enfermedades[enfermedad]}
                  onChange={(e) => handleAntecedentesChange('enfermedades', enfermedad, e.target.checked)}
                />
                {enfermedad.charAt(0).toUpperCase() + enfermedad.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="seccion">
        <h3>Signos Vitales</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Presión Arterial (ej: 120/80):</label>
            <input
              type="text"
              value={formData.signosVitales.presionArterial}
              onChange={(e) => handleSignosVitalesChange('presionArterial', e.target.value)}
              placeholder="120/80"
              pattern="\d{2,3}/\d{2,3}"
            />
          </div>
          <div className="form-group">
            <label>Frecuencia Cardíaca (lpm):</label>
            <input
              type="number"
              min="40"
              max="200"
              value={formData.signosVitales.frecuenciaCardiaca}
              onChange={(e) => handleSignosVitalesChange('frecuenciaCardiaca', parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Temperatura (°C):</label>
            <input
              type="number"
              min="35"
              max="42"
              step="0.1"
              value={formData.signosVitales.temperatura}
              onChange={(e) => handleSignosVitalesChange('temperatura', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Frecuencia Respiratoria (rpm):</label>
            <input
              type="number"
              min="8"
              max="40"
              value={formData.signosVitales.frecuenciaRespiratoria}
              onChange={(e) => handleSignosVitalesChange('frecuenciaRespiratoria', parseInt(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="seccion">
        <h3>Examen Sistema Estomatognático</h3>
        <div className="examen-grid">
          {Object.entries(formData.examenEstomatognatico).map(([campo, data]) => {
            if (campo === 'observaciones') return null;
            return (
              <div key={campo} className="examen-item">
                <label>{campo.charAt(0).toUpperCase() + campo.slice(1)}:</label>
                <select
                  value={data.estado}
                  onChange={(e) => handleExamenChange(campo, e.target.value, data.observacion)}
                >
                  <option value="normal">Normal</option>
                  <option value="patológico">Patológico</option>
                </select>
                {data.estado === 'patológico' && (
                  <input
                    type="text"
                    placeholder="Observación"
                    value={data.observacion}
                    onChange={(e) => handleExamenChange(campo, data.estado, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="seccion">
        <h3>Diagnósticos</h3>
        {formData.diagnosticos.map((diagnostico, index) => (
          <div key={index} className="diagnostico-item">
            <div className="form-row">
              <div className="form-group">
                <label>Descripción:</label>
                <input
                  type="text"
                  value={diagnostico.descripcion}
                  onChange={(e) => handleDiagnosticoChange(index, 'descripcion', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>CIE-10:</label>
                <input
                  type="text"
                  value={diagnostico.cie10}
                  onChange={(e) => handleDiagnosticoChange(index, 'cie10', e.target.value.toUpperCase())}
                  placeholder="Ej: K04.7"
                  pattern="[A-Z]\d{2}(\.\d{1,4})?"
                />
              </div>
              <div className="form-group">
                <label>Tipo:</label>
                <select
                  value={diagnostico.tipo}
                  onChange={(e) => handleDiagnosticoChange(index, 'tipo', e.target.value)}
                >
                  <option value="presuntivo">Presuntivo</option>
                  <option value="definitivo">Definitivo</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={agregarDiagnostico} className="btn btn-secondary">
          + Agregar Diagnóstico
        </button>
      </section>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Consulta'}
        </button>
      </div>
    </form>
  );
};

export default FormularioConsulta;
```

### 3. Lista de Consultas

```jsx
// src/components/HistorialClinico/ListaConsultas.jsx
import React, { useState } from 'react';
import historialClinicoService from '../../services/historialClinicoService';
import './ListaConsultas.css';

const ListaConsultas = ({ consultas, pacienteId, onActualizacion }) => {
  const [loading, setLoading] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState(null);

  const handleEliminarConsulta = async (consultaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta consulta?')) return;

    try {
      setLoading(true);
      await historialClinicoService.eliminarConsulta(pacienteId, consultaId);
      onActualizacion();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!consultas || consultas.length === 0) {
    return (
      <div className="no-consultas">
        <p>No hay consultas registradas en este historial clínico.</p>
      </div>
    );
  }

  return (
    <div className="lista-consultas">
      <h2>Consultas Realizadas ({consultas.length})</h2>
      
      <div className="consultas-timeline">
        {consultas.map((consulta) => (
          <div key={consulta._id} className="consulta-card">
            <div className="consulta-header">
              <div className="consulta-fecha">
                {formatDate(consulta.fecha)}
              </div>
              <div className="consulta-doctor">
                Dr. {consulta.doctor?.usuario?.nombreCompleto || 'No disponible'}
              </div>
            </div>

            <div className="consulta-body">
              <div className="consulta-motivo">
                <strong>Motivo:</strong> {consulta.motivoConsulta}
              </div>

              {consulta.enfermedadActual?.descripcion && (
                <div className="consulta-enfermedad">
                  <strong>Enfermedad actual:</strong> {consulta.enfermedadActual.descripcion}
                </div>
              )}

              {consulta.diagnosticos && consulta.diagnosticos.length > 0 && (
                <div className="consulta-diagnosticos">
                  <strong>Diagnósticos:</strong>
                  <ul>
                    {consulta.diagnosticos.map((diag, idx) => (
                      <li key={idx}>
                        {diag.descripcion} {diag.cie10 && `(${diag.cie10})`} - {diag.tipo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {consulta.tratamientos && consulta.tratamientos.length > 0 && (
                <div className="consulta-tratamientos">
                  <strong>Tratamientos:</strong>
                  <ul>
                    {consulta.tratamientos.map((trat, idx) => (
                      <li key={idx}>
                        Sesión {trat.sesion}: {trat.procedimientos.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="consulta-actions">
              <button 
                onClick={() => setConsultaEditando(consulta)}
                className="btn btn-small btn-secondary"
              >
                Ver detalles
              </button>
              <button 
                onClick={() => handleEliminarConsulta(consulta._id)}
                className="btn btn-small btn-danger"
                disabled={loading}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaConsultas;
```

---

## Manejo de Errores

### Componente de Notificaciones

```jsx
// src/components/Notificacion/Notificacion.jsx
import React, { useState, useEffect } from 'react';
import './Notificacion.css';

const Notificacion = ({ mensaje, tipo = 'info', duracion = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duracion);

    return () => clearTimeout(timer);
  }, [duracion, onClose]);

  if (!visible) return null;

  const iconos = {
    exito: '✅',
    error: '❌',
    advertencia: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`notificacion notificacion-${tipo}`}>
      <span className="notificacion-icono">{iconos[tipo]}</span>
      <span className="notificacion-mensaje">{mensaje}</span>
      <button className="notificacion-cerrar" onClick={() => setVisible(false)}>
        ×
      </button>
    </div>
  );
};

export default Notificacion;
```

### Hook Personalizado

```jsx
// src/hooks/useNotificacion.js
import { useState, useCallback } from 'react';

const useNotificacion = () => {
  const [notificaciones, setNotificaciones] = useState([]);

  const agregarNotificacion = useCallback((mensaje, tipo = 'info', duracion = 5000) => {
    const id = Date.now();
    setNotificaciones(prev => [...prev, { id, mensaje, tipo, duracion }]);
  }, []);

  const eliminarNotificacion = useCallback((id) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const notificar = {
    exito: (mensaje) => agregarNotificacion(mensaje, 'exito'),
    error: (mensaje) => agregarNotificacion(mensaje, 'error'),
    advertencia: (mensaje) => agregarNotificacion(mensaje, 'advertencia'),
    info: (mensaje) => agregarNotificacion(mensaje, 'info')
  };

  return { notificaciones, notificar, eliminarNotificacion };
};

export default useNotificacion;
```

---

## Validaciones

### `src/utils/validaciones.js`

```javascript
/**
 * Validaciones para el módulo de Historia Clínica
 */

export const validaciones = {
  /**
   * Validar formato CIE-10
   * Formato: Letra + 2 dígitos + punto opcional + 1-4 dígitos
   */
  validarCIE10: (codigo) => {
    if (!codigo) return true; // Opcional
    const regex = /^[A-Z]\d{2}(\.\d{1,4})?$/;
    return regex.test(codigo.toUpperCase());
  },

  /**
   * Validar presión arterial
   * Formato: sistólica/diastólica (ej: 120/80)
   */
  validarPresionArterial: (presion) => {
    if (!presion) return true; // Opcional
    const regex = /^\d{2,3}\/\d{2,3}$/;
    return regex.test(presion);
  },

  /**
   * Validar temperatura corporal
   * Rango: 35-42 °C
   */
  validarTemperatura: (temperatura) => {
    const temp = parseFloat(temperatura);
    return !isNaN(temp) && temp >= 35 && temp <= 42;
  },

  /**
   * Validar frecuencia cardíaca
   * Rango: 40-200 lpm
   */
  validarFrecuenciaCardiaca: (frecuencia) => {
    const freq = parseInt(frecuencia);
    return !isNaN(freq) && freq >= 40 && freq <= 200;
  },

  /**
   * Validar formulario de consulta completo
   */
  validarConsulta: (formData) => {
    const errores = [];

    // Motivo de consulta obligatorio
    if (!formData.motivoConsulta?.trim()) {
      errores.push('El motivo de consulta es obligatorio');
    }

    // Validar CIE-10 en diagnósticos
    if (formData.diagnosticos) {
      formData.diagnosticos.forEach((diag, index) => {
        if (diag.cie10 && !validaciones.validarCIE10(diag.cie10)) {
          errores.push(`CIE-10 inválido en diagnóstico ${index + 1}: ${diag.cie10}`);
        }
      });
    }

    // Validar signos vitales
    if (formData.signosVitales) {
      if (formData.signosVitales.presionArterial && 
          !validaciones.validarPresionArterial(formData.signosVitales.presionArterial)) {
        errores.push('Formato de presión arterial inválido. Use ej: 120/80');
      }

      if (formData.signosVitales.temperatura && 
          !validaciones.validarTemperatura(formData.signosVitales.temperatura)) {
        errores.push('Temperatura fuera de rango (35-42 °C)');
      }

      if (formData.signosVitales.frecuenciaCardiaca && 
          !validaciones.validarFrecuenciaCardiaca(formData.signosVitales.frecuenciaCardiaca)) {
        errores.push('Frecuencia cardíaca fuera de rango (40-200 lpm)');
      }
    }

    return errores;
  }
};

export default validaciones;
```

---

## Ejemplos de Peticiones

### 1. Crear Historial Clínico

```javascript
// Ejemplo de uso
const crearHistorial = async (pacienteId) => {
  try {
    const response = await historialClinicoService.crearHistorial(pacienteId);
    console.log('Historial creado:', response.datos.numeroHistoriaClinica);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Llamar a la función
crearHistorial('60f7b3b3b3b3b3b3b3b3b3b4');
```

### 2. Agregar Consulta con Datos Completos

```javascript
const consultaEjemplo = {
  citaId: '60f7b3b3b3b3b3b3b3b3b3b5', // Opcional
  motivoConsulta: 'Dolor en muela del juicio',
  enfermedadActual: {
    descripcion: 'Dolor agudo en zona de tercer molar inferior derecho',
    tiempoEvolucion: '2 días',
    sintomas: ['Dolor intenso', 'Inflamación'],
    intensidadDolor: 8,
    observaciones: 'Paciente refiere dolor nocturno'
  },
  antecedentes: {
    alergias: {
      antibioticos: false,
      anestesia: false
    },
    enfermedades: {
      hemorragias: false,
      vih: false,
      tuberculosis: false,
      asma: false,
      diabetes: false,
      hipertension: false,
      cardiacas: false
    },
    otros: false,
    observaciones: 'Sin antecedentes de importancia'
  },
  signosVitales: {
    presionArterial: '120/80',
    frecuenciaCardiaca: 72,
    temperatura: 36.5,
    frecuenciaRespiratoria: 16
  },
  examenEstomatognatico: {
    labios: { estado: 'normal', observacion: '' },
    mejillas: { estado: 'normal', observacion: '' },
    maxilarSuperior: { estado: 'normal', observacion: '' },
    maxilarInferior: { 
      estado: 'patológico', 
      observacion: 'Inflamación en zona de pieza 4.8' 
    },
    lengua: { estado: 'normal', observacion: '' },
    paladar: { estado: 'normal', observacion: '' },
    pisoBoca: { estado: 'normal', observacion: '' },
    carrillos: { estado: 'normal', observacion: '' },
    glandulasSalivales: { estado: 'normal', observacion: '' },
    oroFaringe: { estado: 'normal', observacion: '' },
    atm: { estado: 'normal', observacion: '' },
    ganglios: { estado: 'normal', observacion: '' },
    observaciones: 'Paciente colaborador'
  },
  diagnosticos: [
    {
      descripcion: 'Pericoronaritis de tercer molar inferior derecho',
      cie10: 'K04.8',
      tipo: 'definitivo'
    }
  ],
  tratamientos: [
    {
      sesion: 1,
      diagnosticosComplicaciones: 'Sin complicaciones',
      procedimientos: ['Irrigación de zona', 'Prescripción de antibióticos'],
      prescripciones: ['Amoxicilina 500mg cada 8 horas por 7 días'],
      codigo: 'PER001',
      firmaDoctor: {
        doctorId: '60f7b3b3b3b3b3b3b3b3b3b6',
        nombreDoctor: 'Dr. Carlos Rodríguez',
        fecha: new Date().toISOString()
      }
    }
  ]
};

// Enviar consulta
const agregarConsulta = async (pacienteId) => {
  try {
    const response = await historialClinicoService.agregarConsulta(pacienteId, consultaEjemplo);
    console.log('Consulta agregada:', response.datos);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

agregarConsulta('60f7b3b3b3b3b3b3b3b3b3b4');
```

### 3. Obtener y Filtrar Consultas

```javascript
// Obtener todas las consultas de un paciente
const obtenerConsultas = async (pacienteId) => {
  try {
    const response = await historialClinicoService.obtenerConsultasFiltradas(pacienteId);
    console.log('Consultas:', response.datos.consultas);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Filtrar consultas por fecha y diagnóstico
const filtrarConsultas = async (pacienteId) => {
  try {
    const response = await historialClinicoService.obtenerConsultasFiltradas(pacienteId, {
      fechaDesde: '2024-01-01',
      fechaHasta: '2024-12-31',
      diagnostico: 'caries',
      page: 1,
      limit: 10
    });
    console.log('Consultas filtradas:', response.datos);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

obtenerConsultas('60f7b3b3b3b3b3b3b3b3b3b4');
filtrarConsultas('60f7b3b3b3b3b3b3b3b3b3b4');
```

---

## 📚 **Recursos Adicionales**

- **Documentación completa de API:** `docs/HistorialClinico-API.md`
- **Skills y requerimientos:** `docs/skills/`
- **Script de migración:** `scripts/migrar-historial-clinico.js`

## 🆘 **Soporte**

Para dudas o problemas:
1. Revisar logs del backend
2. Verificar token JWT válido
3. Comprobar conexión a internet
4. Revisar documentación de API

¡Listo! Con esta guía el frontend puede consumir correctamente el módulo de Historia Clínica.