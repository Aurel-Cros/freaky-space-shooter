export class ControllerManager {
    gamepad: Gamepad | null = null;
    deadzone: number = 0.15;

    constructor() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepad = e.gamepad;
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            this.gamepad = null;
        });
    }

    update(): ControllerInput {
        const input: ControllerInput = {
            left: false,
            right: false,
            up: false,
            down: false,
            fire: false,
            pause: false
        };

        if (!this.gamepad) return input;

        // Update gamepad state
        const gamepads = navigator.getGamepads();
        this.gamepad = gamepads[this.gamepad.index];

        if (this.gamepad) {
            // Left stick movement
            const leftX = this.gamepad.axes[0];
            const leftY = this.gamepad.axes[1];

            if (Math.abs(leftX) > this.deadzone) {
                input.left = leftX < -this.deadzone;
                input.right = leftX > this.deadzone;
            }

            if (Math.abs(leftY) > this.deadzone) {
                input.up = leftY < -this.deadzone;
                input.down = leftY > this.deadzone;
            }

            // D-pad
            input.left = input.left || this.gamepad.buttons[14]?.pressed;
            input.right = input.right || this.gamepad.buttons[15]?.pressed;
            input.up = input.up || this.gamepad.buttons[12]?.pressed;
            input.down = input.down || this.gamepad.buttons[13]?.pressed;

            // Fire button (A, X, RT, RB)
            input.fire = this.gamepad.buttons[0]?.pressed || // A
                this.gamepad.buttons[2]?.pressed || // X
                this.gamepad.buttons[7]?.pressed || // RT
                this.gamepad.buttons[5]?.pressed;   // RB

            // Pause (Start/Menu)
            input.pause = this.gamepad.buttons[9]?.pressed;
        }

        return input;
    }
}

export interface ControllerInput {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    fire: boolean;
    pause: boolean;
}
