# ⏰ Validación de Duración de Citas - Dental Bosch

## 🎯 **Nueva Validación Implementada**

### **✅ Regla Principal**:
- **Pacientes**: Solo pueden agendar citas de **exactamente 1 hora**
- **Doctores**: Pueden agendar citas de **hasta 4 horas**
- **Admin**: Pueden agendar citas de **hasta 4 horas**

---

## 📋 **Casos de Uso - Pacientes**

### **✅ Válidos (1 hora exacta)**:
```javascript
// 09:00 - 10:00 = 60 minutos ✅
{
  "horaInicio": "09:00",
  "horaFin": "10:00"
}

// 14:30 - 15:30 = 60 minutos ✅
{
  "horaInicio": "14:30", 
  "horaFin": "15:30"
}

// 08:00 - 09:00 = 60 minutos ✅
{
  "horaInicio": "08:00",
  "horaFin": "09:00"
}
```

### **❌ Inválidos (no son 1 hora)**:
```javascript
// 09:00 - 09:30 = 30 minutos ❌
{
  "horaInicio": "09:00",
  "horaFin": "09:30"
}
// Error: "Los pacientes solo pueden agendar citas de 1 hora de duración"

// 09:00 - 11:00 = 2 horas ❌
{
  "horaInicio": "09:00",
  "horaFin": "11:00"
}
// Error: "Los pacientes solo pueden agendar citas de 1 hora de duración"

// 09:00 - 09:45 = 45 minutos ❌
{
  "horaInicio": "09:00",
  "horaFin": "09:45"
}
// Error: "Los pacientes solo pueden agendar citas de 1 hora de duración"
```

---

## 📋 **Casos de Uso - Doctores/Admin**

### **✅ Válidos (hasta 4 horas)**:
```javascript
// 09:00 - 10:00 = 1 hora ✅
{
  "horaInicio": "09:00",
  "horaFin": "10:00"
}

// 09:00 - 12:00 = 3 horas ✅
{
  "horaInicio": "09:00",
  "horaFin": "12:00"
}

// 08:00 - 12:00 = 4 horas ✅
{
  "horaInicio": "08:00",
  "horaFin": "12:00"
}
```

### **❌ Inválidos (más de 4 horas)**:
```javascript
// 08:00 - 13:00 = 5 horas ❌
{
  "horaInicio": "08:00",
  "horaFin": "13:00"
}
// Error: "La cita no puede exceder 4 horas de duración"
```

---

## 🔍 **Lógica de Validación**

### **Cálculo de Duración**:
```javascript
const inicio = horaInicio.split(':');      // ["09", "00"]
const fin = horaFin.split(':');            // ["10", "00"]
const inicioMinutos = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);  // 540
const finMinutos = parseInt(fin[0]) * 60 + parseInt(fin[1]);          // 600
const duracion = finMinutos - inicioMinutos;                           // 60

if (rolUsuario === 'paciente') {
  if (duracion !== 60) {
    throw new Error('Los pacientes solo pueden agendar citas de 1 hora de duración');
  }
} else {
  if (duracion > 240) {
    throw new Error('La cita no puede exceder 4 horas de duración');
  }
}
```

---

## 🎯 **Ejemplos de Respuestas**

### **✅ Paciente - Cita Válida**:
```javascript
POST /api/citas
{
  "paciente": "ID_PACIENTE",
  "doctor": "ID_DOCTOR", 
  "fecha": "2024-12-25",
  "horaInicio": "10:00",
  "horaFin": "11:00",  // 1 hora exacta
  "motivo": "Consulta general"
}

// Respuesta:
{
  "success": true,
  "mensaje": "Cita creada exitosamente",
  "datos": { ... }
}
```

### **❌ Paciente - Cita Inválida**:
```javascript
POST /api/citas
{
  "paciente": "ID_PACIENTE",
  "doctor": "ID_DOCTOR",
  "fecha": "2024-12-25", 
  "horaInicio": "10:00",
  "horaFin": "10:30",  // 30 minutos ❌
  "motivo": "Consulta corta"
}

// Respuesta:
{
  "success": false,
  "mensaje": "Los pacientes solo pueden agendar citas de 1 hora de duración"
}
```

### **✅ Doctor - Cita Válida**:
```javascript
POST /api/citas
{
  "paciente": "ID_PACIENTE",
  "doctor": "ID_DOCTOR",
  "fecha": "2024-12-25",
  "horaInicio": "09:00",
  "horaFin": "13:00",  // 4 horas ✅
  "motivo": "Cirugía prolongada"
}

// Respuesta:
{
  "success": true,
  "mensaje": "Cita creada exitosamente",
  "datos": { ... }
}
```

---

## 🔧 **Implementación Técnica**

### **Ubicación**: `src/services/citasService.js`
### **Función**: `crearCita()` - Líneas 195-208

### **Validación por Rol**:
```javascript
// Validar duración según rol del usuario
const duracion = finMinutos - inicioMinutos;

if (rolUsuario === 'paciente') {
  // Para pacientes: exactamente 1 hora (60 minutos)
  if (duracion !== 60) {
    throw new Error('Los pacientes solo pueden agendar citas de 1 hora de duración');
  }
} else {
  // Para doctores y admin: máximo 4 horas (240 minutos)
  if (duracion > 240) {
    throw new Error('La cita no puede exceder 4 horas de duración');
  }
}
```

---

## 🎉 **Beneficios**

1. ✅ **Control de tiempo**: Los pacientes no pueden agendar citas muy cortas o muy largas
2. ✅ **Flexibilidad para doctores**: Pueden agendar citas más largas cuando es necesario
3. ✅ **Consistencia**: Todas las citas de pacientes tendrán la misma duración
4. ✅ **Optimización**: Mejor organización del horario del consultorio
5. ✅ **Claridad**: Mensajes de error específicos por rol

---

## 🚨 **Errores Comunes**

### **Paciente intenta agendar 30 minutos**:
```
POST /api/citas
{
  "horaInicio": "10:00",
  "horaFin": "10:30"
}

Error: "Los pacientes solo pueden agendar citas de 1 hora de duración"
```

### **Paciente intenta agendar 2 horas**:
```
POST /api/citas
{
  "horaInicio": "10:00", 
  "horaFin": "12:00"
}

Error: "Los pacientes solo pueden agendar citas de 1 hora de duración"
```

### **Doctor intenta agendar 5 horas**:
```
POST /api/citas
{
  "horaInicio": "08:00",
  "horaFin": "13:00"
}

Error: "La cita no puede exceder 4 horas de duración"
```

---

**✅ La validación está activa y funcionando. Los pacientes ahora solo pueden agendar citas de exactamente 1 hora.**
