# Sistema de Registro de Entregas - Making Tech

Plataforma profesional para la gestión de envíos y entregas, diseñada para optimizar el seguimiento de registros, exportación de datos y administración de usuarios.

## Características Principales

*   **Administración Integral**: CRUD completo para el registro de entregas.
*   **Seguridad**: Autenticación basada en JWT y sesiones con cierre automático por inactividad.
*   **Herramientas de Exportación**: Generación de reportes en formatos PDF y Excel.
*   **Búsqueda Avanzada**: Sistema de filtrado modular por zona geográfica, destinatario y estado.
*   **Interfaz Multilingüe**: Soporte nativo para Español e Inglés.
*   **Validaciones**: Verificación automática de RUT chileno y datos de contacto.

## Instalación y Configuración

### 1. Dependencias
Asegúrese de tener instalado Node.js (v14+) y MySQL (v5.7+).

```bash
npm install
```

### 2. Base de Datos
1. Cree una base de datos en MySQL llamada `registro_entregas`.
2. Importe el esquema inicial desde `database/init.sql`.
3. (Opcional) Cargue datos de prueba desde `database/seed_data.sql`.

### 3. Variables de Entorno
Cree un archivo `.env` en la raíz del proyecto basándose en `.env.example`. Los parámetros principales son:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=registro_entregas
JWT_SECRET=una_clave_segura_aleatoria
```

## Ejecución

Para iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

Para el entorno de producción:
```bash
npm start
```

El sistema estará accesible en: `http://localhost:3000`

## Credenciales de Acceso (Test)

| Perfil | Email | Password |
| :--- | :--- | :--- |
| Administrador | admin@sistema.com | admin123 |
| Operador | operador@sistema.com | admin123 |

## Estructura del Proyecto

*   `/src`: Lógica del servidor, API y configuración.
*   `/public`: Interfaz de usuario (HTML, CSS, JS).
*   `/database`: Scripts SQL para inicialización.

---
© 2025 Making Tech. Todos los derechos reservados.
