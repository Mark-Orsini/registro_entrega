require('dotenv').config();
const db = require('./src/config/database');

async function testConnection() {
    console.log('--- Iniciando prueba de conexión a MySQL ---');
    try {
        const pool = await db.getConnection();
        console.log('✅ Conexión establecida exitosamente (o pool creado)');

        // Intentar una consulta simple
        try {
            const [rows] = await db.query('SELECT 1 + 1 AS solution');
            console.log('✅ Consulta de prueba exitosa. Resultado:', rows[0].solution);
        } catch (queryError) {
            console.log('⚠️ Conexión de red OK, pero error al ejecutar query (posible base de datos no configurada):', queryError.message);
        }

        process.exit(0);
    } catch (error) {
        console.log('❌ Error de conexión:');
        console.log(error.message);
        console.log('--- Fin de prueba ---');

        // Códigos comunes de error de MySQL
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ENOTFOUND') {
            console.log('ℹ️ Nota: Este error es esperado si aún no has configurado las credenciales reales en el archivo .env');
            process.exit(0);
        } else {
            console.error('❌ Error fatal (posible error de código o dependencia):', error);
            process.exit(1);
        }
    }
}

testConnection();
