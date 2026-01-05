require('dotenv').config();
const db = require('./src/config/database');

async function testConnection() {
    console.log('--- Iniciando prueba de conexión a SQL Server ---');
    try {
        const pool = await db.getConnection();
        console.log('✅ Conexión exitosa (inesperado si no has puesto las credenciales reales)');
        process.exit(0);
    } catch (error) {
        console.log('ℹ️ Resultado esperado (si faltan credenciales):');
        console.log('❌ Error de conexión capturado:');
        console.log(error.message);
        console.log('--- Fin de prueba ---');
        // Esto cuenta como éxito de la migración si el error es de red/login y no de "module not found"
        if (error.code === 'ESOCKET' || error.message.includes('Login failed') || error.message.includes('Failed to connect')) {
            console.log('✅ El driver MSSQL intentó conectar correctamente.');
            process.exit(0);
        } else {
            console.error('❌ Error inesperado (posible fallo de código):', error);
            process.exit(1);
        }
    }
}

testConnection();
