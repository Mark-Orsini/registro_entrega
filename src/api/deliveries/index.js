// ============================================
// MÓDULO DE ENTREGAS (DELIVERIES)
// ============================================
// CRUD completo para gestión de entregas

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { verificarToken } = require('../../middleware/auth');

// ============================================
// GET /api/deliveries
// ============================================
// Obtiene todas las entregas con filtros opcionales

router.get('/', verificarToken, async (req, res) => {
    try {
        const { region, comuna, estado, cliente, fecha_desde, fecha_hasta } = req.query;

        let query = 'SELECT * FROM entregas WHERE 1=1';
        const params = [];

        // Aplicar filtros si existen
        if (region) {
            query += ' AND region = ?';
            params.push(region);
        }

        if (comuna) {
            query += ' AND comuna = ?';
            params.push(comuna);
        }

        if (estado) {
            query += ' AND estado = ?';
            params.push(estado);
        }

        if (cliente) {
            query += ' AND cliente LIKE ?';
            params.push(`%${cliente}%`);
        }

        if (fecha_desde) {
            query += ' AND DATE(fecha_creacion) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(fecha_creacion) <= ?';
            params.push(fecha_hasta);
        }

        // Ordenar por fecha más reciente
        query += ' ORDER BY fecha_creacion DESC';

        const [entregas] = await db.query(query, params);

        res.json({
            success: true,
            count: entregas.length,
            data: entregas
        });

    } catch (error) {
        console.error('Error al obtener entregas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener entregas'
        });
    }
});

// ============================================
// GET /api/deliveries/:id
// ============================================
// Obtiene una entrega específica por ID

router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [entregas] = await db.query(
            'SELECT * FROM entregas WHERE id = ?',
            [id]
        );

        if (entregas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entrega no encontrada'
            });
        }

        res.json({
            success: true,
            data: entregas[0]
        });

    } catch (error) {
        console.error('Error al obtener entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener entrega'
        });
    }
});

// ============================================
// POST /api/deliveries
// ============================================
// Crea una nueva entrega

router.post('/', verificarToken, async (req, res) => {
    try {
        const {
            cliente,
            direccion,
            comuna,
            region,
            telefono,
            email,
            producto,
            observaciones,
            estado = 'proceso'
        } = req.body;

        // Validar campos requeridos
        if (!cliente || !direccion || !comuna || !region) {
            return res.status(400).json({
                success: false,
                message: 'Cliente, dirección, comuna y región son requeridos'
            });
        }

        // Insertar nueva entrega
        const [resultado] = await db.query(
            `INSERT INTO entregas 
            (cliente, direccion, comuna, region, telefono, email, producto, observaciones, estado, usuario_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [cliente, direccion, comuna, region, telefono, email, producto, observaciones, estado, req.usuario.id]
        );

        // Obtener la entrega creada
        const [nuevaEntrega] = await db.query(
            'SELECT * FROM entregas WHERE id = ?',
            [resultado.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Entrega creada exitosamente',
            data: nuevaEntrega[0]
        });

    } catch (error) {
        console.error('Error al crear entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear entrega'
        });
    }
});

// ============================================
// PUT /api/deliveries/:id
// ============================================
// Actualiza una entrega existente

router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            cliente,
            direccion,
            comuna,
            region,
            telefono,
            email,
            producto,
            observaciones,
            estado
        } = req.body;

        // Verificar que la entrega existe
        const [entregaExistente] = await db.query(
            'SELECT id FROM entregas WHERE id = ?',
            [id]
        );

        if (entregaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entrega no encontrada'
            });
        }

        // Actualizar entrega
        await db.query(
            `UPDATE entregas SET 
            cliente = COALESCE(?, cliente),
            direccion = COALESCE(?, direccion),
            comuna = COALESCE(?, comuna),
            region = COALESCE(?, region),
            telefono = COALESCE(?, telefono),
            email = COALESCE(?, email),
            producto = COALESCE(?, producto),
            observaciones = COALESCE(?, observaciones),
            estado = COALESCE(?, estado),
            fecha_actualizacion = NOW()
            WHERE id = ?`,
            [cliente, direccion, comuna, region, telefono, email, producto, observaciones, estado, id]
        );

        // Obtener la entrega actualizada
        const [entregaActualizada] = await db.query(
            'SELECT * FROM entregas WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Entrega actualizada exitosamente',
            data: entregaActualizada[0]
        });

    } catch (error) {
        console.error('Error al actualizar entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar entrega'
        });
    }
});

// ============================================
// DELETE /api/deliveries/:id
// ============================================
// Elimina una entrega

router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la entrega existe
        const [entregaExistente] = await db.query(
            'SELECT id FROM entregas WHERE id = ?',
            [id]
        );

        if (entregaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entrega no encontrada'
            });
        }

        // Eliminar entrega
        await db.query('DELETE FROM entregas WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Entrega eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar entrega'
        });
    }
});

module.exports = router;
