// ============================================
// CONFIGURACIÓN DE BASE DE DATOS (MYSQL)
// ============================================

require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de la conexión a MySQL
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Asegurar que las fechas se manejen como objetos Date de JS
    timezone: 'Z'
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

/**
 * Método para ejecutar consultas SQL
 * @param {string} sqlQuery - La consulta SQL (con ? para parámetros)
 * @param {Array} params - Los parámetros de la consulta
 * @returns {Promise<Array>} - [filas, campos]
 */
async function query(sqlQuery, params = []) {
    try {
        const [result, fields] = await pool.execute(sqlQuery, params);

        // Normalizar la respuesta de INSERT para que el resto de la app
        // vea un objeto con insertId compatible con el formato anterior.
        const isInsert = /^\s*INSERT\s+INTO/i.test(sqlQuery);
        if (isInsert && result.insertId !== undefined) {
            return [{
                insertId: result.insertId,
                affectedRows: result.affectedRows
            }, fields];
        }

        return [result, fields];
    } catch (error) {
        console.error('❌ Error SQL:', error.message);
        console.error('Query:', sqlQuery);
        throw error;
    }
}

// Exportar interfaz
module.exports = {
    query,
    execute: query,
    pool,
    getConnection: async () => {
        const connection = await pool.getConnection();
        return {
            query: (q, p) => connection.execute(q, p),
            execute: (q, p) => connection.execute(q, p),
            release: () => connection.release(),
            beginTransaction: () => connection.beginTransaction(),
            commit: () => connection.commit(),
            rollback: () => connection.rollback()
        };
    }
};
