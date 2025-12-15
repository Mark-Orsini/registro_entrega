// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================
// Validadores reutilizables para RUT, email, etc.

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT con o sin formato (12.345.678-9 o 12345678-9)
 * @returns {boolean} - true si el RUT es válido
 */
function validarRUT(rut) {
    // Limpiar formato (puntos y guión)
    rut = rut.replace(/\./g, '').replace(/-/g, '').trim();

    // Validar largo mínimo
    if (rut.length < 2) {
        return false;
    }

    // Separar cuerpo y dígito verificador
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();

    // Validar que el cuerpo sean solo números
    if (!/^\d+$/.test(cuerpo)) {
        return false;
    }

    // Calcular dígito verificador esperado
    let suma = 0;
    let multiplo = 2;

    // Algoritmo de validación del RUT
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);

    // Comparar dígito verificador
    return dv === dvCalculado;
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si el email es válido
 */
function validarEmail(email) {
    // Expresión regular para validar email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida la fortaleza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { valid: boolean, message: string, strength: string }
 */
function validarPassword(password) {
    const resultado = {
        valid: false,
        message: '',
        strength: 'débil'
    };

    // Longitud mínima
    if (password.length < 6) {
        resultado.message = 'La contraseña debe tener al menos 6 caracteres';
        return resultado;
    }

    // Calcular fortaleza
    let fortaleza = 0;

    if (password.length >= 8) fortaleza++;
    if (/[a-z]/.test(password)) fortaleza++;
    if (/[A-Z]/.test(password)) fortaleza++;
    if (/[0-9]/.test(password)) fortaleza++;
    if (/[^a-zA-Z0-9]/.test(password)) fortaleza++;

    if (fortaleza <= 2) {
        resultado.strength = 'débil';
    } else if (fortaleza <= 4) {
        resultado.strength = 'media';
    } else {
        resultado.strength = 'fuerte';
    }

    resultado.valid = true;
    resultado.message = 'Contraseña válida';
    return resultado;
}

/**
 * Valida un número de teléfono chileno
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si el teléfono es válido
 */
function validarTelefono(telefono) {
    // Limpiar formato
    telefono = telefono.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '');

    // Validar largo (8 o 9 dígitos para Chile)
    // Acepta: 912345678, 221234567, +56912345678
    if (telefono.startsWith('56')) {
        telefono = telefono.substring(2);
    }

    return /^[2-9]\d{7,8}$/.test(telefono);
}

/**
 * Sanitiza un string para prevenir inyección SQL
 * @param {string} string - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizarString(string) {
    if (typeof string !== 'string') {
        return string;
    }

    // Eliminar caracteres peligrosos
    return string
        .replace(/[<>]/g, '') // Eliminar < y >
        .trim();
}

/**
 * Valida que un campo no esté vacío
 * @param {any} valor - Valor a validar
 * @returns {boolean} - true si no está vacío
 */
function noVacio(valor) {
    if (valor === null || valor === undefined) {
        return false;
    }

    if (typeof valor === 'string') {
        return valor.trim().length > 0;
    }

    return true;
}

module.exports = {
    validarRUT,
    validarEmail,
    validarPassword,
    validarTelefono,
    sanitizarString,
    noVacio
};
