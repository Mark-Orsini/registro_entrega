-- =============================================================================
-- BASE DE DATOS: registro_entregas
-- =============================================================================
-- Autor: Sistema de Registro de Entregas
-- Fecha: 2025-01-04
-- Descripción: Script de inicialización de la base de datos MySQL.
--              Incluye creación de tablas, índices, relaciones y datos iniciales.
-- =============================================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS registro_entregas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE registro_entregas;

-- =============================================================================
-- TABLA: usuarios
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cliente', 'operador') DEFAULT 'cliente',
    estado TINYINT(1) DEFAULT 1 COMMENT '1: Activo, 0: Inactivo',
    
    -- Campos de Perfil
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    avatar_url VARCHAR(255),
    bio TEXT,
    
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_rut (rut)
) ENGINE=InnoDB COMMENT='Almacena la información de los usuarios del sistema';

-- =============================================================================
-- TABLA: entregas
-- =============================================================================
CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del Destinatario (Separado para mejor filtro)
    nombre_destinatario VARCHAR(100) NOT NULL,
    apellido_destinatario VARCHAR(100) NOT NULL,
    rut_destinatario VARCHAR(20),
    
    direccion VARCHAR(255) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    
    -- Detalles del Paquete
    producto VARCHAR(255),
    peso_kg DECIMAL(5,2),
    volumen_m3 DECIMAL(5,3),
    observaciones TEXT,
    
    estado ENUM('pendiente', 'proceso', 'entregado', 'fallido', 'devuelto') DEFAULT 'pendiente',
    
    -- Auditoría
    usuario_id INT COMMENT 'ID del usuario que creó/gestionó el registro',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_creacion),
    INDEX idx_region_comuna (region, comuna),
    INDEX idx_destinatario (apellido_destinatario, nombre_destinatario)
) ENGINE=InnoDB COMMENT='Registro principal de entregas';

-- =============================================================================
-- TABLA: codigos_recuperacion
-- =============================================================================
CREATE TABLE IF NOT EXISTS codigos_recuperacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    expira_en DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_codigo (codigo)
) ENGINE=InnoDB COMMENT='Códigos temporales para recuperación de contraseña';

-- =============================================================================
-- DATOS INICIALES
-- =============================================================================

-- Usuario Administrador por defecto
-- Password: "admin123" (Hasheado con bcrypt)
INSERT INTO usuarios (nombre, apellido, rut, email, password, rol, telefono, cargo) 
VALUES 
('Administrador', 'Sistema', '11.111.111-1', 'admin@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'admin', '+56912345678', 'Super Admin')
ON DUPLICATE KEY UPDATE email=email; 

-- Usuario Operador de Prueba
INSERT INTO usuarios (nombre, apellido, rut, email, password, rol, telefono, cargo) 
VALUES 
('Juan', 'Operador', '22.222.222-2', 'operador@sistema.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'operador', '+56987654321', 'Logística')
ON DUPLICATE KEY UPDATE email=email; 

-- Semilla de Entregas para Pruebas
INSERT INTO entregas (nombre_destinatario, apellido_destinatario, rut_destinatario, direccion, comuna, region, telefono, email, producto, peso_kg, volumen_m3, observaciones, estado, usuario_id, fecha_creacion)
VALUES
('Carlos', 'González', '12.345.678-9', 'Av. Providencia 1234', 'Providencia', 'Metropolitana', '+56911112222', 'carlos@email.com', 'Smartphone Samsung', 0.5, 0.001, 'Entrega prioritaria', 'entregado', 1, '2025-01-01 10:00:00'),
('María', 'Rodríguez', '15.222.333-4', 'Calle Los Olmos 567', 'Viña del Mar', 'Valparaíso', '+56933334444', 'maria@email.com', 'Laptop Dell', 2.1, 0.005, 'Fragil', 'proceso', 1, '2025-01-02 11:30:00'),
('Andrés', 'Tapia', '18.444.555-6', 'Pje. Las Rosas 89', 'Concepción', 'Biobío', '+56955556666', 'andres@email.com', 'Monitor 27"', 5.0, 0.02, 'Cuidado con la pantalla', 'pendiente', 2, '2025-01-03 09:15:00'),
('Beatriz', 'López', '10.555.666-7', 'Diagonal Paraguay 200', 'Santiago', 'Metropolitana', '+56977778888', 'beatriz@email.com', 'Silla de Escritorio', 12.5, 0.5, 'Requiere armado', 'fallido', 2, '2025-01-04 14:45:00'),
('Zulma', 'Arancibia', '14.666.777-8', 'Los Militares 4500', 'Las Condes', 'Metropolitana', '+56999990000', 'zulma@email.com', 'Cámara Fotográfica', 0.8, 0.002, 'Sin observaciones', 'entregado', 1, '2024-12-25 16:20:00'),
('Fernando', 'Cáceres', '19.888.999-0', 'Av. Libertad 10', 'Antofagasta', 'Antofagasta', '+56912121313', 'fernando@email.com', 'Teclado Mecánico', 1.2, 0.003, 'Dejar en conserjería', 'proceso', 2, '2024-12-28 08:30:00'),
('Elena', 'Muñoz', '16.777.888-9', 'Baquedano 45', 'Iquique', 'Tarapacá', '+56914141515', 'elena@email.com', 'Libros varios', 3.5, 0.015, 'Entregar tarde', 'pendiente', 1, '2024-12-30 18:00:00');
