// Validar email
exports.validarEmail = (email) => {
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(email);
};

// Validar cédula (exactamente 10 dígitos)
exports.validarCedula = (cedula) => {
  if (!cedula) return false;
  
  // Limpiar caracteres no numéricos
  const cleaned = cedula.replace(/[^0-9]/g, '');
  
  // Requerir exactamente 10 dígitos
  return cleaned.length === 10;
};

// Validar contraseña mínimo 6 caracteres, una mayúscula, un número
exports.validarPassword = (password) => {
  if (!password || password.length < 6) return false;
  
  const tieneNumero = /\d/.test(password);
  const tieneMayuscula = /[A-Z]/.test(password);
  
  return tieneNumero && tieneMayuscula;
};

// Validar teléfono 10 dígitos
exports.validarTelefono = (telefono) => {
  const regex = /^09\d{8}$/;
  return regex.test(telefono);
};