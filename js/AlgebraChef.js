class Chef {
    constructor() {
        this.x = 0; this.y = 0;
        this.width = 80; this.height = 80;
        this.speed = 8; this.emoji = '👨‍🍳';
        this.state = 'normal'; this.stateTimer = 0;
    }
    
    updateMovement(keys, delta, canvas) {
        const moveStep = this.speed * (delta / 16.66);
        if (keys.has('ArrowLeft') || keys.has('a')) this.x -= moveStep;
        if (keys.has('ArrowRight') || keys.has('d')) this.x += moveStep;
        if (keys.has('ArrowUp') || keys.has('w')) this.y -= moveStep;
        if (keys.has('ArrowDown') || keys.has('s')) this.y += moveStep;
        this.x = clamp(this.x, this.width/2, canvas.width - this.width/2);
        this.y = clamp(this.y, this.height/2, canvas.height - this.height/2);
    }
    
    updateState(delta) {
        if (this.state !== 'normal') {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) this.state = 'normal';
        }
    }
    
    getCollider() {
        return {
            x: this.x - this.width*0.4, y: this.y - this.height*0.4,
            width: this.width*0.8, height: this.height*0.8
        };
    }
}

class AlgebraChef {
    constructor() {
        this.sound = new SoundManager();
        this.renderer = new GameRenderer();
        this.ui = new UIManager();
        this.logic = new GameLogic(this);
        this.tutorial = new TutorialManager(this);
        
        this.currentLevelIndex = 0; this.currentStepIndex = 0;
        this.state = 'menu'; this.paused = false;
        this.timeRemaining = 180; this.score = 0; this.lives = 3;
        this.difficulty = 'easy';
        this.completedLevels = new Set();
        this.storyProgress = 0; this.isTutorialMode = false;
        
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.chef = new Chef();
        this.updateCanvasSize();
        
        this.keys = new Set();
        this.fallingObjects = [];
        this.expressionProgress = null;
        this.spawnTimer = 0; this.spawnInterval = 2000;
        this.lastUpdate = 0; this.frameTime = 1000/60;
        this._loopRunning = false;
        this._lastTimerUpdate = 0;
        this._cheatBuffer = '';
    }

    async init() {
        await this.sound.startMusic();
        this.setupEventListeners();
        this.ui.syncVolumeSliders(this.sound);

        if (!localStorage.getItem('algebraChef_storySeen') && this.storyProgress === 0) {
            this.startStoryFromBeginning();
        } else {
            this.showMenu();
        }
        return this;
    }
    
    setupEventListeners() {
        // Canvas input
        const handleInput = (x, y) => {
            if (this.state === 'playing' && !this.paused) {
                const rect = this._canvasRect || this.canvas.getBoundingClientRect();
                this.chef.x = clamp(x - rect.left, this.chef.width/2, this.canvas.width - this.chef.width/2);
                this.chef.y = clamp(y - rect.top, this.chef.height/2, this.canvas.height - this.chef.height/2);
            }
        };
        this.canvas.addEventListener('mousemove', e => handleInput(e.clientX, e.clientY));
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            handleInput(e.touches[0].clientX, e.touches[0].clientY);
        }, {passive: false});

        // Teclado
        document.addEventListener('keydown', e => {
            this.keys.add(e.key);
            if (e.key === 'Escape' && this.state === 'playing') this.togglePause();
            // Código secreto: escribir "chef" durante la partida pasa de nivel
            if (this.state === 'playing' && !this.paused && e.key.length === 1) {
                this._cheatBuffer = (this._cheatBuffer + e.key.toLowerCase()).slice(-12);
                if (this._cheatBuffer.endsWith('chef')) {
                    this._cheatBuffer = '';
                    this.logic.levelComplete();
                }
            }
        });
        document.addEventListener('keyup', e => this.keys.delete(e.key));
        
        // Resize
        const onResize = () => this.updateCanvasSize();
        window.addEventListener('resize', onResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

        // Event delegation para botones
        document.body.addEventListener('click', e => this.handleClick(e));
        
        // Sliders de volumen
        this.setupVolumeControls();
    }

    setupVolumeControls() {
        const updateVol = (id, val) => {
            const display = document.getElementById(id + '-value');
            if (display) display.textContent = Math.round(val * 100) + '%';
        };
        
        const musicSlider = document.getElementById('music-vol');
        const sfxSlider = document.getElementById('sfx-vol');
        const otherSlider = document.getElementById('other-vol');
        
        if (musicSlider) {
            musicSlider.addEventListener('input', e => {
                const v = parseFloat(e.target.value);
                this.sound.setMusicVolume(v);
                updateVol('music', v);
            });
        }
        if (sfxSlider) {
            sfxSlider.addEventListener('input', e => {
                const v = parseFloat(e.target.value);
                this.sound.setSFXVolume(v);
                updateVol('sfx', v);
            });
        }
        if (otherSlider) {
            otherSlider.addEventListener('input', e => {
                const v = parseFloat(e.target.value);
                this.sound.setOtherVolume(v);
                updateVol('other', v);
            });
        }
    }

    handleClick(e) {
        const target = e.target;
        
        // Reproducir sonido en cualquier botón
        if (target.matches('.btn-primary, .btn-secondary, .btn-diff, .level-card:not(.locked)')) {
            this.sound.playSFX('select');
        }
        
        // Botones específicos
        if (target.id === 'back-to-menu') this.showMenu();
        else if (target.id === 'pause-btn') this.togglePause();
        else if (target.id === 'resume-btn') this.togglePause();
        else if (target.id === 'restart-btn') this.restartLevel();
        else if (target.id === 'settings-from-pause-btn') this.showSettings('pause');
        else if (target.id === 'menu-from-pause-btn') this.showMenu();
        else if (target.id === 'close-settings-btn') this.closeSettings();
        else if (target.id === 'retry-btn') this.restartLevel();
        else if (target.id === 'menu-from-gameover-btn') this.showMenu();
        else if (target.id === 'next-level-btn') this.nextLevel();
        else if (target.id === 'menu-from-victory-btn') this.showMenu();
        else if (target.id === 'video-skip-btn') this.skipVideo();
        else if (target.id === 'credits-to-menu-btn') this.showMenu();
        else if (target.id === 'story-next') this.nextStoryPage();
        else if (target.id === 'tutorial-next') this.tutorial.next();
        
        // Dificultad
        else if (target.matches('.btn-diff')) {
            const diff = target.getAttribute('data-diff');
            if (diff) this.setDifficulty(diff);
        }
        
        // Level cards
        else if (target.closest('.level-card:not(.locked)')) {
            const card = target.closest('.level-card');
            const index = parseInt(card.getAttribute('data-index'));
            if (!isNaN(index)) this.logic.startLevel(index);
        }
        
        // Botones del menú principal (creados dinámicamente)
        else if (target.matches('[data-action]')) {
            const action = target.getAttribute('data-action');
            if (action === 'story') this.startStory();
            else if (action === 'tutorial') this.startInteractiveTutorial();
            else if (action === 'levels') this.showLevelSelect();
            else if (action === 'settings') this.showSettings('menu');
            else if (action === 'credits') this.showCredits();
        }
    }
    
    updateCanvasSize() {
        // Usar el tamaño real de layout (evita buffers gigantes o escalados borrosos)
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = Math.max(200, Math.round(rect.width));
        this.canvas.height = Math.max(200, Math.round(rect.height));
        // Cache para el ratón: evita getBoundingClientRect en cada mousemove
        this._canvasRect = { left: rect.left, top: rect.top };
        this.chef.x = clamp(this.chef.x, this.chef.width/2, this.canvas.width - this.chef.width/2);
        this.chef.y = clamp(this.chef.y, this.chef.height/2, this.canvas.height - this.chef.height/2);
    }
    
    showMenu() {
        this.state = 'menu'; this.isTutorialMode = false;
        this.ui.hideAllScreens(); this.ui.showScreen('main-menu');
        this.ui.buildMenuButtons(this);
    }
    
    showLevelSelect() {
        this.ui.hideAllScreens(); this.ui.showScreen('level-select');
        this.ui.renderLevelGrid(this.completedLevels, LEVELS, i => this.logic.startLevel(i));
        this.ui.updateDifficultyUI(this.difficulty);
    }
    
    showCredits() {
        this.ui.hideAllScreens(); this.ui.showScreen('credits-screen');
    }
    
    startStory() {
        this.state = 'story';
        this.ui.hideAllScreens(); this.ui.showScreen('story-screen');
        this.ui.renderStoryPage(this.storyProgress);
    }

    startStoryFromBeginning() {
        this.storyProgress = 0; this.startStory();
    }

    startInteractiveTutorial() {
        if (this.tutorial.shouldShow()) {
            this.isTutorialMode = true;
            this.logic.startLevel(0);
            this.tutorial.start();
            this.togglePause();
        } else {
            this.logic.startLevel(0);
        }
    }

    showSettings(from) {
        this._settingsReturnFrom = from || 'menu';
        this.ui.hideAllScreens(); this.ui.showScreen('settings-screen');
        this.ui.syncVolumeSliders(this.sound);
    }

    closeSettings() {
        const from = this._settingsReturnFrom || 'menu';
        this.ui.hideScreen('settings-screen');
        if (from === 'pause') {
            this.ui.showScreen('pause-screen');
            const step = LEVELS[this.currentLevelIndex]?.steps[this.currentStepIndex];
            this.ui.updatePauseInfo(step?.instruction || '');
        } else {
            this.showMenu();
        }
    }
    
    nextStoryPage() {
        this.storyProgress++;
        if (this.storyProgress < 10) {
            this.ui.renderStoryPage(this.storyProgress);
        } else {
            localStorage.setItem('algebraChef_storySeen', 'true');
            this.showLevelSelect();
        }
    }
    
    setDifficulty(diff) {
        this.difficulty = diff;
        this.ui.updateDifficultyUI(diff);
    }
    
    restartLevel() { this.logic.restartLevel(); }
    nextLevel() { this.logic.nextLevel(); }
    skipVideo() {
        const mode = this._videoMode;
        this.logic._closeEnding(mode, this._videoMessage || '¡Se quemó la cena!');
    }
    
    updateUI() {
        const level = LEVELS[this.currentLevelIndex];
        this.ui.updateLevelInfo(level);
        this.ui.updateStepHistory(level.steps, this.currentStepIndex);
        this.ui.updateSystemEquations(level.system);
        this.ui.updateLives(this.lives);
        this.ui.updateCurrentWork(level.steps, this.currentStepIndex, this.expressionProgress);
        this.updateTimer();
    }
    
    updateTimer() {
        const level = LEVELS[this.currentLevelIndex];
        if (!level) return;
        const percent = (this.timeRemaining / level.timeLimit) * 100;
        // Máx ~6 escrituras al DOM por segundo (rendimiento en máquinas modestas)
        const now = performance.now();
        if (now - this._lastTimerUpdate < 150) return;
        this._lastTimerUpdate = now;
        this.ui.updateTimer(this.timeRemaining, percent);
    }
    
    showHint() {
        if (!this.expressionProgress) return;
        const next = this.expressionProgress.getNextRequiredToken();
        this.ui.showValidation(`Busca: ${next}`, 'correct');
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.ui.showScreen('pause-screen');
            const step = LEVELS[this.currentLevelIndex].steps[this.currentStepIndex];
            this.ui.updatePauseInfo(step.instruction);
        } else {
            this.ui.hideScreen('pause-screen');
            this.lastUpdate = performance.now();
        }
    }
    
    startGameLoop() {
        if (this._loopRunning) return; // evita bucles duplicados al reiniciar el nivel
        this._loopRunning = true;
        this.lastUpdate = performance.now();
        requestAnimationFrame(t => this.gameLoop(t));
    }
    
    gameLoop(time) {
        if (this.state !== 'playing') { this._loopRunning = false; return; }
        let delta = time - this.lastUpdate;
        // Limitar saltos de tiempo: nada de teletransportes por microcortes (ni para el chef ni para los objetos)
        if (delta > this.frameTime * 3) delta = this.frameTime * 3;
        if (delta >= this.frameTime) {
            this.lastUpdate = time - (delta % this.frameTime);
            if (!this.paused) {
                this.logic.update(delta);
                this.draw();
            }
        }
        requestAnimationFrame(t => this.gameLoop(t));
    }
    
    draw() {
        this.renderer.clear(this.ctx, this.canvas);
        this.renderer.drawFallingObjects(this.ctx, this.fallingObjects);
        this.renderer.drawChef(this.ctx, this.chef);
    }
}