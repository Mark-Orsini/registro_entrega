# Sistema de Registro de Entregas

Sistema completo de gestión de entregas con autenticación, panel de control, exportación de datos y soporte bilingüe (Español/Inglés).

## 🚀 Características

- ✅ **Autenticación completa**: Login, registro y recuperación de contraseña
- ✅ **Gestión de entregas**: CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ **Filtros avanzados**: Por región, comuna, nombre, apellido, fecha y búsqueda general
- ✅ **Exportación**: PDF y Excel con filtros aplicados
- ✅ **Bilingüe**: Español e Inglés con cambio dinámico
- ✅ **Validación de RUT**: Validación automática de RUT chileno
- ✅ **Sesiones seguras**: JWT con expiración automática
- ✅ **Diseño moderno**: Interfaz responsive y profesional

## 📋 Requisitos Previos

- **Node.js** v14 o superior
- **MySQL** v5.7 o superior
- **npm** o **yarn**

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd registro_entrega
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos

#### Opción A: Base de Datos Local

1. Crear la base de datos en MySQL:

```bash
mysql -u root -p < database/init.sql
```

2. (Opcional) Poblar con datos de prueba:

```bash
mysql -u root -p registro_entregas < database/seed_data.sql
```

#### Opción B: Base de Datos Remota

1. En el PC que tendrá la base de datos, crear la base de datos:

```bash
mysql -u root -p < database/init.sql
mysql -u root -p registro_entregas < database/seed_data.sql
```

2. Crear usuario remoto en MySQL:

```sql
-- Conectarse a MySQL
mysql -u root -p

-- Crear usuario para acceso remoto
CREATE USER 'usuario_remoto'@'%' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON registro_entregas.* TO 'usuario_remoto'@'%';
FLUSH PRIVILEGES;
```

3. Configurar MySQL para aceptar conexiones remotas:

Editar el archivo de configuración de MySQL (my.cnf o my.ini):

```ini
[mysqld]
bind-address = 0.0.0.0
```

4. Reiniciar MySQL y abrir el puerto 3306 en el firewall.

### 4. Configurar variables de entorno

1. Copiar el archivo de ejemplo:

```bash
copy .env.example .env
```

2. Editar `.env` con tus credenciales:

**Para base de datos local:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=registro_entregas
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=cambia_esto_por_una_clave_super_segura_123456789
JWT_EXPIRES_IN=24h
```

**Para base de datos remota:**
```env
DB_HOST=192.168.1.100  # IP del PC con la base de datos
DB_USER=usuario_remoto
DB_PASSWORD=password_seguro
DB_NAME=registro_entregas
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=cambia_esto_por_una_clave_super_segura_123456789
JWT_EXPIRES_IN=24h
```

## ▶️ Ejecución

### Modo Desarrollo (con reinicio automático)

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor estará disponible en: **http://localhost:3000**

## 👤 Usuarios de Prueba

Después de ejecutar `seed_data.sql`, tendrás estos usuarios disponibles:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sistema.com | admin123 | Administrador |
| operador@sistema.com | admin123 | Operador |
| pedro@sistema.com | admin123 | Operador |

## 📚 Estructura del Proyecto

```
registro_entrega/
├── database/
│   ├── init.sql           # Esquema de base de datos
│   └── seed_data.sql      # Datos de prueba
├── public/
│   ├── index.html         # Interfaz principal
│   ├── style.css          # Estilos
│   ├── script.js          # Lógica frontend
│   ├── api.js             # Cliente API
│   ├── i18n.js            # Sistema de idiomas
│   └── locales/
│       ├── es.json        # Traducciones español
│       └── en.json        # Traducciones inglés
├── src/
│   ├── api/
│   │   ├── auth/          # Rutas de autenticación
│   │   ├── deliveries/    # Rutas de entregas
│   │   └── index.js       # Router central
│   ├── config/
│   │   └── database.js    # Configuración MySQL
│   ├── middleware/
│   │   └── auth.js        # Middleware JWT
│   └── utils/
│       └── validators.js  # Validadores
├── server.js              # Servidor Express
├── package.json
└── .env                   # Variables de entorno
```

## 🔌 API Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/forgot-password` - Solicitar código de recuperación
- `POST /api/auth/verify-code` - Verificar código
- `POST /api/auth/reset-password` - Cambiar contraseña

### Entregas

- `GET /api/deliveries` - Listar entregas (con filtros opcionales)
- `GET /api/deliveries/:id` - Obtener entrega específica
- `POST /api/deliveries` - Crear entrega
- `PUT /api/deliveries/:id` - Actualizar entrega
- `DELETE /api/deliveries/:id` - Eliminar entrega
- `GET /api/deliveries/export/pdf` - Exportar a PDF
- `GET /api/deliveries/export/excel` - Exportar a Excel

### Filtros Disponibles

```
?region=Metropolitana
?comuna=Santiago
?estado=entregado
?nombre=Juan
?apellido=Pérez
?busqueda=laptop
?orden=A-Z|reciente|antigua
?fecha_desde=2025-01-01
?fecha_hasta=2025-01-31
```

## 🌐 Cambio de Idioma

El sistema soporta español e inglés. El cambio se realiza desde el selector en la interfaz y se guarda automáticamente en `localStorage`.

## 🔒 Seguridad

- **Contraseñas hasheadas** con bcrypt
- **Tokens JWT** para autenticación
- **Validación de RUT** chileno
- **Sesiones con expiración** automática por inactividad (5 minutos)
- **Protección de rutas** con middleware

## 📊 Base de Datos

### Tablas Principales

1. **usuarios**: Información de usuarios del sistema
2. **entregas**: Registros de entregas
3. **codigos_recuperacion**: Códigos temporales para recuperación de contraseña

### Índices Optimizados

- Índice en `email` y `rut` para búsquedas rápidas
- Índice en `estado` y `fecha_creacion` para filtros
- Índice compuesto en `region` y `comuna`
- Índice en `apellido_destinatario` y `nombre_destinatario`

## 🐛 Solución de Problemas

### Error: "Cannot connect to MySQL"

1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `.env`
3. Verifica que la base de datos exista
4. Para conexión remota, verifica firewall y bind-address

### Error: "JWT_SECRET is not defined"

Asegúrate de tener el archivo `.env` configurado correctamente.

### Puerto 3000 ya en uso

Cambia el puerto en `.env`:
```env
PORT=3001
```

## 📝 Licencia

ISC

## 👨‍💻 Autor

Making Tech - 2025

---

## 🚀 Próximos Pasos

Para comenzar a usar el sistema:

1. Ejecuta `npm install`
2. Configura tu base de datos
3. Copia y configura `.env`
4. Ejecuta `npm run dev`
5. Abre http://localhost:3000
6. Inicia sesión con `admin@sistema.com` / `admin123`

¡Listo! 🎉
