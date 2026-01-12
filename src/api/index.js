// ============================================
// ROUTER CENTRAL DE LA API
// ============================================
// Este archivo combina todos los módulos de la API
// y los organiza bajo sus respectivas rutas

const express = require('express');
const router = express.Router();

// ============================================
// IMPORTAR MÓDULOS DE LA API
// ============================================

const authAPI = require('./auth');
const deliveriesAPI = require('./deliveries');

// ============================================
// MONTAR RUTAS DE LOS MÓDULOS
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
// RUTA DE SALUD (Health Check)
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
// INFORMACIÓN DE LA API
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
