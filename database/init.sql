-- =============================================================================
-- BASE DE DATOS: registro_entregas
-- =============================================================================
-- Autor: Sistema de Registro de Entregas
-- Fecha: 2025-12-15
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
    cliente VARCHAR(255) NOT NULL COMMENT 'Nombre del destinatario',
    direccion VARCHAR(255) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    producto VARCHAR(255),
    observaciones TEXT,
    estado ENUM('pendiente', 'proceso', 'entregado', 'fallido', 'devuelto') DEFAULT 'pendiente',
    
    -- Auditoría
    usuario_id INT COMMENT 'ID del usuario que creó/gestionó el registro',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_creacion)
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
-- DATOS INICIALES (Opcional)
-- =============================================================================
-- Usuario Administrador por defecto
-- Password: "admin123" (Hasheado con bcrypt)
-- NOTA: En producción, cambia esta contraseña inmediatamente.
INSERT INTO usuarios (nombre, apellido, rut, email, password, rol) 
VALUES 
('Administrador', 'Sistema', '11.111.111-1', 'admin@sistema.com', '$2b$10$X7.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X', 'admin')
ON DUPLICATE KEY UPDATE email=email; 

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
