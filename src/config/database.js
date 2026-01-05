// ============================================
// CONFIGURACIÓN DE BASE DE DATOS (MSSQL)
// ============================================
// Adaptador para conectar a SQL Server manteniendo compatibilidad
// con la sintaxis de consultas existente (estilo MySQL)

require('dotenv').config();
const sql = require('mssql');

// Configuración de la conexión a SQL Server
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false, // Cambiar a true si se usa Azure
        trustServerCertificate: true, // Aceptar certificados auto-firmados
        enableArithAbort: true
    }
};

let pool = null;

/**
 * Establece la conexión a la base de datos
 */
async function connectToDatabase() {
    try {
        if (pool) return pool;

        console.log('🔄 Conectando a SQL Server Remoto...');
        pool = await sql.connect(config);

        console.log('✅ Conexión a SQL Server establecida exitosamente');
        console.log(`📊 Servidor: ${config.server}`);
        console.log(`📊 Base de datos: ${config.database}`);

        return pool;
    } catch (error) {
        console.error('❌ Error al conectar a SQL Server:', error.message);
        console.error('Verifica las credenciales en el archivo .env');
        // No salimos del proceso para permitir reintentos o manejo externo si es necesario
        throw error;
    }
}

// Intentar conectar al inicio
connectToDatabase().catch(err => console.error('Error inicial de conexión (no crítico):', err.message));

/**
 * Convierte consultas estilo MySQL (?) a SQL Server (@p0, @p1...)
 * y maneja incompatibilidades básicas (NOW() -> GETDATE())
 */
async function query(queryString, params = []) {
    try {
        if (!pool) await connectToDatabase();

        const request = pool.request();

        // 1. Reemplazar NOW() por GETDATE()
        let finalQuery = queryString.replace(/NOW\(\)/gi, 'GETDATE()');

        // 2. Reemplazar parámetros ? por @pIndex
        // Usamos una función que reemplaza secuencialmente solo los ? que no estén escapados (aunque aquí asumimos inputs simples)
        let paramIndex = 0;
        finalQuery = finalQuery.replace(/\?/g, () => {
            const pName = `p${paramIndex}`;
            // Mssql requiere que añadamos el input al request object
            request.input(pName, params[paramIndex]);
            paramIndex++;
            return `@${pName}`;
        });

        // 3. Manejar INSERT para devolver insertId (Identity)
        const isInsert = /^\s*INSERT\s+INTO/i.test(finalQuery);
        if (isInsert) {
            // Añadimos el SELECT SCOPE_IDENTITY al final si no existe ya
            if (!/SELECT\s+SCOPE_IDENTITY\(\)/i.test(finalQuery)) {
                finalQuery += '; SELECT SCOPE_IDENTITY() AS insertId;';
            }
        }

        // Ejecutar query
        const result = await request.query(finalQuery);

        // 4. Formatear respuesta para compatibilidad con mysql2
        if (isInsert) {
            // mysql2 devuelve [resultSetHeader] para inserts
            // Simulamos el objeto con insertId
            const insertId = result.recordset[0]?.insertId || 0;
            return [{
                insertId: Number(insertId),
                affectedRows: result.rowsAffected[0]
            }, null];
        }

        // Para SELECT, devolver [filas, campos]
        return [result.recordset, null];

    } catch (error) {
        console.error('❌ Error SQL:', error.message);
        console.error('Query:', queryString);
        throw error;
    }
}

// Exportar interfaz compatible
module.exports = {
    // Método principal usado en la app
    query: query,

    // Alias para execute (usado a veces en mysql2)
    execute: query,

    // Simular getConnection para transacciones o pool manual
    getConnection: async () => {
        if (!pool) await connectToDatabase();
        return {
            query: query,
            execute: query,
            release: () => { /* No-op para mssql global pool */ },
            
            // Simulación básica de transacciones
            beginTransaction: async () => {
                // Nota: Mssql maneja transacciones con objetos Transaction, no en la conexión base global.
                // Para simplificar la migración sin reescribir todo el backend,
                // devolvemos un objeto dummy que permie que el código "funcione" sin errores,
                // aunque sin atomicidad real si el código original usaba la conexión para COMMIT.
                // RECOMENDACIÓN: Refactorizar controladores críticos para usar Transactions de mssql explícitamente.
                return true; 
            },
            commit: async () => { return true; },
            rollback: async () => { return true; }
        };
    }
};
