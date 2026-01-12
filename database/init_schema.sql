-- ============================================
-- SCRIPT DE INICIALIZACIÓN DE ESQUEMA
-- Sistema de Registro de Entregas
-- ============================================

-- 1. CREACIÓN DE TABLAS (Si no existen)

CREATE TABLE IF NOT EXISTS regiones (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS comunas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    region_id INT,
    FOREIGN KEY (region_id) REFERENCES regiones(id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_seguimiento VARCHAR(50) UNIQUE,
    nombre_destinatario VARCHAR(100) NOT NULL,
    apellido_destinatario VARCHAR(100) NOT NULL,
    rut_destinatario VARCHAR(20),
    direccion VARCHAR(255) NOT NULL,
    comuna_id INT,
    telefono_destinatario VARCHAR(20),
    email_destinatario VARCHAR(255),
    producto VARCHAR(255),
    peso_kg DECIMAL(10,2),
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, en_proceso, en_reparto, entregado, fallido, devuelto
    creado_por INT,
    creado_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comuna_id) REFERENCES comunas(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- 2. POBLACIÓN DE DATOS MAESTROS (REGIONES Y COMUNAS)

-- Insertar Región Metropolitana
INSERT INTO regiones (id, nombre) VALUES 
(13, 'Región Metropolitana de Santiago')
ON DUPLICATE KEY UPDATE nombre = 'Región Metropolitana de Santiago';

-- Insertar Comunas de Santiago (52 Comunas)
INSERT INTO comunas (nombre, region_id) VALUES
('Santiago', 13),
('Cerrillos', 13),
('Cerro Navia', 13),
('Conchalí', 13),
('El Bosque', 13),
('Estación Central', 13),
('Huechuraba', 13),
('Independencia', 13),
('La Cisterna', 13),
('La Florida', 13),
('La Granja', 13),
('La Pintana', 13),
('La Reina', 13),
('Las Condes', 13),
('Lo Barnechea', 13),
('Lo Espejo', 13),
('Lo Prado', 13),
('Macul', 13),
('Maipú', 13),
('Ñuñoa', 13),
('Pedro Aguirre Cerda', 13),
('Peñalolén', 13),
('Providencia', 13),
('Pudahuel', 13),
('Quilicura', 13),
('Quinta Normal', 13),
('Recoleta', 13),
('Renca', 13),
('San Joaquín', 13),
('San Miguel', 13),
('San Ramón', 13),
('Vitacura', 13),
('Puente Alto', 13),
('Pirque', 13),
('San José de Maipo', 13),
('Colina', 13),
('Lampa', 13),
('Tiltil', 13),
('San Bernardo', 13),
('Buin', 13),
('Calera de Tango', 13),
('Paine', 13),
('Melipilla', 13),
('Alhué', 13),
('Curacaví', 13),
('María Pinto', 13),
('San Pedro', 13),
('Talagante', 13),
('El Monte', 13),
('Isla de Maipo', 13),
('Padre Hurtado', 13),
('Peñaflor', 13)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
