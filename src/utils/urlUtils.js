// Utilidad para asegurar que las URLs tengan el formato correcto

const asegurarUrlConDiagonal = (url) => {
  if (!url) return 'http://localhost:3000/';
  
  // Si ya termina con /, retornarla tal cual
  if (url.endsWith('/')) return url;
  
  // Si no, agregar la diagonal
  return url + '/';
};

module.exports = {
  asegurarUrlConDiagonal
};
