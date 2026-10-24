const STORY_SCENES = [
    { emoji: "👨‍🍳", text: "Eres un chef profesional con 2 hijos", bg: "#2c3e50" },
    { emoji: "📚", text: "Hoy tu profesor viene a cenar", bg: "#34495e" },
    { emoji: "⏰", text: "¡Debes cocinar rápido!", bg: "#c0392b" },
    { emoji: "🍳", text: "¡Las recetas siguen ecuaciones!", bg: "#d35400" },
    { emoji: "👶", text: "Tus hijos descubren la magia matemática", bg: "#2980b9" },
    { emoji: "🧂", text: "La sal perfecta requiere despejar X", bg: "#16a085" },
    { emoji: "🥧", text: "El horneado es sustituir", bg: "#8e44ad" },
    { emoji: "🥗", text: "¡Mezclar es agrupar términos!", bg: "#27ae60" },
    { emoji: "📜", text: "Solo serviremos una comida perfecta", bg: "#f39c12" },
    { emoji: "👨‍🍳👩‍🍳", text: "¡Demuestra que eres el mejor!", bg: "#e67e22" }
];

const STEP_NAMES = ['Igualamos', 'Sustituimos', 'Resolvemos', 'Verificamos'];

class UIManager {
    constructor() {
        this.storyScenes = STORY_SCENES;
        this.stepNames = STEP_NAMES;
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }
    
    showScreen(id) {
        const s = document.getElementById(id);
        if (s) s.classList.add('active');
    }
    
    hideScreen(id) {
        const s = document.getElementById(id);
        if (s) s.classList.remove('active');
    }
    
    syncVolumeSliders(sound) {
        this.setSliderValue('music-vol', sound.musicVolume);
        this.setSliderValue('sfx-vol', sound.sfxVolume);
        this.setSliderValue('other-vol', sound.otherVolume);
        const musicVal = document.getElementById('music-value');
        const sfxVal = document.getElementById('sfx-value');
        const otherVal = document.getElementById('other-value');
        if (musicVal) musicVal.textContent = Math.round(sound.musicVolume * 100) + '%';
        if (sfxVal) sfxVal.textContent = Math.round(sound.sfxVolume * 100) + '%';
        if (otherVal) otherVal.textContent = Math.round(sound.otherVolume * 100) + '%';
    }
    
    setSliderValue(id, val) {
        const s = document.getElementById(id);
        if (s) s.value = val;
    }
    
    buildMenuButtons(game) {
        const container = document.querySelector('#main-menu .menu-buttons');
        if (!container) return;
        container.innerHTML = '';

        const storySeen = localStorage.getItem('algebraChef_storySeen') === 'true';
        const storyText = storySeen ? "Repetir Historia" : "Historia";
        const storyClass = storySeen ? 'btn-secondary' : 'btn-primary';

        this.addButton(container, storyText, storyClass, 'story');
        this.addButton(container, "Tutorial", 'btn-secondary', 'tutorial');
        this.addButton(container, "Niveles", 'btn-secondary', 'levels');
        this.addButton(container, "Configuración", 'btn-secondary', 'settings');
        this.addButton(container, "Créditos", 'btn-secondary', 'credits');
    }
    
    addButton(container, text, className, action) {
        const btn = document.createElement('button');
        btn.className = className;
        btn.textContent = text;
        btn.setAttribute('data-action', action);
        container.appendChild(btn);
        return btn;
    }

    renderStoryPage(progress) {
        const scene = this.storyScenes[progress];
        if (!scene) return;
        const screen = document.getElementById('story-screen');
        if (screen) screen.style.background = scene.bg;
        this.setTextContent('story-emoji', scene.emoji);
        this.setTextContent('story-text', scene.text);
    }

    renderLevelGrid(completedLevels, levels, onLevelClick) {
        const container = document.getElementById('levels-container');
        if (!container) return;
        container.innerHTML = '';
        levels.forEach((level, i) => {
            const card = this.createLevelCard(level, i, completedLevels);
            container.appendChild(card);
        });
    }
    
    createLevelCard(level, index, completedLevels) {
        const card = document.createElement('div');
        card.className = 'level-card';
        const isLocked = index > 0 && !completedLevels.has(index - 1);
        if (isLocked) card.classList.add('locked');
        const stars = completedLevels.has(index) ? '⭐' : '';
        card.innerHTML = `<div class="level-number">${level.id}</div><div>${level.name}</div><div style="font-size:0.8em;margin-top:5px;">${stars}</div>`;
        if (!isLocked) card.setAttribute('data-index', index);
        return card;
    }
    
    updateDifficultyUI(currentDiff) {
        document.querySelectorAll('.btn-diff').forEach(btn => {
            const d = btn.getAttribute('data-diff');
            btn.classList.toggle('active', d === currentDiff);
        });
    }
    
    updateLevelInfo(level) {
        this.setTextContent('current-level', `Nivel ${level.id}: ${level.name}`);
    }

    updateStepHistory(steps, currentStepIndex) {
        const history = document.getElementById('step-history');
        if (!history) return;
        history.innerHTML = '';
        for (let i = 0; i < currentStepIndex; i++) {
            const div = document.createElement('div');
            div.className = 'step-item';
            div.textContent = `${i+1}. ${this.stepNames[i] || 'Paso '+(i+1)}: ${steps[i].answer}`;
            history.appendChild(div);
        }
    }
    
    updateSystemEquations(system) {
        const el = document.getElementById('system-equations');
        if (el) el.innerHTML = `${system.eq1}<br>${system.eq2}`;
    }
    
    updateLives(lives) {
        const display = document.getElementById('lives-display');
        if (!display) return;
        display.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.className = 'life-heart' + (i >= lives ? ' lost' : '');
            heart.textContent = '❤️';
            display.appendChild(heart);
        }
    }
    
    updateCurrentWork(steps, currentStepIndex, expressionProgress) {
        const stepName = this.stepNames[currentStepIndex] || 'Paso '+(currentStepIndex+1);
        this.setTextContent('current-step-label', `Paso actual: ${stepName}`);
        const current = expressionProgress?.getCurrentString() || '';
        this.setTextContent('current-work', current);
    }
    
    updateTimer(timeRemaining, percent) {
        this.setTextContent('timer-text', formatTime(timeRemaining));
        const fill = document.getElementById('timer-fill');
        if (fill) fill.style.width = Math.max(0, percent) + '%';
    }
    
    updatePauseInfo(instruction) {
        this.setTextContent('pause-step-info', instruction);
    }
    
    showValidation(msg, type) {
        const container = document.getElementById('step-validation');
        if (!container) return;
        container.innerHTML = `<div class="validation-msg ${type}">${msg}</div>`;
        setTimeout(() => container.innerHTML = '', 2000);
    }
    
    flashCorrect() { this.flashBody('flash-correct'); }
    flashWrong() { this.flashBody('flash-wrong'); }
    
    flashBody(className) {
        document.body.classList.add(className);
        setTimeout(() => document.body.classList.remove(className), 300);
    }
    
    showVictory(currentLevel, totalLevels, timeRemaining, timeBonus, totalScore, stars, isTutorialMode = false) {
        const title = document.querySelector('#victory-screen h2');
        const msg = document.getElementById('victory-message');

        if (isTutorialMode) {
            if (title) title.textContent = "🎓 ¡Tutorial Completado!";
            if (msg) msg.innerHTML = `<p>Ya sabes jugar. ¡Atrapa ingredientes y resuelve ecuaciones!</p><p><strong>Puntuación: ${totalScore}</strong></p>`;
        } else {
            if (currentLevel === totalLevels - 1) {
                if (title) title.textContent = "🏆 ¡VICTORIA TOTAL!";
                if (msg) msg.innerHTML = `<p>¡El profesor está impresionado!</p><p><strong>Puntuación: ${totalScore}</strong></p>`;
            } else {
                if (title) title.textContent = "🎉 ¡Perfecto!";
                if (msg) msg.innerHTML = `<p>Tiempo: ${Math.floor(timeRemaining)}s</p><p>Bonus: +${timeBonus}</p><p>Total: ${totalScore}</p>`;
            }
        }
        this.setTextContent('stars-display', stars || '');
    }
    
    showGameOver(message) {
        this.setTextContent('gameover-message', message);
    }
    
    setTextContent(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
}