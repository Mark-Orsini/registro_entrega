document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM (Nombres en español) ---
    const modalLogin = document.getElementById('modalLogin');
    const formLogin = document.getElementById('formLogin');
    const btnAlternarFiltro = document.getElementById('btnAlternarFiltro');
    const menuFiltros = document.getElementById('menuFiltros');
    const inputBusqueda = document.querySelector('.input-busqueda');
    const selectIdioma = document.querySelector('.select-idioma');
    const botonesAccion = document.querySelectorAll('.botones-accion .btn');
    const btnIniciarSesionNav = document.getElementById('btnIniciarSesion');

    // --- Lógica del Modal de Login ---

    // Mostrar modal al cargar (Simulación)
    if (modalLogin) {
        setTimeout(( ) => {
            modalLogin.classList.add('activo');
        }, 300); // Pequeño retraso para la animación suave
    }

    // Manejar envío del formulario
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simular inicio de sesión
            const email = formLogin.querySelector('input[type="email"]').value;
            if (email) {
                // Cerrar modal
                modalLogin.classList.remove('activo');

                // Actualizar botón de navegación (Visual)
                if (btnIniciarSesionNav) {
                    btnIniciarSesionNav.textContent = 'Cerrar Sesión';
                    btnIniciarSesionNav.classList.remove('btn-borde');
                    btnIniciarSesionNav.classList.add('btn-primario'); // Cambiar estilo al estar logueado
                }

                // Mensaje de bienvenida sutil (opcional, o reemplazar por notificación toast)
                console.log(`Usuario autenticado: ${email}`);
            }
        });
    }

    // Abrir modal desde el botón del nav (si se cerró o no se ha logueado)
    if (btnIniciarSesionNav) {
        btnIniciarSesionNav.addEventListener('click', (e) => {
            if (btnIniciarSesionNav.textContent === 'Cerrar Sesión') {
                // Simular Logout
                btnIniciarSesionNav.textContent = 'Iniciar Sesión';
                btnIniciarSesionNav.classList.add('btn-borde');
                btnIniciarSesionNav.classList.remove('btn-primario');
                modalLogin.classList.add('activo');
            } else {
                modalLogin.classList.add('activo');
            }
        });
    }

    // --- Lógica de Filtros de Búsqueda ---

    // Alternar visibilidad del menú
    if (btnAlternarFiltro && menuFiltros) {
        btnAlternarFiltro.addEventListener('click', (e) => {
            e.stopPropagation();
            menuFiltros.classList.toggle('mostrar');
        });
    }

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if (menuFiltros && menuFiltros.classList.contains('mostrar')) {
            if (!menuFiltros.contains(e.target) && !btnAlternarFiltro.contains(e.target)) {
                menuFiltros.classList.remove('mostrar');
            }
        }
    });

    // Manejar selección de opción de filtro
    if (menuFiltros) {
        const enlacesFiltro = menuFiltros.querySelectorAll('a');
        enlacesFiltro.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Obtener texto e icono para feedback (opcional)
                const filtroTipo = link.dataset.filtro; // p.ej: 'region'
                // Aquí iría la lógica real de filtrado
                console.log(`Aplicando filtro: ${filtroTipo}`);

                // Cerrar menú
                menuFiltros.classList.remove('mostrar');
            });
        });
    }

    // --- Otras Interacciones ---

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            console.log('Buscando:', e.target.value);
        });
    }

    if (selectIdioma) {
        selectIdioma.addEventListener('change', (e) => {
            const idioma = e.target.value;
            console.log(`Idioma cambiado a: ${idioma}`);
            // Aquí recargarías la página o cambiarías los textos
        });
    }

    botonesAccion.forEach(btn => {
        btn.addEventListener('click', () => {
            // Lógica placeholder para los botones laterales
            console.log('Acción clickeada:', btn.textContent.trim());
        });
    });

    console.log('App lista e inicializada.');
});
