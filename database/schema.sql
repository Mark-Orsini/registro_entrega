-- =============================================================================
-- PASO 1: CREAR USUARIO DE LA APLICACIÓN (Si no existe)
-- =============================================================================

-- Crear usuario dedicado para la aplicación
CREATE USER IF NOT EXISTS 'registro_app'@'localhost' 
IDENTIFIED BY 'R3g1str0App$2024!Secure';

-- =============================================================================
-- PASO 2: CREAR BASE DE DATOS
-- =============================================================================

CREATE DATABASE IF NOT EXISTS registro_entregas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- PASO 3: OTORGAR PERMISOS AL USUARIO
-- =============================================================================

-- Permisos completos SOLO en la base de datos registro_entregas
GRANT SELECT, INSERT, UPDATE, DELETE, 
      CREATE, DROP, INDEX, ALTER, 
      CREATE TEMPORARY TABLES, 
      LOCK TABLES, 
      EXECUTE, 
      CREATE VIEW, SHOW VIEW,
      CREATE ROUTINE, ALTER ROUTINE,
      TRIGGER,
      EVENT
ON registro_entregas.* 
TO 'registro_app'@'localhost';


-- Aplicar cambios de permisos
FLUSH PRIVILEGES;

-- =============================================================================
-- PASO 4: USAR LA BASE DE DATOS
-- =============================================================================

USE registro_entregas;

-- =============================================================================
-- PASO 5: CREAR TABLAS MAESTRAS
-- =============================================================================

-- TABLA: roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    permisos JSON COMMENT 'Permisos específicos del rol',
    activo BOOLEAN DEFAULT TRUE,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- TABLA: regiones
CREATE TABLE IF NOT EXISTS regiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo_iso VARCHAR(10) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_codigo (codigo_iso)
) ENGINE=InnoDB;

-- TABLA: comunas
CREATE TABLE IF NOT EXISTS comunas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_comuna_region (region_id, nombre),
    FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE CASCADE,
    INDEX idx_region (region_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- =============================================================================
-- PASO 6: CREAR TABLAS PRINCIPALES
-- =============================================================================

-- TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    
    -- Información Personal
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE COMMENT 'Formato: 12345678-9',
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    
    -- Perfil
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Seguridad
    ultimo_login TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    
    -- Auditoría Profesional
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT,
    borrado_at TIMESTAMP NULL,
    borrado_por INT,
    
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (borrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_auth (email, password),
    INDEX idx_rut (rut),
    INDEX idx_estado (estado),
    INDEX idx_borrado (borrado_at),
    INDEX idx_email_verificado (email_verificado)
) ENGINE=InnoDB;

-- TABLA: entregas
CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_seguimiento VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único de tracking',
    comuna_id INT NOT NULL,
    
    -- Destinatario
    nombre_destinatario VARCHAR(100) NOT NULL,
    apellido_destinatario VARCHAR(100) NOT NULL,
    rut_destinatario VARCHAR(12),
    direccion VARCHAR(255) NOT NULL,
    referencia_direccion VARCHAR(255) COMMENT 'Entre calles, edificio, etc',
    telefono_destinatario VARCHAR(20),
    email_destinatario VARCHAR(255),
    
    -- Remitente
    nombre_remitente VARCHAR(100),
    telefono_remitente VARCHAR(20),
    
    -- Detalles Paquete
    producto VARCHAR(255),
    descripcion_producto TEXT,
    peso_kg DECIMAL(10,2),
    volumen_m3 DECIMAL(10,3),
    valor_declarado DECIMAL(12,2),
    fragil BOOLEAN DEFAULT FALSE,
    
    -- Estado y Seguimiento
    estado ENUM('pendiente', 'en_bodega', 'en_reparto', 'entregado', 'fallido', 'devuelto', 'cancelado') DEFAULT 'pendiente',
    prioridad ENUM('normal', 'urgente', 'express') DEFAULT 'normal',
    fecha_programada DATE,
    fecha_entrega DATETIME,
    
    -- Asignación
    repartidor_id INT COMMENT 'Usuario asignado para entrega',
    
    -- Observaciones
    observaciones TEXT,
    motivo_falla TEXT COMMENT 'Razón si estado es fallido',
    
    -- Evidencia
    firma_url VARCHAR(500) COMMENT 'URL de imagen de firma',
    foto_entrega_url VARCHAR(500) COMMENT 'URL de foto de evidencia',
    
    -- Auditoría Profesional
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT,
    borrado_at TIMESTAMP NULL,
    borrado_por INT,
    
    FOREIGN KEY (comuna_id) REFERENCES comunas(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (borrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (repartidor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_codigo (codigo_seguimiento),
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_fecha_creacion (creado_at),
    INDEX idx_fecha_programada (fecha_programada),
    INDEX idx_comuna (comuna_id),
    INDEX idx_rut_destinatario (rut_destinatario),
    INDEX idx_repartidor (repartidor_id),
    INDEX idx_borrado (borrado_at),
    INDEX idx_estado_fecha (estado, creado_at) COMMENT 'Índice compuesto para reportes'
) ENGINE=InnoDB;

-- TABLA: historial_entregas (Trazabilidad completa)
CREATE TABLE IF NOT EXISTS historial_entregas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entrega_id INT NOT NULL,
    estado_anterior ENUM('pendiente', 'en_bodega', 'en_reparto', 'entregado', 'fallido', 'devuelto', 'cancelado'),
    estado_nuevo ENUM('pendiente', 'en_bodega', 'en_reparto', 'entregado', 'fallido', 'devuelto', 'cancelado'),
    observacion TEXT,
    ubicacion_lat DECIMAL(10,8),
    ubicacion_lng DECIMAL(11,8),
    usuario_id INT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_entrega (entrega_id),
    INDEX idx_fecha (fecha_cambio)
) ENGINE=InnoDB;

-- TABLA: sesiones (JWT Blacklist y gestión de sesiones)
CREATE TABLE IF NOT EXISTS sesiones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE COMMENT 'JWT ID único',
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    dispositivo VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    expira_en DATETIME NOT NULL,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cerrado_at TIMESTAMP NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token_jti),
    INDEX idx_activo (activo),
    INDEX idx_expira (expira_en)
) ENGINE=InnoDB;

-- TABLA: codigos_recuperacion
CREATE TABLE IF NOT EXISTS codigos_recuperacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    usado BOOLEAN DEFAULT FALSE,
    ip_solicitante VARCHAR(45),
    expira_en DATETIME NOT NULL,
    usado_en DATETIME NULL,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_codigo (codigo),
    INDEX idx_token (token),
    INDEX idx_usuario (usuario_id),
    INDEX idx_expira (expira_en)
) ENGINE=InnoDB;

-- TABLA: configuraciones (Parámetros del sistema)
CREATE TABLE IF NOT EXISTS configuraciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    descripcion VARCHAR(255),
    categoria VARCHAR(50) DEFAULT 'general',
    editable BOOLEAN DEFAULT TRUE,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT,
    
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_clave (clave),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB;

-- TABLA: auditoria_log (Auditoría completa del sistema)
CREATE TABLE IF NOT EXISTS auditoria_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tabla_nombre VARCHAR(50) NOT NULL,
    registro_id VARCHAR(50) NOT NULL COMMENT 'Permite IDs de diferentes tipos',
    accion ENUM('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    cambios_especificos JSON COMMENT 'Solo los campos modificados',
    usuario_id INT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tabla_registro (tabla_nombre, registro_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha_hora)
) ENGINE=InnoDB;

-- TABLA: notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('entrega', 'sistema', 'alerta', 'info') DEFAULT 'info',
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    entrega_id INT,
    leida BOOLEAN DEFAULT FALSE,
    leida_en TIMESTAMP NULL,
    url_accion VARCHAR(500),
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
    INDEX idx_usuario_leida (usuario_id, leida),
    INDEX idx_creado (creado_at)
) ENGINE=InnoDB;

-- =============================================================================
-- PASO 7: CREAR TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =============================================================================

DELIMITER //

-- Trigger para historial de entregas al cambiar estado
CREATE TRIGGER trg_entregas_historial_after_update
AFTER UPDATE ON entregas
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        INSERT INTO historial_entregas (
            entrega_id, 
            estado_anterior, 
            estado_nuevo, 
            observacion,
            usuario_id
        ) VALUES (
            NEW.id,
            OLD.estado,
            NEW.estado,
            CONCAT('Estado cambiado de ', OLD.estado, ' a ', NEW.estado),
            NEW.actualizado_por
        );
    END IF;
END//

-- Trigger para auditoría de entregas
CREATE TRIGGER trg_auditoria_entregas_update
AFTER UPDATE ON entregas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_log (
        tabla_nombre,
        registro_id,
        accion,
        datos_anteriores,
        datos_nuevos,
        usuario_id
    ) VALUES (
        'entregas',
        NEW.id,
        'UPDATE',
        JSON_OBJECT(
            'estado', OLD.estado,
            'direccion', OLD.direccion,
            'repartidor_id', OLD.repartidor_id
        ),
        JSON_OBJECT(
            'estado', NEW.estado,
            'direccion', NEW.direccion,
            'repartidor_id', NEW.repartidor_id
        ),
        NEW.actualizado_por
    );
END//

DELIMITER ;

-- =============================================================================
-- PASO 8: CREAR VISTAS ÚTILES
-- =============================================================================

-- Vista: entregas_completas
CREATE OR REPLACE VIEW v_entregas_completas AS
SELECT 
    e.id,
    e.codigo_seguimiento,
    e.nombre_destinatario,
    e.apellido_destinatario,
    e.direccion,
    e.telefono_destinatario,
    e.estado,
    e.prioridad,
    e.fecha_programada,
    e.fecha_entrega,
    c.nombre AS comuna,
    r.nombre AS region,
    CONCAT(u.nombre, ' ', u.apellido) AS repartidor,
    e.creado_at,
    e.actualizado_at
FROM entregas e
LEFT JOIN comunas c ON e.comuna_id = c.id
LEFT JOIN regiones r ON c.region_id = r.id
LEFT JOIN usuarios u ON e.repartidor_id = u.id
WHERE e.borrado_at IS NULL;

-- Vista: estadísticas_entregas
CREATE OR REPLACE VIEW v_estadisticas_entregas AS
SELECT 
    DATE(creado_at) AS fecha,
    estado,
    COUNT(*) AS cantidad,
    prioridad,
    AVG(peso_kg) AS peso_promedio
FROM entregas
WHERE borrado_at IS NULL
GROUP BY DATE(creado_at), estado, prioridad;

-- =============================================================================
-- PASO 9: INSERTAR DATOS MAESTROS INICIALES
-- =============================================================================

-- Roles del sistema
INSERT INTO roles (nombre, descripcion, permisos) VALUES 
('admin', 'Acceso total al sistema', JSON_OBJECT('all', true)),
('operador', 'Gestión de entregas', JSON_OBJECT('entregas', 'write', 'reportes', 'read')),
('repartidor', 'Actualización de entregas asignadas', JSON_OBJECT('entregas', 'update_own')),
('cliente', 'Consulta de estados', JSON_OBJECT('entregas', 'read_own'))
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);

-- Regiones de Chile
INSERT INTO regiones (nombre, codigo_iso) VALUES 
('Arica y Parinacota', 'XV'),
('Tarapacá', 'I'),
('Antofagasta', 'II'),
('Atacama', 'III'),
('Coquimbo', 'IV'),
('Valparaíso', 'V'),
('Metropolitana de Santiago', 'RM'),
("Libertador General Bernardo O'Higgins", 'VI'),
('Maule', 'VII'),
('Ñuble', 'XVI'),
('Biobío', 'VIII'),
('Araucanía', 'IX'),
('Los Ríos', 'XIV'),
('Los Lagos', 'X'),
('Aysén del General Carlos Ibáñez del Campo', 'XI'),
('Magallanes y de la Antártica Chilena', 'XII')
ON DUPLICATE KEY UPDATE codigo_iso=VALUES(codigo_iso);

-- Comunas principales (ejemplo con Región Metropolitana)
INSERT INTO comunas (region_id, nombre) VALUES
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Santiago'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Providencia'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Las Condes'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Ñuñoa'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'La Reina'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Maipú'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Pudahuel'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'Puente Alto'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'San Bernardo'),
((SELECT id FROM regiones WHERE codigo_iso = 'RM'), 'La Florida')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Configuraciones iniciales del sistema
INSERT INTO configuraciones (clave, valor, tipo, descripcion, categoria) VALUES
('sistema.nombre', 'Sistema de Registro de Entregas', 'string', 'Nombre del sistema', 'general'),
('sistema.version', '1.0.0', 'string', 'Versión actual', 'general'),
('entregas.dias_retencion', '90', 'number', 'Días antes de archivar entregas', 'entregas'),
('notificaciones.email_activo', 'true', 'boolean', 'Activar notificaciones por email', 'notificaciones'),
('seguridad.intentos_login', '5', 'number', 'Intentos máximos de login', 'seguridad'),
('seguridad.tiempo_bloqueo', '30', 'number', 'Minutos de bloqueo tras intentos fallidos', 'seguridad')
ON DUPLICATE KEY UPDATE valor=VALUES(valor);


INSERT INTO usuarios (
    rol_id, 
    nombre, 
    apellido, 
    rut, 
    email, 
    password, 
    cargo,
    email_verificado,
    estado
) 
SELECT 
    1,
    'Administrador',
    'Sistema',
    '11111111-1',
    'admin@sistema.com',
    '$2b$10$placeholder_hash_must_be_generated_by_backend',
    'Super Admin',
    TRUE,
    'activo'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@sistema.com'
);

-- =============================================================================
-- PASO 11: CREAR PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =============================================================================

DELIMITER //

-- Procedimiento: Obtener estadísticas del dashboard
CREATE PROCEDURE sp_estadisticas_dashboard(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    SELECT 
        COUNT(*) AS total_entregas,
        SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) AS entregadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'en_reparto' THEN 1 ELSE 0 END) AS en_reparto,
        SUM(CASE WHEN estado = 'fallido' THEN 1 ELSE 0 END) AS fallidas,
        ROUND(AVG(peso_kg), 2) AS peso_promedio,
        SUM(CASE WHEN prioridad = 'urgente' THEN 1 ELSE 0 END) AS urgentes
    FROM entregas
    WHERE DATE(creado_at) BETWEEN p_fecha_inicio AND p_fecha_fin
        AND borrado_at IS NULL;
END//

-- Procedimiento: Limpiar sesiones expiradas
CREATE PROCEDURE sp_limpiar_sesiones_expiradas()
BEGIN
    UPDATE sesiones 
    SET activo = FALSE, 
        cerrado_at = NOW()
    WHERE expira_en < NOW() 
        AND activo = TRUE;
    
    SELECT ROW_COUNT() AS sesiones_cerradas;
END//

DELIMITER ;

-- =============================================================================
-- PASO 12: CREAR EVENTOS PROGRAMADOS
-- =============================================================================

-- Activar el event scheduler
SET GLOBAL event_scheduler = ON;

-- Evento: Limpiar sesiones expiradas cada hora
CREATE EVENT IF NOT EXISTS evt_limpiar_sesiones
ON SCHEDULE EVERY 1 HOUR
DO
    CALL sp_limpiar_sesiones_expiradas();

-- Evento: Limpiar códigos de recuperación expirados cada día
CREATE EVENT IF NOT EXISTS evt_limpiar_codigos_recuperacion
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM codigos_recuperacion 
    WHERE expira_en < NOW() OR (usado = TRUE AND creado_at < DATE_SUB(NOW(), INTERVAL 7 DAY));

-- =============================================================================
-- PASO 13: VERIFICACIÓN FINAL
-- =============================================================================

-- Mostrar permisos del usuario creado
SHOW GRANTS FOR 'registro_app'@'localhost';

-- Mostrar tablas creadas
SHOW TABLES;

-- Verificar roles insertados
SELECT * FROM roles;

-- Verificar regiones insertadas
SELECT COUNT(*) AS total_regiones FROM regiones;