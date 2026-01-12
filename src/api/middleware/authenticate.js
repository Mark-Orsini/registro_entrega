const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token no proporcionado.'
        });
    }

    try {
        // 2. Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');

        // 3. Adjuntar usuario al request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }
};

module.exports = authMiddleware;
