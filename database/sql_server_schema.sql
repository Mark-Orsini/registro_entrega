-- =============================================================================
-- SQL SERVER SCHEMA - Registro de Entregas
-- =============================================================================

-- 1. CREACIÓN DE LA BASE DE DATOS
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'registro_entregas')
BEGIN
    CREATE DATABASE registro_entregas;
END
GO

USE registro_entregas;
GO

-- 2. CREACIÓN DEL LOGIN Y USUARIO REMOTO
-- Nota: El login se crea a nivel de instancia, el usuario a nivel de base de datos.
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'registro_remoto')
BEGIN
    CREATE LOGIN [registro_remoto] WITH PASSWORD = 'R3g1str0R3m0t0$2024!Secure', DEFAULT_DATABASE = [registro_entregas], CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'registro_remoto')
BEGIN
    CREATE USER [registro_remoto] FOR LOGIN [registro_remoto];
    ALTER ROLE [db_owner] ADD MEMBER [registro_remoto]; -- O asignar permisos específicos
END
GO

-- 3. TABLAS MAESTRAS

-- TABLA: roles
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(50) NOT NULL UNIQUE,
        descripcion NVARCHAR(255),
        permisos NVARCHAR(MAX), -- JSON almacenado como NVARCHAR(MAX)
        activo BIT DEFAULT 1,
        creado_at DATETIME2 DEFAULT GETDATE(),
        actualizado_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- TABLA: regiones
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[regiones]') AND type in (N'U'))
BEGIN
    CREATE TABLE regiones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL UNIQUE,
        codigo_iso NVARCHAR(10) NOT NULL UNIQUE,
        activo BIT DEFAULT 1
    );
    CREATE INDEX idx_regiones_codigo ON regiones(codigo_iso);
END
GO

-- TABLA: comunas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[comunas]') AND type in (N'U'))
BEGIN
    CREATE TABLE comunas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        region_id INT NOT NULL,
        nombre NVARCHAR(100) NOT NULL,
        activo BIT DEFAULT 1,
        CONSTRAINT unique_comuna_region UNIQUE (region_id, nombre),
        FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_comunas_region ON comunas(region_id);
END
GO

-- 4. TABLAS PRINCIPALES

-- TABLA: usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usuarios]') AND type in (N'U'))
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rol_id INT NOT NULL,
        nombre NVARCHAR(100) NOT NULL,
        apellido NVARCHAR(100) NOT NULL,
        rut NVARCHAR(12) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        telefono NVARCHAR(20),
        cargo NVARCHAR(100),
        avatar_url NVARCHAR(500),
        bio NVARCHAR(MAX),
        ultimo_login DATETIME2 NULL,
        intentos_fallidos INT DEFAULT 0,
        bloqueado_hasta DATETIME2 NULL,
        email_verificado BIT DEFAULT 0,
        token_verificacion NVARCHAR(255),
        estado NVARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
        creado_at DATETIME2 DEFAULT GETDATE(),
        creado_por INT,
        actualizado_at DATETIME2 DEFAULT GETDATE(),
        actualizado_por INT,
        borrado_at DATETIME2 NULL,
        borrado_por INT,
        
        FOREIGN KEY (rol_id) REFERENCES roles(id),
        FOREIGN KEY (creado_por) REFERENCES usuarios(id),
        FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
        FOREIGN KEY (borrado_por) REFERENCES usuarios(id)
    );
    CREATE INDEX idx_usuarios_email_pass ON usuarios(email, password);
    CREATE INDEX idx_usuarios_estado ON usuarios(estado);
END
GO

-- TABLA: entregas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entregas]') AND type in (N'U'))
BEGIN
    CREATE TABLE entregas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        codigo_seguimiento NVARCHAR(50) NOT NULL UNIQUE,
        comuna_id INT NOT NULL,
        nombre_destinatario NVARCHAR(100) NOT NULL,
        apellido_destinatario NVARCHAR(100) NOT NULL,
        rut_destinatario NVARCHAR(12),
        direccion NVARCHAR(255) NOT NULL,
        referencia_direccion NVARCHAR(255),
        telefono_destinatario NVARCHAR(20),
        email_destinatario NVARCHAR(255),
        nombre_remitente NVARCHAR(100),
        telefono_remitente NVARCHAR(20),
        producto NVARCHAR(255),
        descripcion_producto NVARCHAR(MAX),
        peso_kg DECIMAL(10,2),
        volumen_m3 DECIMAL(10,3),
        valor_declarado DECIMAL(12,2),
        fragil BIT DEFAULT 0,
        estado NVARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_bodega', 'en_reparto', 'entregado', 'fallido', 'devuelto', 'cancelado')),
        prioridad NVARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('normal', 'urgente', 'express')),
        fecha_programada DATE,
        fecha_entrega DATETIME2,
        repartidor_id INT,
        observaciones NVARCHAR(MAX),
        motivo_falla NVARCHAR(MAX),
        firma_url NVARCHAR(500),
        foto_entrega_url NVARCHAR(500),
        creado_at DATETIME2 DEFAULT GETDATE(),
        creado_por INT,
        actualizado_at DATETIME2 DEFAULT GETDATE(),
        actualizado_por INT,
        borrado_at DATETIME2 NULL,
        borrado_por INT,

        FOREIGN KEY (comuna_id) REFERENCES comunas(id),
        FOREIGN KEY (creado_por) REFERENCES usuarios(id),
        FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
        FOREIGN KEY (borrado_por) REFERENCES usuarios(id),
        FOREIGN KEY (repartidor_id) REFERENCES usuarios(id)
    );
    CREATE INDEX idx_entregas_estado ON entregas(estado);
    CREATE INDEX idx_entregas_codigo ON entregas(codigo_seguimiento);
END
GO

-- TABLA: historial_entregas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[historial_entregas]') AND type in (N'U'))
BEGIN
    CREATE TABLE historial_entregas (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        entrega_id INT NOT NULL,
        estado_anterior NVARCHAR(20),
        estado_nuevo NVARCHAR(20),
        observacion NVARCHAR(MAX),
        ubicacion_lat DECIMAL(10,8),
        ubicacion_lng DECIMAL(11,8),
        usuario_id INT,
        fecha_cambio DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
END
GO

-- TABLA: sesiones
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sesiones]') AND type in (N'U'))
BEGIN
    CREATE TABLE sesiones (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        usuario_id INT NOT NULL,
        token_jti NVARCHAR(255) NOT NULL UNIQUE,
        refresh_token NVARCHAR(500),
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(500),
        dispositivo NVARCHAR(100),
        activo BIT DEFAULT 1,
        expira_en DATETIME2 NOT NULL,
        creado_at DATETIME2 DEFAULT GETDATE(),
        cerrado_at DATETIME2 NULL,
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
END
GO

-- TABLA: configuraciones
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[configuraciones]') AND type in (N'U'))
BEGIN
    CREATE TABLE configuraciones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        clave NVARCHAR(100) NOT NULL UNIQUE,
        valor NVARCHAR(MAX) NOT NULL,
        tipo NVARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
        descripcion NVARCHAR(255),
        categoria NVARCHAR(50) DEFAULT 'general',
        editable BIT DEFAULT 1,
        actualizado_at DATETIME2 DEFAULT GETDATE(),
        actualizado_por INT,
        
        FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
    );
END
GO

-- 5. TRIGGERS PARA ACTUALIZADO_AT (Simulando ON UPDATE)

-- Trigger para [roles]
GO
CREATE TRIGGER tr_roles_update ON roles AFTER UPDATE AS
BEGIN
    UPDATE roles SET actualizado_at = GETDATE() FROM roles INNER JOIN inserted i ON roles.id = i.id;
END
GO

-- Trigger para [usuarios]
CREATE TRIGGER tr_usuarios_update ON usuarios AFTER UPDATE AS
BEGIN
    UPDATE usuarios SET actualizado_at = GETDATE() FROM usuarios INNER JOIN inserted i ON usuarios.id = i.id;
END
GO

-- Trigger para [entregas]
CREATE TRIGGER tr_entregas_update ON entregas AFTER UPDATE AS
BEGIN
    UPDATE entregas SET actualizado_at = GETDATE() FROM entregas INNER JOIN inserted i ON entregas.id = i.id;
END
GO

-- 6. TRIGGERS DE LÓGICA DE NEGOCIO (Similar a MySQL)

CREATE TRIGGER trg_entregas_historial_after_update ON entregas AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO historial_entregas (entrega_id, estado_anterior, estado_nuevo, observacion, usuario_id)
    SELECT i.id, d.estado, i.estado, 'Estado cambiado de ' + d.estado + ' a ' + i.estado, i.actualizado_por
    FROM inserted i
    INNER JOIN deleted d ON i.id = d.id
    WHERE i.estado <> d.estado;
END
GO

-- 7. VISTAS

IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_entregas_completas')
    DROP VIEW v_entregas_completas;
GO
CREATE VIEW v_entregas_completas AS
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
    u.nombre + ' ' + u.apellido AS repartidor,
    e.creado_at,
    e.actualizado_at
FROM entregas e
LEFT JOIN comunas c ON e.comuna_id = c.id
LEFT JOIN regiones r ON c.region_id = r.id
LEFT JOIN usuarios u ON e.repartidor_id = u.id
WHERE e.borrado_at IS NULL;
GO

-- 8. DATOS INICIALES

-- Roles
IF NOT EXISTS (SELECT 1 FROM roles)
BEGIN
    INSERT INTO roles (nombre, descripcion, permisos) VALUES 
    ('admin', 'Acceso total al sistema', '{"all": true}'),
    ('operador', 'Gestión de entregas', '{"entregas": "write", "reportes": "read"}'),
    ('repartidor', 'Actualización de entregas asignadas', '{"entregas": "update_own"}'),
    ('cliente', 'Consulta de estados', '{"entregas": "read_own"}');
END
GO

-- Regiones
IF NOT EXISTS (SELECT 1 FROM regiones)
BEGIN
    INSERT INTO regiones (nombre, codigo_iso) VALUES 
    ('Arica y Parinacota', 'XV'),
    ('Tarapacá', 'I'),
    ('Antofagasta', 'II'),
    ('Atacama', 'III'),
    ('Coquimbo', 'IV'),
    ('Valparaíso', 'V'),
    ('Metropolitana de Santiago', 'RM'),
    ('Libertador General Bernardo O''Higgins', 'VI'),
    ('Maule', 'VII'),
    ('Ñuble', 'XVI'),
    ('Biobío', 'VIII'),
    ('Araucanía', 'IX'),
    ('Los Ríos', 'XIV'),
    ('Los Lagos', 'X'),
    ('Aysén del General Carlos Ibáñez del Campo', 'XI'),
    ('Magallanes y de la Antártica Chilena', 'XII');
END
GO
