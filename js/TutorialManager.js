// Sistema de Tutorial Educativo
class TutorialManager {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.steps = [
            {
                title: "🟢 Bolita Verde (Correcta)",
                text: "Esta es una bolita VERDE. ¡Reúne varias para completar el SISTEMA de ecuaciones!",
                visual: '<div style="width:60px;height:60px;background:#4CAF50;border-radius:50%;margin:15px auto;box-shadow:0 4px 10px rgba(76,175,80,0.5);"></div>'
            },
            {
                title: "🔴 Bolita Roja (Incorrecta)",
                text: "¡CUIDADO! Esta es una bolita ROJA (incorrecta). Si la tocas, pierdes una VIDA.",
                visual: '<div style="width:60px;height:60px;background:#FF5252;border-radius:50%;margin:15px auto;box-shadow:0 4px 10px rgba(255,82,82,0.5);"></div>'
            },
            {
                title: "❤️ Vidas",
                text: "Tienes 3 vidas. Cada bolita roja que toques te quitará una vida. ¡Evítalas!",
                visual: '<div style="font-size:40px;margin:15px auto;text-align:center;">❤️ ❤️ ❤️</div>'
            },
            {
                title: "⏱️ Tiempo",
                text: "Completa cada paso antes de que se acabe el tiempo. ¡Date prisa pero ten cuidado!",
                visual: '<div style="font-size:35px;margin:15px auto;text-align:center;">⏱️</div>'
            },
            {
                title: "🎯 Objetivo",
                text: "Reúne los ingredientes correctos (bolitas verdes) en el orden adecuado para resolver cada ecuación.",
                visual: '<div style="font-size:30px;margin:15px auto;text-align:center;">x = 5 - y</div>'
            }
        ];
    }

    start() {
        this.currentStep = 0;
        this.show();
        // El clic en 'tutorial-next' lo maneja la delegación de eventos de AlgebraChef
    }

    show() {
        const overlay = document.getElementById('tutorial-overlay');
        const title = document.getElementById('tutorial-title');
        const text = document.getElementById('tutorial-text');
        const visual = document.getElementById('tutorial-visual');
        const btn = document.getElementById('tutorial-next');
        
        if (!overlay || !title || !text || !visual || !btn) return;
        
        const step = this.steps[this.currentStep];
        title.textContent = step.title;
        text.textContent = step.text;
        visual.innerHTML = step.visual;
        
        btn.textContent = this.currentStep === this.steps.length - 1 ? '¡Empezar!' : 'Siguiente';
        
        // Elevar la pantalla de juego por encima del menú de pausa
        document.getElementById('game-screen')?.classList.add('tutorial-open');
        overlay.style.display = 'flex';
    }

    next() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.finish();
        } else {
            this.show();
        }
    }

    finish() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.style.display = 'none';
        document.getElementById('game-screen')?.classList.remove('tutorial-open');
        localStorage.setItem('tutorialCompleted', 'true');
        if (this.game.state === 'playing' && this.game.paused) {
            this.game.togglePause();
        }
    }

    shouldShow() {
        return !localStorage.getItem('tutorialCompleted');
    }
}