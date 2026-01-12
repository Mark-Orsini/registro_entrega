const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// GET /api/comunas
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT c.id, c.nombre, r.nombre as region_nombre 
            FROM comunas c
            JOIN regiones r ON c.region_id = r.id
            ORDER BY c.nombre ASC
        `;

        const [comunas] = await db.query(sql);

        res.json({
            success: true,
            data: comunas
        });

    } catch (error) {
        console.error('Error al obtener comunas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener listado de comunas'
        });
    }
});

module.exports = router;
