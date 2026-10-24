// ------ CLASE GAMERENDERER --------

class GameRenderer {
    constructor() {
        // Constructor vacío - métodos estáticos de renderizado
    }
    
    // ------ FUNCIONES DE LIMPIEZA --------
    
    clear(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // ------ FUNCIONES DE RENDERIZADO DE OBJETOS --------
    
    drawFallingObjects(ctx, objects) {
        objects.forEach(obj => obj.draw(ctx));
    }
    
    // ------ FUNCIONES DE RENDERIZADO DEL CHEF --------
    
    drawChef(ctx, chef) {
        ctx.save();
        ctx.translate(chef.x, chef.y);
        
        const { scale, rotation } = this.getChefTransform(chef);
        
        ctx.scale(scale, scale);
        ctx.rotate(rotation);
        
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chef.emoji, 0, 0);
        
        ctx.restore();
    }
    
    // ------ FUNCIONES AUXILIARES --------
    
    getChefTransform(chef) {
        let scale = 1;
        let rotation = 0;
        
        if (chef.state === 'celebrate') {
            scale = 1.2 + Math.sin(Date.now() / 50) * 0.1;
            rotation = Math.sin(Date.now() / 100) * 0.2;
        } else if (chef.state === 'sad') {
            scale = 0.8 + Math.sin(Date.now() / 50) * 0.05;
        }
        
        return { scale, rotation };
    }
}