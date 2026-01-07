-- =============================================================================
-- DATOS DE PRUEBA: SEED DATA (VERSION NORMALIZADA)
-- =============================================================================

USE registro_entregas;

-- Poblar algunas comunas (Muestra)
INSERT INTO comunas (region_id, nombre) VALUES 
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Santiago'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Las Condes'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Providencia'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Ñuñoa'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Maipú'),
((SELECT id FROM regiones WHERE codigo_iso = 'V'), 'Valparaíso'),
((SELECT id FROM regiones WHERE codigo_iso = 'V'), 'Viña del Mar'),
((SELECT id FROM regiones WHERE codigo_iso = 'VIII'), 'Concepción'),
((SELECT id FROM regiones WHERE codigo_iso = 'VIII'), 'Talcahuano'),
((SELECT id FROM regiones WHERE codigo_iso = 'II'), 'Antofagasta'),
((SELECT id FROM regiones WHERE codigo_iso = 'IX'), 'Temuco'),
((SELECT id FROM regiones WHERE codigo_iso = 'X'), 'Puerto Montt')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Usuarios Operadores
INSERT INTO usuarios (rol_id, nombre, apellido, rut, email, password, cargo) VALUES 
((SELECT id FROM roles WHERE nombre = 'operador'), 'Juan', 'Operador', '22.222.222-2', 'operador@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'Logística'),
((SELECT id FROM roles WHERE nombre = 'operador'), 'Pedro', 'Martínez', '16.555.777-8', 'pedro@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'Operador de Bodega')
ON DUPLICATE KEY UPDATE email=email;

-- Semilla de Entregas
INSERT INTO entregas (codigo_seguimiento, comuna_id, nombre_destinatario, apellido_destinatario, rut_destinatario, direccion, telefono_destinatario, email_destinatario, producto, peso_kg, volumen_m3, observaciones, estado, creado_por)
VALUES
('TRK-SEED001', (SELECT id FROM comunas WHERE nombre = 'Providencia' LIMIT 1), 'Carlos', 'González', '12.345.678-9', 'Av. Providencia 1234', '+56911112222', 'carlos@email.com', 'Smartphone Samsung', 0.5, 0.001, 'Entrega prioritaria', 'entregado', 1),
('TRK-SEED002', (SELECT id FROM comunas WHERE nombre = 'Viña del Mar' LIMIT 1), 'María', 'Rodríguez', '15.222.333-4', 'Calle Los Olmos 567', '+56933334444', 'maria@email.com', 'Laptop Dell', 2.1, 0.005, 'Fragil', 'en_reparto', 1),
('TRK-SEED003', (SELECT id FROM comunas WHERE nombre = 'Concepción' LIMIT 1), 'Andrés', 'Tapia', '18.444.555-6', 'Pje. Las Rosas 89', '+56955556666', 'andres@email.com', 'Monitor 27"', 5.0, 0.02, 'Cuidado con la pantalla', 'pendiente', 2),
('TRK-SEED004', (SELECT id FROM comunas WHERE nombre = 'Santiago' LIMIT 1), 'Beatriz', 'López', '10.555.666-7', 'Diagonal Paraguay 200', '+56977778888', 'beatriz@email.com', 'Silla de Escritorio', 12.5, 0.5, 'Requiere armado', 'fallido', 2),
('TRK-SEED005', (SELECT id FROM comunas WHERE nombre = 'Las Condes' LIMIT 1), 'Zulma', 'Arancibia', '14.666.777-8', 'Los Militares 4500', '+56999990000', 'zulma@email.com', 'Cámara Fotográfica', 0.8, 0.002, 'Sin observaciones', 'entregado', 1);

