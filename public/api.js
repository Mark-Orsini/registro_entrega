// ============================================
// API Configuration and Helper Functions
// ============================================

// Configuración del backend
const API_CONFIG = {
    // Cambia esta URL cuando tengas tu backend listo
    BASE_URL: 'http://localhost:3000/api',
    TIMEOUT: 10000 // 10 segundos
};

// Endpoints
const API_ENDPOINTS = {
    // Autenticación
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_CODE: '/auth/verify-code',
    RESET_PASSWORD: '/auth/reset-password',

    // Entregas
    DELIVERIES: '/deliveries',
    DELIVERY_BY_ID: (id) => `/deliveries/${id}`,

    // Usuario
    USER_PROFILE: '/user/profile',
    LOGOUT: '/auth/logout'
};

// ============================================
// Token Management
// ============================================

function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

function removeAuthToken() {
    localStorage.removeItem('auth_token');
}

// ============================================
// HTTP Request Helper
// ============================================

async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(url, {
            ...config,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Error: ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('La solicitud ha tardado demasiado. Por favor, inténtalo de nuevo.');
        }
        throw error;
    }
}

// ============================================
// API Functions
// ============================================

const API = {
    // Autenticación
    async login(email, password) {
        return await apiRequest(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: { email, password }
        });
    },

    async register(userData) {
        return await apiRequest(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: userData
        });
    },

    async forgotPassword(email) {
        return await apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            body: { email }
        });
    },

    async verifyCode(email, code) {
        return await apiRequest(API_ENDPOINTS.VERIFY_CODE, {
            method: 'POST',
            body: { email, code }
        });
    },

    async resetPassword(email, code, newPassword) {
        return await apiRequest(API_ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            body: { email, code, newPassword }
        });
    },

    async logout() {
        return await apiRequest(API_ENDPOINTS.LOGOUT, {
            method: 'POST'
        });
    },

    // Entregas
    async getDeliveries(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `${API_ENDPOINTS.DELIVERIES}?${queryParams}` : API_ENDPOINTS.DELIVERIES;
        return await apiRequest(endpoint);
    },

    async getDeliveryById(id) {
        return await apiRequest(API_ENDPOINTS.DELIVERY_BY_ID(id));
    },

    async createDelivery(deliveryData) {
        return await apiRequest(API_ENDPOINTS.DELIVERIES, {
            method: 'POST',
            body: deliveryData
        });
    },

    async updateDelivery(id, deliveryData) {
        return await apiRequest(API_ENDPOINTS.DELIVERY_BY_ID(id), {
            method: 'PUT',
            body: deliveryData
        });
    },

    async deleteDelivery(id) {
        return await apiRequest(API_ENDPOINTS.DELIVERY_BY_ID(id), {
            method: 'DELETE'
        });
    },

    // Comunas
    async getCommunes() {
        return await apiRequest('/comunas');
    },

    // Exportación
    async exportPDF(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_CONFIG.BASE_URL}/deliveries/export/pdf?${queryParams}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al exportar PDF');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'reporte_entregas.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    async exportExcel(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_CONFIG.BASE_URL}/deliveries/export/excel?${queryParams}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al exportar Excel');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'reporte_entregas.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    // Usuario
    async getUserProfile() {
        return await apiRequest(API_ENDPOINTS.USER_PROFILE);
    }
};

// Exportar para uso global
window.API = API;
window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;
