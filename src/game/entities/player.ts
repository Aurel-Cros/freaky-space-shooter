import { GameEngine } from '../engine.js';
import { HookManager } from '../hooks.js';
import { Weapon } from '../weapons/weapon.js';
import type { PowerUpType } from './powerup.js';

export class Player {
    x: number = 800;
    y: number = 800;
    speed: number = 350;
    width: number = 60;
    height: number = 60;
    color: string = '#4af';
    weapon: Weapon;
    modules: any[] = [];
    engine: GameEngine;
    hooks: HookManager;
    maxHp: number = 100;
    hp: number = 100;
    shield: number = 0; // Shield points

    // Powerup effects
    speedMultiplier: number = 1;
    damageMultiplier: number = 1;
    scoreMultiplier: number = 1;
    piercingShots: boolean = false;
    homingMissiles: boolean = false;
    shieldRegen: boolean = false;
    invincible: boolean = false;
    timeSlowActive: boolean = false;

    // Powerup timers
    powerupTimers: Record<string, number> = {};

    constructor(engine: GameEngine, hooks: HookManager) {
        this.engine = engine;
        this.hooks = hooks;
        this.weapon = new Weapon(this, hooks);
    }

    takeDamage(amount: number) {
        // Invincibility check
        if (this.invincible) return;

        // Shield absorbs damage first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
        }
        this.hp = Math.max(0, this.hp - amount);
        this.hooks.trigger('onDamage', this, amount);
        this.applyPowerup('invincibility', 2);
        if (this.hp <= 0) {
            this.hooks.trigger('onDeath', this);
        }
    }

    update(dt: number, keys: Record<string, boolean>, controllerInput?: any) {
        // Update powerup timers
        this.updatePowerupTimers(dt);

        let moved = false;
        const effectiveSpeed = this.speed * this.speedMultiplier;

        // Keyboard input
        if (keys['arrowleft'] || keys['a']) { this.x -= effectiveSpeed * dt; moved = true; }
        if (keys['arrowright'] || keys['d']) { this.x += effectiveSpeed * dt; moved = true; }
        if (keys['arrowup'] || keys['w']) { this.y -= effectiveSpeed * dt; moved = true; }
        if (keys['arrowdown'] || keys['s']) { this.y += effectiveSpeed * dt; moved = true; }

        // Controller input
        if (controllerInput) {
            if (controllerInput.left) { this.x -= effectiveSpeed * dt; moved = true; }
            if (controllerInput.right) { this.x += effectiveSpeed * dt; moved = true; }
            if (controllerInput.up) { this.y -= effectiveSpeed * dt; moved = true; }
            if (controllerInput.down) { this.y += effectiveSpeed * dt; moved = true; }
        }

        if (moved) this.hooks.trigger('onMove', this);

        // Shield regeneration
        if (this.shieldRegen && this.shield < 100) {
            this.shield = Math.round(Math.min(100, this.shield + 25 * dt));
        }

        // Clamp to canvas
        this.x = Math.max(0, Math.min(this.engine.canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.engine.canvas.height - this.height, this.y));

        // Fire weapon
        if (keys[' '] || (controllerInput && controllerInput.fire)) {
            this.weapon.fire();
        }

        // TODO: Update modules
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Draw player ship sprite if available, otherwise fallback to rectangle
        const playerSprite = this.engine.sprites.getSprite('player_ship');
        if (playerSprite) {
            ctx.drawImage(playerSprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Shield visual effect
        if (this.shield > 0) {
            ctx.strokeStyle = '#4ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
            ctx.setLineDash([]);
        }

        // Health bar
        const barWidth = this.width;
        const barHeight = 8;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 15, barWidth, barHeight);
        ctx.fillStyle = '#4f4';
        ctx.fillRect(this.x, this.y - 15, barWidth * (this.hp / this.maxHp), barHeight);

        // Shield bar (if present)
        if (this.shield > 0) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 25, barWidth, 6);
            ctx.fillStyle = '#4ff';
            ctx.fillRect(this.x, this.y - 25, barWidth * Math.min(1, this.shield / 50), 6);
        }

        ctx.restore();
    }

    updatePowerupTimers(dt: number) {
        // Update all powerup timers
        for (const powerup in this.powerupTimers) {
            const timeLeft = this.powerupTimers[powerup];
            const newTime = timeLeft - dt;
            if (newTime <= 0) {
                this.removePowerupEffect(powerup);
                delete this.powerupTimers[powerup];
            } else {
                this.powerupTimers[powerup] = newTime;
            }
        }
    }

    removePowerupEffect(powerupType: string) {
        switch (powerupType) {
            case 'rapid_fire':
                this.weapon.cooldown = 0.25;
                break;
            case 'triple_shot':
                this.weapon.tripleShot = false;
                break;
            case 'speed_boost':
                this.speedMultiplier = 1;
                break;
            case 'damage_boost':
                this.damageMultiplier = 1;
                break;
            case 'piercing_shot':
                this.piercingShots = false;
                this.damageMultiplier = 1;
                break;
            case 'homing_missiles':
                this.homingMissiles = false;
                break;
            case 'shield_regen':
                this.shieldRegen = false;
                break;
            case 'invincibility':
                this.invincible = false;
                break;
            case 'double_score':
                this.scoreMultiplier = 1;
                break;
        }
    }

    applyPowerup(type: PowerUpType, powerUpDuration?: number) {
        const duration = powerUpDuration ?? 15; // 15 seconds for timed powerups

        switch (type) {
            case 'health':
                this.hp = Math.min(this.maxHp, this.hp + 50);
                break;
            case 'shield':
                this.shield = Math.min(100, this.shield + 50);
                break;
            case 'rapid_fire':
                this.weapon.cooldown = 0.1;
                this.powerupTimers[type] = duration;
                break;
            case 'triple_shot':
                this.weapon.tripleShot = true;
                this.powerupTimers[type] = duration;
                break;
            case 'speed_boost':
                this.speedMultiplier = 1.5;
                this.powerupTimers[type] = duration;
                break;
            case 'damage_boost':
                this.damageMultiplier = 2;
                this.powerupTimers[type] = duration;
                break;
            case 'piercing_shot':
                this.piercingShots = true;
                this.damageMultiplier = 0.1;
                this.powerupTimers[type] = duration;
                break;
            case 'homing_missiles':
                this.homingMissiles = true;
                this.powerupTimers[type] = duration;
                break;
            case 'shield_regen':
                this.shieldRegen = true;
                this.powerupTimers[type] = duration; // Longer duration
                break;
            case 'invincibility':
                this.invincible = true;
                this.powerupTimers[type] = powerUpDuration ?? 5; // Shorter duration
                break;
            case 'double_score':
                this.scoreMultiplier = 2;
                this.powerupTimers[type] = duration;
                break;
        }
    }
}
