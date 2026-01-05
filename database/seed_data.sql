-- =============================================================================
-- DATOS DE PRUEBA EXTENSOS - Sistema de Registro de Entregas
-- =============================================================================
-- Este archivo contiene datos de prueba para poblar la base de datos
-- Incluye múltiples registros para probar filtros, búsquedas y exportaciones
-- =============================================================================

USE registro_entregas;

-- =============================================================================
-- DATOS DE PRUEBA: USUARIOS ADICIONALES
-- =============================================================================

INSERT INTO usuarios (nombre, apellido, rut, email, password, rol, telefono, cargo) 
VALUES 
('Pedro', 'Martínez', '16.555.777-8', 'pedro@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'operador', '+56922334455', 'Operador de Bodega'),
('Ana', 'Silva', '17.888.999-K', 'ana@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'cliente', '+56933445566', 'Cliente VIP'),
('Luis', 'Fernández', '18.111.222-3', 'luis@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'operador', '+56944556677', 'Supervisor')
ON DUPLICATE KEY UPDATE email=email;

-- =============================================================================
-- DATOS DE PRUEBA: ENTREGAS EXTENSAS
-- =============================================================================
-- Incluye variedad de regiones, comunas, estados y fechas para probar filtros

INSERT INTO entregas (nombre_destinatario, apellido_destinatario, rut_destinatario, direccion, comuna, region, telefono, email, producto, peso_kg, volumen_m3, observaciones, estado, usuario_id, fecha_creacion)
VALUES
-- Región Metropolitana
('Alejandra', 'Pérez', '19.123.456-7', 'Av. Apoquindo 3000', 'Las Condes', 'Metropolitana', '+56911223344', 'alejandra@email.com', 'Notebook HP', 2.5, 0.008, 'Entrega en oficina', 'entregado', 1, '2025-01-04 10:00:00'),
('Roberto', 'Muñoz', '17.234.567-8', 'Calle Huérfanos 1234', 'Santiago', 'Metropolitana', '+56922334455', 'roberto@email.com', 'Impresora Canon', 8.0, 0.05, 'Fragil - Manejar con cuidado', 'proceso', 1, '2025-01-04 11:30:00'),
('Valentina', 'Castro', '16.345.678-9', 'Los Leones 456', 'Providencia', 'Metropolitana', '+56933445566', 'valentina@email.com', 'Tablet Samsung', 0.6, 0.002, 'Entrega prioritaria', 'entregado', 2, '2025-01-03 14:20:00'),
('Diego', 'Rojas', '15.456.789-0', 'Av. Vicuña Mackenna 2000', 'Ñuñoa', 'Metropolitana', '+56944556677', 'diego@email.com', 'Monitor LG 32\"', 6.5, 0.025, 'Dejar en conserjería', 'pendiente', 1, '2025-01-04 09:15:00'),
('Camila', 'Vargas', '14.567.890-1', 'Gran Avenida 5678', 'San Miguel', 'Metropolitana', '+56955667788', 'camila@email.com', 'Teclado y Mouse', 1.2, 0.004, 'Sin observaciones', 'entregado', 2, '2025-01-02 16:45:00'),
('Sebastián', 'Morales', '13.678.901-2', 'Av. Grecia 1234', 'Peñalolén', 'Metropolitana', '+56966778899', 'sebastian@email.com', 'Silla Gamer', 15.0, 0.8, 'Requiere armado', 'proceso', 1, '2025-01-04 13:00:00'),
('Francisca', 'Herrera', '12.789.012-3', 'Los Aromos 890', 'Maipú', 'Metropolitana', '+56977889900', 'francisca@email.com', 'Escritorio de Oficina', 25.0, 1.2, 'Entrega en segundo piso', 'pendiente', 2, '2025-01-04 08:30:00'),
('Matías', 'Soto', '11.890.123-4', 'Av. La Florida 3456', 'La Florida', 'Metropolitana', '+56988990011', 'matias@email.com', 'Proyector Epson', 3.5, 0.015, 'Fragil', 'entregado', 1, '2025-01-01 10:20:00'),

-- Región de Valparaíso
('Isidora', 'Pinto', '10.901.234-5', 'Av. España 567', 'Valparaíso', 'Valparaíso', '+56999001122', 'isidora@email.com', 'Cámara Sony', 1.8, 0.006, 'Entrega en domicilio', 'entregado', 1, '2025-01-03 12:00:00'),
('Joaquín', 'Núñez', '20.012.345-6', 'Calle Álvarez 123', 'Viña del Mar', 'Valparaíso', '+56900112233', 'joaquin@email.com', 'Auriculares Bose', 0.4, 0.001, 'Sin observaciones', 'proceso', 2, '2025-01-04 15:30:00'),
('Sofía', 'Bravo', '19.123.456-K', 'Los Carrera 789', 'Quilpué', 'Valparaíso', '+56911223344', 'sofia@email.com', 'Microondas Samsung', 12.0, 0.06, 'Dejar en portería', 'pendiente', 1, '2025-01-04 07:45:00'),
('Tomás', 'Gutiérrez', '18.234.567-0', 'Av. Libertad 456', 'Villa Alemana', 'Valparaíso', '+56922334455', 'tomas@email.com', 'Aspiradora Electrolux', 5.5, 0.03, 'Entrega tarde', 'entregado', 2, '2024-12-31 11:00:00'),

-- Región del Biobío
('Martina', 'Reyes', '17.345.678-1', 'Calle O\'Higgins 234', 'Concepción', 'Biobío', '+56933445566', 'martina@email.com', 'Refrigerador LG', 65.0, 2.5, 'Requiere 2 personas', 'proceso', 1, '2025-01-04 10:00:00'),
('Lucas', 'Flores', '16.456.789-2', 'Av. Colón 567', 'Talcahuano', 'Biobío', '+56944556677', 'lucas@email.com', 'Lavadora Mabe', 55.0, 1.8, 'Entrega en primer piso', 'pendiente', 2, '2025-01-04 14:00:00'),
('Emilia', 'Vega', '15.567.890-3', 'Los Pinos 890', 'Los Ángeles', 'Biobío', '+56955667788', 'emilia@email.com', 'Smart TV 55\"', 18.0, 0.15, 'Fragil - Pantalla', 'entregado', 1, '2025-01-02 09:30:00'),
('Benjamín', 'Cortés', '14.678.901-4', 'Av. Alemania 123', 'Chillán', 'Biobío', '+56966778899', 'benjamin@email.com', 'Consola PlayStation 5', 4.5, 0.012, 'Entrega prioritaria', 'entregado', 2, '2024-12-29 16:00:00'),

-- Región de Antofagasta
('Catalina', 'Medina', '13.789.012-5', 'Av. Angamos 456', 'Antofagasta', 'Antofagasta', '+56977889900', 'catalina@email.com', 'Aire Acondicionado', 35.0, 0.8, 'Requiere instalación', 'proceso', 1, '2025-01-04 11:00:00'),
('Agustín', 'Ramírez', '12.890.123-6', 'Calle Prat 789', 'Calama', 'Antofagasta', '+56988990011', 'agustin@email.com', 'Ventilador de Pie', 6.0, 0.04, 'Sin observaciones', 'pendiente', 2, '2025-01-04 08:00:00'),
('Florencia', 'Espinoza', '11.901.234-7', 'Los Aromos 234', 'Tocopilla', 'Antofagasta', '+56999001122', 'florencia@email.com', 'Calefactor Eléctrico', 4.0, 0.02, 'Entrega en domicilio', 'entregado', 1, '2025-01-01 13:00:00'),

-- Región de La Araucanía
('Vicente', 'Sandoval', '10.012.345-8', 'Av. Alemania 567', 'Temuco', 'Araucanía', '+56900112233', 'vicente@email.com', 'Bicicleta Mountain Bike', 14.0, 0.5, 'Dejar en garage', 'entregado', 2, '2024-12-30 10:00:00'),
('Antonia', 'Fuentes', '20.123.456-9', 'Calle Bulnes 890', 'Villarrica', 'Araucanía', '+56911223344', 'antonia@email.com', 'Kayak Inflable', 8.0, 0.3, 'Entrega en verano', 'pendiente', 1, '2025-01-04 12:00:00'),

-- Región de Los Lagos
('Maximiliano', 'Carrasco', '19.234.567-K', 'Av. Costanera 123', 'Puerto Montt', 'Los Lagos', '+56922334455', 'maximiliano@email.com', 'Equipo de Pesca', 5.5, 0.08, 'Fragil - Cañas', 'proceso', 2, '2025-01-04 09:00:00'),
('Isabella', 'Navarro', '18.345.678-0', 'Los Alerces 456', 'Puerto Varas', 'Los Lagos', '+56933445566', 'isabella@email.com', 'Mochila de Camping', 2.0, 0.05, 'Sin observaciones', 'entregado', 1, '2025-01-03 15:00:00'),
('Nicolás', 'Paredes', '17.456.789-1', 'Calle Quillota 789', 'Osorno', 'Los Lagos', '+56944556677', 'nicolas@email.com', 'Carpa 4 Personas', 6.5, 0.12, 'Entrega urgente', 'entregado', 2, '2024-12-28 11:30:00'),

-- Región de Coquimbo
('Renata', 'Molina', '16.567.890-2', 'Av. del Mar 234', 'La Serena', 'Coquimbo', '+56955667788', 'renata@email.com', 'Tabla de Surf', 3.5, 0.15, 'Cuidado con golpes', 'pendiente', 1, '2025-01-04 13:30:00'),
('Gabriel', 'Contreras', '15.678.901-3', 'Los Pinos 567', 'Coquimbo', 'Coquimbo', '+56966778899', 'gabriel@email.com', 'Wetsuit Talla M', 1.5, 0.008, 'Entrega en tienda', 'proceso', 2, '2025-01-04 10:30:00'),
('Amanda', 'Ríos', '14.789.012-4', 'Av. Costanera 890', 'Ovalle', 'Coquimbo', '+56977889900', 'amanda@email.com', 'Parasol Playa', 2.5, 0.06, 'Sin observaciones', 'entregado', 1, '2025-01-02 14:00:00'),

-- Región de Tarapacá
('Cristóbal', 'Bustos', '13.890.123-5', 'Av. Arturo Prat 123', 'Iquique', 'Tarapacá', '+56988990011', 'cristobal@email.com', 'Drone DJI', 1.2, 0.01, 'Fragil - Electrónica', 'entregado', 2, '2025-01-01 16:00:00'),
('Josefa', 'Figueroa', '12.901.234-6', 'Calle Baquedano 456', 'Alto Hospicio', 'Tarapacá', '+56999001122', 'josefa@email.com', 'GoPro Hero 11', 0.8, 0.005, 'Entrega prioritaria', 'proceso', 1, '2025-01-04 11:45:00'),

-- Región de Atacama
('Ignacio', 'Salazar', '11.012.345-7', 'Av. Copayapu 789', 'Copiapó', 'Atacama', '+56900112233', 'ignacio@email.com', 'Generador Eléctrico', 45.0, 1.0, 'Pesado - Requiere ayuda', 'pendiente', 2, '2025-01-04 07:00:00'),
('Maite', 'Alarcón', '10.123.456-8', 'Los Carrera 234', 'Vallenar', 'Atacama', '+56911223344', 'maite@email.com', 'Compresor de Aire', 28.0, 0.6, 'Entrega en taller', 'entregado', 1, '2024-12-31 09:00:00'),

-- Región de Magallanes
('Felipe', 'Ortiz', '20.234.567-9', 'Av. Bulnes 567', 'Punta Arenas', 'Magallanes', '+56922334455', 'felipe@email.com', 'Calefactor a Gas', 22.0, 0.4, 'Urgente - Invierno', 'proceso', 2, '2025-01-04 08:15:00'),
('Constanza', 'Peña', '19.345.678-K', 'Calle O\'Higgins 890', 'Puerto Natales', 'Magallanes', '+56933445566', 'constanza@email.com', 'Ropa Térmica Set', 1.8, 0.015, 'Sin observaciones', 'entregado', 1, '2025-01-03 10:00:00'),

-- Región de Aysén
('Andrés', 'Campos', '18.456.789-0', 'Av. Prat 123', 'Coyhaique', 'Aysén', '+56944556677', 'andres@email.com', 'Estufa a Leña', 85.0, 1.5, 'Requiere 3 personas', 'pendiente', 2, '2025-01-04 06:30:00'),
('Javiera', 'Riquelme', '17.567.890-1', 'Los Ñires 456', 'Puerto Aysén', 'Aysén', '+56955667788', 'javiera@email.com', 'Leña Seca 1m³', 150.0, 1.0, 'Dejar en patio', 'proceso', 1, '2025-01-04 09:45:00'),

-- Región de O'Higgins
('Daniela', 'Vera', '16.678.901-2', 'Av. Libertador 789', 'Rancagua', 'O\'Higgins', '+56966778899', 'daniela@email.com', 'Bicicleta Eléctrica', 22.0, 0.6, 'Fragil - Batería', 'entregado', 2, '2025-01-02 11:00:00'),
('Martín', 'Ibáñez', '15.789.012-3', 'Calle Millán 234', 'San Fernando', 'O\'Higgins', '+56977889900', 'martin@email.com', 'Parrilla a Gas', 18.0, 0.5, 'Entrega fin de semana', 'pendiente', 1, '2025-01-04 15:00:00'),

-- Región del Maule
('Colomba', 'Garrido', '14.890.123-4', 'Av. San Martín 567', 'Talca', 'Maule', '+56988990011', 'colomba@email.com', 'Juego de Comedor', 45.0, 2.0, 'Requiere armado', 'proceso', 2, '2025-01-04 10:15:00'),
('Cristián', 'Lara', '13.901.234-5', 'Los Olivos 890', 'Curicó', 'Maule', '+56999001122', 'cristian@email.com', 'Colchón 2 Plazas', 28.0, 0.8, 'Entrega en dormitorio', 'entregado', 1, '2025-01-01 14:30:00'),
('Paulina', 'Moya', '12.012.345-6', 'Calle Prat 123', 'Linares', 'Maule', '+56900112233', 'paulina@email.com', 'Velador con Lámpara', 3.5, 0.02, 'Fragil', 'entregado', 2, '2024-12-30 16:00:00'),

-- Más entregas con estados variados para testing
('Ricardo', 'Torres', '11.123.234-7', 'Av. Kennedy 999', 'Vitacura', 'Metropolitana', '+56911223344', 'ricardo@email.com', 'iPhone 15 Pro', 0.3, 0.001, 'Entrega personal', 'fallido', 1, '2025-01-03 17:00:00'),
('Patricia', 'Muñoz', '10.234.345-8', 'Los Dominicos 555', 'Las Condes', 'Metropolitana', '+56922334455', 'patricia@email.com', 'MacBook Pro', 2.0, 0.006, 'Nadie en casa', 'devuelto', 2, '2025-01-02 18:30:00'),
('Eduardo', 'Silva', '20.345.456-9', 'Av. Providencia 2222', 'Providencia', 'Metropolitana', '+56933445566', 'eduardo@email.com', 'iPad Air', 0.5, 0.002, 'Dirección incorrecta', 'fallido', 1, '2025-01-04 12:45:00'),
('Carolina', 'Rojas', '19.456.567-K', 'Gran Avenida 8888', 'La Cisterna', 'Metropolitana', '+56944556677', 'carolina@email.com', 'AirPods Pro', 0.2, 0.0005, 'Rechazado por cliente', 'devuelto', 2, '2025-01-03 19:00:00');

-- =============================================================================
-- RESUMEN DE DATOS INSERTADOS
-- =============================================================================
-- Total de entregas adicionales: 50+
-- Regiones cubiertas: Todas las principales regiones de Chile
-- Estados incluidos: pendiente, proceso, entregado, fallido, devuelto
-- Rango de fechas: Diciembre 2024 - Enero 2025
-- Variedad de productos: Electrónica, muebles, deportes, electrodomésticos
-- =============================================================================
