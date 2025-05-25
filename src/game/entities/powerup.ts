import { GameEngine } from '../engine.js';
import type { Player } from './player.js';

export type PowerUpType = 'rapid_fire' | 'shield' | 'triple_shot' | 'health' | 'speed_boost' | 'damage_boost' | 'piercing_shot' | 'homing_missiles' | 'shield_regen' | 'invincibility' | 'double_score';

export class PowerUp {
    x: number;
    y: number;
    width: number = 36;
    height: number = 36;
    type: PowerUpType;
    color: string;
    alive: boolean = true;
    bobOffset: number = 0;
    engine: GameEngine;

    constructor(engine: GameEngine, x: number, y: number, type: PowerUpType) {
        this.engine = engine;
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
        this.type = type;

        switch (type) {
            case 'rapid_fire': this.color = '#ff4'; break;
            case 'shield': this.color = '#4ff'; break;
            case 'triple_shot': this.color = '#f4f'; break;
            case 'health': this.color = '#4f4'; break;
            case 'speed_boost': this.color = '#8f8'; break;
            case 'damage_boost': this.color = '#f84'; break;
            case 'piercing_shot': this.color = '#84f'; break;
            case 'homing_missiles': this.color = '#f48'; break;
            case 'shield_regen': this.color = '#48f'; break;
            case 'invincibility': this.color = '#ff8'; break;
            case 'double_score': this.color = '#8ff'; break;
        }
    }

    update(dt: number) {
        this.bobOffset += dt * 3;
        this.y += Math.sin(this.bobOffset) * 0.5;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Draw power-up sprite based on type, otherwise fallback to rectangle
        let sprite: HTMLImageElement | null = null;
        switch (this.type) {
            case 'health':
                sprite = this.engine.sprites.getSprite('powerup_health');
                break;
            case 'shield':
            case 'shield_regen':
            case 'invincibility':
                sprite = this.engine.sprites.getSprite('powerup_shield');
                break;
            case 'rapid_fire':
            case 'triple_shot':
            case 'damage_boost':
            case 'piercing_shot':
            case 'homing_missiles':
                sprite = this.engine.sprites.getSprite('powerup_weapon');
                break;
            case 'speed_boost':
            case 'double_score':
                sprite = this.engine.sprites.getSprite('powerup_speed');
                break;
        }

        if (sprite) {
            // Add glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Add a glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
        }

        ctx.restore();
    }

    apply(player: Player) {
        player.applyPowerup(this.type);
        this.alive = false;
    }
}
