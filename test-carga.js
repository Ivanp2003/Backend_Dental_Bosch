import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuración de la carga (Equivalente al Thread Group de JMeter)
export const options = {
    stages: [
        { duration: '5s', target: 10 },  // Sube gradualmente a 10 usuarios en 5 segundos
        { duration: '15s', target: 50 }, // Sube a 50 usuarios concurrentes en 15 segundos
        { duration: '10s', target: 0 },  // Baja a 0 usuarios (Ramp-down)
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // El test falla si más del 1% de las peticiones dan error
        http_req_duration: ['p(95)<500'], // El 95% de las peticiones deben responder en menos de 500ms
    },
};

// 2. La lógica de la prueba (Lo que hace cada usuario simulado)
export default function () {
    const url = 'http://localhost:5000/api/auth/login';
    
    // Aquí definimos el JSON exacto sin riesgo de que se altere a multipart
    const payload = JSON.stringify({
        email: 'admin@dentalbosch.com',
        password: 'Admin123',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Realizar la petición POST
    const res = http.post(url, payload, params);

    // Validar que el servidor Express responda con código 200 (Éxito)
    check(res, {
        'status es 200': (r) => r.status === 200,
        'tiene token': (r) => r.json().hasOwnProperty('token'),
    });

    // Simular un tiempo de espera pequeño entre clics de usuario (1 segundo)
    sleep(1);
}
