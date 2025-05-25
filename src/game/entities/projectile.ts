import { GameEngine } from '../engine.js';

export class Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number = 16;
    height: number = 24;
    color: string = '#fff';
    alive: boolean = true;
    fromPlayer: boolean;
    engine: GameEngine;
    piercing: boolean = false;
    homing: boolean = false;
    homingTarget: any = null;

    constructor(engine: GameEngine, x: number, y: number, vx: number, vy: number, fromPlayer: boolean) {
        this.engine = engine;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.fromPlayer = fromPlayer;
    }

    update(dt: number) {
        // Homing behavior for player projectiles
        if (this.homing && this.fromPlayer) {
            if (!this.homingTarget || !this.homingTarget.hp || this.homingTarget.hp <= 0) {
                this.homingTarget = this.engine.boss;
            }

            if (this.homingTarget && this.homingTarget.hp > 0) {
                const targetX = this.homingTarget.x + this.homingTarget.width / 2;
                const targetY = this.homingTarget.y + this.homingTarget.height / 2;
                const dx = targetX - (this.x + this.width / 2);
                const dy = targetY - (this.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    const homingStrength = 1000; // Adjust homing strength
                    const homingFactor = Math.min(1, homingStrength * dt / distance);
                    this.vx += dx * homingFactor;
                    this.vy += dy * homingFactor;

                    // Limit speed
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const maxSpeed = 600;
                    if (speed > maxSpeed) {
                        this.vx = (this.vx / speed) * maxSpeed;
                        this.vy = (this.vy / speed) * maxSpeed;
                    }
                }
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // Remove if out of bounds
        if (
            this.x < -this.width ||
            this.x > this.engine.canvas.width + this.width ||
            this.y < -this.height ||
            this.y > this.engine.canvas.height + this.height
        ) {
            this.alive = false;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Ensure projectiles are always visible
        ctx.globalAlpha = 1.0;

        // Draw projectile sprite based on owner, otherwise fallback to rectangle
        let sprite: HTMLImageElement | null = null;
        if (this.fromPlayer) {
            sprite = this.engine.sprites.getSprite('player_projectile');
        } else {
            sprite = this.engine.sprites.getSprite('boss_projectile');
        }

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Only draw sprite if it's fully loaded and valid
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback to solid colored rectangle for visibility
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Add a bright outline for better visibility
            ctx.strokeStyle = this.fromPlayer ? '#fff' : '#ff0';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }
}
