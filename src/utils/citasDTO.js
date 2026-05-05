/**
 * 📋 DTO para transformar datos de citas a un formato amigable para el frontend
 * Elimina IDs innecesarios y estructura los datos de manera clara
 * 
 * 🎯 OBJETIVO: Proporcionar datos consistentes y seguros para el frontend
 * 
 * 📄 EJEMPLO DE RESPUESTA PARA DOCTOR:
 * {
 *   "success": true,
 *   "datos": {
 *     "citas": [
 *       {
 *         "fecha": "2024-01-15T00:00:00.000Z",
 *         "horaInicio": "09:00",
 *         "horaFin": "10:00",
 *         "estado": "pendiente",
 *         "motivo": "Consulta general de revisión dental",
 *         "fechaFormateada": "lunes, 15 de enero de 2024",
 *         "horaFormateada": "9:00 AM - 10:00 AM",
 *         "paciente": {
 *           "nombreCompleto": "Juan Pérez González",
 *           "email": "juan.perez@email.com",
 *           "telefono": "809-123-4567"
 *         },
 *         "estadoInfo": {
 *           "etiqueta": "Pendiente",
 *           "color": "#f59e0b",
 *           "icono": "⏳"
 *         },
 *         "metadatos": {
 *           "esHoy": false,
 *           "esPasada": false,
 *           "timestamp": 1705316400000
 *         }
 *       }
 *     ],
 *     "pagination": { ... }
 *   }
 * }
 */

class CitasDTO {
  /**
   * 🔄 Transformar lista de citas para admin
   */
  static transformarCitasAdmin(citas) {
    return citas.map(cita => this.transformarCitaAdmin(cita));
  }

  /**
   * 🔄 Transformar cita individual para admin
   */
  static transformarCitaAdmin(cita) {
    console.log('🔍 DTO - Transformando cita:', cita._id);
    console.log('🔍 DTO - Paciente:', cita.paciente);
    console.log('🔍 DTO - Doctor:', cita.doctor);
    
    // 🔄 Crear objeto limpio sin spread operator
    const resultado = {
      id: cita._id,
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      duracion: cita.duracion,
      estado: cita.estado,
      motivo: cita.motivo,
      creadoPor: cita.creadoPor,
      confirmada: cita.confirmada,
      canceladaPor: cita.canceladaPor,
      
      // 📅 Fechas formateadas
      fechaFormateada: this.formatearFecha(cita.fecha),
      horaFormateada: this.formatearHora(cita.horaInicio, cita.horaFin),
      
      // 👤 Información del paciente (manejo seguro)
      paciente: this.extraerDatosPaciente(cita.paciente),
      
      // 👨‍⚕️ Información del doctor (manejo seguro)
      doctor: this.extraerDatosDoctor(cita.doctor),
      
      // 📊 Metadatos útiles
      metadatos: {
        createdAt: cita.createdAt,
        updatedAt: cita.updatedAt,
        fechaHoraInicio: cita.fechaHoraInicio,
        fechaHoraFin: cita.fechaHoraFin
      }
    };
    
    console.log('🔍 DTO - Resultado transformado:', resultado);
    return resultado;
  }

  /**
   * 👤 Extraer datos del paciente de manera segura
   */
  static extraerDatosPaciente(paciente) {
    if (!paciente) {
      return { id: null, nombreCompleto: 'Paciente no encontrado', email: 'No disponible' };
    }
    
    const resultado = {
      id: paciente._id || paciente.id,
      nombreCompleto: 'Sin nombre',
      email: 'No disponible',
      telefono: 'No disponible',
      edad: paciente.edad || null
    };
    
    // Intentar obtener nombre completo de diferentes fuentes
    if (paciente.usuario) {
      resultado.nombreCompleto = paciente.usuario.nombreCompleto || 
                               `${paciente.usuario.nombre || ''} ${paciente.usuario.apellido || ''}`.trim() || 
                               'Sin nombre';
      resultado.email = paciente.usuario.email || 'No disponible';
      resultado.telefono = paciente.usuario.telefono || 'No disponible';
    } else if (paciente.nombreCompleto) {
      resultado.nombreCompleto = paciente.nombreCompleto;
    } else if (paciente.nombre || paciente.apellido) {
      resultado.nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim() || 'Sin nombre';
    }
    
    return resultado;
  }

  /**
   * 👨‍⚕️ Extraer datos del doctor de manera segura
   */
  static extraerDatosDoctor(doctor) {
    if (!doctor) {
      return { id: null, nombreCompleto: 'Doctor no encontrado', especialidad: 'No especificada' };
    }
    
    const resultado = {
      id: doctor._id || doctor.id,
      nombreCompleto: 'Sin nombre',
      especialidad: doctor.especialidad || 'No especificada',
      email: 'No disponible'
    };
    
    // Intentar obtener nombre completo de diferentes fuentes
    if (doctor.usuario) {
      resultado.nombreCompleto = doctor.usuario.nombreCompleto || 
                               `${doctor.usuario.nombre || ''} ${doctor.usuario.apellido || ''}`.trim() || 
                               'Sin nombre';
      resultado.email = doctor.usuario.email || 'No disponible';
    } else if (doctor.nombreCompleto) {
      resultado.nombreCompleto = doctor.nombreCompleto;
    } else if (doctor.nombre || doctor.apellido) {
      resultado.nombreCompleto = `${doctor.nombre || ''} ${doctor.apellido || ''}`.trim() || 'Sin nombre';
    }
    
    return resultado;
  }

  /**
   * 🔄 Transformar cita para paciente (vista limitada)
   */
  static transformarCitaPaciente(cita) {
    return {
      id: cita._id,
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      duracion: cita.duracion,
      estado: cita.estado,
      motivo: cita.motivo,
      confirmada: cita.confirmada,
      
      // 📅 Fechas formateadas
      fechaFormateada: this.formatearFecha(cita.fecha),
      horaFormateada: this.formatearHora(cita.horaInicio, cita.horaFin),
      
      // 👨‍⚕️ Solo información básica del doctor
      doctor: {
        nombreCompleto: this.obtenerNombreCompleto(cita.doctor, true),
        especialidad: cita.doctor.especialidad || 'No especificada'
      },
      
      // 📊 Metadatos básicos
      metadatos: {
        createdAt: cita.createdAt,
        updatedAt: cita.updatedAt
      }
    };
  }

  /**
   * 🔄 Transformar cita para doctor
   */
  static transformarCitaDoctor(cita) {
    // Validación de entrada
    if (!cita) {
      return this.getCitaVacia();
    }

    try {
      return {
        // 📅 Información básica de la cita
        fecha: cita.fecha || null,
        horaInicio: cita.horaInicio || '',
        horaFin: cita.horaFin || '',
        estado: cita.estado || 'desconocido',
        motivo: this.limpiarTexto(cita.motivo) || 'No especificado',
        
        // 📅 Fechas y horas formateadas
        fechaFormateada: this.formatearFecha(cita.fecha) || 'Fecha no válida',
        horaFormateada: this.formatearHora(cita.horaInicio, cita.horaFin) || 'Hora no válida',
        
        // 👤 Información del paciente con validación
        paciente: this.extraerPacienteSeguro(cita.paciente),
        
        // 🏷️ Información del estado para UI
        estadoInfo: this.getEstadoInfo(cita.estado),
        
        // 📊 Metadatos útiles
        metadatos: {
          esHoy: this.esHoy(cita.fecha),
          esPasada: this.esPasada(cita.fecha, cita.horaInicio),
          timestamp: this.getTimestamp(cita.fecha, cita.horaInicio)
        }
      };
    } catch (error) {
      console.error('❌ Error en transformarCitaDoctor:', error);
      return this.getCitaVacia();
    }
  }

  /**
   * 📅 Formatear fecha a formato legible
   */
  static formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const date = new Date(fecha);
      
      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return date.toLocaleDateString('es-ES', opciones);
    } catch (error) {
      console.error('❌ Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }

  /**
   * 🕐 Formatear hora a formato legible
   */
  static formatearHora(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return 'Hora no disponible';
    
    try {
      // Validar formato de hora HH:MM
      const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
        return 'Formato inválido';
      }
      
      // Formato: "10:00 AM - 11:00 AM"
      const inicio = this.convertirHora12(horaInicio);
      const fin = this.convertirHora12(horaFin);
      
      return `${inicio} - ${fin}`;
    } catch (error) {
      console.error('❌ Error formateando hora:', error);
      return 'Error en hora';
    }
  }

  /**
   * 🕐 Convertir hora de 24h a 12h
   */
  static convertirHora12(hora24) {
    if (!hora24) return '12:00 AM';
    
    try {
      const [horas, minutos] = hora24.split(':');
      const hora = parseInt(horas);
      const minuto = parseInt(minutos);
      
      // Validar que sea una hora válida
      if (isNaN(hora) || isNaN(minuto) || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
        return '12:00 AM';
      }
      
      const ampm = hora >= 12 ? 'PM' : 'AM';
      const hora12 = hora % 12 || 12;
      
      return `${hora12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('❌ Error convirtiendo hora:', error);
      return '12:00 AM';
    }
  }

  /**
   * 🏷️ Obtener etiqueta de estado con colores
   */
  static getEstadoInfo(estado) {
    const estados = {
      pendiente: { etiqueta: 'Pendiente', color: '#f59e0b', icono: '⏳' },
      confirmada: { etiqueta: 'Confirmada', color: '#10b981', icono: '✅' },
      cancelada: { etiqueta: 'Cancelada', color: '#ef4444', icono: '❌' },
      completada: { etiqueta: 'Completada', color: '#6366f1', icono: '✨' },
      en_progreso: { etiqueta: 'En Progreso', color: '#3b82f6', icono: '🔄' }
    };
    
    return estados[estado] || { etiqueta: estado, color: '#6b7280', icono: '📅' };
  }

  /**
   * � Obtener nombre completo de manera segura
   */
  static obtenerNombreCompleto(entidad, esDoctor = false) {
    if (!entidad) return 'Desconocido';
    
    // Para doctores, puede tener nombreCompleto directamente
    if (esDoctor && entidad.nombreCompleto) {
      return entidad.nombreCompleto;
    }
    
    // Para pacientes o si no tiene nombreCompleto
    if (entidad.usuario) {
      if (entidad.usuario.nombreCompleto) {
        return entidad.usuario.nombreCompleto;
      }
      
      const nombre = entidad.usuario.nombre || '';
      const apellido = entidad.usuario.apellido || '';
      return `${nombre} ${apellido}`.trim() || 'Sin nombre';
    }
    
    // Si no hay usuario, intentar con campos directos
    if (entidad.nombre || entidad.apellido) {
      const nombre = entidad.nombre || '';
      const apellido = entidad.apellido || '';
      return `${nombre} ${apellido}`.trim() || 'Sin nombre';
    }
    
    return 'Desconocido';
  }

  /**
   * 🛡️ Extraer información del paciente de forma segura
   */
  static extraerPacienteSeguro(paciente) {
    if (!paciente) {
      return {
        nombreCompleto: 'Paciente no disponible',
        email: 'No disponible',
        telefono: 'No disponible'
      };
    }

    try {
      const nombreCompleto = this.obtenerNombreCompleto(paciente);
      const email = paciente.usuario?.email || paciente.email || 'No disponible';
      const telefono = paciente.usuario?.telefono || paciente.telefono || 'No disponible';

      return {
        nombreCompleto: this.limpiarTexto(nombreCompleto) || 'Sin nombre',
        email: this.limpiarTexto(email) || 'No disponible',
        telefono: this.limpiarTexto(telefono) || 'No disponible'
      };
    } catch (error) {
      console.error('❌ Error en extraerPacienteSeguro:', error);
      return {
        nombreCompleto: 'Error al cargar',
        email: 'No disponible',
        telefono: 'No disponible'
      };
    }
  }

  /**
   * 🧹 Limpiar texto de caracteres peligrosos
   */
  static limpiarTexto(texto) {
    if (!texto || typeof texto !== 'string') return '';
    
    return texto
      .trim()
      .replace(/[<>]/g, '') // Eliminar tags HTML básicos
      .replace(/javascript:/gi, '') // Eliminar protocolos javascript
      .substring(0, 500); // Limitar longitud
  }

  /**
   * 📅 Verificar si la cita es hoy
   */
  static esHoy(fecha) {
    if (!fecha) return false;
    
    try {
      const fechaCita = new Date(fecha);
      const hoy = new Date();
      
      return fechaCita.toDateString() === hoy.toDateString();
    } catch (error) {
      return false;
    }
  }

  /**
   * ⏰ Verificar si la cita ya pasó
   */
  static esPasada(fecha, horaFin) {
    if (!fecha || !horaFin) return false;
    
    try {
      const fechaCita = new Date(fecha);
      const [horas, minutos] = horaFin.split(':');
      fechaCita.setHours(parseInt(horas), parseInt(minutos), 0, 0);
      
      return fechaCita < new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * ⏱️ Obtener timestamp para ordenamiento
   */
  static getTimestamp(fecha, horaInicio) {
    if (!fecha || !horaInicio) return 0;
    
    try {
      const fechaCita = new Date(fecha);
      const [horas, minutos] = horaInicio.split(':');
      fechaCita.setHours(parseInt(horas), parseInt(minutos), 0, 0);
      
      return fechaCita.getTime();
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📋 Obtener estructura de cita vacía para fallback
   */
  static getCitaVacia() {
    return {
      fecha: null,
      horaInicio: '',
      horaFin: '',
      estado: 'desconocido',
      motivo: 'No disponible',
      fechaFormateada: 'Fecha no válida',
      horaFormateada: 'Hora no válida',
      paciente: {
        nombreCompleto: 'Paciente no disponible',
        email: 'No disponible',
        telefono: 'No disponible'
      },
      estadoInfo: this.getEstadoInfo('desconocido'),
      metadatos: {
        esHoy: false,
        esPasada: false,
        timestamp: 0
      }
    };
  }

  /**
   * 📊 Obtener estadísticas de citas
   */
  static generarEstadisticas(citas) {
    const stats = {
      total: citas.length,
      porEstado: {},
      porDia: {},
      porDoctor: {},
      proximas: [],
      deHoy: []
    };
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    citas.forEach(cita => {
      // 📊 Por estado
      stats.porEstado[cita.estado] = (stats.porEstado[cita.estado] || 0) + 1;
      
      // 📊 Por día
      const dia = cita.fecha?.toISOString().split('T')[0];
      if (dia) {
        stats.porDia[dia] = (stats.porDia[dia] || 0) + 1;
      }
      
      // 📊 Por doctor
      const doctorNombre = cita.doctor?.nombreCompleto || 'Desconocido';
      stats.porDoctor[doctorNombre] = (stats.porDoctor[doctorNombre] || 0) + 1;
      
      // 📅 Próximas citas
      if (cita.estado !== 'cancelada' && cita.estado !== 'completada') {
        const fechaCita = new Date(cita.fecha);
        if (fechaCita >= hoy) {
          stats.proximas.push(cita);
        }
      }
      
      // 📅 Citas de hoy
      const fechaCita = new Date(cita.fecha);
      if (fechaCita.toDateString() === hoy.toDateString()) {
        stats.deHoy.push(cita);
      }
    });
    
    return stats;
  }
}

module.exports = CitasDTO;
