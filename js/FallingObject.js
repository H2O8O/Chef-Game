// ============================================
// FALLING OBJECT - OBJETOS QUE CAEN
// Clase para los ingredientes que caen en el juego
// ============================================

class FallingObject {
    constructor(text, x, isCorrect) {
        // Propiedades básicas
        this.text = text;
        this.x = x;
        this.y = -50;
        this.isCorrect = isCorrect;
        this.caught = false;
        
        // Propiedades visuales (siempre plenamente visibles: evitar "invisibles" que castigan)
        this.radius = 30;
        this.opacity = 1;
        // Altura inicial variada para que las tandas no se alineen ni se solapen
        this.y = -50 - Math.random() * 70;
        
        // Colores según si es correcto o no
        this.fillColor = isCorrect ? '#4CAF50' : '#FF5252';
        this.strokeColor = '#fff';
        this.textColor = '#fff';
        this.haloColor = 'rgba(10, 10, 10, 0.55)'; // halo oscuro: contraste sobre cualquier fondo
    }

    /**
     * Actualiza la posición y estado del objeto
     * @param {number} speed - Velocidad de caída
     */
    update(speed) {
        this.y += speed;
        
        if (this.caught) {
            this.radius *= 1.05;
            this.opacity *= 0.92;
        }
    }

    /**
     * Verifica si el objeto salió de la pantalla
     * @param {number} canvasHeight - Altura del canvas
     * @returns {boolean}
     */
    isOffScreen(canvasHeight) {
        return this.y - this.radius > canvasHeight;
    }

    /**
     * Detecta colisión con un rectángulo (el chef)
     * @param {Object} rect - Rectángulo con x, y, width, height
     * @returns {boolean}
     */
    collidesWith(rect) {
        const nearestX = clamp(this.x, rect.x, rect.x + rect.width);
        const nearestY = clamp(this.y, rect.y, rect.y + rect.height);
        
        const dx = this.x - nearestX;
        const dy = this.y - nearestY;
        
        return (dx * dx + dy * dy) <= (this.radius * this.radius);
    }

    /**
     * Dibuja el objeto en el canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Sin rotación: el texto siempre legible (horizontal)
        
        ctx.globalAlpha = this.opacity;
        
        if (this.caught) {
            ctx.scale(1.5, 1.5);
        }

        this.drawCircle(ctx);
        this.drawText(ctx);
        
        ctx.restore();
    }
    
    drawCircle(ctx) {
        // Halo oscuro de contraste (detrás del círculo)
        ctx.strokeStyle = this.haloColor;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    drawText(ctx) {
        ctx.fillStyle = this.textColor;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 0, 0);
    }
}
