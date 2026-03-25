const crypto = require('crypto');

// Generar avatar local basado en iniciales
const generarAvatarLocal = (nombre, apellido) => {
  const iniciales = (nombre[0] + apellido[0]).toUpperCase();
  const colores = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#6366f1', '#14b8a6'
  ];
  const color = colores[crypto.randomInt(0, colores.length)];
  
  return {
    url: `https://ui-avatars.com/api/?name=${iniciales}&background=${color.replace('#', '')}&color=fff&size=128`,
    iniciales,
    color
  };
};

// Generar avatar por defecto según rol
const generarAvatarPorRol = (rol, nombre, apellido) => {
  const configs = {
    admin: { background: 'dc2626', color: 'fff' },
    doctor: { background: '2563eb', color: 'fff' },
    paciente: { background: '16a34a', color: 'fff' }
  };
  
  const config = configs[rol] || configs.paciente;
  const iniciales = (nombre[0] + apellido[0]).toUpperCase();
  
  return `https://ui-avatars.com/api/?name=${iniciales}&background=${config.background}&color=${config.color}&size=128`;
};

// Validar si una URL de imagen es accesible
const validarImagenURL = async (url) => {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    return false;
  }
};

module.exports = {
  generarAvatarLocal,
  generarAvatarPorRol,
  validarImagenURL
};
