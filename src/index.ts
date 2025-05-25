import { GameEngine } from './game/engine.js';

window.onload = () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    const engine = new GameEngine(canvas);
    engine.start();
};