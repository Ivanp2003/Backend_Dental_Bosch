# 🚫 Endpoint - Listar Doctores Inactivos

## 📋 **Información General**

### **Endpoint**: `GET /api/admin/doctores-inactivos`

### **Propósito**: Listar todos los doctores que están inactivos (estado: false)

### **Acceso**: Solo administradores

---

## 🔐 **Autenticación**

### **Headers Requeridos**:
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

### **Rol Requerido**: `admin`

---

## 📊 **Parámetros Opcionales (Query)**

### **Paginación**:
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Cantidad de resultados por página (default: 10)

### **Filtros**:
- `especialidad` (opcional): Filtrar por especialidad (búsqueda parcial, case-insensitive)

---

## 🎯 **Ejemplos de Uso**

### **1. Listar todos los doctores inactivos**:
```javascript
GET /api/admin/doctores-inactivos

// Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. Listar con paginación**:
```javascript
GET /api/admin/doctores-inactivos?page=2&limit=5
```

### **3. Filtrar por especialidad**:
```javascript
GET /api/admin/doctores-inactivos?especialidad=odontologia
```

### **4. Combinar filtros**:
```javascript
GET /api/admin/doctores-inactivos?especialidad=pediatria&page=1&limit=20
```

---

## 📱 **Ejemplo en React Native**

### **Implementación**:
```javascript
// api/admin.js
import axios from 'axios';

const API_URL = 'https://backend-dental-bosch-vr8o.onrender.com/api';

export const listarDoctoresInactivos = async (token, filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.especialidad) params.append('especialidad', filtros.especialidad);

    const response = await axios.get(`${API_URL}/admin/doctores-inactivos?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### **Componente React Native**:
```javascript
// components/DoctoresInactivosList.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { listarDoctoresInactivos } from '../api/admin';

const DoctoresInactivosList = ({ token }) => {
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const cargarDoctores = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const resultado = await listarDoctoresInactivos(token, {
        page: pageNum,
        limit: 10
      });

      if (reset) {
        setDoctores(resultado.datos.doctores);
      } else {
        setDoctores(prev => [...prev, ...resultado.datos.doctores]);
      }

      setHasMore(resultado.datos.currentPage < resultado.datos.totalPages);
    } catch (error) {
      console.error('Error cargando doctores inactivos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDoctores(1, true);
  }, []);

  const renderDoctor = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.usuario.nombre} {item.usuario.apellido}</Text>
        <View style={[styles.statusBadge, styles.inactive]}>
          <Text style={styles.statusText}>Inactivo</Text>
        </View>
      </View>
      
      <Text style={styles.email}>{item.usuario.email}</Text>
      <Text style={styles.specialty}>Especialidad: {item.especialidad}</Text>
      <Text style={styles.phone}>📱 {item.usuario.telefono}</Text>
      <Text style={styles.createdAt}>
        📅 Inactivo desde: {new Date(item.usuario.updatedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      cargarDoctores(page + 1);
    }
  };

  if (loading && doctores.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Cargando doctores inactivos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctores Inactivos</Text>
      
      <FlatList
        data={doctores}
        renderItem={renderDoctor}
        keyExtractor={item => item._id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={loading ? <ActivityIndicator /> : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay doctores inactivos</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  doctorCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  inactive: {
    backgroundColor: '#dc3545'
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  specialty: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  createdAt: {
    fontSize: 12,
    color: '#999'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});

export default DoctoresInactivosList;
```

---

## 🎯 **Respuestas Esperadas**

### **✅ Éxito (200)**:
```json
{
  "success": true,
  "mensaje": "Doctores inactivos listados exitosamente",
  "datos": {
    "doctores": [
      {
        "_id": "6a029c85570629a705bf5adc",
        "especialidad": "Odontología General",
        "experiencia": "5 años",
        "consultorio": "Consultorio 1A",
        "horarioAtencion": [
          {
            "dia": "lunes",
            "horaInicio": "08:00",
            "horaFin": "17:00",
            "disponible": true
          }
        ],
        "usuario": {
          "_id": "6a029c85570629a705bf5add",
          "nombre": "Juan",
          "apellido": "Pérez",
          "email": "juan.perez@consultorio.com",
          "telefono": "0987654321",
          "cedula": "1712345678",
          "estado": false,
          "confirmado": true,
          "createdAt": "2024-01-15T10:30:00.000Z"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "hasNextPage": false
  }
}
```

### **❌ Errores Comunes**:

#### **401 - No autorizado**:
```json
{
  "success": false,
  "mensaje": "Acceso denegado. Token no proporcionado o inválido"
}
```

#### **403 - Rol no autorizado**:
```json
{
  "success": false,
  "mensaje": "Acceso denegado. Se requiere rol de administrador"
}
```

#### **500 - Error interno**:
```json
{
  "success": false,
  "mensaje": "Error interno del servidor",
  "error": "Error detallado (solo en desarrollo)"
}
```

---

## 🔄 **Comparación con Otros Endpoints**

| **Endpoint** | **Filtro** | **Propósito** |
|---|---|---|
| `GET /api/admin/doctores` | `estado=true` (por defecto) | Listar doctores activos |
| `GET /api/admin/doctores-pendientes` | `estado=pendiente` | Listar doctores pendientes |
| `GET /api/admin/doctores-inactivos` | `estado=false` | Listar doctores inactivos |

---

## 🎉 **Características**

### **✅ Funcionalidades**:
- **Filtrado automático**: Solo doctores con `estado: false`
- **Paginación**: Manejo de grandes volúmenes de datos
- **Búsqueda por especialidad**: Filtrado flexible
- **Información completa**: Datos del doctor y su usuario
- **Ordenamiento**: Por fecha de creación (más recientes primero)

### **✅ Seguridad**:
- **Autenticación requerida**: Token JWT válido
- **Autorización por rol**: Solo administradores
- **Validación de datos**: Parámetros validados

---

## 📋 **Notas Importantes**

1. **Estado inactivo**: `usuario.estado: false`
2. **No eliminados**: Los doctores no se eliminan, solo se desactivan
3. **Reactivación**: Se puede reactivar con `PUT /api/admin/doctores/:id/estado`
4. **Asignación automática**: Al desactivar, las citas futuras pueden reasignarse

---

**✅ El endpoint está listo para usar. Los administradores ahora pueden listar fácilmente todos los doctores inactivos del sistema.**
