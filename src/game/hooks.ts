// Centralized hook system for extensibility
export type HookName = 'onAttack' | 'onDamage' | 'onMove' | 'onDeath' | string;
export type HookCallback = (...args: any[]) => void;

export class HookManager {
    private hooks: Record<HookName, HookCallback[]> = {};

    on(hook: HookName, cb: HookCallback) {
        if (!this.hooks[hook]) this.hooks[hook] = [];
        this.hooks[hook].push(cb);
    }

    trigger(hook: HookName, ...args: any[]) {
        (this.hooks[hook] || []).forEach(cb => cb(...args));
    }
}
