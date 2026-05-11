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

// Validar actualización de contraseña
exports.validarActualizacionPassword = (passwordActual, passwordNuevo) => {
  const errores = [];
  
  // Validar que no estén vacíos
  if (!passwordActual || passwordActual.trim() === '') {
    errores.push('La contraseña actual es requerida');
  }
  
  if (!passwordNuevo || passwordNuevo.trim() === '') {
    errores.push('La nueva contraseña es requerida');
  }
  
  // Validar longitud mínima
  if (passwordNuevo && passwordNuevo.length < 6) {
    errores.push('La nueva contraseña debe tener al menos 6 caracteres');
  }
  
  // Validar que sea diferente a la actual
  if (passwordActual && passwordNuevo && passwordActual === passwordNuevo) {
    errores.push('La nueva contraseña debe ser diferente a la actual');
  }
  
  // Validar complejidad (mínimo 6 caracteres, una mayúscula, un número)
  if (passwordNuevo && !exports.validarPassword(passwordNuevo)) {
    errores.push('La nueva contraseña debe tener al menos 6 caracteres, una mayúscula y un número');
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
};

// Validar datos de perfil
exports.validarActualizacionPerfil = (datos, rol) => {
  const errores = [];
  const { nombre, apellido, email, telefono, cedula } = datos;
  
  // Validaciones generales
  if (!nombre || nombre.trim() === '') {
    errores.push('El nombre es requerido');
  }
  
  if (!apellido || apellido.trim() === '') {
    errores.push('El apellido es requerido');
  }
  
  if (!email || email.trim() === '') {
    errores.push('El email es requerido');
  } else if (!exports.validarEmail(email)) {
    errores.push('El email no es válido');
  }
  
  if (!telefono || telefono.trim() === '') {
    errores.push('El teléfono es requerido');
  } else if (!exports.validarTelefono(telefono)) {
    errores.push('El teléfono debe tener 10 dígitos y empezar con 09');
  }
  
  // Validaciones específicas por rol
  if (rol === 'paciente') {
    if (!cedula || cedula.trim() === '') {
      errores.push('La cédula es requerida para pacientes');
    } else if (!exports.validarCedula(cedula)) {
      errores.push('La cédula debe tener exactamente 10 dígitos');
    }
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
};

// Sanitizar datos de entrada
exports.sanitizarDatosPerfil = (datos) => {
  const sanitizados = {};
  
  // Limpiar y asignar solo campos permitidos
  const camposPermitidos = ['nombre', 'apellido', 'email', 'telefono', 'cedula', 'fechaNacimiento', 'genero', 'direccion', 'contactoEmergencia'];
  
  camposPermitidos.forEach(campo => {
    if (datos[campo] !== undefined) {
      sanitizados[campo] = datos[campo].toString().trim();
    }
  });
  
  return sanitizados;
};