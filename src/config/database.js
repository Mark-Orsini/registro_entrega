// ============================================
// CONFIGURACIÓN DE BASE DE DATOS (MYSQL / MSSQL)
// ============================================

require('dotenv').config();
const mysql = require('mysql2/promise');
const mssql = require('mssql');

const DB_TYPE = process.env.DB_TYPE || 'mysql';

// --- CONFIGURACIÓN MYSQL ---
const mysqlConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z'
};

// --- CONFIGURACIÓN MSSQL (SQL SERVER) ---
const mssqlConfig = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_HOST,
    database: process.env.MSSQL_DATABASE,
    port: parseInt(process.env.MSSQL_PORT) || 1433,
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let mysqlPool = null;
let mssqlPool = null;

// Inicializar pools según el tipo
if (DB_TYPE === 'mysql') {
    mysqlPool = mysql.createPool(mysqlConfig);
} else if (DB_TYPE === 'mssql') {
    mssqlPool = new mssql.ConnectionPool(mssqlConfig);
}

/**
 * Obtener pool de MSSQL conectado
 */
async function getMssqlPool() {
    if (!mssqlPool.connected && !mssqlPool.connecting) {
        await mssqlPool.connect();
    }
    return mssqlPool;
}

/**
 * Método universal para ejecutar consultas SQL
 * @param {string} sqlQuery - La consulta SQL
 * @param {Array} params - Los parámetros
 */
async function query(sqlQuery, params = []) {
    try {
        if (DB_TYPE === 'mysql') {
            const [result, fields] = await mysqlPool.execute(sqlQuery, params);
            
            // Normalizar INSERT para MySQL
            const isInsert = /^\s*INSERT\s+INTO/i.test(sqlQuery);
            if (isInsert && result.insertId !== undefined) {
                return [{
                    insertId: result.insertId,
                    affectedRows: result.affectedRows
                }, fields];
            }
            return [result, fields];

        } else if (DB_TYPE === 'mssql') {
            const pool = await getMssqlPool();
            const request = pool.request();
            
            // Reemplazar ? por @p0, @p1, etc para SQL Server
            let queryText = sqlQuery;
            params.forEach((val, i) => {
                request.input(`p${i}`, val);
                queryText = queryText.replace('?', `@p${i}`);
            });

            const result = await request.query(queryText);
            
            // Normalizar para que devuelva [rows, fields]
            // SQL Server recordset es el array de filas
            const rows = result.recordset || [];
            
            // Manejar metadatos si es necesario (fields)
            const fields = result.recordset ? Object.keys(result.recordset.columns || {}) : [];

            // Normalizar INSERT para MSSQL (si la consulta usa SCOPE_IDENTITY() o similar)
            // Nota: Se asume que el backend podría necesitar ajustes si depende de insertId
            // Para simplicidad, devolvemos el resultado de la consulta.
            if (result.rowsAffected && result.rowsAffected.length > 0) {
                // Si la consulta fue un INSERT y devolvió algo (vía OUTPUT o SELECT SCOPE_IDENTITY)
                if (rows.length > 0 && (rows[0].id || rows[0].insertId)) {
                   return [{
                       insertId: rows[0].id || rows[0].insertId,
                       affectedRows: result.rowsAffected[0]
                   }, fields];
                }
                return [{ affectedRows: result.rowsAffected[0] }, fields];
            }

            return [rows, fields];
        }
    } catch (error) {
        console.error(`❌ Error SQL (${DB_TYPE}):`, error.message);
        console.error('Query:', sqlQuery);
        throw error;
    }
}

// Exportar interfaz
module.exports = {
    query,
    execute: query,
    pool: DB_TYPE === 'mysql' ? mysqlPool : mssqlPool,
    getConnection: async () => {
        if (DB_TYPE === 'mysql') {
            const connection = await mysqlPool.getConnection();
            return {
                query: (q, p) => connection.execute(q, p),
                execute: (q, p) => connection.execute(q, p),
                release: () => connection.release(),
                beginTransaction: () => connection.beginTransaction(),
                commit: () => connection.commit(),
                rollback: () => connection.rollback()
            };
        } else {
            const pool = await getMssqlPool();
            const transaction = new mssql.Transaction(pool);
            return {
                query: async (q, p) => {
                    const request = new mssql.Request(transaction);
                    let qText = q;
                    p.forEach((v, i) => {
                        request.input(`p${i}`, v);
                        qText = qText.replace('?', `@p${i}`);
                    });
                    const res = await request.query(qText);
                    return [res.recordset, []];
                },
                execute: async (q, p) => {
                    const request = new mssql.Request(transaction);
                    let qText = q;
                    p.forEach((v, i) => {
                        request.input(`p${i}`, v);
                        qText = qText.replace('?', `@p${i}`);
                    });
                    const res = await request.query(qText);
                    return [res.recordset, []];
                },
                release: () => {}, // No aplica directo en mssql trans
                beginTransaction: () => transaction.begin(),
                commit: () => transaction.commit(),
                rollback: () => transaction.rollback()
            };
        }
    }
};
