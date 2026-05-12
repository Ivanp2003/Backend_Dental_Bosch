// Script de diagnóstico para despliegue
require('dotenv').config();

console.log('=== DIAGNÓSTICO DE DESPLIEGUE ===\n');

// 1. Verificar entorno
console.log('1. ENTORNO:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || '❌ NO CONFIGURADO'}`);

// 2. Verificar variables críticas
console.log('\n2. VARIABLES CRÍTICAS:');
const criticalVars = {
  'MONGODB_URI': process.env.MONGODB_URI,
  'MONGODB_URI_PRODUCTION': process.env.MONGODB_URI_PRODUCTION,
  'JWT_SECRET': process.env.JWT_SECRET
};

Object.entries(criticalVars).forEach(([key, value]) => {
  if (value) {
    console.log(`${key}: ✅ CONFIGURADA`);
  } else {
    console.log(`${key}: ❌ FALTANTE`);
  }
});

// 3. Verificar variables opcionales
console.log('\n3. VARIABLES OPCIONALES:');
const optionalVars = {
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'EMAIL_FROM': process.env.EMAIL_FROM,
  'PORT': process.env.PORT
};

Object.entries(optionalVars).forEach(([key, value]) => {
  if (value) {
    console.log(`${key}: ✅ CONFIGURADA`);
  } else {
    console.log(`${key}: ⚠️  OPCIONAL`);
  }
});

// 4. Verificar si hay URI de MongoDB disponible
console.log('\n4. CONEXIÓN A MONGODB:');
const mongodbUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;
if (mongodbUri) {
  console.log('URI encontrada: ✅');
  console.log(`Tipo: ${mongodbUri.includes('mongodb+srv') ? 'Atlas (Producción)' : 'Local'}`);
  
  // Verificar formato básico
  if (mongodbUri.includes('mongodb') && mongodbUri.includes('://')) {
    console.log('Formato: ✅ Válido');
  } else {
    console.log('Formato: ❌ Inválido');
  }
} else {
  console.log('URI: ❌ NO ENCONTRADA');
}

// 5. Recomendaciones
console.log('\n5. RECOMENDACIONES:');
const missingCritical = Object.entries(criticalVars).filter(([key, value]) => !value);

if (missingCritical.length > 0) {
  console.log('❌ VARIABLES FALTANTES EN RENDER:');
  missingCritical.forEach(([key]) => {
    console.log(`   - ${key}`);
  });
  console.log('\n🔧 CONFIGURA ESTAS VARIABLES EN EL PANEL DE RENDER:');
  console.log('   Environment → Add Environment Variable');
  console.log('\n   VALORES REQUERIDOS:');
  console.log('   NODE_ENV=production');
  console.log('   MONGODB_URI=tu_uri_de_mongodb_atlas');
  console.log('   JWT_SECRET=tu_secreto_jwt');
} else {
  console.log('✅ Todas las variables críticas están configuradas');
  console.log('🚀 La aplicación debería funcionar');
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
