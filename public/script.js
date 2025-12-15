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
    const inputBusqueda = document.querySelector('.input-busqueda');
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
        console.log("Sesión cerrada");
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
                mostrarMensaje('Tu sesión ha expirado por inactividad.', 'error');
                cerrarSesion();
                if (modalLogin) modalLogin.classList.remove('activo');
            }
        }, TIEMPO_EXPIRACION_MINUTOS * 60 * 1000);
    }

    function actualizarUIUsuario(estaLogueado, datosSesion = null) {
        if (!btnIniciarSesionNav) return;

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
        } else {
            alert(texto);
        }
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
                // Llamada al API
                const response = await API.login(email, password);

                if (response.success) {
                    cerrarModal(modalLogin);
                    guardarSesion(response);
                    mostrarMensaje(`Bienvenido ${response.user?.nombre || 'Usuario'}!`, 'exito');
                    console.log('Login exitoso:', response);
                } else {
                    mostrarMensaje(response.message || 'Error al iniciar sesión', 'error', formLogin);
                }
            } catch (error) {
                console.error('Error de login:', error);
                mostrarMensaje(error.message || 'Error al conectar con el servidor', 'error', formLogin);
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
                mostrarMensaje('El RUT ingresado no es válido', 'error', formRegistro);
                return;
            }

            if (password !== confirmPassword) {
                mostrarMensaje('Las contraseñas no coinciden', 'error', formRegistro);
                return;
            }

            if (password.length < 6) {
                mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error', formRegistro);
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
                    cerrarModal(modalRegistro);
                    mostrarMensaje('Registro exitoso. Por favor, inicia sesión.', 'exito');
                    mostrarModal(modalLogin);
                    formRegistro.reset();
                } else {
                    mostrarMensaje(response.message || 'Error al registrar', 'error', formRegistro);
                }
            } catch (error) {
                console.error('Error de registro:', error);
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

    if (btnAlternarFiltro && menuFiltros) {
        btnAlternarFiltro.addEventListener('click', (e) => {
            e.stopPropagation();
            menuFiltros.classList.toggle('mostrar');
        });
    }

    document.addEventListener('click', (e) => {
        if (menuFiltros && menuFiltros.classList.contains('mostrar')) {
            if (!menuFiltros.contains(e.target) && !btnAlternarFiltro.contains(e.target)) {
                menuFiltros.classList.remove('mostrar');
            }
        }
    });

    if (menuFiltros) {
        const enlacesFiltro = menuFiltros.querySelectorAll('a');
        enlacesFiltro.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filtroTipo = link.dataset.filtro;
                console.log(`Aplicando filtro: ${filtroTipo}`);
                menuFiltros.classList.remove('mostrar');
            });
        });
    }

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            console.log('Buscando:', e.target.value);
        });
    }

    if (selectIdioma) {
        selectIdioma.addEventListener('change', (e) => {
            const idioma = e.target.value;
            console.log(`Idioma cambiado a: ${idioma}`);
        });
    }

    botonesAccion.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Acción clickeada:', btn.textContent.trim());
        });
    });

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    verificarSesionAlInicio();
    console.log('App lista e inicializada con persistencia y autenticación completa.');
});

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.obtenerClaseEstado = function (estado) {
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
};
