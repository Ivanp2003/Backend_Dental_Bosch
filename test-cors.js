// Test CORS - Script para verificar configuración del backend
const testCORS = async () => {
  const backendUrl = 'https://backend-dental-bosch-vr8o.onrender.com';
  
  console.log('🔍 Probando configuración CORS...\n');
  
  // Test 1: Health Check (debería funcionar siempre)
  console.log('1. Health Check:');
  try {
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    console.log('✅ Health Check OK:', data);
    console.log('   Entorno:', data.entorno);
  } catch (error) {
    console.log('❌ Health Check Error:', error.message);
  }
  
  // Test 2: Login (debería fallar con CORS si no está configurado)
  console.log('\n2. Login Test (CORS):');
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://dental-bosch.vercel.app'
      },
      body: JSON.stringify({
        email: 'admin@dentalbosch.com',
        password: 'Admin123'
      })
    });
    
    console.log('✅ Login Response Status:', response.status);
    console.log('✅ CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    });
    
    const data = await response.json();
    console.log('✅ Login Response:', data);
  } catch (error) {
    console.log('❌ Login CORS Error:', error.message);
  }
  
  // Test 3: Preflight OPTIONS
  console.log('\n3. Preflight OPTIONS Test:');
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://dental-bosch.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS Status:', response.status);
    console.log('✅ OPTIONS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    });
  } catch (error) {
    console.log('❌ OPTIONS Error:', error.message);
  }
};

// Ejecutar test
testCORS();
