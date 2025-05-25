// Screen shake effect for visual feedback
export class ScreenShake {
    intensity: number = 0;
    duration: number = 0;
    currentTime: number = 0;
    offsetX: number = 0;
    offsetY: number = 0;

    start(intensity: number, duration: number) {
        this.intensity = intensity;
        this.duration = duration;
        this.currentTime = 0;
    }

    update(dt: number) {
        if (this.currentTime < this.duration) {
            this.currentTime += dt;

            // Calculate shake progress (0 to 1)
            const progress = Math.min(this.currentTime / this.duration, 1);

            // Reduce intensity over time
            const currentIntensity = this.intensity * (1 - progress);

            // Generate random offset
            this.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
            this.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    apply(ctx: CanvasRenderingContext2D) {
        if (this.offsetX !== 0 || this.offsetY !== 0) {
            ctx.translate(this.offsetX, this.offsetY);
        }
    }

    isActive(): boolean {
        return this.currentTime < this.duration;
    }
}
