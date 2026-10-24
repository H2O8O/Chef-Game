const DECOY_TOKENS = ['a','b','z','w','p','q','r','s','t','9','6','x²','y²','*','/','?','#'];
const SPAWN_LANES = [0.15,0.3,0.45,0.6,0.75,0.9];
const BASE_FALL_SPEED = 2.5;
const CELEBRATION_DURATION = 500;

// El selector de dificultad ahora afecta el gameplay real
const DIFFICULTY_TUNING = {
    easy:   { spawnInterval: 2200, speedMultiplier: 1 },
    medium: { spawnInterval: 1700, speedMultiplier: 1.15 },
    hard:   { spawnInterval: 1300, speedMultiplier: 1.3 }
};

class GameLogic {
    constructor(game) { this.game = game; }
    
    startLevel(index) {
        this.resetLevel(index);
        this.game.ui.hideAllScreens();
        this.game.ui.showScreen('game-screen');
        this.game.updateUI();
        this.game.startGameLoop();
    }
    
    resetLevel(index) {
        const game = this.game;
        const level = LEVELS[index];
        game.currentLevelIndex = index;
        game.currentStepIndex = 0;
        game.state = 'playing';
        game.paused = false;
        game.lives = 3;
        game.score = 0;
        game.timeRemaining = level.timeLimit;
        game.fallingObjects = [];
        game.spawnTimer = 0;
        const tuning = DIFFICULTY_TUNING[game.difficulty];
        game.spawnInterval = tuning ? tuning.spawnInterval : 2000;
        const step = level.steps[game.currentStepIndex];
        game.expressionProgress = new ExpressionProgress(step.ingredients);
        game.chef.x = game.canvas.width / 2;
        game.chef.y = game.canvas.height - 80;
        game.chef.state = 'normal';
    }
    
    restartLevel() { this.startLevel(this.game.currentLevelIndex); }
    
    nextLevel() {
        if (this.game.currentLevelIndex < LEVELS.length - 1) {
            this.startLevel(this.game.currentLevelIndex + 1);
        } else {
            this.game.showMenu();
        }
    }
    
    completeStep() {
        if (this.game.state !== 'playing') return;
        this.game.currentStepIndex++;
        // Limpiar ingredientes restantes del paso anterior para que no penalicen
        this.game.fallingObjects = [];
        const level = LEVELS[this.game.currentLevelIndex];
        if (this.game.currentStepIndex < level.steps.length) {
            const step = level.steps[this.game.currentStepIndex];
            this.game.expressionProgress = new ExpressionProgress(step.ingredients);
            this.game.updateUI();
        } else {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        if (this.game.currentLevelIndex === 7) {
            this.playFinalSequence();
        } else {
            this.showVictoryScreen();
        }
    }

    showVictoryScreen() {
        const game = this.game;
        game.state = 'victory';
        if (!game.isTutorialMode) game.completedLevels.add(game.currentLevelIndex);
        game.ui.hideAllScreens();
        game.ui.showScreen('victory-screen');
        const level = LEVELS[game.currentLevelIndex];
        const timeBonus = Math.floor(Math.max(0, game.timeRemaining) * 5);
        const totalScore = game.score + timeBonus;
        const stars = this.calculateStars(level);
        game.ui.showVictory(game.currentLevelIndex, LEVELS.length, game.timeRemaining, timeBonus, totalScore, stars, game.isTutorialMode);
    }

    update(delta) {
        const game = this.game;
        if (game.state !== 'playing' || game.paused) return;
        
        this.updateTime(delta);
        this.updateChef(delta);
        this.updateObjects(delta);
        this.checkCollisions();
        this.spawnObjects(delta);
    }
    
    updateTime(delta) {
        this.game.timeRemaining -= delta / 1000;
        if (this.game.timeRemaining <= 0) {
            this.gameOver('¡Se acabó el tiempo!');
        }
        this.game.updateTimer();
    }
    
    updateChef(delta) {
        const game = this.game;
        game.chef.updateMovement(game.keys, delta, game.canvas);
        game.chef.updateState(delta);
    }
    
    updateObjects(delta) {
        const game = this.game;
        const tuning = DIFFICULTY_TUNING[game.difficulty];
        const speed = BASE_FALL_SPEED * (tuning ? tuning.speedMultiplier : 1) * (delta / 16.66);
        game.fallingObjects.forEach(obj => obj.update(speed));
        game.fallingObjects = game.fallingObjects.filter(obj => {
            if (obj.caught && obj.opacity < 0.1) return false;
            if (!obj.caught && obj.isOffScreen(game.canvas.height)) {
                if (obj.isCorrect) {
                    this.loseLife();
                    game.ui.flashWrong();
                    // Aviso claro: el jugador ve QUÉ ingrediente se le escapó
                    game.ui.showValidation(`⚠️ ¡Se te cayó "${obj.text}"!`, 'wrong');
                }
                return false;
            }
            return true;
        });
    }
    
    checkCollisions() {
        const game = this.game;
        const chefCollider = game.chef.getCollider();
        game.fallingObjects.forEach(obj => {
            if (!obj.caught && obj.collidesWith(chefCollider)) {
                this.handleCatch(obj);
            }
        });
    }
    
    handleCatch(obj) {
        obj.caught = true;
        const result = this.game.expressionProgress.addToken(obj.text);
        if (result.success) {
            this.game.sound.playSFX('correct');
            this.game.ui.flashCorrect();
            this.game.chef.state = 'celebrate';
            this.game.chef.stateTimer = CELEBRATION_DURATION;
            this.game.score += 10;
            if (result.finished) {
                setTimeout(() => this.completeStep(), 500);
            }
            this.game.updateUI();
        } else if (result.overCollected) {
            // Ingrediente ya reunido: se desvanece sin castigar (evita vidas injustas)
            this.game.ui.showValidation(`Ya tienes "${obj.text}"`, 'correct');
        } else {
            this.game.sound.playSFX('incorrect');
            this.game.ui.showValidation(result.expected ? `¡Incorrecto! Busca: ${result.expected}` : '¡Incorrecto!', 'wrong');
            this.game.ui.flashWrong();
            this.game.chef.state = 'sad';
            this.game.chef.stateTimer = CELEBRATION_DURATION;
            this.loseLife();
        }
    }
    
    loseLife() {
        this.game.lives--;
        this.game.ui.updateLives(this.game.lives);
        if (this.game.lives <= 0) {
            this.gameOver('¡Sin vidas!');
        }
    }
    
    spawnObjects(delta) {
        const game = this.game;
        game.spawnTimer += delta;
        if (game.spawnTimer >= game.spawnInterval) {
            game.spawnTimer = 0;
            this.spawnBatch();
        }
    }
    
    spawnBatch() {
        const game = this.game;
        // Límite de objetos simultáneos: rendimiento y claridad visual
        if (game.fallingObjects.length > 12) return;
        const remaining = game.expressionProgress.getRemainingTokens();
        if (remaining.length === 0) return;
        
        const pool = remaining.slice(); // copia para no generar tokens repetidos
        const correctCount = Math.min(2, Math.max(1, pool.length));
        const decoyCount = Math.min(2, Math.floor(Math.random() * 2) + 1);
        
        const tokens = [];
        for (let i = 0; i < correctCount; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            tokens.push({text: pool[idx], correct: true});
            pool.splice(idx, 1); // quitar del pool para evitar duplicados
        }
        for (let i = 0; i < decoyCount; i++) {
            const decoy = DECOY_TOKENS[Math.floor(Math.random() * DECOY_TOKENS.length)];
            tokens.push({text: decoy, correct: false});
        }
        
        // Carriles únicos por tanda + dispersión: nada de objetos superpuestos
        const lanes = shuffle(SPAWN_LANES.slice());
        tokens.forEach(({text, correct}, i) => {
            const lane = lanes[i % lanes.length];
            let baseY = -50 - Math.random() * 70;
            let x = game.canvas.width * lane;
            // Buscar hueco libre en la banda superior: no nacer encima de otro objeto
            for (let t = 1; t <= 6; t++) {
                const offset = (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 70;
                const candidate = Math.max(40, Math.min(game.canvas.width - 40, game.canvas.width * lane + offset));
                let libre = true;
                for (const o of game.fallingObjects) {
                    if (!o.caught && o.y < 130 && Math.abs(o.x - candidate) < 70 && Math.abs(o.y - baseY) < 80) {
                        libre = false;
                        break;
                    }
                }
                if (libre) { x = candidate; break; }
                if (t === 6) x = candidate;
            }
            const obj = new FallingObject(text, x, correct);
            obj.y = baseY;
            game.fallingObjects.push(obj);
        });
    }
    
    calculateStars(level) {
        const timePercent = (this.game.timeRemaining / level.timeLimit) * 100;
        if (timePercent > 75) return '⭐⭐⭐';
        if (timePercent > 40) return '⭐⭐';
        return '⭐';
    }
    
    gameOver(message) {
        // En el nivel 8 (index 7), perder reproduce el video de derrota
        if (this.game.currentLevelIndex === 7) {
            this.playDefeatSequence(message);
            return;
        }
        this.game.state = 'gameover';
        this.game.ui.hideAllScreens();
        this.game.ui.showScreen('gameover-screen');
        this.game.ui.showGameOver(message);
    }

    playFinalSequence() {
        this._showEnding('victory');
    }

    playDefeatSequence(message) {
        this._showEnding('defeat', message);
    }

    _showEnding(mode, gameoverMessage = '') {
        const game = this.game;
        const screen = document.getElementById('video-screen');
        const title = document.getElementById('ending-title');
        if (!screen || !title) {
            // Sin pantalla de final disponible: seguir el flujo normal
            if (mode === 'victory') game.showCredits();
            else this._afterDefeatVideo(gameoverMessage);
            return;
        }

        if (this._endingTimer) {
            clearTimeout(this._endingTimer);
            this._endingTimer = null;
        }

        game.state = 'video';
        game._videoMode = mode;
        game._videoMessage = gameoverMessage;
        game.sound.stopMusic();
        game.ui.hideAllScreens();
        screen.classList.add('active');

        const victory = mode === 'victory';
        title.textContent = victory ? 'Good Ending' : 'Bad Ending';
        title.style.color = victory ? '#43d477' : '#ff5d6c';
        document.getElementById('ending-line1').textContent = victory
            ? 'Preparaste una muy buena comida'
            : 'Preparaste una muy mala comida';
        document.getElementById('ending-score').textContent = victory ? '9/10' : '3/10';
        document.getElementById('ending-icon').textContent = victory ? '🎉' : '💀';

        this._endingTimer = setTimeout(() => {
            this._endingTimer = null;
            this._closeEnding(mode, gameoverMessage);
        }, victory ? 10000 : 8000);
    }

    _closeEnding(mode, gameoverMessage = '') {
        if (this._endingTimer) {
            clearTimeout(this._endingTimer);
            this._endingTimer = null;
        }
        this.game.sound.startMusic();
        if (mode === 'victory') {
            this.game.showCredits();
        } else {
            this._afterDefeatVideo(gameoverMessage);
        }
    }

    _afterDefeatVideo(message) {
        this.game.state = 'gameover';
        this.game.ui.hideAllScreens();
        this.game.ui.showScreen('gameover-screen');
        this.game.ui.showGameOver(message);
    }
}