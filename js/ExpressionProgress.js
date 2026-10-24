// ------ CLASE EXPRESSIONPROGRESS --------

class ExpressionProgress {
    constructor(targetTokens) {
        // ------ PROPIEDADES --------
        this.targetTokens = targetTokens.slice();
        this.collectedTokens = {}; // Mapa: {token: cantidad}
        this.required = this.buildRequiredMap(targetTokens);
    }

    // ------ FUNCIONES DE CONSTRUCCIÓN --------

    buildRequiredMap(tokens) {
        const map = {};
        for (const token of tokens) {
            map[token] = (map[token] || 0) + 1;
        }
        return map;
    }

    // ------ FUNCIONES DE PROGRESO --------

    addToken(token) {
        const needed = this.required[token] || 0;
        const collected = this.collectedTokens[token] || 0;
        
        if (collected < needed) {
            this.collectedTokens[token] = collected + 1;
            return { 
                success: true, 
                finished: this.isComplete() 
            };
        }
        
        if (needed > 0) {
            // El ingrediente era necesario pero ya está completo: no debe castigar
            return { success: false, overCollected: true, expected: this.getNextRequiredToken() };
        }
        
        return { 
            success: false, 
            expected: this.getNextRequiredToken() 
        };
    }

    isComplete() {
        for (const token in this.required) {
            const needed = this.required[token];
            const collected = this.collectedTokens[token] || 0;
            if (collected < needed) return false;
        }
        return true;
    }

    // ------ FUNCIONES DE CONSULTA --------

    getNextRequiredToken() {
        for (const token of this.targetTokens) {
            const needed = this.required[token];
            const collected = this.collectedTokens[token] || 0;
            if (collected < needed) return token;
        }
        return null;
    }

    getRemainingTokens() {
        const remaining = [];
        for (const token in this.required) {
            const needed = this.required[token];
            const collected = this.collectedTokens[token] || 0;
            const missing = needed - collected;
            for (let i = 0; i < missing; i++) {
                remaining.push(token);
            }
        }
        return remaining;
    }

    getCurrentString() {
        const organized = [];
        const tempCollected = {...this.collectedTokens};
        
        for (const token of this.targetTokens) {
            if (tempCollected[token] > 0) {
                organized.push(token);
                tempCollected[token]--;
            }
        }
        
        return this.formatTokens(organized);
    }

    // ------ FUNCIONES DE FORMATEO --------

    formatTokens(tokens) {
        if (tokens.length === 0) return '';
        
        const ops = new Set(['+', '-', '=', '*', '/']);
        let result = '';
        
        for (const tok of tokens) {
            if (tok === '(') {
                result += '(';
            } else if (tok === ')') {
                result += ')';
            } else if (ops.has(tok)) {
                result = result.trim();
                result += ' ' + tok + ' ';
            } else {
                const lastChar = result[result.length - 1];
                if (!result || lastChar === '(' || lastChar === ' ') {
                    result += tok;
                } else if (lastChar !== ')') {
                    result += tok;
                } else {
                    result += ' ' + tok;
                }
            }
        }
        
        return result.trim();
    }

    // ------ FUNCIONES DE PERSISTENCIA --------

    serialize() {
        return {
            targetTokens: this.targetTokens,
            collectedTokens: this.collectedTokens
        };
    }

    static deserialize(data) {
        const progress = new ExpressionProgress(data.targetTokens);
        progress.collectedTokens = data.collectedTokens || {};
        return progress;
    }
}