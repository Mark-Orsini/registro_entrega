// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// Verifica que el usuario tenga un token JWT válido

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 * Protege rutas que requieren autenticación
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
function verificarToken(req, res, next) {
    // Obtener token del header Authorization
    // Formato esperado: "Bearer TOKEN_AQUI"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Obtener solo el token

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token no proporcionado.'
        });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Agregar información del usuario al request
        // Esto estará disponible en todas las rutas protegidas
        req.usuario = decoded;

        // Continuar al siguiente middleware o ruta
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Por favor, inicia sesión nuevamente.'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Token inválido'
        });
    }
}

/**
 * Middleware opcional para verificar token
 * No bloquea la petición si no hay token
 */
function verificarTokenOpcional(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.usuario = decoded;
        } catch (error) {
            // Token inválido, pero no bloqueamos la petición
            req.usuario = null;
        }
    }

    next();
}

module.exports = {
    verificarToken,
    verificarTokenOpcional
};
