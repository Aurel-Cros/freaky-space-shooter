// Core game loop, input, and rendering engine
import { Player } from './entities/player.js';
import { Boss } from './entities/boss.js';
import { HookManager } from './hooks.js';
import { Projectile } from './entities/projectile.js';
import { PowerUp, PowerUpType } from './entities/powerup.js';
import { ControllerManager } from './controller.js';
import { BackgroundManager } from './background.js';
import { SpriteManager } from './sprite-manager.js';
import { ParticleSystem } from './particles.js';
import { SoundManager } from './sound-manager.js';
import { ScreenShake } from './screen-shake.js';

export class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    player: Player;
    boss: Boss;
    hooks: HookManager;
    keys: Record<string, boolean> = {};
    controller: ControllerManager;
    background: BackgroundManager;
    sprites: SpriteManager;
    particles: ParticleSystem;
    sounds: SoundManager;
    screenShake: ScreenShake;
    lastTimestamp: number = 0;
    projectiles: Projectile[] = [];
    powerUps: PowerUp[] = [];
    gameState: 'playing' | 'gameOver' | 'victory' = 'playing';
    score: number = 0;
    timeScale: number = 1.0;
    startTime: number = 0;
    initialPowerUpSpawned: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.hooks = new HookManager();
        this.controller = new ControllerManager();
        this.background = new BackgroundManager();
        this.sprites = new SpriteManager();
        this.particles = new ParticleSystem(this);
        this.sounds = new SoundManager();
        this.screenShake = new ScreenShake();
        this.player = new Player(this, this.hooks);
        this.boss = new Boss(this, this.hooks);
        this.startTime = performance.now() / 1000;
        this.setupInput();
        this.setupHooks();

        // Spawn initial power-up after 5 seconds
        setTimeout(() => this.spawnRandomPowerUp(), 5000);
    }

    setupInput() {
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        // Restart game
        window.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 'r' && this.gameState !== 'playing') {
                this.restart();
            }
        });
    }

    setupHooks() {
        this.hooks.on('onDeath', (entity) => {
            if (entity === this.player) {
                this.gameState = 'gameOver';
                // Player explosion
                this.particles.createExplosion(entity.x + entity.width / 2, entity.y + entity.height / 2, 15);
                this.sounds.playExplosion();
                this.screenShake.start(15, 0.5);
            } else if (entity === this.boss) {
                // Check if boss has more lives
                if (this.boss.currentLife < this.boss.lives) {
                    // Boss will respawn - don't end game yet
                    this.score += 500; // Partial bonus for defeating boss life
                } else {
                    // Final death - trigger victory
                    this.gameState = 'victory';
                    this.score += 1000; // Full bonus for final defeat
                }

                // Boss explosion - bigger effect
                this.particles.createExplosion(entity.x + entity.width / 2, entity.y + entity.height / 2, 25);
                this.particles.createSmoke(entity.x + entity.width / 2, entity.y + entity.height / 2, 10);
                this.sounds.playExplosion();
                this.screenShake.start(20, 0.8);
            }
        });

        this.hooks.on('onDamage', (entity, damage) => {
            if (entity === this.boss) {
                this.score += damage; // Points for hitting boss
                // Small smoke effect on boss damage
                this.particles.createSmoke(entity.x + Math.random() * entity.width, entity.y + Math.random() * entity.height, 2);
                this.sounds.playHit();
                this.screenShake.start(3, 0.1);
            } else if (entity === this.player) {
                this.screenShake.start(8, 0.3);
            }
        });

        this.hooks.on('onAttack', (entity) => {
            if (entity === this.player) {
                this.sounds.playShoot();
            } else if (entity === this.boss) {
                this.sounds.playBossShoot();
            }
        });

        this.hooks.on('onBossRespawn', (boss, currentLife) => {
            // Boss respawn notification effects
            this.particles.createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 20);
            this.sounds.playExplosion();
            this.screenShake.start(12, 0.4);
        });
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp: number) {
        const dt = (timestamp - this.lastTimestamp) / 1000 || 0;
        this.lastTimestamp = timestamp;
        this.update(dt);
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    } update(dt: number) {
        if (this.gameState !== 'playing') return;

        // Apply time scaling for time slow powerup
        const scaledDt = dt * this.timeScale;

        this.background.update(scaledDt);
        const controllerInput = this.controller.update();
        this.player.update(scaledDt, this.keys, controllerInput);
        this.boss.update(scaledDt);
        this.projectiles.forEach(p => p.update(scaledDt));
        this.projectiles = this.projectiles.filter(p => p.alive);
        this.powerUps.forEach(p => p.update(scaledDt));
        this.particles.update(scaledDt);
        this.screenShake.update(dt); // Screen shake should not be affected by time scale

        this.checkCollisions();

        // Update score based on survival time (with multiplier)
        this.score += Math.floor(dt * 10 * this.player.scoreMultiplier);
    } checkCollisions() {
        this.projectiles.forEach(projectile => {
            if (!projectile.alive) return;

            // Player projectiles hitting boss
            if (projectile.fromPlayer && this.isColliding(projectile, this.boss)) {
                const damage = 25 * this.player.damageMultiplier;
                this.boss.takeDamage(damage);

                // Piercing shots don't get destroyed
                if (!projectile.piercing) {
                    projectile.alive = false;
                }

                // Add hit effect
                this.particles.createHitEffect(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2);
            }

            // Boss projectiles hitting player
            if (!projectile.fromPlayer && this.isColliding(projectile, this.player)) {
                this.player.takeDamage(20);
                projectile.alive = false;
                // Add hit effect
                this.particles.createHitEffect(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2);
            }
        });

        // Power-up collection
        this.powerUps.forEach(powerUp => {
            if (powerUp.alive && this.isColliding(powerUp, this.player)) {
                this.player.applyPowerup(powerUp.type);
                this.score += 100 * this.player.scoreMultiplier;
                this.sounds.playPowerUp();
                powerUp.alive = false;
            }
        });
        this.powerUps = this.powerUps.filter(p => p.alive);
    }

    isColliding(rect1: any, rect2: any): boolean {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Show loading screen if sprites aren't ready
        if (!this.sprites.isLoaded() || !this.background.isLoaded()) {
            this.renderLoadingScreen();
            return;
        }

        // Apply screen shake
        this.ctx.save();
        this.screenShake.apply(this.ctx);

        // Render animated background
        this.background.render(this.ctx, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing') {
            this.player.render(this.ctx);
            this.boss.render(this.ctx);
            this.projectiles.forEach(p => p.render(this.ctx));
            this.powerUps.forEach(p => p.render(this.ctx));
            this.particles.render(this.ctx);
        }

        // Restore context before UI rendering
        this.ctx.restore();

        this.renderUI();
    }

    renderLoadingScreen() {
        this.ctx.save();
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);

        // Progress bar
        const progress = (this.sprites.getLoadProgress() + (this.background.isLoaded() ? 1 : 0)) / 2;
        const barWidth = 400;
        const barHeight = 25;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height / 2 + 40;

        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = '#4af';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        this.ctx.restore();
    } renderUI() {
        this.ctx.save();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';

        // Score display (top left)
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 15, 35);

        // Game time
        const gameTime = Math.floor(performance.now() / 1000 - this.startTime);
        this.ctx.fillText(`Time: ${gameTime}s`, 15, 70);            // Boss HP indicator (top center)
        if (this.gameState === 'playing') {
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Boss HP: ${this.boss.hp}/${this.boss.maxHp} (Life ${this.boss.currentLife}/${this.boss.lives})`, this.canvas.width / 2, 35);

            // Player stats (top right)
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, this.canvas.width - 15, 35);
            if (this.player.shield > 0) {
                this.ctx.fillText(`Shield: ${this.player.shield}`, this.canvas.width - 15, 70);
            }

            // Show active powerups
            let powerupY = 105;
            for (const powerup in this.player.powerupTimers) {
                const timeLeft = this.player.powerupTimers[powerup];
                this.ctx.fillText(`${powerup}: ${Math.ceil(timeLeft)}s`, this.canvas.width - 15, powerupY);
                powerupY += 25;
            }
        }

        if (this.gameState === 'gameOver') {
            this.ctx.textAlign = 'center';
            this.ctx.font = '48px Arial';
            this.ctx.fillStyle = '#f44';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '28px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 85);
        } else if (this.gameState === 'victory') {
            this.ctx.textAlign = 'center';
            this.ctx.font = '48px Arial';
            this.ctx.fillStyle = '#4f4';
            this.ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '28px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 85);
        }

        this.ctx.restore();
    }

    restart() {
        this.gameState = 'playing';
        this.projectiles = [];
        this.powerUps = [];
        this.score = 0;
        this.timeScale = 1.0;
        this.player.hp = this.player.maxHp;
        this.boss.hp = this.boss.maxHp;
        this.boss.phase = 1;
        this.boss.color = '#f44';
        this.boss.attackCooldown = 0.8;
        this.boss.speed = 80;
        this.boss.lives = 5;
        this.boss.currentLife = 1;
        this.boss.burstMode = false;
        this.boss.burstCount = 0;
        this.player.x = 400;
        this.player.y = 500;
        this.boss.x = 350;
        this.boss.y = 60;
        this.startTime = performance.now() / 1000;
        this.initialPowerUpSpawned = false;

        // Reset all player abilities and powerups
        this.player.weapon.cooldown = 0.25;
        this.player.weapon.tripleShot = false;
        this.player.shield = 0;
        this.player.speedMultiplier = 1;
        this.player.damageMultiplier = 1;
        this.player.scoreMultiplier = 1;
        this.player.piercingShots = false;
        this.player.homingMissiles = false;
        this.player.shieldRegen = false;
        this.player.invincible = false;
        this.player.timeSlowActive = false;
        this.player.powerupTimers = {};

        // Spawn initial power-up after 5 seconds
        setTimeout(() => this.spawnRandomPowerUp(), 5000);
    }

    spawnRandomPowerUp() {
        const types: PowerUpType[] = ['rapid_fire', 'shield', 'triple_shot', 'health', 'speed_boost', 'damage_boost', 'piercing_shot', 'homing_missiles', 'shield_regen', 'invincibility', 'double_score'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.spawnPowerUp(
            Math.random() * (this.canvas.width - 50) + 25,
            Math.random() * (this.canvas.height * 0.6) + 100,
            randomType
        );
    }

    spawnPowerUp(x: number, y: number, type?: PowerUpType) {
        const types: PowerUpType[] = ['rapid_fire', 'shield', 'triple_shot', 'health', 'speed_boost', 'damage_boost', 'piercing_shot', 'homing_missiles', 'shield_regen', 'invincibility', 'double_score'];
        const powerUpType = type || types[Math.floor(Math.random() * types.length)];
        this.powerUps.push(new PowerUp(this, x, y, powerUpType));
    }
}
