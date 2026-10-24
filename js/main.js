// Punto de entrada del juego (scripts clásicos cargados desde index.html)

document.addEventListener('DOMContentLoaded', () => {
    // Pantalla de inicio para activar audio
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    
    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        startBtn.textContent = '⏳ Cargando...';

        window.game = new AlgebraChef();
        await window.game.init();

        startScreen.classList.remove('active');
    });
});
