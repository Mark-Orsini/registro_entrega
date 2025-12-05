document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const searchInput = document.querySelector('.search-input');
    const langSelect = document.querySelector('.lang-select');
    const actionBtns = document.querySelectorAll('.action-buttons .btn');
    const loginBtnNav = document.getElementById('loginBtn');

    // --- Login Modal Logic ---

    // Show modal on load
    if (loginModal) {
        // Simple check to see if we should show it (could be session based in real app)
        // For now, always show on load as requested
        setTimeout(() => {
            loginModal.classList.add('active');
        }, 100); // Small delay for fade-in effect
    }

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate login
            const email = loginForm.querySelector('input[type="email"]').value;
            if (email) {
                // Close modal
                loginModal.classList.remove('active');
                // Optional: Update UI to show logged in state
                if (loginBtnNav) loginBtnNav.textContent = 'Cerrar Sesión';
                alert(`¡Bienvenido, ${email}!`);
            }
        });
    }

    // Allow opening modal via Nav Button (if needed)
    if (loginBtnNav) {
        loginBtnNav.addEventListener('click', (e) => {
            if (loginBtnNav.textContent === 'Cerrar Sesión') {
                loginBtnNav.textContent = 'Iniciar Sesión';
                loginModal.classList.add('active');
            } else {
                loginModal.classList.add('active');
            }
        });
    }

    // --- Search Filter Logic ---

    // Toggle Dropdown
    if (filterToggleBtn && filterDropdown) {
        filterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing immediately
            filterDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (filterDropdown && filterDropdown.classList.contains('show')) {
            if (!filterDropdown.contains(e.target) && e.target !== filterToggleBtn) {
                filterDropdown.classList.remove('show');
            }
        }
    });

    // Handle Filter Selection
    if (filterDropdown) {
        const filterLinks = filterDropdown.querySelectorAll('a');
        filterLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filterType = e.target.dataset.filter;
                const filterText = e.target.textContent;
                console.log(`Filtro seleccionado: ${filterType}`);
                alert(`Filtrando por: ${filterText}`);
                filterDropdown.classList.remove('show');
            });
        });
    }

    // --- Other Existing Logic ---

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('Buscando:', e.target.value);
        });
    }

    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            alert(`Idioma cambiado a: ${lang === 'es' ? 'Español' : 'English'}`);
        });
    }

    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.textContent;
            // Solo mostrar alerta si no es algo ya manejado
            alert(`Acción seleccionada: ${action}`);
        });
    });

    console.log('Registro de Entregas - App is ready');
});
