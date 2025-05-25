import { GameEngine } from '../engine.js';
import { HookManager } from '../hooks.js';
import { Projectile } from './projectile.js';
import { PowerUpType } from './powerup.js';

export class Boss {
    x: number = 350;
    y: number = 60;
    width: number = 150;
    height: number = 150;
    color: string = '#f44';
    maxHp: number = 800; // Much harder!
    hp: number = 800;
    lastAttack: number = 0;
    attackCooldown: number = 0.8; // Faster attacks
    direction: number = 1;
    speed: number = 80; // Faster movement
    engine: GameEngine;
    hooks: HookManager;
    phase: number = 1;
    lastPhaseChange: number = 0;

    // Respawn system
    lives: number = 5; // Total lives (respawns up to 5 times)
    currentLife: number = 1;
    powerUpsToSpawn: number = 2;

    // Burst firing system
    burstMode: boolean = false;
    burstCount: number = 0;
    maxBurstsPerRound: number = 5;
    burstCooldown: number = 0.2; // Time between shots in a burst
    roundCooldown: number = 3.0; // Time between burst rounds
    lastBurstTime: number = 0;

    constructor(engine: GameEngine, hooks: HookManager) {
        this.engine = engine;
        this.hooks = hooks;
    }

    takeDamage(amount: number) {
        const oldHp = this.hp;
        this.hp = Math.max(0, this.hp - amount);
        this.hooks.trigger('onDamage', this, amount);

        // Check for phase change at 50% HP
        if (this.phase === 1 && this.hp <= this.maxHp * 0.5 && oldHp > this.maxHp * 0.5) {
            this.enterPhase2();
        }

        if (this.hp <= 0) {
            this.onDeath();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.color = '#f84'; // Orange in phase 2
        this.attackCooldown = 0.4; // Even faster attacks
        this.speed = 120; // Much faster movement
        this.hooks.trigger('onPhaseChange', this, 2);
        this.engine.spawnPowerUp(this.engine.canvas.width / 2, this.engine.canvas.height / 2);
    }

    update(dt: number) {
        // Simple left-right movement
        this.x += this.direction * this.speed * dt;
        if (this.x < 0 || this.x > this.engine.canvas.width - this.width) {
            this.direction *= -1;
            this.hooks.trigger('onMove', this);
        }

        // Burst firing attack pattern
        const now = performance.now() / 1000;

        if (this.burstMode) {
            // In burst mode - fire rapidly
            if (now - this.lastBurstTime > this.burstCooldown) {
                this.attack();
                this.lastBurstTime = now;
                this.burstCount++;

                if (this.burstCount >= this.maxBurstsPerRound) {
                    // End burst round
                    this.burstMode = false;
                    this.burstCount = 0;
                    this.lastAttack = now; // Start cooldown timer
                }
            }
        } else {
            // Not in burst mode - check if it's time for next round
            if (now - this.lastAttack > this.roundCooldown) {
                this.burstMode = true;
                this.lastBurstTime = now;
            }
        }
    }

    attack() {
        this.hooks.trigger('onAttack', this);

        if (this.phase === 1) {
            // Phase 1: 5 projectiles in spread
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height;

            for (let i = -2; i <= 2; i++) {
                const proj = new Projectile(
                    this.engine,
                    centerX + i * 20 - 8, // Increased spacing and adjusted for larger projectiles
                    centerY,
                    i * 60,
                    250,
                    false
                );
                proj.color = '#f84';
                this.engine.projectiles.push(proj);
            }
        } else {
            // Phase 2: Spiral pattern + spread
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height;
            const time = performance.now() / 1000;

            // Spiral attack
            for (let i = 0; i < 8; i++) {
                const angle = (time * 3 + i * Math.PI / 4) % (Math.PI * 2);
                const proj = new Projectile(
                    this.engine,
                    centerX - 8, // Adjusted for larger projectiles
                    centerY,
                    Math.cos(angle) * 200,
                    Math.sin(angle) * 200 + 100,
                    false
                );
                proj.color = '#f94';
                this.engine.projectiles.push(proj);
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Phase 2 visual effects
        if (this.phase === 2) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
        }

        // Draw boss ship sprite if available, otherwise fallback to rectangle
        const bossSprite = this.engine.sprites.getSprite('boss_ship');
        if (bossSprite) {
            ctx.drawImage(bossSprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Health bar
        const barWidth = this.width;
        const barHeight = 12;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 20, barWidth, barHeight);
        ctx.fillStyle = this.phase === 1 ? '#f44' : '#f84';
        ctx.fillRect(this.x, this.y - 20, barWidth * (this.hp / this.maxHp), barHeight);

        // Phase indicator
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Phase ${this.phase}`, this.x + this.width / 2, this.y - 25);

        ctx.restore();
    }

    onDeath() {
        this.hooks.trigger('onDeath', this);

        if (this.currentLife < this.lives) {
            // Respawn boss
            this.respawn();
        } else {
            // Final death - trigger victory
            this.engine.gameState = 'victory';
        }
    }

    respawn() {
        this.currentLife++;

        // Heal player by 50%
        this.engine.player.hp = Math.min(this.engine.player.maxHp, this.engine.player.hp + this.engine.player.maxHp * 0.5);

        // Spawn multiple powerups
        const centerX = this.engine.canvas.width / 2;
        const centerY = this.engine.canvas.height / 2;
        const powerupTypes: PowerUpType[] = ['health', 'shield', 'rapid_fire', 'triple_shot', 'speed_boost', 'damage_boost', 'piercing_shot', 'homing_missiles'];

        for (let i = 0; i < this.powerUpsToSpawn; i++) {
            const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            const angle = (i / 3) * Math.PI * 2;
            const distance = 60;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            this.engine.spawnPowerUp(x, y, randomType);
        }

        // Reset boss with increased difficulty
        this.hp = this.maxHp;
        this.phase = 1;
        this.color = '#f44';

        // Scale difficulty with each respawn
        const difficultyScale = 1 + (this.currentLife - 1);
        this.maxHp = Math.floor(800 * difficultyScale);
        this.hp = this.maxHp;
        this.speed = Math.floor(80 * difficultyScale);
        this.attackCooldown = Math.max(0.3, 0.8 / difficultyScale);
        this.burstCooldown = Math.max(0.1, 0.2 / difficultyScale);
        this.maxBurstsPerRound = Math.min(10, 5 + this.currentLife);

        // Reset position
        this.x = 350;
        this.y = 60;
        this.direction = 1;

        // Reset burst state
        this.burstMode = false;
        this.burstCount = 0;
        this.lastBurstTime = 0;

        this.hooks.trigger('onBossRespawn', this, this.currentLife);
    }
}
