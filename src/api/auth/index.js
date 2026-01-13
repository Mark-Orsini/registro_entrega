// ============================================
// MÓDULO DE AUTENTICACIÓN
// ============================================
// Maneja login, registro, y recuperación de contraseña

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { verificarToken } = require('../../middleware/auth');
const { validarRUT, validarEmail } = require('../../utils/validators');
const rateLimit = require('express-rate-limit');

// Limiter estricto para Login/Register (evita fuerza bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos por IP
    message: { success: false, message: 'Demasiados intentos fallidos, espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// POST /api/auth/login
// ============================================
// Permite a un usuario iniciar sesión

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que se enviaron los datos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario en la base de datos
        const [usuarios] = await db.query(
            `SELECT u.*, r.nombre as rol 
             FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.email = ?`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = usuarios[0];

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rut: usuario.rut
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar login'
        });
    }
});

// ============================================
// POST /api/auth/register
// ============================================
// Registra un nuevo usuario

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { nombre, apellido, rut, email, password } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !rut || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar RUT
        if (!validarRUT(rut)) {
            return res.status(400).json({
                success: false,
                message: 'RUT inválido'
            });
        }

        // Validar email
        if (!validarEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe
        const [usuariosExistentes] = await db.query(
            'SELECT id FROM usuarios WHERE email = ? OR rut = ?',
            [email, rut]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email o RUT ya están registrados'
            });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario (por defecto rol 'cliente')
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombre, apellido, rut, email, password, rol_id) VALUES (?, ?, ?, ?, ?, (SELECT id FROM roles WHERE nombre = "cliente"))',
            [nombre, apellido, rut, email, passwordHash]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: resultado.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
});

// ============================================
// POST /api/auth/forgot-password
// ============================================
// Inicia el proceso de recuperación de contraseña

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Verificar que el usuario existe
        const [usuarios] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            // Por seguridad, responder como si existiera
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás un código de verificación'
            });
        }

        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Guardar código en la base de datos
        // Verificar si ya existe un código para este usuario
        const [codigosExistentes] = await db.query(
            'SELECT id FROM codigos_recuperacion WHERE usuario_id = ?',
            [usuarios[0].id]
        );

        if (codigosExistentes.length > 0) {
            // Actualizar
            await db.query(
                'UPDATE codigos_recuperacion SET codigo = ?, expira_en = ? WHERE usuario_id = ?',
                [codigo, expiracion, usuarios[0].id]
            );
        } else {
            // Insertar
            await db.query(
                'INSERT INTO codigos_recuperacion (usuario_id, codigo, expira_en) VALUES (?, ?, ?)',
                [usuarios[0].id, codigo, expiracion]
            );
        }

        // TODO: Enviar código por email
        // Por ahora, se devuelve en la respuesta (solo para desarrollo)
        console.log(`Código de recuperación para ${email}: ${codigo}`);

        res.json({
            success: true,
            message: 'Código enviado al email',
            // SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
            codigo: process.env.NODE_ENV === 'development' ? codigo : undefined
        });

    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar solicitud'
        });
    }
});

/**
 * Helper para verificar el código de recuperación
 * @param {string} email 
 * @param {string} code 
 * @returns {Promise<Object|null>} - El código si es válido, null de lo contrario
 */
async function getValidRecoveryCode(email, code) {
    const [codigos] = await db.query(
        `SELECT cr.*, u.id as usuario_id FROM codigos_recuperacion cr
         JOIN usuarios u ON cr.usuario_id = u.id
         WHERE u.email = ? AND cr.codigo = ? AND cr.expira_en > NOW()`,
        [email, code]
    );
    return codigos.length > 0 ? codigos[0] : null;
}

router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }

        const codigoValido = await getValidRecoveryCode(email, code);

        if (!codigoValido) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }

        res.json({
            success: true,
            message: 'Código verificado correctamente'
        });

    } catch (error) {
        console.error('Error en verify-code:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar código'
        });
    }
});

// ============================================
// POST /api/auth/reset-password
// ============================================
// Cambia la contraseña después de verificar el código

router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar código nuevamente
        const codigoValido = await getValidRecoveryCode(email, code);

        if (!codigoValido) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }

        // Hash de la nueva contraseña
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await db.query(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [passwordHash, codigoValido.usuario_id]
        );

        // Eliminar código usado
        await db.query(
            'DELETE FROM codigos_recuperacion WHERE usuario_id = ?',
            [codigoValido.usuario_id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña'
        });
    }
});

// ============================================
// GET /api/auth/profile
// ============================================
// Obtiene el perfil del usuario autenticado

router.get('/profile', verificarToken, async (req, res) => {
    try {
        const [usuarios] = await db.query(
            `SELECT u.id, u.nombre, u.apellido, u.rut, u.email, u.telefono, u.cargo, u.avatar_url, u.bio, u.creado_at as fecha_registro, r.nombre as rol 
             FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.id = ?`,
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: usuarios[0]
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil'
        });
    }
});

// ============================================
// PUT /api/auth/profile
// ============================================
// Actualiza el perfil del usuario autenticado

router.put('/profile', verificarToken, async (req, res) => {
    try {
        const { nombre, apellido, telefono, cargo, bio, avatar_url } = req.body;

        await db.query(
            `UPDATE usuarios SET 
            nombre = COALESCE(?, nombre),
            apellido = COALESCE(?, apellido),
            telefono = COALESCE(?, telefono),
            cargo = COALESCE(?, cargo),
            bio = COALESCE(?, bio),
            avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?`,
            [nombre, apellido, telefono, cargo, bio, avatar_url, req.usuario.id]
        );

        // Obtener usuario actualizado
        const [usuarios] = await db.query(
            `SELECT u.*, r.nombre as rol 
             FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.id = ?`,
            [req.usuario.id]
        );

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: usuarios[0]
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil'
        });
    }
});

module.exports = router;
