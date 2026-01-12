// ============================================
// MÓDULO DE ENTREGAS (DELIVERIES)
// ============================================
// CRUD completo para gestión de entregas

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { verificarToken } = require('../../middleware/auth');
const mysql = require('mysql2/promise');
const mssql = require('mssql');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Aplicar middleware a todas las rutas de entregas
router.use(verificarToken);

/**
 * Helper para construir la consulta base de entregas con filtros
 * @param {Object} filters - Filtros provenientes de req.query
 * @returns {Object} - { query, params }
 */
function buildDeliveriesQuery(filters) {
    const {
        region_id,
        comuna_id,
        estado,
        busqueda,
        orden,
        fecha_desde,
        fecha_hasta
    } = filters;

    let sql = `
        SELECT e.*, c.nombre as comuna_nombre, r.nombre as region_nombre 
        FROM entregas e
        JOIN comunas c ON e.comuna_id = c.id
        JOIN regiones r ON c.region_id = r.id
        WHERE e.borrado_at IS NULL
    `;
    const params = [];

    if (region_id) {
        sql += ' AND r.id = ?';
        params.push(region_id);
    }

    if (comuna_id) {
        sql += ' AND e.comuna_id = ?';
        params.push(comuna_id);
    }

    if (estado) {
        sql += ' AND e.estado = ?';
        params.push(estado);
    }

    if (busqueda) {
        sql += ' AND (e.nombre_destinatario LIKE ? OR e.apellido_destinatario LIKE ? OR e.producto LIKE ?)';
        params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    if (fecha_desde) {
        sql += ' AND CAST(e.creado_at AS DATE) >= ?';
        params.push(fecha_desde);
    }

    if (fecha_hasta) {
        sql += ' AND CAST(e.creado_at AS DATE) <= ?';
        params.push(fecha_hasta);
    }

    let orderBy = ' ORDER BY ';
    switch (orden) {
        case 'A-Z':
            orderBy += 'e.apellido_destinatario ASC, e.nombre_destinatario ASC';
            break;
        case 'antigua':
            orderBy += 'e.creado_at ASC';
            break;
        case 'reciente':
        default:
            orderBy += 'e.creado_at DESC';
            break;
    }
    sql += orderBy;

    return { sql, params };
}

// ============================================
// GET /api/deliveries
// ============================================
// Obtiene todas las entregas con filtros opcionales

router.get('/', async (req, res) => {
    try {
        const { sql, params } = buildDeliveriesQuery(req.query);
        const [entregas] = await db.query(sql, params);

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
// GET /api/deliveries/export/pdf
// ============================================
// Exporta las entregas a PDF

router.get('/export/pdf', async (req, res) => {
    try {
        const { sql, params } = buildDeliveriesQuery(req.query);
        const [entregas] = await db.query(sql, params);

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=entregas.pdf');

        doc.pipe(res);

        // Encabezado
        doc.fontSize(20).text('Reporte de Entregas', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Tabla
        const tableTop = 150;
        let y = tableTop;

        doc.font('Helvetica-Bold');
        doc.text('ID', 30, y);
        doc.text('Destinatario', 70, y);
        doc.text('Dirección', 200, y);
        doc.text('Producto', 350, y);
        doc.text('Estado', 480, y);

        doc.moveDown();
        doc.moveTo(30, y + 15).lineTo(570, y + 15).stroke();

        y += 20;
        doc.font('Helvetica');

        entregas.forEach(entrega => {
            if (y > 750) {
                doc.addPage();
                y = 50;
            }

            doc.text(entrega.id.toString(), 30, y);
            doc.text(`${entrega.nombre_destinatario} ${entrega.apellido_destinatario}`, 70, y, { width: 120, ellipsis: true });
            doc.text(`${entrega.direccion}, ${entrega.comuna_nombre}`, 200, y, { width: 140, ellipsis: true });
            doc.text(entrega.producto || '-', 350, y, { width: 120, ellipsis: true });
            doc.text(entrega.estado, 480, y);

            y += 20;
        });

        doc.end();

    } catch (error) {
        console.error('Error exportando PDF:', error);
        res.status(500).json({ success: false, message: 'Error al exportar PDF' });
    }
});

// ============================================
// GET /api/deliveries/export/excel
// ============================================
// Exporta las entregas a Excel

router.get('/export/excel', async (req, res) => {
    try {
        const { sql, params } = buildDeliveriesQuery(req.query);
        const [entregas] = await db.query(sql, params);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Entregas');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre Destinatario', key: 'nombre_destinatario', width: 20 },
            { header: 'Apellido Destinatario', key: 'apellido_destinatario', width: 20 },
            { header: 'RUT', key: 'rut_destinatario', width: 15 },
            { header: 'Dirección', key: 'direccion', width: 30 },
            { header: 'Comuna', key: 'comuna_nombre', width: 20 },
            { header: 'Región', key: 'region_nombre', width: 20 },
            { header: 'Teléfono', key: 'telefono_destinatario', width: 15 },
            { header: 'Email', key: 'email_destinatario', width: 25 },
            { header: 'Producto', key: 'producto', width: 25 },
            { header: 'Peso (Kg)', key: 'peso_kg', width: 10 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Fecha Creación', key: 'creado_at', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };

        entregas.forEach(entrega => {
            worksheet.addRow(entrega);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=entregas.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exportando Excel:', error);
        res.status(500).json({ success: false, message: 'Error al exportar Excel' });
    }
});

// ============================================
// GET /api/deliveries/:id
// ============================================
// Obtiene una entrega específica por ID

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [entregas] = await db.query(
            `SELECT e.*, c.nombre as comuna_nombre, r.nombre as region_nombre 
             FROM entregas e
             JOIN comunas c ON e.comuna_id = c.id
             JOIN regiones r ON c.region_id = r.id
             WHERE e.id = ? AND e.borrado_at IS NULL`,
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

/**
 * Genera un código de seguimiento único
 * @returns {string} - Código con formato TRK-XXXXXXXX
 */
function generarCodigoSeguimiento() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `TRK-${timestamp}${random}`;
}

// ============================================
// POST /api/deliveries
// ============================================
// Crea una nueva entrega

router.post('/', async (req, res) => {
    try {
        const {
            nombre_destinatario,
            apellido_destinatario,
            rut_destinatario,
            direccion,
            comuna_id,
            telefono_destinatario,
            email_destinatario,
            producto,
            peso_kg,
            volumen_m3,
            observaciones,
            estado = 'pendiente'
        } = req.body;

        // Sanitizar valores opcionales para evitar undefined en la query
        const valores = {
            rut: rut_destinatario || null,
            telefono: telefono_destinatario || null,
            email: email_destinatario || null,
            producto: producto || null,
            peso: peso_kg || null,
            volumen: volumen_m3 || null,
            obs: observaciones || null
        };

        if (!nombre_destinatario || !apellido_destinatario || !direccion || !comuna_id) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, apellido, dirección y comuna son requeridos'
            });
        }

        const codigo_seguimiento = generarCodigoSeguimiento();

        const [resultado] = await db.query(
            `INSERT INTO entregas 
            (codigo_seguimiento, nombre_destinatario, apellido_destinatario, rut_destinatario, direccion, comuna_id, telefono_destinatario, email_destinatario, producto, peso_kg, volumen_m3, observaciones, estado, creado_por) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo_seguimiento, nombre_destinatario, apellido_destinatario, valores.rut, direccion, comuna_id, valores.telefono, valores.email, valores.producto, valores.peso, valores.volumen, valores.obs, estado, req.usuario.id]
        );

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

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre_destinatario,
            apellido_destinatario,
            rut_destinatario,
            direccion,
            comuna_id,
            telefono_destinatario,
            email_destinatario,
            producto,
            peso_kg,
            volumen_m3,
            observaciones,
            estado
        } = req.body;

        // Helper para convertir undefined a null
        const s = (val) => val === undefined ? null : val;

        const [entregaExistente] = await db.query(
            'SELECT id FROM entregas WHERE id = ? AND borrado_at IS NULL',
            [id]
        );

        if (entregaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entrega no encontrada'
            });
        }

        await db.query(
            `UPDATE entregas SET 
            nombre_destinatario = COALESCE(?, nombre_destinatario),
            apellido_destinatario = COALESCE(?, apellido_destinatario),
            rut_destinatario = COALESCE(?, rut_destinatario),
            direccion = COALESCE(?, direccion),
            comuna_id = COALESCE(?, comuna_id),
            telefono_destinatario = COALESCE(?, telefono_destinatario),
            email_destinatario = COALESCE(?, email_destinatario),
            producto = COALESCE(?, producto),
            peso_kg = COALESCE(?, peso_kg),
            volumen_m3 = COALESCE(?, volumen_m3),
            observaciones = COALESCE(?, observaciones),
            estado = COALESCE(?, estado),
            actualizado_por = ?,
            actualizado_at = NOW()
            WHERE id = ?`,
            [s(nombre_destinatario), s(apellido_destinatario), s(rut_destinatario), s(direccion), s(comuna_id), s(telefono_destinatario), s(email_destinatario), s(producto), s(peso_kg), s(volumen_m3), s(observaciones), s(estado), req.usuario.id, id]
        );

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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [entregaExistente] = await db.query(
            'SELECT id FROM entregas WHERE id = ? AND borrado_at IS NULL',
            [id]
        );

        if (entregaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entrega no encontrada'
            });
        }

        // Soft Delete
        await db.query(
            'UPDATE entregas SET borrado_at = NOW(), actualizado_por = ? WHERE id = ?',
            [req.usuario.id, id]
        );

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
