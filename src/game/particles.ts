// Particle system for visual effects
import { GameEngine } from './engine.js';

export type ParticleType = 'explosion' | 'muzzle_flash' | 'hit' | 'smoke';

export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    type: ParticleType;
    alive: boolean = true;

    constructor(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, type: ParticleType) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.type = type;
    }

    update(dt: number) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        if (this.life <= 0) {
            this.alive = false;
        }

        // Apply gravity to some particle types
        if (this.type === 'explosion') {
            this.vy += 50 * dt; // gravity
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;

        switch (this.type) {
            case 'explosion':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'muzzle_flash':
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
                break;

            case 'hit':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (1 - alpha), 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'smoke':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (2 - alpha), 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }
}

export class ParticleSystem {
    particles: Particle[] = [];
    engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    createExplosion(x: number, y: number, count: number = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = 0.5 + Math.random() * 0.5;
            const size = 6 + Math.random() * 8; // Doubled from 3 + 4
            const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push(new Particle(x, y, vx, vy, life, size, color, 'explosion'));
        }
    }

    createMuzzleFlash(x: number, y: number) {
        for (let i = 0; i < 3; i++) {
            const vx = (Math.random() - 0.5) * 20;
            const vy = -50 - Math.random() * 30;
            const life = 0.1 + Math.random() * 0.1;
            const size = 4 + Math.random() * 6; // Doubled from 2 + 3
            const color = '#ffff88';

            this.particles.push(new Particle(x, y, vx, vy, life, size, color, 'muzzle_flash'));
        }
    }

    createHitEffect(x: number, y: number) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 40;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = 0.2 + Math.random() * 0.2;
            const size = 12 + Math.random() * 8; // Increased from 8 + 6
            const color = '#ffffff';

            this.particles.push(new Particle(x, y, vx, vy, life, size, color, 'hit'));
        }
    }

    createSmoke(x: number, y: number, count: number = 3) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 30;
            const vy = -20 - Math.random() * 20;
            const life = 1 + Math.random() * 1;
            const size = 8 + Math.random() * 10; // Doubled from 4 + 6
            const gray = Math.floor(60 + Math.random() * 40);
            const color = `rgb(${gray}, ${gray}, ${gray})`;

            this.particles.push(new Particle(x, y, vx, vy, life, size, color, 'smoke'));
        }
    }

    update(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(dt);

            if (!particle.alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(particle => particle.render(ctx));
    }
}
