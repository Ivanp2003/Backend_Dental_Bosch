require('dotenv').config();
const mongoose = require('mongoose');
const Cita = require('../src/models/Cita');

const ZONA_HORARIA_ECUADOR = -5;

function getAhoraEnEcuador() {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  return new Date(utc + (ZONA_HORARIA_ECUADOR * 3600000));
}

function construirFechaFinEcuador(cita) {
  const [hora, minuto] = cita.horaFin.split(':');
  const fechaFin = new Date(cita.fecha);
  fechaFin.setHours(parseInt(hora), parseInt(minuto), 0, 0);
  const utc = fechaFin.getTime() + fechaFin.getTimezoneOffset() * 60000;
  return new Date(utc + (ZONA_HORARIA_ECUADOR * 3600000));
}

async function cancelarCitasVencidas() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const ahora = getAhoraEnEcuador();
  console.log(`Ejecutando a las ${ahora.toISOString()} (hora Ecuador)`);

  const candidatas = await Cita.find({
    estado: { $in: ['pendiente', 'pendiente_confirmacion_paciente', 'confirmada'] },
    fecha: { $lte: ahora }
  });

  const vencidas = candidatas.filter(cita => {
    const fechaFin = construirFechaFinEcuador(cita);
    return fechaFin < ahora;
  });

  if (vencidas.length === 0) {
    console.log('No hay citas vencidas pendientes.');
    await mongoose.disconnect();
    return;
  }

  const ids = vencidas.map(c => c._id);

  const resultado = await Cita.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        estado: 'cancelada',
        canceladaPor: 'sistema',
        motivoCancelacion: 'Cita auto-cancelada: el horario transcurrió sin que el doctor registrara el resultado.',
        fechaCancelacion: ahora
      }
    }
  );

  console.log(`Auto-canceladas: ${resultado.modifiedCount} citas`);
  console.log('IDs afectadas:', ids.map(id => id.toString()));

  await mongoose.disconnect();
}

cancelarCitasVencidas().catch(err => {
  console.error('Error en cancelarCitasVencidas:', err);
  process.exit(1);
});