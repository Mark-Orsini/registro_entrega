// ============================================
// SERVIDOR PRINCIPAL - Registro de Entregas
// ============================================

// Cargar variables de entorno desde .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const readline = require('readline-sync');
const mysql = require('mysql2/promise');
const mssql = require('mssql');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Función: checkAvailability
 * Prueba si podemos conectarnos a MySQL y SQL Server.
 * Retorna un reporte de cuál funciona y cuál no.
 */
async function checkAvailability() {
    const results = {
        mysql: { available: false, error: null },
        mssql: { available: false, error: null }
    };

    // Probar MySQL
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 3306,
            connectTimeout: 3000
        });
        await connection.end();
        results.mysql.available = true;
    } catch (e) {
        results.mysql.available = false;
        results.mysql.error = e.message;
    }

    // Probar MSSQL
    try {
        const pool = await mssql.connect({
            user: process.env.MSSQL_USER,
            password: process.env.MSSQL_PASSWORD,
            server: process.env.MSSQL_HOST,
            database: process.env.MSSQL_DATABASE,
            port: parseInt(process.env.MSSQL_PORT) || 1433,
            options: {
                encrypt: process.env.MSSQL_ENCRYPT === 'true',
                trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
            },
            connectionTimeout: 3000
        });
        await pool.close();
        results.mssql.available = true;
    } catch (e) {
        results.mssql.available = false;
        results.mssql.error = e.message;
    }

    return results;
}

/**
 * Función Principal (startServer)
 * 1. Revisa las bases de datos.
 * 2. Te pregunta cuál quieres usar.
 * 3. Enciende el servidor en el puerto 3000.
 */
async function startServer() {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║       SELECCIÓN DE BASE DE DATOS       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('Verificando disponibilidad...');

    const availability = await checkAvailability();

    const mysqlStatus = availability.mysql.available ? '\x1b[32m(disponible)\x1b[0m' : '\x1b[31m(no disponible)\x1b[0m';
    const mssqlStatus = availability.mssql.available ? '\x1b[32m(disponible)\x1b[0m' : '\x1b[31m(no disponible)\x1b[0m';

    console.log(`1. MySQL ${mysqlStatus}`);
    console.log(`2. SQL Server (Remote) ${mssqlStatus}`);
    console.log('0. Salir');
    console.log('');

    const choice = readline.question('Elige una opcion: ');

    if (choice === '1') {
        process.env.DB_TYPE = 'mysql';
        console.log('\x1b[34mUsando MySQL local...\x1b[0m');
    } else if (choice === '2') {
        process.env.DB_TYPE = 'mssql';
        console.log('\x1b[34mUsando SQL Server remoto...\x1b[0m');
    } else if (choice === '0') {
        process.exit(0);
    } else {
        console.log('\x1b[31mOpción inválida. Usando selección por defecto (.env).\x1b[0m');
    }

    // Inicializar la aplicación Express después de la selección
    const app = express();
    const PORT = process.env.PORT || 3000;

    // ============================================
    // CONFIGURACIÓN (Middleware)
    // Cosas necesarias para que el server entienda JSON y acepte peticiones
    // ============================================
    // ============================================
    // SEGURIDAD & MIDDLEWARE
    // ============================================

    // 1. Helmet: Protege headers HTTP
    app.use(helmet());

    // 2. Rate Limiting Global: Evita ataques DDoS básicos
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // Límite de 100 peticiones por IP
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Demasiadas peticiones, intenta más tarde.' }
    });
    app.use(limiter);

    app.use(cors());
    app.use(express.json({ limit: '10kb' })); // Limitar tamaño de body para evitar sobrecarga
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });

    // ============================================
    // CARPETA PÚBLICA (Frontend)
    // Aquí le decimos que muestre los archivos de la carpeta 'public'
    // ============================================
    app.use(express.static(path.join(__dirname, 'public')));

    // ============================================
    // RUTAS (Los caminos de la API)
    // Todo lo que empiece con /api se va al manejador de rutas principal
    // ============================================
    // Nota: El router de la API debe requerirse DESPUÉS de establecer process.env.DB_TYPE
    const apiRouter = require('./src/api');
    app.use('/api', apiRouter);

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // ============================================
    // ERRORES (Si algo sale mal)
    // ============================================
    app.use((req, res) => {
        res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    });

    app.use((error, req, res, next) => {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    });

    // ============================================
    // ENCENDER EL SERVIDOR
    // ============================================
    app.listen(PORT, () => {
        console.log('╔════════════════════════════════════════╗');
        console.log('║    Servidor Iniciado Exitosamente      ║');
        console.log('╠════════════════════════════════════════╣');
        console.log(`║    Puerto: ${PORT}                        ║`);
        console.log(`║    Base de Datos: ${process.env.DB_TYPE.toUpperCase()}                ║`);
        console.log(`║    URL: http://localhost:${PORT}          ║`);
        console.log('╚════════════════════════════════════════╝');
        console.log('');
        console.log('Presiona Ctrl+C para detener el servidor');
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => { process.exit(0); });
    process.on('SIGINT', () => { process.exit(0); });
}

// Ejecutar inicio del servidor
startServer();
