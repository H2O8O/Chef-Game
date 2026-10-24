// ============================================
// UTILIDADES COMPARTIDAS - MATES CHEF
// Funciones auxiliares reutilizables
// ============================================

/**
 * Restringe un valor dentro de un rango [min, max]
 * @param {number} value - Valor a restringir
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Valor restringido
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

/**
 * Mezcla aleatoriamente un array (algoritmo Fisher-Yates)
 * @param {Array} array - Array a mezclar
 * @returns {Array} Nuevo array mezclado
 */
function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Genera un número aleatorio dentro de un rango
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Número aleatorio
 */
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Genera un entero aleatorio dentro de un rango
 * @param {number} min - Valor mínimo (inclusive)
 * @param {number} max - Valor máximo (inclusive)
 * @returns {number} Entero aleatorio
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Formatea el tiempo en formato MM:SS
 * @param {number} seconds - Segundos totales
 * @returns {string} Tiempo formateado
 */
function formatTime(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Detecta si el dispositivo es táctil
 * @returns {boolean} True si es dispositivo táctil
 */
function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

/**
 * Detecta si es un dispositivo móvil
 * @returns {boolean} True si es móvil
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
