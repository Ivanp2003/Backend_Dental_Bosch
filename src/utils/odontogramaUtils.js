/**
 * Utilidades para manejo de odontogramas
 * Sistema de nomenclatura FDI (ISO 3950)
 * Caras: M=Mesial, D=Distal, O=Oclusal/Incisal, V=Vestibular, L=Lingual, P=Palatina
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
          estadoGeneral: 'SANO',
          superficies: {
            M: { estado: 'SANO', observacion: '' },
            D: { estado: 'SANO', observacion: '' },
            O: { estado: 'SANO', observacion: '' },
            V: { estado: 'SANO', observacion: '' },
            L: { estado: 'SANO', observacion: '' },
            P: { estado: 'SANO', observacion: '' }
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
          estadoGeneral: 'SANO',
          superficies: {
            M: { estado: 'SANO', observacion: '' },
            D: { estado: 'SANO', observacion: '' },
            O: { estado: 'SANO', observacion: '' },
            V: { estado: 'SANO', observacion: '' },
            L: { estado: 'SANO', observacion: '' },
            P: { estado: 'SANO', observacion: '' }
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

/**
 * Valida que un estado clínico sea válido
 * @param {String} estado - Estado a validar
 * @returns {Boolean} true si es válido
 */
function validarEstadoClinico(estado) {
  const estadosValidos = [
    'SANO',
    'CARIES',
    'OBTURADO',
    'SELLANTE_NECESARIO',
    'SELLANTE_REALIZADO',
    'EXTRACCION_INDICADA',
    'PERDIDA_POR_CARIES',
    'PERDIDA_OTRA_CAUSA',
    'ENDODONCIA',
    'CORONA',
    'PROTESIS_FIJA',
    'PROTESIS_REMOVIBLE',
    'PROTESIS_TOTAL'
  ];
  return estadosValidos.includes(estado);
}

/**
 * Valida que una cara sea válida
 * @param {String} cara - Cara a validar (M, D, O, V, L, P)
 * @returns {Boolean} true si es válida
 */
function validarCara(cara) {
  const carasValidas = ['M', 'D', 'O', 'V', 'L', 'P'];
  return carasValidas.includes(cara);
}

/**
 * Valida compatibilidad entre estados (previene estados incompatibles)
 * @param {String} estadoActual - Estado actual del diente
 * @param {String} nuevoEstado - Nuevo estado a asignar
 * @returns {Object} { valido: Boolean, mensaje: String }
 */
function validarCompatibilidadEstados(estadoActual, nuevoEstado) {
  // Si es el mismo estado, es válido
  if (estadoActual === nuevoEstado) {
    return { valido: true, mensaje: '' };
  }

  // PROHIBIDO: CARIES + OBTURADO en misma cara
  if (estadoActual === 'CARIES' && nuevoEstado === 'OBTURADO') {
    return { valido: true, mensaje: '' }; // Es válido, caries puede ser obturada
  }
  if (estadoActual === 'OBTURADO' && nuevoEstado === 'CARIES') {
    return { valido: false, mensaje: 'PROHIBIDO: Un diente obturado no puede tener caries en la misma cara' };
  }

  // PROHIBIDO: PIEZA_PERDIDA + CARIES
  if ((estadoActual === 'PERDIDA_POR_CARIES' || estadoActual === 'PERDIDA_OTRA_CAUSA') && nuevoEstado === 'CARIES') {
    return { valido: false, mensaje: 'PROHIBIDO: Una pieza perdida no puede tener caries' };
  }
  if (estadoActual === 'CARIES' && (nuevoEstado === 'PERDIDA_POR_CARIES' || nuevoEstado === 'PERDIDA_OTRA_CAUSA')) {
    return { valido: true, mensaje: '' }; // Es válido, caries puede llevar a pérdida
  }

  // PROHIBIDO: PROTESIS_TOTAL + pieza existente
  if (estadoActual === 'PROTESIS_TOTAL' && nuevoEstado !== 'SANO' && nuevoEstado !== 'PROTESIS_TOTAL') {
    return { valido: false, mensaje: 'PROHIBIDO: Una prótesis total no puede tener otros estados' };
  }
  if (nuevoEstado === 'PROTESIS_TOTAL' && estadoActual !== 'SANO' && estadoActual !== 'PERDIDA_POR_CARIES' && estadoActual !== 'PERDIDA_OTRA_CAUSA') {
    return { valido: false, mensaje: 'PROHIBIDO: Solo se puede colocar prótesis total en piezas sanas o perdidas' };
  }

  // PROHIBIDO: EXTRACCION_INDICADA + PERDIDA
  if ((estadoActual === 'EXTRACCION_INDICADA' && (nuevoEstado === 'PERDIDA_POR_CARIES' || nuevoEstado === 'PERDIDA_OTRA_CAUSA')) ||
      ((estadoActual === 'PERDIDA_POR_CARIES' || estadoActual === 'PERDIDA_OTRA_CAUSA') && nuevoEstado === 'EXTRACCION_INDICADA')) {
    return { valido: false, mensaje: 'PROHIBIDO: Una pieza no puede estar indicada para extracción y estar perdida simultáneamente' };
  }

  // PROHIBIDO: SANO + cualquier patología
  if (estadoActual === 'SANO' && nuevoEstado === 'SANO') {
    return { valido: true, mensaje: '' };
  }
  if (nuevoEstado === 'SANO' && estadoActual !== 'SANO') {
    return { valido: false, mensaje: 'PROHIBIDO: No se puede cambiar un estado patológico a SANO sin tratamiento' };
  }

  // Por defecto, permitir el cambio
  return { valido: true, mensaje: '' };
}

/**
 * Valida que un estado de superficie sea válido
 * @param {String} estadoSuperficie - Estado de superficie
 * @returns {Boolean} true si es válido
 */
function validarEstadoSuperficie(estadoSuperficie) {
  const estadosValidos = ['SANO', 'CARIES', 'OBTURADO', 'SELLANTE_REALIZADO', 'SELLANTE_NECESARIO'];
  return estadosValidos.includes(estadoSuperficie);
}

module.exports = {
  generarOdontogramaInicial,
  validarCodigoFDI,
  obtenerNombreDiente,
  validarEstadoClinico,
  validarCara,
  validarCompatibilidadEstados,
  validarEstadoSuperficie
};
