import { Player } from '../entities/player.js';
import { HookManager } from '../hooks.js';
import { Projectile } from '../entities/projectile.js';

export class Weapon {
    owner: Player;
    hooks: HookManager;
    cooldown: number = 0.25;
    lastFired: number = 0;
    tripleShot: boolean = false; // Power-up ability

    constructor(owner: Player, hooks: HookManager) {
        this.owner = owner;
        this.hooks = hooks;
    }

    fire() {
        const now = performance.now() / 1000;
        if (now - this.lastFired < this.cooldown) return;
        this.lastFired = now;
        this.hooks.trigger('onAttack', this.owner);

        if (this.tripleShot) {
            // Fire 3 projectiles in spread
            for (let i = -1; i <= 1; i++) {
                const projX = this.owner.x + this.owner.width / 2 - 8 + i * 15; // Adjusted for larger projectiles and spacing
                const projY = this.owner.y - 24; // Adjusted for larger projectiles
                const proj = new Projectile(
                    this.owner.engine,
                    projX,
                    projY,
                    i * 100, // horizontal spread
                    -500,
                    true
                );

                // Apply powerup effects
                if (this.owner.piercingShots) {
                    proj.piercing = true;
                }
                if (this.owner.homingMissiles) {
                    proj.homing = true;
                }

                this.owner.engine.projectiles.push(proj);
                // Add muzzle flash effect
                this.owner.engine.particles.createMuzzleFlash(projX + 8, projY);
            }
        } else {
            // Single projectile
            const projX = this.owner.x + this.owner.width / 2 - 8; // Adjusted for larger projectiles
            const projY = this.owner.y - 24; // Adjusted for larger projectiles
            const proj = new Projectile(
                this.owner.engine,
                projX,
                projY,
                0,
                -500,
                true
            );

            // Apply powerup effects
            if (this.owner.piercingShots) {
                proj.piercing = true;
            }
            if (this.owner.homingMissiles) {
                proj.homing = true;
            }

            this.owner.engine.projectiles.push(proj);
            // Add muzzle flash effect
            this.owner.engine.particles.createMuzzleFlash(projX + 8, projY); // Adjusted for larger projectiles
        }
    }
}
