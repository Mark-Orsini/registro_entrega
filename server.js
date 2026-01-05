// ============================================
// SERVIDOR PRINCIPAL - Registro de Entregas
// ============================================

// Cargar variables de entorno desde .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Permite peticiones desde otros dominios
app.use(cors());

// Parser de JSON - Permite recibir datos en formato JSON
app.use(express.json());

// Parser de URL encoded - Para formularios
app.use(express.urlencoded({ extended: true }));

// Logger simple - Muestra todas las peticiones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS (FRONTEND)
// ============================================

// Sirve todos los archivos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// RUTAS DE LA API
// ============================================

// Importar el router central de la API
const apiRouter = require('./src/api');

// Montar todas las rutas de la API bajo '/api'
app.use('/api', apiRouter);

// ============================================
// RUTA PRINCIPAL
// ============================================

// Ruta raíz - sirve el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// MANEJO DE ERRORES 404
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// ============================================
// MANEJO DE ERRORES GENERALES
// ============================================

app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║    Servidor Iniciado Exitosamente      ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║    Puerto: ${PORT}                   ║`);
    console.log(`║    URL: http://localhost:${PORT}       ║`);
    console.log(`║    Frontend: /public                   ║`);
    console.log(`║    API: /api                           ║`);
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('Presiona Ctrl+C para detener el servidor');
    console.log('');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('');
    console.log('X Servidor detenido X');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('');
    console.log('X Servidor detenido X');
    process.exit(0);
});
