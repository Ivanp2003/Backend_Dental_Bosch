// Pruebas unitarias de lógica de cálculo de slots (sin MongoDB)

describe('Pruebas de Lógica de Slots Ocupados', () => {
  
  test('Debe calcular slots de 30 minutos para una cita de 1 hora', () => {
    const horaInicio = '09:00';
    const horaFin = '10:00';
    
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [finHora, finMin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;
    
    const slotsOcupados = [];
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      const slotHora = Math.floor(minutos / 60);
      const slotMin = minutos % 60;
      const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
      if (!slotsOcupados.includes(slotStr)) {
        slotsOcupados.push(slotStr);
      }
    }

    expect(slotsOcupados).toEqual(['09:00', '09:30']);
  });

  test('Debe calcular slots de 30 minutos para una cita de 2 horas', () => {
    const horaInicio = '10:00';
    const horaFin = '12:00';
    
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [finHora, finMin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;
    
    const slotsOcupados = [];
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      const slotHora = Math.floor(minutos / 60);
      const slotMin = minutos % 60;
      const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
      if (!slotsOcupados.includes(slotStr)) {
        slotsOcupados.push(slotStr);
      }
    }

    expect(slotsOcupados).toEqual(['10:00', '10:30', '11:00', '11:30']);
  });

  test('Debe calcular slots para cita de 30 minutos', () => {
    const horaInicio = '14:00';
    const horaFin = '14:30';
    
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [finHora, finMin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;
    
    const slotsOcupados = [];
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      const slotHora = Math.floor(minutos / 60);
      const slotMin = minutos % 60;
      const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
      if (!slotsOcupados.includes(slotStr)) {
        slotsOcupados.push(slotStr);
      }
    }

    expect(slotsOcupados).toEqual(['14:00']);
  });

  test('Debe calcular slots para cita de 1.5 horas', () => {
    const horaInicio = '08:30';
    const horaFin = '10:00';
    
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [finHora, finMin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;
    
    const slotsOcupados = [];
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      const slotHora = Math.floor(minutos / 60);
      const slotMin = minutos % 60;
      const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
      if (!slotsOcupados.includes(slotStr)) {
        slotsOcupados.push(slotStr);
      }
    }

    expect(slotsOcupados).toEqual(['08:30', '09:00', '09:30']);
  });

  test('Debe eliminar slots duplicados', () => {
    const citas = [
      { horaInicio: '09:00', horaFin: '10:00' },
      { horaInicio: '09:30', horaFin: '10:30' }
    ];
    
    const slotsOcupados = [];
    for (const cita of citas) {
      const [inicioHora, inicioMin] = cita.horaInicio.split(':').map(Number);
      const [finHora, finMin] = cita.horaFin.split(':').map(Number);
      
      const inicioMinutos = inicioHora * 60 + inicioMin;
      const finMinutos = finHora * 60 + finMin;
      
      for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
        const slotHora = Math.floor(minutos / 60);
        const slotMin = minutos % 60;
        const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
        if (!slotsOcupados.includes(slotStr)) {
          slotsOcupados.push(slotStr);
        }
      }
    }

    expect(slotsOcupados).toEqual(['09:00', '09:30', '10:00']);
  });

  test('Debe ordenar slots cronológicamente', () => {
    const citas = [
      { horaInicio: '14:00', horaFin: '15:00' },
      { horaInicio: '09:00', horaFin: '10:00' }
    ];
    
    const slotsOcupados = [];
    for (const cita of citas) {
      const [inicioHora, inicioMin] = cita.horaInicio.split(':').map(Number);
      const [finHora, finMin] = cita.horaFin.split(':').map(Number);
      
      const inicioMinutos = inicioHora * 60 + inicioMin;
      const finMinutos = finHora * 60 + finMin;
      
      for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
        const slotHora = Math.floor(minutos / 60);
        const slotMin = minutos % 60;
        const slotStr = `${String(slotHora).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
        if (!slotsOcupados.includes(slotStr)) {
          slotsOcupados.push(slotStr);
        }
      }
    }

    slotsOcupados.sort();
    expect(slotsOcupados).toEqual(['09:00', '09:30', '14:00', '14:30']);
  });
});
