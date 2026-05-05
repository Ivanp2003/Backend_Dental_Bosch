/**
 * 📋 DTO para transformar datos de citas a un formato amigable para el frontend
 * Elimina IDs innecesarios y estructura los datos de manera clara
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
    return {
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
      
      // 👤 Información del paciente (solo datos útiles)
      paciente: {
        id: cita.paciente._id,
        nombreCompleto: cita.paciente.usuario?.nombreCompleto || 
                      `${cita.paciente.usuario?.nombre || ''} ${cita.paciente.usuario?.apellido || ''}`.trim(),
        email: cita.paciente.usuario?.email,
        telefono: cita.paciente.usuario?.telefono,
        edad: cita.paciente.edad
      },
      
      // 👨‍⚕️ Información del doctor (solo datos útiles)
      doctor: {
        id: cita.doctor._id,
        nombreCompleto: cita.doctor.nombreCompleto || 
                      cita.doctor.usuario?.nombreCompleto || 
                      `${cita.doctor.usuario?.nombre || ''} ${cita.doctor.usuario?.apellido || ''}`.trim(),
        especialidad: cita.doctor.especialidad,
        email: cita.doctor.usuario?.email
      },
      
      // 📊 Metadatos útiles
      metadatos: {
        createdAt: cita.createdAt,
        updatedAt: cita.updatedAt,
        fechaHoraInicio: cita.fechaHoraInicio,
        fechaHoraFin: cita.fechaHoraFin
      }
    };
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
        nombreCompleto: cita.doctor.nombreCompleto || 
                      cita.doctor.usuario?.nombreCompleto || 
                      `${cita.doctor.usuario?.nombre || ''} ${cita.doctor.usuario?.apellido || ''}`.trim(),
        especialidad: cita.doctor.especialidad
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
    return {
      id: cita._id,
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      duracion: cita.duracion,
      estado: cita.estado,
      motivo: cita.motivo,
      creadoPor: cita.creadoPor,
      confirmada: cita.confirmada,
      
      // 📅 Fechas formateadas
      fechaFormateada: this.formatearFecha(cita.fecha),
      horaFormateada: this.formatearHora(cita.horaInicio, cita.horaFin),
      
      // 👤 Información del paciente
      paciente: {
        nombreCompleto: cita.paciente.usuario?.nombreCompleto || 
                      `${cita.paciente.usuario?.nombre || ''} ${cita.paciente.usuario?.apellido || ''}`.trim(),
        email: cita.paciente.usuario?.email,
        telefono: cita.paciente.usuario?.telefono,
        edad: cita.paciente.edad
      },
      
      // 📊 Metadatos
      metadatos: {
        createdAt: cita.createdAt,
        updatedAt: cita.updatedAt
      }
    };
  }

  /**
   * 📅 Formatear fecha a formato legible
   */
  static formatearFecha(fecha) {
    if (!fecha) return null;
    
    const date = new Date(fecha);
    const opciones = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('es-ES', opciones);
  }

  /**
   * 🕐 Formatear hora a formato legible
   */
  static formatearHora(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return null;
    
    // Formato: "10:00 AM - 11:00 AM"
    const inicio = this.convertirHora12(horaInicio);
    const fin = this.convertirHora12(horaFin);
    
    return `${inicio} - ${fin}`;
  }

  /**
   * 🕐 Convertir hora de 24h a 12h
   */
  static convertirHora12(hora24) {
    if (!hora24) return null;
    
    const [horas, minutos] = hora24.split(':');
    const hora = parseInt(horas);
    const ampm = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora % 12 || 12;
    
    return `${hora12}:${minutos} ${ampm}`;
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
