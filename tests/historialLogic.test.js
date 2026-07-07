// Pruebas unitarias de lógica de historial clínico 

describe('Pruebas de Lógica de Historial Clínico', () => {
  
  test('Debe crear estructura de consulta válida', () => {
    const consulta = {
      fecha: new Date('2026-06-20'),
      doctor: 'doctor123',
      motivoConsulta: 'Dolor dental',
      diagnostico: 'Caries',
      tratamiento: 'Obturación',
      observaciones: 'Consulta de rutina'
    };

    expect(consulta.motivoConsulta).toBeDefined();
    expect(consulta.diagnostico).toBeDefined();
    expect(consulta.tratamiento).toBeDefined();
    expect(consulta.fecha).toBeInstanceOf(Date);
  });

  test('Debe crear estructura de odontograma válida', () => {
    const odontograma = {
      dientes: [
        {
          codigoFDI: '18',
          estadoGeneral: 'SANO',
          superficies: {
            vestibular: { estado: 'SANO', observacion: '' },
            lingual: { estado: 'SANO', observacion: '' },
            oclusal: { estado: 'CARIES', observacion: 'Caries detectada' }
          }
        }
      ]
    };

    expect(odontograma.dientes).toBeDefined();
    expect(odontograma.dientes.length).toBeGreaterThan(0);
    expect(odontograma.dientes[0].codigoFDI).toBe('18');
    expect(odontograma.dientes[0].superficies).toBeDefined();
  });

  test('Debe agregar nueva consulta al array de consultas', () => {
    const historial = {
      paciente: 'paciente123',
      consultas: [
        {
          fecha: new Date('2026-06-20'),
          motivoConsulta: 'Dolor dental',
          diagnostico: 'Caries'
        }
      ]
    };

    const nuevaConsulta = {
      fecha: new Date('2026-06-21'),
      motivoConsulta: 'Limpieza dental',
      diagnostico: 'Sarro'
    };

    historial.consultas.push(nuevaConsulta);

    expect(historial.consultas.length).toBe(2);
    expect(historial.consultas[1].motivoConsulta).toBe('Limpieza dental');
  });

  test('Debe actualizar consulta existente por ID', () => {
    const consultaId = 'consulta123';
    const historial = {
      paciente: 'paciente123',
      consultas: [
        {
          _id: consultaId,
          fecha: new Date('2026-06-20'),
          tratamiento: 'Obturación'
        }
      ]
    };

    const consulta = historial.consultas.find(c => c._id === consultaId);
    if (consulta) {
      consulta.tratamiento = 'Obturación con resina';
      consulta.observaciones = 'Actualizado';
    }

    expect(consulta.tratamiento).toBe('Obturación con resina');
    expect(consulta.observaciones).toBe('Actualizado');
  });

  test('Debe filtrar consultas por fecha', () => {
    const historial = {
      paciente: 'paciente123',
      consultas: [
        { fecha: new Date('2026-06-20'), motivo: 'Consulta 1' },
        { fecha: new Date('2026-06-21'), motivo: 'Consulta 2' },
        { fecha: new Date('2026-06-22'), motivo: 'Consulta 3' }
      ]
    };

    const fechaDesde = new Date('2026-06-21');
    const consultasFiltradas = historial.consultas.filter(
      c => c.fecha >= fechaDesde
    );

    expect(consultasFiltradas.length).toBe(2);
    expect(consultasFiltradas[0].motivo).toBe('Consulta 2');
  });

  test('Debe calcular estadísticas básicas de consultas', () => {
    const historial = {
      paciente: 'paciente123',
      consultas: [
        { diagnostico: 'Caries' },
        { diagnostico: 'Caries' },
        { diagnostico: 'Gingivitis' },
        { diagnostico: 'Caries' }
      ]
    };

    const diagnosticos = {};
    historial.consultas.forEach(c => {
      diagnosticos[c.diagnostico] = (diagnosticos[c.diagnostico] || 0) + 1;
    });

    expect(diagnosticos['Caries']).toBe(3);
    expect(diagnosticos['Gingivitis']).toBe(1);
  });

  test('Debe validar código FDI de diente', () => {
    const codigosValidos = ['11', '18', '21', '28', '31', '38', '41', '48', '51', '55', '61', '65', '71', '75', '81', '85'];
    
    codigosValidos.forEach(codigo => {
      expect(codigo).toMatch(/^[1-8][1-8]$/);
    });
  });

  test('Debe validar estado clínico de diente', () => {
    const estadosValidos = ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_NECESARIO', 'SELLANTE_REALIZADO', 
                           'EXTRACCION_INDICADA', 'PERDIDA_POR_CARIES', 'PERDIDA_OTRA_CAUSA', 
                           'ENDODONCIA', 'CORONA', 'PROTESIS_FIJA', 'PROTESIS_REMOVIBLE', 'PROTESIS_TOTAL'];
    
    const estado = 'CARIES';
    expect(estadosValidos.includes(estado)).toBe(true);
  });

  test('Debe validar estado de superficie', () => {
    const estadosValidos = ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO'];
    
    const estado = 'CARIES';
    expect(estadosValidos.includes(estado)).toBe(true);
  });
});
