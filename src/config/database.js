// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================
// Maneja la conexión a MySQL usando un pool de conexiones

const mysql = require('mysql2/promise');

// Crear pool de conexiones
// Un pool permite reutilizar conexiones en vez de crear una nueva cada vez
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'registro_entregas',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,        // Máximo 10 conexiones simultáneas
    queueLimit: 0,              // Sin límite de cola
    enableKeepAlive: true,      // Mantener conexiones vivas
    keepAliveInitialDelay: 0
});

// Probar la conexión al iniciar
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida exitosamente');
        console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar a MySQL:', error.message);
        console.error('');
        console.error('Verifica que:');
        console.error('1. MySQL esté corriendo');
        console.error('2. Las credenciales en .env sean correctas');
        console.error('3. La base de datos exista');
        process.exit(1);
    }
}

// Ejecutar test de conexión
testConnection();

// Exportar el pool para usar en otros archivos
module.exports = pool;
