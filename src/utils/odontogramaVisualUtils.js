/**
 * Utilidades para metadata visual de odontogramas
 * Generan datos necesarios para renderizado frontend
 */

const { obtenerNombreDiente } = require('./odontogramaUtils');

/**
 * Obtiene metadata visual completa para un diente
 * @param {String} codigoFDI - Código FDI (ej: "11", "23", "55")
 * @param {String} estadoGeneral - Estado general del diente
 * @returns {Object} Metadata visual
 */
function obtenerMetadataVisual(codigoFDI, estadoGeneral) {
  const cuadrante = parseInt(codigoFDI[0]);
  const posicion = parseInt(codigoFDI[1]);
  
  return {
    coordenadas: calcularCoordenadas(cuadrante, posicion),
    colorPrincipal: obtenerColorEstado(estadoGeneral),
    forma: obtenerFormaDiente(posicion, cuadrante),
    geometriaSuperficies: obtenerGeometriaSuperficies(posicion, cuadrante),
    cuadrante,
    posicion,
    esTemporal: cuadrante >= 5,
    nombreDescriptivo: obtenerNombreDiente(codigoFDI)
  };
}

/**
 * Calcula coordenadas X/Y para posicionar diente en layout visual
 * Layout tipo "boca abierta" vista desde arriba
 * 
 * @param {Number} cuadrante - 1-8 según FDI
 * @param {Number} posicion - 1-8 (permanente) o 1-5 (temporal)
 * @returns {Object} { x, y, cuadrante }
 */
function calcularCoordenadas(cuadrante, posicion) {
  // Configuración de layouts por cuadrante
  const layouts = {
    // Cuadrante 1: Superior derecho (18 → 11)
    1: { 
      baseX: 400, 
      baseY: 100, 
      direccion: -1,
      descripcion: 'Superior Derecho'
    },
    
    // Cuadrante 2: Superior izquierdo (21 → 28)
    2: { 
      baseX: 450, 
      baseY: 100, 
      direccion: 1,
      descripcion: 'Superior Izquierdo'
    },
    
    // Cuadrante 3: Inferior izquierdo (31 → 38)
    3: { 
      baseX: 450, 
      baseY: 300, 
      direccion: 1,
      descripcion: 'Inferior Izquierdo'
    },
    
    // Cuadrante 4: Inferior derecho (41 → 48)
    4: { 
      baseX: 400, 
      baseY: 300, 
      direccion: -1,
      descripcion: 'Inferior Derecho'
    },
    
    // Cuadrantes temporales (5-8)
    5: { baseX: 400, baseY: 100, direccion: -1, descripcion: 'Superior Derecho Temporal' },
    6: { baseX: 450, baseY: 100, direccion: 1, descripcion: 'Superior Izquierdo Temporal' },
    7: { baseX: 450, baseY: 300, direccion: 1, descripcion: 'Inferior Izquierdo Temporal' },
    8: { baseX: 400, baseY: 300, direccion: -1, descripcion: 'Inferior Derecho Temporal' }
  };
  
  const layout = layouts[cuadrante];
  const espaciado = 55; // Píxeles entre dientes
  
  return {
    x: layout.baseX + (layout.direccion * posicion * espaciado),
    y: layout.baseY,
    cuadrante,
    descripcionCuadrante: layout.descripcion
  };
}

/**
 * Obtiene color hexadecimal según estado clínico
 * Estándar odontológico profesional:
 * - ROJO = Patologías
 * - AZUL = Tratamientos realizados
 * - AMARILLO = Pendientes
 * - GRIS = Ausentes
 * 
 * @param {String} estado - Estado clínico
 * @returns {String} Color hex
 */
function obtenerColorEstado(estado) {
  const colores = {
    // ===== ESTADOS NORMALES =====
    'SANO': '#FFFFFF',
    
    // ===== PATOLOGÍAS (ROJO) =====
    'CARIES': '#FF0000',
    'EXTRACCION_INDICADA': '#FF6B6B',
    'PERDIDA_POR_CARIES': '#CC0000',
    'PERDIDA_OTRA_CAUSA': '#999999',
    
    // ===== TRATAMIENTOS REALIZADOS (AZUL) =====
    'OBTURADO': '#0000FF',
    'SELLANTE_REALIZADO': '#4169E1',
    'ENDODONCIA': '#000080',
    'CORONA': '#1E90FF',
    
    // ===== PRÓTESIS (AZUL OSCURO) =====
    'PROTESIS_FIJA': '#00008B',
    'PROTESIS_REMOVIBLE': '#4682B4',
    'PROTESIS_TOTAL': '#191970',
    
    // ===== PENDIENTES (AMARILLO) =====
    'SELLANTE_NECESARIO': '#FFD700'
  };
  
  return colores[estado] || '#FFFFFF';
}

/**
 * Determina forma del diente para seleccionar geometría correcta
 * @param {Number} posicion - Posición en cuadrante (1-8)
 * @param {Number} cuadrante - Cuadrante (1-8)
 * @returns {String} Tipo de diente
 */
function obtenerFormaDiente(posicion, cuadrante) {
  const esTemporal = cuadrante >= 5;
  
  if (esTemporal) {
    if (posicion <= 2) return 'incisivo_temporal';
    if (posicion === 3) return 'canino_temporal';
    return 'molar_temporal';
  } else {
    if (posicion <= 2) return 'incisivo';
    if (posicion === 3) return 'canino';
    if (posicion <= 5) return 'premolar';
    return 'molar';
  }
}

/**
 * Define paths SVG para cada superficie según tipo de diente
 * Formato compacto: { cara: [path, labelX, labelY] }
 * El frontend usa la key del objeto como label (M, D, O, V, L, P)
 * 
 * @param {Number} posicion - Posición del diente
 * @param {Number} cuadrante - Cuadrante
 * @returns {Object} Geometría de superficies en formato compacto
 */
function obtenerGeometriaSuperficies(posicion, cuadrante) {
  const forma = obtenerFormaDiente(posicion, cuadrante);
  
  // Formato compacto: [path, labelX, labelY]
  const geometrias = {
    incisivo: {
      M: ['M 20,0 L 10,5 L 10,35 L 20,40 Z', 12, 22],
      D: ['M 20,0 L 30,5 L 30,35 L 20,40 Z', 28, 22],
      O: ['M 10,5 L 30,5 L 30,12 L 10,12 Z', 20, 10],
      V: ['M 10,12 L 30,12 L 30,20 L 10,20 Z', 20, 17],
      L: ['M 10,20 L 30,20 L 30,28 L 10,28 Z', 20, 25],
      P: ['M 10,28 L 30,28 L 30,35 L 10,35 Z', 20, 33]
    },
    canino: {
      M: ['M 20,0 L 8,8 L 8,32 L 20,40 Z', 12, 22],
      D: ['M 20,0 L 32,8 L 32,32 L 20,40 Z', 28, 22],
      O: ['M 8,8 L 32,8 L 28,15 L 12,15 Z', 20, 12],
      V: ['M 12,15 L 28,15 L 28,22 L 12,22 Z', 20, 19],
      L: ['M 12,22 L 28,22 L 28,28 L 12,28 Z', 20, 26],
      P: ['M 12,28 L 28,28 L 32,32 L 8,32 Z', 20, 31]
    },
    premolar: {
      M: ['M 20,0 L 5,10 L 5,30 L 20,40 Z', 11, 22],
      D: ['M 20,0 L 35,10 L 35,30 L 20,40 Z', 29, 22],
      O: ['M 5,10 L 35,10 L 30,17 L 10,17 Z', 20, 14],
      V: ['M 10,17 L 30,17 L 30,23 L 10,23 Z', 20, 21],
      L: ['M 10,23 L 30,23 L 30,30 L 10,30 Z', 20, 27],
      P: ['M 10,30 L 30,30 L 35,30 L 5,30 Z', 20, 32]
    },
    molar: {
      M: ['M 20,0 L 3,12 L 3,28 L 20,40 Z', 10, 22],
      D: ['M 20,0 L 37,12 L 37,28 L 20,40 Z', 30, 22],
      O: ['M 3,12 L 37,12 L 32,18 L 8,18 Z', 20, 16],
      V: ['M 8,18 L 32,18 L 32,24 L 8,24 Z', 20, 22],
      L: ['M 8,24 L 32,24 L 32,28 L 8,28 Z', 20, 27],
      P: ['M 8,28 L 32,28 L 37,28 L 3,28 Z', 20, 30]
    }
  };
  
  // Dientes temporales usan mismas geometrías
  geometrias.incisivo_temporal = geometrias.incisivo;
  geometrias.canino_temporal = geometrias.canino;
  geometrias.molar_temporal = geometrias.molar;
  
  return geometrias[forma] || geometrias.molar;
}

module.exports = {
  obtenerMetadataVisual,
  calcularCoordenadas,
  obtenerColorEstado,
  obtenerFormaDiente,
  obtenerGeometriaSuperficies
};
