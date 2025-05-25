export class SpriteManager {
    private sprites: Record<string, HTMLImageElement> = {};
    private loadedSprites: number = 0;
    private totalSprites: number = 0;

    constructor() {
        this.loadSprites();
    }

    private loadSprites() {
        const spriteList = [
            // Player assets
            { name: 'player_ship', path: 'assets/images/Foozle_2DS0011_Void_MainShip/Main Ship/Main Ship - Bases/PNGs/Main Ship - Base - Full health.png' },
            { name: 'player_projectile', path: 'assets/images/Foozle_2DS0011_Void_MainShip/Main ship weapons/PNGs/Main ship weapon - Projectile - Auto cannon bullet.png' },

            // Boss assets
            { name: 'boss_ship', path: 'assets/images/Foozle_2DS0014_Void_EnemyFleet_3/Nautolan/Designs - Base/PNGs/Nautolan Ship - Dreadnought - Base.png' },
            { name: 'boss_projectile', path: 'assets/images/Foozle_2DS0014_Void_EnemyFleet_3/Nautolan/Weapon Effects - Projectiles/PNGs/Nautolan - Bullet.png' },

            // Power-up assets
            { name: 'powerup_health', path: 'assets/images/Foozle_2DS0011_Void_MainShip/Main Ship/Main Ship - Shields/PNGs/Main Ship - Shields - Round Shield.png' },
            { name: 'powerup_shield', path: 'assets/images/Foozle_2DS0011_Void_MainShip/Main Ship/Main Ship - Shields/PNGs/Main Ship - Shields - Invincibility Shield.png' },
            { name: 'powerup_weapon', path: 'assets/images/Foozle_2DS0011_Void_MainShip/Main ship weapons/PNGs/Main ship weapon - Projectile - Big Space Gun.png' },
            { name: 'powerup_speed', path: 'assets/images/Foozle_2DS0011_Void_MainShip/Main Ship/Main Ship - Engine Effects/PNGs/Main Ship - Engines - Base Engine - Powering.png' }
        ];

        this.totalSprites = spriteList.length;

        spriteList.forEach(sprite => {
            const img = new Image();
            img.onload = () => {
                this.loadedSprites++;
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite: ${sprite.path}`);
                this.loadedSprites++;
            };
            img.src = sprite.path;
            this.sprites[sprite.name] = img;
        });
    }

    getSprite(name: string): HTMLImageElement | null {
        return this.sprites[name] || null;
    }

    isLoaded(): boolean {
        return this.loadedSprites >= this.totalSprites;
    }

    getLoadProgress(): number {
        return this.totalSprites > 0 ? this.loadedSprites / this.totalSprites : 1;
    }
}
