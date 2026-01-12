document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================

    // Modales
    const modalLogin = document.getElementById('modalLogin');
    const modalRecuperar = document.getElementById('modalRecuperarClave');
    const modalRegistro = document.getElementById('modalRegistro');

    // Formularios
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const formSolicitarCodigo = document.getElementById('formSolicitarCodigo');
    const formVerificarCodigo = document.getElementById('formVerificarCodigo');
    const formNuevaClave = document.getElementById('formNuevaClave');

    // Links
    const btnIniciarSesionNav = document.getElementById('btnIniciarSesion');
    const linkRecuperarClave = document.getElementById('linkRecuperarClave');
    const linkRegistro = document.getElementById('linkRegistro');
    const linkYaTengoCuenta = document.getElementById('linkYaTengoCuenta');
    const cerrarRecuperar = document.getElementById('cerrarRecuperar');
    const cerrarRegistro = document.getElementById('cerrarRegistro');

    // Filtros
    const btnAlternarFiltro = document.getElementById('btnAlternarFiltro');
    const menuFiltros = document.getElementById('menuFiltros');
    const selectIdioma = document.querySelector('.select-idioma');
    const botonesAccion = document.querySelectorAll('.botones-accion .btn');

    // ============================================
    // CONFIGURACIÓN DE SESIÓN
    // ============================================

    const TIEMPO_EXPIRACION_MINUTOS = 5;
    const CLAVE_SESION = 'app_entrega_sesion';

    // Variable para almacenar email durante recuperación
    let emailRecuperacion = '';
    let codigoRecuperacion = '';

    // ============================================
    // FUNCIONES DE VALIDACIÓN
    // ============================================

    // Validar RUT chileno
    function validarRut(rut) {
        // Limpiar formato
        rut = rut.replace(/\./g, '').replace(/-/g, '');

        if (rut.length < 2) return false;

        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();

        // Calcular dígito verificador
        let suma = 0;
        let multiplo = 2;

        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo.charAt(i)) * multiplo;
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }

        const dvEsperado = 11 - (suma % 11);
        const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);

        return dv === dvCalculado;
    }

    // Formatear RUT mientras se escribe
    function formatearRut(rut) {
        rut = rut.replace(/\./g, '').replace(/-/g, '');

        if (rut.length <= 1) return rut;

        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);

        // Formatear cuerpo con puntos
        const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return `${cuerpoFormateado}-${dv}`;
    }

    // ============================================
    // FUNCIONES DE ESTADO DE ENTREGA
    // ============================================

    function obtenerClaseEstado(estado) {
        const estadoLower = estado.toLowerCase().trim();

        const mapeo = {
            'entregado': 'estado-entregado',
            'entregada': 'estado-entregado',
            'completado': 'estado-entregado',
            'error': 'estado-error',
            'fallido': 'estado-error',
            'rechazado': 'estado-error',
            'proceso': 'estado-proceso',
            'en proceso': 'estado-proceso',
            'enviado': 'estado-proceso',
            'en camino': 'estado-proceso',
            'devuelto': 'estado-devuelto',
            'devuelta': 'estado-devuelto',
            'retornado': 'estado-devuelto'
        };

        return mapeo[estadoLower] || 'etiqueta-pendiente';
    }

    // ============================================
    // GESTIÓN DE SESIÓN
    // ============================================

    function guardarSesion(datos) {
        const estadoSesion = {
            activo: true,
            email: datos.user?.email || datos.email,
            nombre: datos.user?.nombre,
            token: datos.token,
            ultimaActividad: Date.now()
        };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(estadoSesion));

        if (datos.token) {
            setAuthToken(datos.token);
        }

        actualizarUIUsuario(true, estadoSesion);
        iniciarListenerInactividad();
    }

    function obtenerSesion() {
        const sesionStr = localStorage.getItem(CLAVE_SESION);
        if (!sesionStr) return null;
        return JSON.parse(sesionStr);
    }

    function cerrarSesion() {
        localStorage.removeItem(CLAVE_SESION);
        removeAuthToken();
        actualizarUIUsuario(false);
        if (typeof mostrarModal === 'function' && typeof modalLogin !== 'undefined') {
            mostrarModal(modalLogin);
        }
    }

    function verificarSesionAlInicio() {
        const sesion = obtenerSesion();
        if (sesion && sesion.activo) {
            const ahora = Date.now();
            const tiempoInactivo = (ahora - sesion.ultimaActividad) / 1000 / 60;

            if (tiempoInactivo < TIEMPO_EXPIRACION_MINUTOS) {
                actualizarActividad();
                actualizarUIUsuario(true, sesion);
                iniciarListenerInactividad();
            } else {
                cerrarSesion();
            }
        } else {
            // Si no hay sesión, forzar cierre para mostrar login
            cerrarSesion();
        }
    }

    function actualizarActividad() {
        const sesion = obtenerSesion();
        if (sesion && sesion.activo) {
            sesion.ultimaActividad = Date.now();
            localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        }
    }

    let timerInactividad;
    function iniciarListenerInactividad() {
        document.removeEventListener('mousemove', resetearTimerInactividad);
        document.removeEventListener('keypress', resetearTimerInactividad);
        document.removeEventListener('click', resetearTimerInactividad);
        document.removeEventListener('scroll', resetearTimerInactividad);

        document.addEventListener('mousemove', resetearTimerInactividad);
        document.addEventListener('keypress', resetearTimerInactividad);
        document.addEventListener('click', resetearTimerInactividad);
        document.addEventListener('scroll', resetearTimerInactividad);

        resetearTimerInactividad();
    }

    function resetearTimerInactividad() {
        actualizarActividad();
        clearTimeout(timerInactividad);
        timerInactividad = setTimeout(() => {
            const sesion = obtenerSesion();
            if (sesion && sesion.activo) {
                mostrarMensaje(window.i18n?.t('msg_sesion_expirada') || 'Tu sesión ha expirado por inactividad.', 'error');
                cerrarSesion();
                if (modalLogin) modalLogin.classList.remove('activo');
            }
        }, TIEMPO_EXPIRACION_MINUTOS * 60 * 1000);
    }

    function actualizarUIUsuario(estaLogueado, datosSesion = null) {
        const dashboardPrincipal = document.getElementById('dashboard-principal');
        const seccionAuth = document.getElementById('seccion-auth');
        const seccionUsuario = document.getElementById('seccion-usuario');
        const navNombreUsuario = document.getElementById('navNombreUsuario');

        // Actualizar botón de navegación
        if (btnIniciarSesionNav) {
            if (estaLogueado) {
                const nombre = datosSesion?.nombre || 'Usuario';
                btnIniciarSesionNav.textContent = `${nombre} - Cerrar Sesión`;
                btnIniciarSesionNav.classList.remove('btn-borde');
                btnIniciarSesionNav.classList.add('btn-primario');
            } else {
                btnIniciarSesionNav.textContent = 'Iniciar Sesión';
                btnIniciarSesionNav.classList.add('btn-borde');
                btnIniciarSesionNav.classList.remove('btn-primario');
            }
        }

        // Actualizar visibilidad de secciones
        if (estaLogueado) {
            if (seccionAuth) seccionAuth.style.display = 'none';
            if (seccionUsuario) {
                seccionUsuario.style.display = 'flex';
                if (navNombreUsuario) navNombreUsuario.textContent = datosSesion?.nombre || 'Usuario';
            }
            if (dashboardPrincipal) {
                dashboardPrincipal.classList.remove('dashboard-blur');
            }

            // Cargar datos al entrar
            cargarEntregas();
        } else {
            if (seccionAuth) seccionAuth.style.display = 'block';
            if (seccionUsuario) seccionUsuario.style.display = 'none';
            if (dashboardPrincipal) {
                dashboardPrincipal.classList.add('dashboard-blur');
            }

            // Auto-abrir modal de login cuando no hay sesión
            if (modalLogin && !modalLogin.classList.contains('activo')) {
                mostrarModal(modalLogin);
            }
        }
    }

    // ============================================
    // FUNCIONES DE UI
    // ============================================

    function mostrarModal(modal) {
        cerrarTodosLosModales();
        if (modal) {
            modal.classList.add('activo');
            document.body.classList.add('modal-abierto');
        }
    }

    function cerrarModal(modal) {
        if (modal) {
            modal.classList.remove('activo');
            document.body.classList.remove('modal-abierto');
        }
    }

    function cerrarTodosLosModales() {
        // Fix #1: No permitir cerrar modal de login si no hay sesión
        const sesion = obtenerSesion();
        if (!sesion || !sesion.activo) {
            // Solo cerrar modales de recuperación y registro, mantener login abierto
            if (modalRecuperarClave) modalRecuperarClave.classList.remove('activo');
            if (modalRegistro) modalRegistro.classList.remove('activo');
            return;
        }

        [modalLogin, modalRecuperarClave, modalRegistro].forEach(m => {
            if (m) m.classList.remove('activo');
        });
        document.body.classList.remove('modal-abierto');
    }

    function mostrarMensaje(texto, tipo = 'info', contenedor = null) {
        const div = document.createElement('div');
        div.className = `mensaje-formulario mensaje-${tipo}`;
        div.textContent = texto;

        if (contenedor) {
            const mensajeAnterior = contenedor.querySelector('.mensaje-formulario');
            if (mensajeAnterior) mensajeAnterior.remove();
            contenedor.insertBefore(div, contenedor.firstChild);
        }
    }

    // Sistema de notificaciones toast
    function mostrarNotificacion(texto, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-toast notificacion-${tipo}`;
        notificacion.textContent = texto;
        document.body.appendChild(notificacion);

        setTimeout(() => notificacion.classList.add('mostrar'), 100);
        setTimeout(() => {
            notificacion.classList.remove('mostrar');
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }

    function cambiarPasoRecuperacion(paso) {
        document.querySelectorAll('.paso-recuperacion').forEach(p => p.classList.remove('activo'));
        const pasoElemento = document.getElementById(paso);
        if (pasoElemento) pasoElemento.classList.add('activo');
    }

    // ============================================
    // LÓGICA DE LOGIN
    // ============================================

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await API.login(email, password);

                if (response.success) {
                    cerrarModal(modalLogin);
                    guardarSesion(response);
                    mostrarNotificacion(`${window.i18n?.t('msg_login_exitoso') || '¡Bienvenido!'} ${response.user?.nombre || 'Usuario'}!`, 'exito');
                } else {
                    mostrarMensaje(response.message || window.i18n?.t('msg_error_login') || 'Error al iniciar sesión', 'error', formLogin);
                }
            } catch (error) {
                mostrarMensaje(error.message || window.i18n?.t('msg_error_conexion') || 'Error al conectar con el servidor', 'error', formLogin);
            }
        });
    }

    // ============================================
    // LÓGICA DE REGISTRO
    // ============================================

    if (formRegistro) {
        // Formatear RUT mientras se escribe
        const inputRut = document.getElementById('regRut');
        if (inputRut) {
            inputRut.addEventListener('input', (e) => {
                const valor = e.target.value.replace(/\./g, '').replace(/-/g, '');
                e.target.value = formatearRut(valor);
            });
        }

        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('regNombre').value;
            const apellido = document.getElementById('regApellido').value;
            const rut = document.getElementById('regRut').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            // Validaciones
            if (!validarRut(rut)) {
                mostrarMensaje(window.i18n?.t('msg_rut_invalido') || 'El RUT ingresado no es válido', 'error', formRegistro);
                return;
            }

            if (password !== confirmPassword) {
                mostrarMensaje(window.i18n?.t('msg_passwords_no_coinciden') || 'Las contraseñas no coinciden', 'error', formRegistro);
                return;
            }

            if (password.length < 6) {
                mostrarMensaje(window.i18n?.t('msg_password_corta') || 'La contraseña debe tener al menos 6 caracteres', 'error', formRegistro);
                return;
            }

            try {
                const response = await API.register({
                    nombre,
                    apellido,
                    rut,
                    email,
                    password
                });

                if (response.success) {
                    // Auto-login después del registro
                    const loginResponse = await API.login(email, password);

                    if (loginResponse.success) {
                        cerrarModal(modalRegistro);
                        guardarSesion(loginResponse);
                        mostrarNotificacion(window.i18n?.t('msg_registro_login_exitoso') || '¡Cuenta creada! Bienvenido.', 'exito');
                        formRegistro.reset();
                    } else {
                        cerrarModal(modalRegistro);
                        mostrarNotificacion(window.i18n?.t('msg_registro_exitoso') || 'Registro exitoso. Por favor, inicia sesión.', 'exito');
                        mostrarModal(modalLogin);
                        formRegistro.reset();
                    }
                } else {
                    mostrarMensaje(response.message || 'Error al registrar', 'error', formRegistro);
                }
            } catch (error) {
                mostrarMensaje(error.message || 'Error al conectar con el servidor', 'error', formRegistro);
            }
        });
    }

    // ============================================
    // LÓGICA DE RECUPERACIÓN DE CONTRASEÑA
    // ============================================

    // Paso 1: Solicitar Código
    if (formSolicitarCodigo) {
        formSolicitarCodigo.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('recuperarEmail').value;
            emailRecuperacion = email;

            try {
                const response = await API.forgotPassword(email);

                if (response.success) {
                    mostrarMensaje('Código enviado a tu correo', 'exito');
                    cambiarPasoRecuperacion('pasoCodigo');
                } else {
                    mostrarMensaje(response.message || 'Error al enviar código', 'error', formSolicitarCodigo);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje(error.message || 'Error al conectar', 'error', formSolicitarCodigo);
            }
        });
    }

    // Paso 2: Verificar Código
    if (formVerificarCodigo) {
        formVerificarCodigo.addEventListener('submit', async (e) => {
            e.preventDefault();

            const codigo = document.getElementById('codigoVerificacion').value;
            codigoRecuperacion = codigo;

            try {
                const response = await API.verifyCode(emailRecuperacion, codigo);

                if (response.success) {
                    mostrarMensaje('Código verificado', 'exito');
                    cambiarPasoRecuperacion('pasoNuevaClave');
                } else {
                    mostrarMensaje(response.message || 'Código incorrecto', 'error', formVerificarCodigo);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje(error.message || 'Error al verificar', 'error', formVerificarCodigo);
            }
        });

        // Botón volver
        const btnVolverCorreo = document.getElementById('btnVolverCorreo');
        if (btnVolverCorreo) {
            btnVolverCorreo.addEventListener('click', () => {
                cambiarPasoRecuperacion('pasoCorreo');
            });
        }
    }

    // Paso 3: Nueva Contraseña
    if (formNuevaClave) {
        formNuevaClave.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nuevaClave = document.getElementById('nuevaClave').value;
            const confirmarClave = document.getElementById('confirmarClave').value;

            if (nuevaClave !== confirmarClave) {
                mostrarMensaje('Las contraseñas no coinciden', 'error', formNuevaClave);
                return;
            }

            if (nuevaClave.length < 6) {
                mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error', formNuevaClave);
                return;
            }

            try {
                const response = await API.resetPassword(emailRecuperacion, codigoRecuperacion, nuevaClave);

                if (response.success) {
                    cerrarModal(modalRecuperarClave);
                    cambiarPasoRecuperacion('pasoCorreo');
                    mostrarMensaje('Contraseña cambiada exitosamente', 'exito');
                    mostrarModal(modalLogin);
                } else {
                    mostrarMensaje(response.message || 'Error al cambiar contraseña', 'error', formNuevaClave);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje(error.message || 'Error al conectar', 'error', formNuevaClave);
            }
        });
    }

    // ============================================
    // NAVEGACIÓN ENTRE MODALES
    // ============================================

    if (btnIniciarSesionNav) {
        btnIniciarSesionNav.addEventListener('click', () => {
            const sesion = obtenerSesion();
            if (sesion && sesion.activo) {
                cerrarSesion();
            } else {
                mostrarModal(modalLogin);
            }
        });
    }

    if (linkRecuperarClave) {
        linkRecuperarClave.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarModal(modalRecuperarClave);
            cambiarPasoRecuperacion('pasoCorreo');
        });
    }

    if (linkRegistro) {
        linkRegistro.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarModal(modalRegistro);
        });
    }

    const btnVolverLogin = document.getElementById('btnVolverLogin');
    if (btnVolverLogin) {
        btnVolverLogin.addEventListener('click', () => {
            mostrarModal(modalLogin);
        });
    }

    if (cerrarRecuperar) {
        cerrarRecuperar.addEventListener('click', () => {
            cerrarModal(modalRecuperarClave);
            cambiarPasoRecuperacion('pasoCorreo');
        });
    }

    if (cerrarRegistro) {
        cerrarRegistro.addEventListener('click', () => {
            cerrarModal(modalRegistro);
        });
    }

    // ============================================
    // FILTROS Y BÚSQUEDA
    // ============================================

    // Fix #3: Arreglar dropdown de filtros
    if (btnAlternarFiltro && menuFiltros) {
        btnAlternarFiltro.addEventListener('click', (e) => {
            e.stopPropagation();
            menuFiltros.classList.toggle('mostrar');
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!menuFiltros.contains(e.target) && !btnAlternarFiltro.contains(e.target)) {
                menuFiltros.classList.remove('mostrar');
            }
        });

        // Manejar selección de filtros
        const opcionesFiltro = menuFiltros.querySelectorAll('a[data-filtro]');
        opcionesFiltro.forEach(opcion => {
            opcion.addEventListener('click', (e) => {
                e.preventDefault();
                const filtro = e.currentTarget.dataset.filtro;
                aplicarFiltro(filtro);
                menuFiltros.classList.remove('mostrar');
            });
        });
    }

    // Fix #2: Búsqueda en tiempo real
    let timeoutBusqueda;
    const inputBusqueda = document.getElementById('inputBusqueda');

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                filtrosActuales.busqueda = e.target.value.trim();
                actualizarBadgesFiltros();
                cargarEntregas();
            }, 300); // Debounce de 300ms
        });
    }

    function aplicarFiltro(filtro) {
        switch (filtro) {
            case 'az':
                filtrosActuales.orden = 'A-Z';
                break;
            case 'fecha-desc':
                filtrosActuales.orden = 'reciente';
                break;
            case 'fecha-asc':
                filtrosActuales.orden = 'antigua';
                break;
            case 'nombre':
                if (inputBusqueda && inputBusqueda.value.trim()) {
                    filtrosActuales.busqueda = inputBusqueda.value.trim();
                    filtrosActuales.tipoBusqueda = window.i18n?.t('filtro_nombre') || 'Nombre';
                } else {
                    if (inputBusqueda) inputBusqueda.focus();
                    mostrarNotificacion(window.i18n?.t('msg_ingresar_nombre') || 'Escribe un nombre en el buscador', 'info');
                    return; // No recargar si no hay datos
                }
                break;
            case 'apellido':
                if (inputBusqueda && inputBusqueda.value.trim()) {
                    filtrosActuales.busqueda = inputBusqueda.value.trim();
                    filtrosActuales.tipoBusqueda = window.i18n?.t('filtro_apellido') || 'Apellido';
                } else {
                    if (inputBusqueda) inputBusqueda.focus();
                    mostrarNotificacion(window.i18n?.t('msg_ingresar_apellido') || 'Escribe un apellido en el buscador', 'info');
                    return;
                }
                break;
            default:
                break;
        }

        actualizarBadgesFiltros();
        cargarEntregas();
    }

    function actualizarBadgesFiltros() {
        // Contenedor principal de badges (usamos el mismo span pero lo limpiamos)
        const contenedorBadges = document.getElementById('filtroActivoBadge');
        if (!contenedorBadges) return;

        contenedorBadges.innerHTML = '';
        contenedorBadges.style.display = 'none';

        let hayFiltros = false;

        // Badge de Orden
        if (filtrosActuales.orden) {
            let textoOrden = '';
            if (filtrosActuales.orden === 'A-Z') textoOrden = window.i18n?.t('filtro_az') || 'A-Z';
            else if (filtrosActuales.orden === 'reciente') textoOrden = window.i18n?.t('filtro_fecha_reciente') || 'Fecha: Reciente';
            else if (filtrosActuales.orden === 'antigua') textoOrden = window.i18n?.t('filtro_fecha_antigua') || 'Fecha: Antigua';

            if (textoOrden) {
                crearBadge(textoOrden, () => {
                    delete filtrosActuales.orden;
                    actualizarBadgesFiltros();
                    cargarEntregas();
                });
                hayFiltros = true;
            }
        }

        // Badge de Búsqueda
        if (filtrosActuales.busqueda && filtrosActuales.busqueda.length > 0) {
            // Si usamos input normal, tal vez no queremos badge, pero si viene de menú sí?
            // El usuario pidió "los demas filtros... se vea como en la imagen".
            // Asumiremos que si hay búsqueda, mostramos badge.
            const tipo = filtrosActuales.tipoBusqueda || (window.i18n?.t('busqueda') || 'Búsqueda');
            crearBadge(`${tipo}: ${filtrosActuales.busqueda}`, () => {
                delete filtrosActuales.busqueda;
                delete filtrosActuales.tipoBusqueda;
                if (inputBusqueda) inputBusqueda.value = '';
                actualizarBadgesFiltros();
                cargarEntregas();
            });
            hayFiltros = true;
        }

        if (hayFiltros) {
            contenedorBadges.style.display = 'inline-flex';
            contenedorBadges.style.gap = '10px';
            contenedorBadges.style.background = 'transparent'; // Quitar fondo del contenedor padre si tiene
            contenedorBadges.style.padding = '0';
        }
    }

    function crearBadge(texto, onClickCerrar) {
        const contenedorBadges = document.getElementById('filtroActivoBadge');
        const badge = document.createElement('span');
        badge.className = 'filtro-individual-badge'; // Clase nueva para estilo
        // Estilo inline temporal para asegurar que se vea como la imagen (azul, redondeado)
        // Idealmente esto iría en CSS, pero para asegurar el cambio rápido:
        badge.style.backgroundColor = '#3b82f6'; // Azul
        badge.style.color = 'white';
        badge.style.padding = '5px 12px';
        badge.style.borderRadius = '20px';
        badge.style.fontSize = '0.9rem';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '8px';
        badge.style.marginRight = '8px';

        badge.innerHTML = `${texto} <i class="bi bi-x" style="cursor: pointer;"></i>`;

        const closeIcon = badge.querySelector('i');
        closeIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            onClickCerrar();
        });

        contenedorBadges.appendChild(badge);
    }

    // ============================================
    // DASHBOARD Y ENTREGAS
    // ============================================

    const cuerpoTabla = document.getElementById('cuerpo-tabla-registros');
    const seccionAuth = document.getElementById('seccion-auth');
    const seccionUsuario = document.getElementById('seccion-usuario');
    const navNombreUsuario = document.getElementById('navNombreUsuario');
    const dashboardPrincipal = document.getElementById('dashboard-principal');
    const landingPage = document.getElementById('landing-page');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnRecargar = document.getElementById('btnRecargar');

    // Filtros activos
    let filtrosActuales = {};

    async function cargarEntregas() {
        if (!cuerpoTabla) return;

        try {
            cuerpoTabla.innerHTML = `<tr><td colspan="7" class="text-center">${window.i18n?.t('cargando') || 'Cargando...'}</td></tr>`;

            const response = await API.getDeliveries(filtrosActuales);

            if (response.success) {
                renderizarTabla(response.data);
            } else {
                cuerpoTabla.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${window.i18n?.t('error_cargar_datos') || 'Error al cargar datos'}</td></tr>`;
            }
        } catch (error) {
            cuerpoTabla.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${window.i18n?.t('msg_error_conexion') || 'Error de conexión'}</td></tr>`;
        }
    }

    // Fix #9: Tracking de registros seleccionados
    let registrosSeleccionados = new Set();

    function renderizarTabla(entregas) {
        cuerpoTabla.innerHTML = '';

        if (entregas.length === 0) {
            cuerpoTabla.innerHTML = `<tr><td colspan="7" class="text-center">${window.i18n?.t('no_registros') || 'No hay registros encontrados'}</td></tr>`;
            return;
        }

        entregas.forEach(entrega => {
            const tr = document.createElement('tr');
            tr.dataset.id = entrega.id;
            tr.innerHTML = `
                <td class="col-checkbox">
                    <input type="checkbox" class="checkbox-registro" data-id="${entrega.id}">
                </td>
                <td>#${entrega.id}</td>
                <td>
                    <div class="fw-bold">${entrega.nombre_destinatario} ${entrega.apellido_destinatario}</div>
                    <small class="text-muted">${entrega.rut_destinatario || ''}</small>
                </td>
                <td>
                    <div>${entrega.direccion}</div>
                    <small class="text-muted">${entrega.comuna_nombre || entrega.comuna}, ${entrega.region_nombre || entrega.region}</small>
                </td>
                <td>${entrega.producto || window.i18n?.t('na') || 'N/A'}</td>
                <td>
                    <span class="etiqueta ${obtenerClaseEstado(entrega.estado)}">
                        ${traducirEstado(entrega.estado)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon btn-editar" title="Editar" data-id="${entrega.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon btn-eliminar" title="Eliminar" data-id="${entrega.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
            cuerpoTabla.appendChild(tr);
        });

        // Listeners para botones de acción dentro de la tabla
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => editarEntrega(btn.dataset.id));
        });
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => eliminarEntrega(btn.dataset.id));
        });

        // Fix #9: Listeners para checkboxes
        document.querySelectorAll('.checkbox-registro').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const row = e.target.closest('tr');

                if (e.target.checked) {
                    registrosSeleccionados.add(id);
                    row.classList.add('fila-seleccionada');
                } else {
                    registrosSeleccionados.delete(id);
                    row.classList.remove('fila-seleccionada');
                }
                actualizarSelectAll();
            });
        });
    }

    // Fix #9: Select all functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.checkbox-registro');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                const id = parseInt(checkbox.dataset.id);
                const row = checkbox.closest('tr');

                if (e.target.checked) {
                    registrosSeleccionados.add(id);
                    row.classList.add('fila-seleccionada');
                } else {
                    registrosSeleccionados.delete(id);
                    row.classList.remove('fila-seleccionada');
                }
            });
        });
    }

    function actualizarSelectAll() {
        if (!selectAllCheckbox) return;
        const checkboxes = document.querySelectorAll('.checkbox-registro');
        const totalCheckboxes = checkboxes.length;
        const checkedCheckboxes = document.querySelectorAll('.checkbox-registro:checked').length;

        selectAllCheckbox.checked = totalCheckboxes > 0 && totalCheckboxes === checkedCheckboxes;
        selectAllCheckbox.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
    }

    // Cargar comunas para el select
    async function cargarComunas() {
        if (!crearComuna) return;

        try {
            // Limpiar opciones anteriores pero mantener el placeholder
            crearComuna.innerHTML = `<option value="" disabled selected data-i18n="placeholder_seleccionar_comuna">${window.i18n?.t('placeholder_seleccionar_comuna') || 'Seleccione una comuna'}</option>`;

            const response = await API.getCommunes();
            if (response.success) {
                const comunas = response.data;

                // Ordenar alfabéticamente si no vienen ordenadas
                comunas.sort((a, b) => a.nombre.localeCompare(b.nombre));

                comunas.forEach(comuna => {
                    const option = document.createElement('option');
                    option.value = comuna.id;
                    option.textContent = comuna.nombre;
                    crearComuna.appendChild(option);
                });
            } else {
                console.error('Error cargando comunas:', response.message);
                mostrarNotificacion('Error cargando comunas', 'error');
            }
        } catch (error) {
            console.error('Error de red al cargar comunas:', error);
            mostrarNotificacion('Error de conexión', 'error');
        }
    }

    // Funciones placeholders para edición/eliminación
    // Variables de estado para edición
    let modoEdicion = false;
    let idEdicion = null;

    async function editarEntrega(id) {
        try {
            const response = await API.getDeliveryById(id);
            if (response.success) {
                const entrega = response.data;

                // Preparar modal para edición
                modoEdicion = true;
                idEdicion = id;

                // Actualizar textos
                if (document.querySelector('#modalCrearRegistro h2')) {
                    document.querySelector('#modalCrearRegistro h2').textContent = 'Editar Registro';
                }
                if (document.querySelector('#modalCrearRegistro p')) {
                    document.querySelector('#modalCrearRegistro p').textContent = `Editando entrega #${id}`;
                }
                const btnSubmit = formCrearRegistro.querySelector('button[type="submit"]');
                if (btnSubmit) btnSubmit.textContent = 'Guardar Cambios';

                // Cargar comunas primero para poder seleccionar la correcta
                await cargarComunasCrear(); // Función renombrada para claridad

                // Llenar formulario
                document.getElementById('crearNombre').value = entrega.nombre_destinatario || '';
                document.getElementById('crearApellido').value = entrega.apellido_destinatario || '';
                document.getElementById('crearRut').value = entrega.rut_destinatario || '';
                document.getElementById('crearDireccion').value = entrega.direccion || '';

                // Seleccionar comuna (asegurar que es string para comparación)
                const selectComuna = document.getElementById('crearComuna');
                if (selectComuna) selectComuna.value = entrega.comuna_id;

                document.getElementById('crearTelefono').value = entrega.telefono_destinatario || '';
                document.getElementById('crearEmailDest').value = entrega.email_destinatario || '';
                document.getElementById('crearProducto').value = entrega.producto || '';
                document.getElementById('crearPeso').value = entrega.peso_kg || '';
                document.getElementById('crearEstado').value = entrega.estado || 'pendiente';

                mostrarModal(modalCrearRegistro);
            } else {
                mostrarNotificacion('Error al cargar datos de la entrega', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error de conexión', 'error');
        }
    }

    async function eliminarEntrega(id) {
        // Usar notificación en lugar de confirm
        if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

        try {
            const res = await API.deleteDelivery(id);
            if (res.success) {
                mostrarNotificacion(window.i18n?.t('msg_entrega_eliminada') || 'Entrega eliminada', 'exito');
                registrosSeleccionados.delete(parseInt(id));
                cargarEntregas();
            } else {
                mostrarNotificacion('Error al eliminar', 'error');
            }
        } catch (error) {
            mostrarNotificacion('Error de conexión', 'error');
        }
    }

    if (btnRecargar) {
        btnRecargar.addEventListener('click', cargarEntregas);
    }

    // Fix #9: Exportación con validación de selección
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    const btnExportarExcel = document.getElementById('btnExportarExcel');

    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', async () => {
            if (registrosSeleccionados.size === 0) {
                mostrarNotificacion('Tiene que seleccionar un registro para exportar.', 'error');
                return;
            }

            try {
                const ids = Array.from(registrosSeleccionados).join(',');
                await API.exportPDF({ ids });
                mostrarNotificacion(window.i18n?.t('msg_pdf_descargado') || 'PDF descargado', 'exito');
            } catch (error) {
                mostrarNotificacion(window.i18n?.t('msg_error_exportar_pdf') || 'Error al exportar PDF', 'error');
            }
        });
    }

    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', async () => {
            if (registrosSeleccionados.size === 0) {
                mostrarNotificacion('Tiene que seleccionar un registro para exportar.', 'error');
                return;
            }

            try {
                const ids = Array.from(registrosSeleccionados).join(',');
                await API.exportExcel({ ids });
                mostrarNotificacion(window.i18n?.t('msg_excel_descargado') || 'Excel descargado', 'exito');
            } catch (error) {
                mostrarNotificacion(window.i18n?.t('msg_error_exportar_excel') || 'Error al exportar Excel', 'error');
            }
        });
    }

    // Fix #7: Modal Crear Registro
    const modalCrearRegistro = document.getElementById('modalCrearRegistro');
    const btnNuevoRegistro = document.getElementById('btnNuevoRegistro');
    const formCrearRegistro = document.getElementById('formCrearRegistro');
    const btnCancelarCrear = document.getElementById('btnCancelarCrear');
    const cerrarCrearRegistro = document.getElementById('cerrarCrearRegistro');

    if (btnNuevoRegistro) {
        btnNuevoRegistro.addEventListener('click', () => {
            resetearFormularioCrear();
            mostrarModal(modalCrearRegistro);
            cargarComunasCrear();
        });
    }

    function resetearFormularioCrear() {
        modoEdicion = false;
        idEdicion = null;
        if (formCrearRegistro) formCrearRegistro.reset();

        // Restaurar textos
        if (document.querySelector('#modalCrearRegistro h2')) {
            document.querySelector('#modalCrearRegistro h2').textContent = 'Crear Nuevo Registro';
        }
        if (document.querySelector('#modalCrearRegistro p')) {
            document.querySelector('#modalCrearRegistro p').textContent = 'Completa los datos de la entrega';
        }
        const btnSubmit = formCrearRegistro?.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.textContent = 'Crear Registro';
    }

    if (btnCancelarCrear) {
        btnCancelarCrear.addEventListener('click', () => {
            cerrarModal(modalCrearRegistro);
            if (formCrearRegistro) formCrearRegistro.reset();
        });
    }

    if (cerrarCrearRegistro) {
        cerrarCrearRegistro.addEventListener('click', () => {
            cerrarModal(modalCrearRegistro);
            if (formCrearRegistro) formCrearRegistro.reset();
        });
    }

    // Cargar comunas dinámicamente
    async function cargarComunasCrear() {
        const selectComuna = document.getElementById('crearComuna');
        if (!selectComuna) return;

        // Evitar recargar si ya tiene opciones (más allá del placeholder)
        if (selectComuna.options.length > 1) return;

        try {
            // Intentar cargar comunas desde la API
            const response = await fetch('http://localhost:3000/api/comunas');
            const data = await response.json();

            if (data.success && data.data) {
                // Mantener placeholder
                selectComuna.innerHTML = '<option value="">Seleccione una comuna</option>';
                data.data.forEach(comuna => {
                    const option = document.createElement('option');
                    option.value = comuna.id;
                    option.textContent = comuna.nombre;
                    selectComuna.appendChild(option);
                });
            }
        } catch (error) {
            // Si falla, dejar opción por defecto
            console.error(error);
        }
    }

    if (formCrearRegistro) {
        // Formatear RUT mientras se escribe
        const inputRutCrear = document.getElementById('crearRut');
        if (inputRutCrear) {
            inputRutCrear.addEventListener('input', (e) => {
                const valor = e.target.value.replace(/\./g, '').replace(/-/g, '');
                e.target.value = formatearRut(valor);
            });
        }

        formCrearRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('crearNombre').value;
            const apellido = document.getElementById('crearApellido').value;
            const rut = document.getElementById('crearRut').value;
            const direccion = document.getElementById('crearDireccion').value;
            const comuna_id = document.getElementById('crearComuna').value;
            const telefono = document.getElementById('crearTelefono').value;
            const email = document.getElementById('crearEmailDest').value;
            const producto = document.getElementById('crearProducto').value;
            const peso = document.getElementById('crearPeso').value;
            const estado = document.getElementById('crearEstado').value;

            // Validar RUT si se proporciona
            if (rut && !validarRut(rut)) {
                mostrarMensaje('El RUT ingresado no es válido', 'error', formCrearRegistro);
                return;
            }

            const datosEntrega = {
                nombre_destinatario: nombre,
                apellido_destinatario: apellido,
                rut_destinatario: rut || null,
                direccion,
                comuna_id: parseInt(comuna_id),
                telefono_destinatario: telefono || null,
                email_destinatario: email || null,
                producto: producto || null,
                peso_kg: peso ? parseFloat(peso) : null,
                estado
            };

            try {
                let response;
                if (modoEdicion && idEdicion) {
                    response = await API.updateDelivery(idEdicion, datosEntrega);
                } else {
                    response = await API.createDelivery(datosEntrega);
                }

                if (response.success) {
                    cerrarModal(modalCrearRegistro);
                    resetearFormularioCrear();
                    mostrarNotificacion(modoEdicion ? 'Registro actualizado' : 'Registro creado exitosamente', 'exito');
                    cargarEntregas();
                } else {
                    mostrarMensaje(response.message || 'Error al procesar registro', 'error', formCrearRegistro);
                }
            } catch (error) {
                mostrarMensaje(error.message || 'Error al conectar con el servidor', 'error', formCrearRegistro);
            }
        });
    }

    // ============================================
    // GESTIÓN DE IDIOMA
    // ============================================

    // Esperar a que i18n esté listo
    window.addEventListener('load', () => {
        if (window.i18n && selectIdioma) {
            // Establecer idioma actual en el selector
            selectIdioma.value = i18n.getCurrentLang();

            // Listener para cambio de idioma
            selectIdioma.addEventListener('change', (e) => {
                i18n.setLanguage(e.target.value);
                // Recargar tabla para traducir estados
                const sesion = obtenerSesion();
                if (sesion && sesion.activo) {
                    cargarEntregas();
                }
            });
        }
    });

    function traducirEstado(estado) {
        if (!estado) return '';
        const key = `estado_${estado.toLowerCase().trim().replace(/\s+/g, '_')}`;
        return window.i18n?.t(key) || estado;
    }



    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', cerrarSesion);
    }

    // Fix #5: Integrar validación de sesión al inicio
    verificarSesionAlInicio();

    // Exportar funciones necesarias globalmente si es necesario
    window.obtenerClaseEstado = obtenerClaseEstado;

});
