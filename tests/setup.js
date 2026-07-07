// Load environment variables before running tests
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Set test timeout
jest.setTimeout(30000);

// Log para verificar que las variables se cargaron
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Cargada' : 'No cargada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Cargada' : 'No cargada');
