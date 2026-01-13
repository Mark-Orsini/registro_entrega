// ============================================
// “TORRE DE CONTROL” DE LA API
// ============================================
// Aquí llegan todas las peticiones y se derivan a su archivo correspondiente.
// Ejemplo: si piden algo de usuarios, lo manda a auth.js

const express = require('express');
const router = express.Router();

// ============================================
// IMPORTAR MÓDULOS DE LA API
// ============================================

const authAPI = require('./auth');
const deliveriesAPI = require('./deliveries');

// ============================================
// CONEXIÓN DE RUTAS
// ============================================

// Rutas de autenticación
// /api/auth/login
// /api/auth/register
// /api/auth/forgot-password
// /api/auth/verify-code
// /api/auth/reset-password
router.use('/auth', authAPI);

// Rutas de entregas
// /api/deliveries (GET, POST)
// /api/deliveries/:id (GET, PUT, DELETE)
// /api/deliveries/:id (GET, PUT, DELETE)
router.use('/deliveries', deliveriesAPI);

// Rutas de comunas
// /api/comunas
router.use('/comunas', require('./comunas'));

// ============================================
// CHEQUEO DE ESTADO (Health Check)
// Para ver si la API está viva y respondiendo.
// ============================================

router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ============================================
// ÍNDICE DE LA API
// Si entras a /api te muestra todo lo que puedes hacer.
// ============================================

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de Registro de Entregas',
        version: '1.0.0',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                forgotPassword: 'POST /api/auth/forgot-password',
                verifyCode: 'POST /api/auth/verify-code',
                resetPassword: 'POST /api/auth/reset-password'
            },
            deliveries: {
                getAll: 'GET /api/deliveries',
                getById: 'GET /api/deliveries/:id',
                create: 'POST /api/deliveries',
                update: 'PUT /api/deliveries/:id',
                delete: 'DELETE /api/deliveries/:id'
            }
        }
    });
});

module.exports = router;
