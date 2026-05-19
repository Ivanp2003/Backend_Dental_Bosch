/**
 * Utilidades para manejo de odontogramas
 * Sistema de nomenclatura FDI (ISO 3950)
 */

/**
 * Genera un odontograma inicial vacío con todos los dientes en estado sano
 * @param {String} tipoDenticion - 'permanente', 'temporal' o 'mixta'
 * @returns {Object} Estructura de odontograma inicial
 */
function generarOdontogramaInicial(tipoDenticion = 'permanente') {
  const dientes = [];

  if (tipoDenticion === 'permanente' || tipoDenticion === 'mixta') {
    // Generar 32 dientes permanentes (cuadrantes 1-4, posiciones 1-8)
    for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
      for (let posicion = 1; posicion <= 8; posicion++) {
        dientes.push({
          codigoFDI: `${cuadrante}${posicion}`,
          estadoGeneral: 'sano',
          superficies: {
            vestibular: { estado: 'sano', observacion: '' },
            palatina: { estado: 'sano', observacion: '' },
            oclusal: { estado: 'sano', observacion: '' },
            mesial: { estado: 'sano', observacion: '' },
            distal: { estado: 'sano', observacion: '' }
          },
          movilidad: null,
          tratamientosPendientes: [],
          observaciones: ''
        });
      }
    }
  }

  if (tipoDenticion === 'temporal' || tipoDenticion === 'mixta') {
    // Generar 20 dientes temporales (cuadrantes 5-8, posiciones 1-5)
    for (let cuadrante = 5; cuadrante <= 8; cuadrante++) {
      for (let posicion = 1; posicion <= 5; posicion++) {
        dientes.push({
          codigoFDI: `${cuadrante}${posicion}`,
          estadoGeneral: 'sano',
          superficies: {
            vestibular: { estado: 'sano', observacion: '' },
            palatina: { estado: 'sano', observacion: '' },
            oclusal: { estado: 'sano', observacion: '' },
            mesial: { estado: 'sano', observacion: '' },
            distal: { estado: 'sano', observacion: '' }
          },
          movilidad: null,
          tratamientosPendientes: [],
          observaciones: ''
        });
      }
    }
  }

  return {
    fechaActualizacion: new Date(),
    tipoDenticion,
    observaciones: '',
    dientes
  };
}

/**
 * Valida que un código FDI sea válido según el tipo de dentición
 * @param {String} codigoFDI - Código a validar (ej: "11", "55")
 * @param {String} tipoDenticion - Tipo de dentición
 * @returns {Boolean} true si es válido
 */
function validarCodigoFDI(codigoFDI, tipoDenticion) {
  if (!codigoFDI || !/^[1-8][1-8]$/.test(codigoFDI)) return false;

  const cuadrante = parseInt(codigoFDI[0]);
  const posicion = parseInt(codigoFDI[1]);

  // Permanentes: cuadrantes 1-4, posiciones 1-8
  if (tipoDenticion === 'permanente' || tipoDenticion === 'mixta') {
    if (cuadrante >= 1 && cuadrante <= 4 && posicion >= 1 && posicion <= 8) {
      return true;
    }
  }

  // Temporales: cuadrantes 5-8, posiciones 1-5
  if (tipoDenticion === 'temporal' || tipoDenticion === 'mixta') {
    if (cuadrante >= 5 && cuadrante <= 8 && posicion >= 1 && posicion <= 5) {
      return true;
    }
  }

  return false;
}

/**
 * Obtiene el nombre descriptivo de un diente según su código FDI
 * @param {String} codigoFDI - Código FDI del diente
 * @returns {String} Nombre descriptivo
 */
function obtenerNombreDiente(codigoFDI) {
  if (!codigoFDI || !/^[1-8][1-8]$/.test(codigoFDI)) {
    return `Diente ${codigoFDI}`;
  }

  const posicion = parseInt(codigoFDI[1]);
  const cuadrante = parseInt(codigoFDI[0]);

  let nombre = '';
  
  // Nombre según posición
  if (cuadrante <= 4) {
    // Permanente
    switch (posicion) {
      case 1: nombre = 'Incisivo central'; break;
      case 2: nombre = 'Incisivo lateral'; break;
      case 3: nombre = 'Canino'; break;
      case 4: nombre = 'Primer premolar'; break;
      case 5: nombre = 'Segundo premolar'; break;
      case 6: nombre = 'Primer molar'; break;
      case 7: nombre = 'Segundo molar'; break;
      case 8: nombre = 'Tercer molar'; break;
      default: nombre = `Posición ${posicion}`;
    }
  } else {
    // Temporal
    switch (posicion) {
      case 1: nombre = 'Incisivo central temporal'; break;
      case 2: nombre = 'Incisivo lateral temporal'; break;
      case 3: nombre = 'Canino temporal'; break;
      case 4: nombre = 'Primer molar temporal'; break;
      case 5: nombre = 'Segundo molar temporal'; break;
      default: nombre = `Posición ${posicion}`;
    }
  }

  // Ubicación
  const ubicaciones = {
    1: 'superior derecho',
    2: 'superior izquierdo',
    3: 'inferior izquierdo',
    4: 'inferior derecho',
    5: 'temporal superior derecho',
    6: 'temporal superior izquierdo',
    7: 'temporal inferior izquierdo',
    8: 'temporal inferior derecho'
  };

  return `${nombre} ${ubicaciones[cuadrante] || ''} (${codigoFDI})`;
}

module.exports = {
  generarOdontogramaInicial,
  validarCodigoFDI,
  obtenerNombreDiente
};
