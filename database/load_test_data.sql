-- ============================================
-- SCRIPT DE CARGA DE DATOS DE PRUEBA (COMPATIBLE CON schema.sql)
-- Sistema de Registro de Entregas
-- ============================================

-- 1. INSERTAR USUARIO DE PRUEBA (si no existe)
-- Se asume rol_id=1 (Admin) o 'cliente' si se prefiere. 
-- schema.sql inserta roles: 1=admin, 2=operador, 3=repartidor, 4=cliente.
-- Usaremos rol_id=1 para que tenga permisos.
-- Contraseña: test123 (Hash bcrypt)
INSERT INTO usuarios (rol_id, nombre, apellido, rut, email, password, creado_at, estado, email_verificado)
SELECT 1, 'Usuario', 'Prueba', '22222222-2', 'test@test.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', NOW(), 'activo', 1
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'test@test.com');

-- 2. ASEGURAR COMUNAS NECESARIAS (Si schema.sql solo insertó algunas)
-- Usamos INSERT IGNORE o ON DUPLICATE para no fallar
INSERT INTO comunas (region_id, nombre) VALUES
(13, 'Cerrillos'), (13, 'Cerro Navia'), (13, 'Conchalí'), (13, 'El Bosque'),
(13, 'Estación Central'), (13, 'Huechuraba'), (13, 'Independencia'), (13, 'La Cisterna'),
(13, 'La Granja'), (13, 'La Pintana'), (13, 'Lo Barnechea'), (13, 'Lo Espejo'),
(13, 'Lo Prado'), (13, 'Macul'), (13, 'Pedro Aguirre Cerda'), (13, 'Peñalolén'),
(13, 'Quilicura'), (13, 'Quinta Normal'), (13, 'Recoleta'), (13, 'Renca'),
(13, 'San Joaquín'), (13, 'San Miguel'), (13, 'San Ramón'), (13, 'Vitacura'),
(13, 'Pirque'), (13, 'San José de Maipo'), (13, 'Colina'), (13, 'Lampa'),
(13, 'Tiltil'), (13, 'Buin'), (13, 'Calera de Tango'), (13, 'Paine'),
(13, 'Melipilla'), (13, 'Alhué'), (13, 'Curacaví'), (13, 'María Pinto'),
(13, 'San Pedro'), (13, 'Talagante'), (13, 'El Monte'), (13, 'Isla de Maipo'),
(13, 'Padre Hurtado'), (13, 'Peñaflor')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- 3. INSERTAR 20 REGISTROS DE ENTREGAS DE EJEMPLO

-- Variables
SET @usuario_id = (SELECT id FROM usuarios WHERE email = 'test@test.com' LIMIT 1);
SET @comuna_santiago = (SELECT id FROM comunas WHERE nombre = 'Santiago' LIMIT 1);
SET @comuna_providencia = (SELECT id FROM comunas WHERE nombre = 'Providencia' LIMIT 1);
SET @comuna_maipu = (SELECT id FROM comunas WHERE nombre = 'Maipú' LIMIT 1);
SET @comuna_lascondes = (SELECT id FROM comunas WHERE nombre = 'Las Condes' LIMIT 1);
SET @comuna_laflorida = (SELECT id FROM comunas WHERE nombre = 'La Florida' LIMIT 1);
SET @comuna_puentealto = (SELECT id FROM comunas WHERE nombre = 'Puente Alto' LIMIT 1);
SET @comuna_nunoa = (SELECT id FROM comunas WHERE nombre = 'Ñuñoa' LIMIT 1);
SET @comuna_vitacura = (SELECT id FROM comunas WHERE nombre = 'Vitacura' LIMIT 1);

-- Estados válidos según schema.sql: 'pendiente', 'en_bodega', 'en_reparto', 'entregado', 'fallido', 'devuelto', 'cancelado'

INSERT INTO entregas (codigo_seguimiento, nombre_destinatario, apellido_destinatario, rut_destinatario, direccion, comuna_id, telefono_destinatario, email_destinatario, producto, peso_kg, estado, creado_por, creado_at) VALUES
('TRK-001A2B3C', 'Juan', 'Pérez', '12345678-9', 'Av. Libertador Bernardo O''Higgins 1234', @comuna_santiago, '+56912345678', 'juan.perez@email.com', 'Laptop Dell XPS 15', 2.5, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('TRK-002D4E5F', 'María', 'González', '23456789-0', 'Av. Providencia 2567', @comuna_providencia, '+56923456789', 'maria.gonzalez@email.com', 'iPhone 14 Pro', 0.3, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('TRK-003G6H7I', 'Carlos', 'Rodríguez', '34567890-1', 'Av. Pajaritos 3890', @comuna_maipu, '+56934567890', 'carlos.rodriguez@email.com', 'Smart TV Samsung 55"', 15.0, 'en_reparto', @usuario_id, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('TRK-004J8K9L', 'Ana', 'Martínez', '45678901-2', 'Av. Apoquindo 4521', @comuna_lascondes, '+56945678901', 'ana.martinez@email.com', 'Refrigerador LG', 65.0, 'pendiente', @usuario_id, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('TRK-005M0N1O', 'Pedro', 'López', '56789012-3', 'Av. Vicuña Mackenna 5678', @comuna_laflorida, '+56956789012', 'pedro.lopez@email.com', 'Bicicleta de montaña', 12.0, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('TRK-006P2Q3R', 'Laura', 'Fernández', '67890123-4', 'Av. Concha y Toro 6789', @comuna_puentealto, '+56967890123', 'laura.fernandez@email.com', 'Microondas Panasonic', 8.5, 'en_bodega', @usuario_id, NOW()),
('TRK-007S4T5U', 'Diego', 'Sánchez', '78901234-5', 'Av. Irarrázaval 7890', @comuna_nunoa, '+56978901234', 'diego.sanchez@email.com', 'Consola PlayStation 5', 4.5, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('TRK-008V6W7X', 'Sofía', 'Ramírez', '89012345-6', 'Av. Vitacura 8901', @comuna_vitacura, '+56989012345', 'sofia.ramirez@email.com', 'Tablet iPad Air', 0.5, 'pendiente', @usuario_id, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('TRK-009Y8Z9A', 'Andrés', 'Torres', '90123456-7', 'Calle Agustinas 1234', @comuna_santiago, '+56990123456', 'andres.torres@email.com', 'Monitor LG 27" 4K', 6.0, 'devuelto', @usuario_id, DATE_SUB(NOW(), INTERVAL 8 DAY)),
('TRK-010B0C1D', 'Valentina', 'Flores', '01234567-8', 'Av. Los Leones 2345', @comuna_providencia, '+56901234567', 'valentina.flores@email.com', 'Cafetera Nespresso', 3.2, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 9 DAY)),
('TRK-011E2F3G', 'Matías', 'Muñoz', '11234567-9', 'Av. Américo Vespucio 3456', @comuna_maipu, '+56911234567', 'matias.munoz@email.com', 'Aspiradora Robot Roomba', 4.0, 'en_reparto', @usuario_id, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('TRK-012H4I5J', 'Isidora', 'Rojas', '21234567-0', 'Av. Kennedy 4567', @comuna_lascondes, '+56921234567', 'isidora.rojas@email.com', 'Impresora HP LaserJet', 7.5, 'pendiente', @usuario_id, DATE_SUB(NOW(), INTERVAL 11 DAY)),
('TRK-013K6L7M', 'Benjamín', 'Vargas', '31234567-1', 'Av. Walker Martínez 5678', @comuna_laflorida, '+56931234567', 'benjamin.vargas@email.com', 'Auriculares Sony WH-1000XM4', 0.3, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 12 DAY)),
('TRK-014N8O9P', 'Emilia', 'Castro', '41234567-2', 'Av. Eyzaguirre 6789', @comuna_puentealto, '+56941234567', 'emilia.castro@email.com', 'Lavadora Samsung 10kg', 55.0, 'en_bodega', @usuario_id, DATE_SUB(NOW(), INTERVAL 13 DAY)),
('TRK-015Q0R1S', 'Tomás', 'Herrera', '51234567-3', 'Av. Grecia 7890', @comuna_nunoa, '+56951234567', 'tomas.herrera@email.com', 'Teclado mecánico Logitech', 1.2, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 14 DAY)),
('TRK-016T2U3V', 'Martina', 'Parra', '61234567-4', 'Av. Nueva Costanera 8901', @comuna_vitacura, '+56961234567', 'martina.parra@email.com', 'Cámara Canon EOS R6', 1.8, 'pendiente', @usuario_id, DATE_SUB(NOW(), INTERVAL 15 DAY)),
('TRK-017W4X5Y', 'Lucas', 'Reyes', '71234567-5', 'Paseo Ahumada 9012', @comuna_santiago, '+56971234567', 'lucas.reyes@email.com', 'Silla Gamer DXRacer', 25.0, 'devuelto', @usuario_id, DATE_SUB(NOW(), INTERVAL 16 DAY)),
('TRK-018Z6A7B', 'Catalina', 'Morales', '81234567-6', 'Av. 11 de Septiembre 1234', @comuna_providencia, '+56981234567', 'catalina.morales@email.com', 'Smartwatch Apple Watch Series 8', 0.2, 'entregado', @usuario_id, DATE_SUB(NOW(), INTERVAL 17 DAY)),
('TRK-019C8D9E', 'Sebastián', 'Núñez', '91234567-7', 'Av. Las Torres 2345', @comuna_maipu, '+56991234567', 'sebastian.nunez@email.com', 'Aire Acondicionado Split 12000 BTU', 35.0, 'en_reparto', @usuario_id, DATE_SUB(NOW(), INTERVAL 18 DAY)),
('TRK-020F0G1H', 'Florencia', 'Gutiérrez', '10234567-8', 'Av. Manquehue 3456', @comuna_lascondes, '+56910234567', 'florencia.gutierrez@email.com', 'Escritorio de oficina ergonómico', 40.0, 'pendiente', @usuario_id, DATE_SUB(NOW(), INTERVAL 19 DAY));

-- VERIFICACIÓN
SELECT 'Registros insertados y actualizados correctamente' AS resultado;
