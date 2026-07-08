# API RESTful - Sistema de Gestión Odontológica (Dental Bosch) 🦷

Bienvenido al repositorio del backend del **Sistema de Gestión Odontológica Dental Bosch v3.1.0**. Esta API proporciona una solución integral para la administración de pacientes, doctores, citas médicas e historiales clínicos, con notificaciones en tiempo real y seguridad robusta.

---

## 🏗️ Arquitectura del Sistema (MVC)

El proyecto está diseñado bajo el patrón arquitectónico **Modelo-Vista-Controlador (MVC)**, el cual separa las responsabilidades lógicas del sistema, permitiendo que el código sea escalable, mantenible y limpio.

*   **Modelos (Models):** Ubicados en `src/models/`. Se encargan de definir la estructura y esquema de los datos en MongoDB usando Mongoose. Aquí se establecen las reglas de validación (como el Algoritmo del Módulo 10 para cédulas ecuatorianas, campos obligatorios y bloqueos de caracteres inválidos).
*   **Controladores (Controllers):** Ubicados en `src/controllers/`. Contienen toda la lógica de negocio. Reciben las peticiones del usuario, interactúan con los Modelos para obtener/modificar los datos, y preparan la respuesta.
*   **Vistas (Views):** Al ser una API RESTful, las "vistas" no son páginas HTML, sino respuestas estructuradas en formato **JSON** que son consumidas por el Frontend (React/Next.js/Expo).
*   **Rutas (Routers):** Ubicadas en `src/routers/`. Actúan como despachadores (dispatchers) que reciben las peticiones HTTP (GET, POST, PUT, DELETE) y las dirigen al Controlador correspondiente.
*   **Servicios y Utilidades (Services & Utils):** Capas de apoyo para enviar correos (SendGrid/Nodemailer), generar JWTs, manejar encriptaciones de contraseñas (`bcryptjs`) e interactuar con servicios externos (Expo Push Notifications).

---

## 👥 Roles, Funciones y Restricciones

El sistema cuenta con 3 roles jerárquicos claramente definidos. La protección de estas funciones se realiza mediante **JSON Web Tokens (JWT)** y middlewares de autorización.

### 1. Administrador (Admin)
Es el usuario de mayor jerarquía. Tiene acceso global a la información para auditar y controlar a los empleados.
*   **Funciones:**
    *   Gestionar su propio perfil y contraseña.
    *   **Control de Doctores:** Puede aprobar doctores recién registrados, rechazarlos, darlos de baja (Soft Delete) y reactivarlos. Solo los doctores aprobados pueden ingresar al sistema.
    *   Visualizar el catálogo completo de todos los pacientes del sistema.
    *   Visualizar y auditar el listado global de TODAS las citas agendadas, sin restricción.
*   **Restricciones:** 
    *   No puede agendar citas en nombre de los doctores ni llenar historiales clínicos o diagnósticos (esta es una tarea puramente médica).

### 2. Doctor
Es el profesional médico. Solo tiene acceso a la información que concierne directamente a su agenda y a los pacientes que atiende.
*   **Funciones:**
    *   Registrarse en la plataforma (requiere aprobación del Admin para activar la cuenta).
    *   **Agenda Médica:** Crear citas para sus pacientes, visualizar sus citas asignadas (`mis-citas`), finalizarlas una vez atendidas o cancelarlas.
    *   **Gestión de Pacientes:** Visualizar el listado exclusivo de *sus* pacientes (`mis-pacientes`) y su detalle.
    *   **Historial y Odontograma:** Tienen acceso de escritura para iniciar odontogramas, modificar el estado de cada diente y registrar diagnósticos u observaciones en el historial clínico de sus pacientes.
    *   Reciben notificaciones Push automáticas al ser agendada o cancelada una cita suya.
*   **Restricciones:**
    *   NO pueden acceder a los historiales clínicos de pacientes que no atienden.
    *   NO pueden aprobar, rechazar o visualizar cuentas de otros doctores.

### 3. Paciente
Es el usuario final. Tiene el nivel de acceso más restringido por motivos de privacidad.
*   **Funciones:**
    *   Crear su cuenta en el sistema.
    *   Explorar el catálogo público de Doctores disponibles (para conocer su especialidad y horarios de atención).
    *   **Reservas:** Agendar nuevas citas médicas seleccionando los horarios (slots) disponibles de un doctor, visualizar sus propias citas agendadas y cancelarlas en caso de imprevistos.
    *   **Consultar Historial:** Ver en modo lectura su propio historial clínico y la representación gráfica de su odontograma.
*   **Restricciones:**
    *   Solamente pueden ver **sus propias citas** y su propio historial. 
    *   Tienen **Prohibido** modificar o agregar diagnósticos a su propio odontograma/historial clínico.

---

## 🧪 Usuarios de Prueba (Por Defecto)

Al iniciar la base de datos por primera vez (al arrancar el servidor `server.js` conectándose a MongoDB), el sistema auto-generará estos 3 usuarios de prueba (`seeds`) para facilitar el desarrollo y los testeos en el Frontend.

> 🛡️ **Nota:** Las contraseñas están almacenadas usando un hash seguro (bcrypt) y las cédulas cumplen con la validación del Algoritmo del Módulo 10 para cédulas ecuatorianas.

| Rol | Nombre | Apellido | Email | Contraseña | Cédula | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Elisabel | Bosch | `admin@dentalbosch.com` | `Admin123` | 1710034065 | Aprobado |
| **Doctor** | Ana | Gomez | `doctor@dentalbosch.com` | `Docdbosch01` | 0923456784 | Aprobado |
| **Paciente** | Luis | Herrera | `paciente@dentalbosch.com` | `Pac1entedbosch` | 1725489635 | Aprobado |

*¡Con estos usuarios podrás navegar y probar instantáneamente cada una de las funcionalidades de tu frontend redirigiendo correctamente según su rol!*
