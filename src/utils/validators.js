// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================
// Validadores reutilizables para RUT, email, etc.

/**
 * Validar RUT
 * Revisa que el RUT tenga el formato correcto y que el dígito verificador coincida.
 * @param {string} rut - Ejemplo: 12.345.678-9
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
 * Validar Email
 * Verifica que el texto parezca un correo real (algo@algo.com).
 */
function validarEmail(email) {
    // Expresión regular para validar email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validar Contraseña
 * Revisa qué tan segura es la contraseña (largo, mayúsculas, números).
 * Retorna: si es válida y qué nivel de fuerza tiene (débil, media, fuerte).
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
 * Validar Teléfono
 * Acepta números chilenos de 8 o 9 dígitos, con o sin +56.
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
 * Sanitizar Texto (Seguridad)
 * Limpia el texto de cosas peligrosas como scripts (<script>) para evitar hackeos.
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
 * Validar que no esté vacío
 * Simple chequeo para ver si escribieron algo.
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
