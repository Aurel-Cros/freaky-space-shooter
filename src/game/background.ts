export class BackgroundManager {
    private images: HTMLImageElement[] = [];
    private currentImage: number = 0;
    private loadedImages: number = 0;
    private totalImages: number = 8;
    private scrollY: number = 0;
    private scrollSpeed: number = 20;

    constructor() {
        this.loadBackgrounds();
    }

    private loadBackgrounds() {
        for (let i = 1; i <= this.totalImages; i++) {
            const img = new Image();
            img.onload = () => {
                this.loadedImages++;
            };
            img.src = `assets/images/backgrounds/Purple_Nebula_0${i}-1024x1024.png`;
            this.images.push(img);
        }
    }

    update(dt: number) {
        this.scrollY += this.scrollSpeed * dt;
        if (this.scrollY >= 1024) {
            this.scrollY = 0;
            if (Math.random() < 0.1) {
                this.currentImage = (this.currentImage + 1) % this.totalImages;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        if (this.loadedImages === 0) return;

        const img = this.images[this.currentImage];
        if (!img) return;

        ctx.save();

        const scale = Math.max(canvasWidth / 1024, canvasHeight / 1024) * 1.2;
        const scaledWidth = 1024 * scale;
        const scaledHeight = 1024 * scale;
        const offsetX = (canvasWidth - scaledWidth) / 2;
        const offsetY = (canvasHeight - scaledHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY - this.scrollY, scaledWidth, scaledHeight);
        ctx.drawImage(img, offsetX, offsetY - this.scrollY + scaledHeight, scaledWidth, scaledHeight);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.restore();
    }

    isLoaded(): boolean {
        return this.loadedImages === this.totalImages;
    }
}
