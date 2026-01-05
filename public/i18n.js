// ============================================
// MÓDULO DE INTERNACIONALIZACIÓN (i18n)
// ============================================
// Maneja el cambio de idioma en toda la aplicación

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('app_language') || 'es';
        this.translations = {};
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            // Cargar ambos idiomas
            const [esResponse, enResponse] = await Promise.all([
                fetch('/locales/es.json'),
                fetch('/locales/en.json')
            ]);

            this.translations.es = await esResponse.json();
            this.translations.en = await enResponse.json();

            // Aplicar idioma guardado
            this.applyLanguage(this.currentLang);
        } catch (error) {
            console.error('Error cargando traducciones:', error);
        }
    }

    applyLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Idioma ${lang} no disponible`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('app_language', lang);

        // Actualizar todos los elementos con data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translations[lang][key];

            if (translation) {
                // Determinar si es un input placeholder o texto normal
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    // Preservar iconos si existen
                    const icon = element.querySelector('i');
                    if (icon) {
                        element.innerHTML = '';
                        element.appendChild(icon.cloneNode(true));
                        element.appendChild(document.createTextNode(' ' + translation));
                    } else {
                        element.textContent = translation;
                    }
                }
            }
        });

        // Actualizar atributo lang del HTML
        document.documentElement.lang = lang;

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    t(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }

    getCurrentLang() {
        return this.currentLang;
    }

    setLanguage(lang) {
        this.applyLanguage(lang);
    }
}

// Crear instancia global
const i18n = new I18n();

// Exportar para uso global
window.i18n = i18n;
