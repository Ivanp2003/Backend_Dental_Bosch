/**
 * Helpers para el módulo de Historia Clínica
 * Funciones de cálculo automático y utilidades
 */

/**
 * Calcular grupo etario basado en la fecha de nacimiento
 * Según Skill 2: Grupos etarios oficiales
 * 
 * @param {Date} fechaNacimiento - Fecha de nacimiento del paciente
 * @returns {String} Grupo etario correspondiente
 */
const calcularGrupoEtario = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);
  
  // Calcular edad en años
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  
  // Determinar grupo etario según rangos oficiales
  if (edad < 1) {
    return 'menor de 1 año';
  } else if (edad >= 1 && edad <= 4) {
    return '1-4 años';
  } else if (edad >= 5 && edad <= 9) {
    return '5-9 años';
  } else if (edad >= 10 && edad <= 14) {
    return '10-14 años';
  } else if (edad >= 15 && edad <= 19) {
    return '15-19 años';
  } else if (edad >= 20 && edad <= 64) {
    return '20-64 años';
  } else {
    return '65 años o más';
  }
};

/**
 * Calcular edad basada en fecha de nacimiento
 * 
 * @param {Date} fechaNacimiento - Fecha de nacimiento del paciente
 * @returns {Number} Edad en años
 */
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);
  
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  
  return edad;
};

/**
 * Generar número de historia clínica único
 * Formato: HC-YYYY-NNNNNN (ej: HC-2025-000001)
 * Según Skill 2: Debe ser único, autogenerado e inmutable
 * 
 * @param {Number} consecutivo - Número consecutivo del año
 * @returns {String} Número de historia clínica formateado
 */
const generarNumeroHistoriaClinica = (consecutivo) => {
  const anio = new Date().getFullYear();
  // Formatear consecutivo con 6 dígitos (ej: 000001)
  const consecutivoFormateado = String(consecutivo).padStart(6, '0');
  return `HC-${anio}-${consecutivoFormateado}`;
};

/**
 * Obtener el siguiente consecutivo para historia clínica
 * Consulta el último número usado y retorna el siguiente
 * 
 * @param {MongooseModel} HistorialClinico - Modelo de Historia Clínica
 * @returns {Promise<String>} Próximo número de historia clínica
 */
const obtenerProximoNumeroHistoriaClinica = async (HistorialClinico) => {
  const anioActual = new Date().getFullYear();
  
  // Buscar el último historial creado en el año actual
  const ultimoHistorial = await HistorialClinico.findOne({
    numeroHistoriaClinica: new RegExp(`^HC-${anioActual}-`)
  })
  .sort({ numeroHistoriaClinica: -1 })
  .select('numeroHistoriaClinica');
  
  let consecutivo;
  
  if (ultimoHistorial && ultimoHistorial.numeroHistoriaClinica) {
    // Extraer el número del último historial (ej: "HC-2025-000123" -> 123)
    const partes = ultimoHistorial.numeroHistoriaClinica.split('-');
    consecutivo = parseInt(partes[2]) + 1;
  } else {
    // Primer historial del año
    consecutivo = 1;
  }
  
  return generarNumeroHistoriaClinica(consecutivo);
};

/**
 * Validar formato de CIE-10
 * Formato: Letra + 2 dígitos + punto opcional + 1-4 dígitos
 * Ejemplos: K04, K04.7, K04.71
 * 
 * @param {String} codigo - Código CIE-10 a validar
 * @returns {Boolean} True si es válido
 */
const validarCIE10 = (codigo) => {
  if (!codigo) return false;
  const regex = /^[A-Z]\d{2}(\.\d{1,4})?$/;
  return regex.test(codigo.toUpperCase());
};

/**
 * Formatear presión arterial para almacenamiento
 * Convierte valores separados a formato string "sistólica/diastólica"
 * 
 * @param {Number} sistolica - Presión sistólica
 * @param {Number} diastolica - Presión diastólica
 * @returns {String} Presión arterial formateada
 */
const formatearPresionArterial = (sistolica, diastolica) => {
  if (!sistolica || !diastolica) return null;
  return `${sistolica}/${diastolica}`;
};

/**
 * Inicializar estructura vacía de antecedentes con valores por defecto
 * Útil para crear consultas nuevas con valores iniciales
 * 
 * @returns {Object} Estructura de antecedentes inicializada
 */
const inicializarAntecedentes = () => ({
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
});

/**
 * Inicializar estructura vacía de examen estomatognático
 * 
 * @returns {Object} Estructura de examen estomatognático inicializada
 */
const inicializarExamenEstomatognatico = () => ({
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
});

/**
 * Inicializar estructura vacía de plan diagnóstico
 * 
 * @returns {Object} Estructura de plan diagnóstico inicializada
 */
const inicializarPlanDiagnostico = () => ({
  biometria: { solicitado: false, realizado: false, pendiente: false },
  quimicaSanguinea: { solicitado: false, realizado: false, pendiente: false },
  rayosX: { solicitado: false, realizado: false, pendiente: false },
  otros: '',
  observaciones: ''
});

/**
 * Inicializar estructura vacía de indicadores de salud bucal
 * 
 * @returns {Object} Estructura de indicadores inicializada
 */
const inicializarIndicadoresSaludBucal = () => ({
  higieneOral: { placa: null, calculo: null, gingivitis: null },
  enfermedadPeriodontal: null,
  maloclusion: null,
  fluorosis: null,
  indiceCPO: { C: 0, P: 0, O: 0, total: 0 }
});

/**
 * Calcular total del índice CPO automáticamente
 * 
 * @param {Object} indiceCPO - Objeto con C, P, O
 * @returns {Object} Índice CPO con total calculado
 */
const calcularTotalCPO = (indiceCPO) => {
  if (!indiceCPO) return { C: 0, P: 0, O: 0, total: 0 };
  
  const C = indiceCPO.C || 0;
  const P = indiceCPO.P || 0;
  const O = indiceCPO.O || 0;
  
  return {
    C,
    P,
    O,
    total: C + P + O
  };
};

module.exports = {
  calcularGrupoEtario,
  calcularEdad,
  generarNumeroHistoriaClinica,
  obtenerProximoNumeroHistoriaClinica,
  validarCIE10,
  formatearPresionArterial,
  inicializarAntecedentes,
  inicializarExamenEstomatognatico,
  inicializarPlanDiagnostico,
  inicializarIndicadoresSaludBucal,
  calcularTotalCPO
};