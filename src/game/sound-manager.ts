// Simple sound system for game audio
export class SoundManager {
    private musicVolume: number = 0.3;
    private sfxVolume: number = 0.5;
    private enabled: boolean = true;
    private audioContext: AudioContext | null = null;
    private userInteracted: boolean = false;

    constructor() {
        // Wait for user interaction before initializing audio
        this.setupUserInteractionHandler();
    }

    private setupUserInteractionHandler() {
        const enableAudio = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                try {
                    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                } catch (e) {
                    console.warn('AudioContext not supported, audio disabled');
                }
                // Remove listeners after first interaction
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('keydown', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
            }
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        document.addEventListener('touchstart', enableAudio);
    }

    // Simple beep generation for basic sound effects
    private playBeep(frequency: number = 440, duration: number = 0.1, volume: number = 0.3) {
        if (!this.enabled || !this.userInteracted || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // Silently fail if audio context creation fails
        }
    }

    playShoot() {
        this.playBeep(800, 0.1, 0.2);
    }

    playBossShoot() {
        this.playBeep(400, 0.15, 0.3);
    }

    playHit() {
        this.playBeep(300, 0.05, 0.4);
    }

    playExplosion() {
        // Create a more complex explosion sound
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playBeep(150 + Math.random() * 100, 0.2 + Math.random() * 0.1, 0.3);
            }, i * 50);
        }
    }

    playPowerUp() {
        // Ascending tone for power-up
        this.playBeep(440, 0.1, 0.3);
        setTimeout(() => this.playBeep(550, 0.1, 0.3), 100);
        setTimeout(() => this.playBeep(660, 0.1, 0.3), 200);
    }

    playBackgroundMusic() {
        // Placeholder for background music implementation
    }

    stopBackgroundMusic() {
        // Placeholder for stopping background music
    }

    setMusicVolume(volume: number) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        // Placeholder for applying music volume
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
}
