// ------ CLASE SOUNDMANAGER --------

class SoundManager {
    // Configuración de respaldo (misma info que assets/Audio/audio-config.json)
    static DEFAULT_CONFIG = [
        { name: 'backgroundmusic', path: 'assets/Audio/BackgroundMusic.mp3', volume: 0.45, type: 'background' },
        { name: 'correctsound', path: 'assets/Audio/CorrectSound.mp3', volume: 0.3, type: 'effect' },
        { name: 'incorrectsound', path: 'assets/Audio/IncorrectSound.mp3', volume: 0.3, type: 'effect' },
        { name: 'selecmenusound', path: 'assets/Audio/SelectMenuSound.mp3', volume: 0.25, type: 'ui' }
    ];

    constructor() {
        if (SoundManager._instance) return SoundManager._instance;
        SoundManager._instance = this;
        this.emitter = new EventTarget();
        this.audioPath = 'assets/Audio/';
        this.configUrl = this.audioPath + 'audio-config.json';
        this.registry = new Map();
        this.queue = [];
        this.state = 'stopped';
        this.musicVolume = this._loadStoredVolume('musicVolume', 0.5);
        this.sfxVolume = this._loadStoredVolume('sfxVolume', 0.7);
        this.otherVolume = this._loadStoredVolume('otherVolume', 0.5);
        this._initPromise = this._init();
    }
    async _init() {
        await this.loadConfig();
        await this.preloadAll();
        this.applyCategoryVolumes();
    }
    async loadConfig() {
        try {
            const res = await fetch(this.configUrl);
            if (!res.ok) throw new Error('audio-config.json not found');
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('Invalid audio config format');
            this._registerConfig(data);
            this.emitter.dispatchEvent(new CustomEvent('configloaded'));
        } catch (e) {
            // fetch falla al abrir el juego con doble clic (file://): usar config integrada
            console.warn('audio-config.json no disponible, usando configuración integrada:', e.message);
            this._registerConfig(SoundManager.DEFAULT_CONFIG);
        }
    }

    _registerConfig(data) {
        data.forEach(item => {
            if (!item.name || !item.path || typeof item.volume !== 'number' || !item.type) return;
            const audio = new Audio(item.path);
            audio.volume = item.volume;
            audio.loop = item.type === 'background';
            audio.addEventListener('ended', () => this._onEnded(item.name));
            audio.addEventListener('error', () => this._onError(item.name));
            this.registry.set(item.name.toLowerCase(), {
                name: item.name.toLowerCase(),
                type: item.type,
                volume: item.volume,
                audio
            });
        });
    }

    _loadStoredVolume(key, fallback) {
        const stored = parseFloat(localStorage.getItem(key));
        if (!Number.isFinite(stored)) return fallback;
        return Math.max(0, Math.min(1, stored));
    }
    async preloadAll() {
        const loads = [];
        this.registry.forEach(meta => {
            const a = meta.audio;
            loads.push(new Promise(resolve => {
                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    a.removeEventListener('canplaythrough', onReady);
                    resolve(true);
                };
                const onReady = () => finish();
                a.addEventListener('canplaythrough', onReady, { once: true });
                a.addEventListener('error', finish, { once: true });
                // Guardia: nunca bloquear el inicio del juego más de 8s por un audio
                setTimeout(finish, 8000);
                a.load();
            }));
        });
        await Promise.allSettled(loads);
    }
    applyCategoryVolumes() {
        this.registry.forEach(meta => {
            const base = typeof meta.volume === 'number' ? meta.volume : 1;
            if (meta.type === 'background') meta.audio.volume = base * this.musicVolume;
            else if (meta.type === 'effect' || meta.type === 'ui') meta.audio.volume = base * this.sfxVolume;
            else meta.audio.volume = base * this.otherVolume;
        });
    }
    async startMusic() {
        if (this._initPromise) {
            await this._initPromise;
        }
        this.playSound('backgroundmusic');
    }
    stopMusic() {
        this.stopSound('backgroundmusic');
    }
    playSFX(name) {
        const map = {
            correct: 'correctsound',
            incorrect: 'incorrectsound',
            hover: 'selecmenusound',
            select: 'selecmenusound'
        };
        const target = map[name] || name;
        this.playSound(target);
    }
    playSound(name, opts = {}) {
        const key = String(name || '').toLowerCase();
        const meta = this.registry.get(key);
        if (!meta) return;
        const a = meta.audio;
        const isBackground = meta.type === 'background';
        if (isBackground) {
            if (!a.paused) {
                // La música ya suena (y está en loop): no volver a encolarla
                this.state = 'playing';
                return;
            }
            try {
                a.currentTime = 0;
                this.state = 'playing';
                a.play().then(() => {
                    this.emitter.dispatchEvent(new CustomEvent('soundstart', { detail: { name: key } }));
                }).catch(() => {
                    const onClick = () => {
                        a.play();
                        document.removeEventListener('click', onClick);
                    };
                    document.addEventListener('click', onClick);
                });
            } catch {}
        } else {
            try {
                const clone = a.cloneNode(true);
                clone.volume = a.volume;
                clone.play().then(() => {
                    this.emitter.dispatchEvent(new CustomEvent('soundstart', { detail: { name: key } }));
                }).catch(() => {
                    const onClick = () => {
                        clone.play();
                        document.removeEventListener('click', onClick);
                    };
                    document.addEventListener('click', onClick);
                });
                clone.addEventListener('ended', () => {
                    clone.remove();
                    this.emitter.dispatchEvent(new CustomEvent('soundend', { detail: { name: key } }));
                }, { once: true });
            } catch {}
        }
    }
    pauseSound(name) {
        const meta = this.registry.get(String(name || '').toLowerCase());
        if (!meta) return;
        const a = meta.audio;
        a.pause();
        this.state = 'paused';
        this.emitter.dispatchEvent(new CustomEvent('soundpause', { detail: { name: meta.name } }));
    }
    stopSound(name) {
        const meta = this.registry.get(String(name || '').toLowerCase());
        if (!meta) return;
        const a = meta.audio;
        a.pause();
        a.currentTime = 0;
        this.queue = [];
        this.state = 'stopped';
        this.emitter.dispatchEvent(new CustomEvent('soundstop', { detail: { name: meta.name } }));
    }
    setVolume(name, value) {
        const meta = this.registry.get(String(name || '').toLowerCase());
        if (!meta) return;
        const v = Math.max(0, Math.min(1, Number(value)));
        meta.volume = v;
        meta.audio.volume = v;
        this.emitter.dispatchEvent(new CustomEvent('volumechange', { detail: { name: meta.name, volume: v } }));
    }
    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, Number(value)));
        localStorage.setItem('musicVolume', this.musicVolume);
        this.applyCategoryVolumes();
    }
    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, Number(value)));
        localStorage.setItem('sfxVolume', this.sfxVolume);
        this.applyCategoryVolumes();
    }
    setOtherVolume(value) {
        this.otherVolume = Math.max(0, Math.min(1, Number(value)));
        localStorage.setItem('otherVolume', this.otherVolume);
        this.applyCategoryVolumes();
    }
    getAllSounds() {
        const out = [];
        this.registry.forEach(meta => out.push({ name: meta.name, type: meta.type, volume: meta.volume }));
        return out;
    }
    addEventListener(type, handler) {
        this.emitter.addEventListener(type, handler);
    }
    removeEventListener(type, handler) {
        this.emitter.removeEventListener(type, handler);
    }
    _onEnded(name) {
        this.emitter.dispatchEvent(new CustomEvent('soundend', { detail: { name } }));
        this._processQueue();
    }
    _onError(name) {
        this.emitter.dispatchEvent(new CustomEvent('sounderror', { detail: { name } }));
    }
    _processQueue() {
        if (!this.queue.length) return;
        const next = this.queue.shift();
        this.playSound(next);
        this.emitter.dispatchEvent(new CustomEvent('queueprocessed', { detail: { next } }));
    }
    static getInstance() {
        return SoundManager._instance || new SoundManager();
    }
}
