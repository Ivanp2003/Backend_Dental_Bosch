// Validar email
exports.validarEmail = (email) => {
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(email);
};

// Validar nombre y apellido (solo letras y espacios, mínimo 2 caracteres)
exports.validarNombre = (nombre) => {
  if (!nombre || nombre.trim() === '') return false;
  
  // Permitir letras, espacios, acentos y ñ
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
  return regex.test(nombre.trim());
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

// Validar datos de perfil (actualización parcial)
exports.validarActualizacionPerfil = (datos, rol) => {
  const errores = [];
  const { nombre, apellido, email, telefono, cedula } = datos;
  
  // Validaciones generales (solo si se proporcionan y no están vacíos)
  if (nombre !== undefined && nombre.trim() !== '' && !exports.validarNombre(nombre)) {
    errores.push('El nombre no es válido');
  }
  
  if (apellido !== undefined && apellido.trim() !== '' && !exports.validarNombre(apellido)) {
    errores.push('El apellido no es válido');
  }
  
  if (email !== undefined && email.trim() !== '' && !exports.validarEmail(email)) {
    errores.push('El email no es válido');
  }
  
  if (telefono !== undefined && telefono.trim() !== '' && !exports.validarTelefono(telefono)) {
    errores.push('El teléfono debe tener 10 dígitos y empezar con 09');
  }
  
  // Validaciones específicas por rol (solo si se proporcionan)
  if (rol === 'paciente' && cedula !== undefined && cedula.trim() !== '' && !exports.validarCedula(cedula)) {
    errores.push('La cédula debe tener exactamente 10 dígitos');
  }
  
  // Validar dirección si se proporciona
  if (datos.direccion !== undefined && typeof datos.direccion === 'object') {
    if (datos.direccion.calle !== undefined && datos.direccion.calle.trim() === '') {
      errores.push('La calle no puede estar vacía');
    }
    if (datos.direccion.ciudad !== undefined && datos.direccion.ciudad.trim() === '') {
      errores.push('La ciudad no puede estar vacía');
    }
    if (datos.direccion.provincia !== undefined && datos.direccion.provincia.trim() === '') {
      errores.push('La provincia no puede estar vacía');
    }
  }
  
  // Validar contacto de emergencia si se proporciona
  if (datos.contactoEmergencia !== undefined && typeof datos.contactoEmergencia === 'object') {
    if (datos.contactoEmergencia.nombre !== undefined && datos.contactoEmergencia.nombre.trim() === '') {
      errores.push('El nombre del contacto de emergencia no puede estar vacío');
    }
    if (datos.contactoEmergencia.telefono !== undefined && datos.contactoEmergencia.telefono.trim() !== '' && !exports.validarTelefono(datos.contactoEmergencia.telefono)) {
      errores.push('El teléfono del contacto de emergencia debe tener 10 dígitos y empezar con 09');
    }
    if (datos.contactoEmergencia.parentesco !== undefined && datos.contactoEmergencia.parentesco.trim() === '') {
      errores.push('El parentesco del contacto de emergencia no puede estar vacío');
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
  
  // Limpiar y asignar solo campos permitidos (incluyendo campos de doctores)
  const camposPermitidos = [
    'nombre', 'apellido', 'email', 'telefono', 'cedula', 
    'fechaNacimiento', 'genero', 'direccion', 'contactoEmergencia',
    // Campos específicos de doctores
    'especialidad', 'experiencia', 'consultorio', 'horarios'
  ];
  
  camposPermitidos.forEach(campo => {
    if (datos[campo] !== undefined) {
      // Para objetos anidados, mantener estructura sin convertir a string
      if (['horarios', 'direccion', 'contactoEmergencia'].includes(campo) && typeof datos[campo] === 'object') {
        sanitizados[campo] = datos[campo];
      } else {
        sanitizados[campo] = datos[campo].toString().trim();
      }
    }
  });
  
  return sanitizados;
};