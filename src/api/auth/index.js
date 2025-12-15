// ============================================
// MÓDULO DE AUTENTICACIÓN
// ============================================
// Maneja login, registro, y recuperación de contraseña

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { validarRUT, validarEmail } = require('../../utils/validators');

// ============================================
// POST /api/auth/login
// ============================================
// Permite a un usuario iniciar sesión

router.post('/login', async (req, res) => {
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
            'SELECT * FROM usuarios WHERE email = ?',
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

router.post('/register', async (req, res) => {
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

        // Insertar nuevo usuario
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombre, apellido, rut, email, password) VALUES (?, ?, ?, ?, ?)',
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
        await db.query(
            'INSERT INTO codigos_recuperacion (usuario_id, codigo, expira_en) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE codigo = ?, expira_en = ?',
            [usuarios[0].id, codigo, expiracion, codigo, expiracion]
        );

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

// ============================================
// POST /api/auth/verify-code
// ============================================
// Verifica el código de recuperación

router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }

        // Buscar código válido
        const [codigos] = await db.query(
            `SELECT cr.* FROM codigos_recuperacion cr
             JOIN usuarios u ON cr.usuario_id = u.id
             WHERE u.email = ? AND cr.codigo = ? AND cr.expira_en > NOW()`,
            [email, code]
        );

        if (codigos.length === 0) {
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
        const [codigos] = await db.query(
            `SELECT cr.*, u.id as usuario_id FROM codigos_recuperacion cr
             JOIN usuarios u ON cr.usuario_id = u.id
             WHERE u.email = ? AND cr.codigo = ? AND cr.expira_en > NOW()`,
            [email, code]
        );

        if (codigos.length === 0) {
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
            [passwordHash, codigos[0].usuario_id]
        );

        // Eliminar código usado
        await db.query(
            'DELETE FROM codigos_recuperacion WHERE usuario_id = ?',
            [codigos[0].usuario_id]
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

module.exports = router;
