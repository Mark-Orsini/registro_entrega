require('dotenv').config();
const db = require('./src/config/database');

const DB_TYPE = process.env.DB_TYPE || 'mysql';

async function testConnection() {
    console.log(`--- Iniciando prueba de conexión a ${DB_TYPE.toUpperCase()} ---`);
    try {
        // Intentar una consulta simple usando la abstracción unificada
        const [rows] = await db.query('SELECT 1 + 1 AS solution');

        // En MySQL rows es un array, en MSSQL recordset es un array.
        // Nuestra abstracción en database.js asegura que rows sea un array.
        const result = Array.isArray(rows) ? rows[0].solution : rows.solution;

        console.log('✅ Conexión establecida exitosamente');
        console.log('✅ Consulta de prueba exitosa. Resultado:', result);

        process.exit(0);
    } catch (error) {
        console.log(`❌ Error de conexión a ${DB_TYPE.toUpperCase()}:`);
        console.log(error.message);

        if (DB_TYPE === 'mysql') {
            if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ENOTFOUND') {
                console.log('ℹ️ Nota: Verifica tus credenciales de MySQL en el archivo .env');
            }
        } else {
            console.log('ℹ️ Nota: Verifica tus credenciales de SQL Server (MSSQL) en el archivo .env');
            console.log('Asegúrate de que el servidor remoto permita conexiones y el firewall esté abierto.');
        }

        process.exit(0); // Salimos con 0 para no romper procesos si es esperado por falta de config
    }
}

testConnection();
