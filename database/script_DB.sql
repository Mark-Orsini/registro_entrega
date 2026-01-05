-- =============================================================================
-- BASE DE DATOS: registro_entregas (NIVEL EMPRESARIAL)
-- =============================================================================
-- Descripción: Script profesional normalizado con auditoría completa.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS registro_entregas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE registro_entregas;

-- =============================================================================
-- 1. TABLAS MAESTRAS (NORMALIZACIÓN)
-- =============================================================================

-- TABLA: roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABLA: regiones
CREATE TABLE IF NOT EXISTS regiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo_iso VARCHAR(10)
) ENGINE=InnoDB;

-- TABLA: comunas
CREATE TABLE IF NOT EXISTS comunas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE CASCADE,
    INDEX idx_region (region_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 2. TABLAS PRINCIPALES
-- =============================================================================

-- TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    
    -- Perfil
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    avatar_url VARCHAR(255),
    
    -- Auditoría Profesional
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT,
    borrado_at TIMESTAMP NULL,
    
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    INDEX idx_auth (email, password),
    INDEX idx_rut (rut)
) ENGINE=InnoDB;

-- TABLA: entregas
CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comuna_id INT NOT NULL,
    
    -- Destinatario
    nombre_destinatario VARCHAR(100) NOT NULL,
    apellido_destinatario VARCHAR(100) NOT NULL,
    rut_destinatario VARCHAR(20),
    direccion VARCHAR(255) NOT NULL,
    telefono_destinatario VARCHAR(20),
    email_destinatario VARCHAR(255),
    
    -- Detalles Paquete
    producto VARCHAR(255),
    peso_kg DECIMAL(10,2),
    volumen_m3 DECIMAL(10,3),
    observaciones TEXT,
    estado ENUM('pendiente', 'en_proceso', 'entregado', 'fallido', 'devuelto') DEFAULT 'pendiente',
    
    -- Auditoría Profesional
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT,
    borrado_at TIMESTAMP NULL,
    
    FOREIGN KEY (comuna_id) REFERENCES comunas(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (creado_at),
    INDEX idx_comuna (comuna_id)
) ENGINE=InnoDB;

-- TABLA: auditoria_log (OPCIONAL PERO RECOMENDADO PARA NIVEL EMPRESA)
CREATE TABLE IF NOT EXISTS auditoria_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tabla_nombre VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    usuario_id INT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. DATOS MAESTROS INICIALES
-- =============================================================================

INSERT INTO roles (nombre, descripcion) VALUES 
('admin', 'Acceso total al sistema'),
('operador', 'Gestión de entregas'),
('cliente', 'Consulta de estados');

-- Algunos ejemplos de Regiones y Comunas
INSERT INTO regiones (nombre, codigo_iso) VALUES 
('Metropolitana de Santiago', 'RM'),
('Valparaíso', 'V'),
('Biobío', 'VIII');

INSERT INTO comunas (region_id, nombre) VALUES 
(1, 'Santiago'), (1, 'Las Condes'), (1, 'Providencia'),
(2, 'Valparaíso'), (2, 'Viña del Mar'),
(3, 'Concepción'), (3, 'Talcahuano');

-- Usuario Admin Inicial (Password: admin123 hash simulado)
INSERT INTO usuarios (rol_id, nombre, apellido, rut, email, password, cargo) 
VALUES (1, 'Admin', 'Empresa', '1-9', 'admin@empresa.com', '$2b$10$2B.P8u7x6/7jK.v0I/N3Se0N3XGg6Yn6m6W6V6U6T6S6R6Q6P6O', 'Gerente de TI');
