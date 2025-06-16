import * as THREE from 'three';

declare global {
    interface Window {
        debugObject?: THREE.Object3D | null;
    }
}

function degToRad(degrees: number) {
    return degrees * (Math.PI / 180);
}

function radToDeg(radians: number) {
    return radians * (180 / Math.PI);
}

class ClickAndKeyControls {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    moveAmount: number;          // Amount to move on arrow keys
    rotateAmount: number;        // Amount to rotate on arrow keys in radians
    selectedObject: THREE.Object3D | null; // Currently selected object
    raycaster: THREE.Raycaster;  // For raycasting on clicks
    mouse: THREE.Vector2;        // Mouse position for raycasting
    /**
     * @param scene - The Three.js scene to interact with
     * @param camera - The Three.js camera to manipulate
     * @param renderer - The Three.js WebGLRenderer to capture mouse events
     * @param moveAmount - Amount to move on arrow keys (default: 1)
     * @param rotateAmountDeg - Amount to rotate on arrow keys in degrees (default: 90)
     */
    constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, moveAmount = 1, rotateAmountDeg = 90) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.moveAmount = moveAmount;          // 1 unit translation
        //this.rotateAmount = THREE.Math.degToRad(rotateAmountDeg); // convert degrees to radians
        this.rotateAmount = degToRad(rotateAmountDeg); // convert degrees to radians

        this.selectedObject = null;            // track currently clicked object

        // For raycasting on clicks
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Bind event handlers
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        // Attach listeners
        this.renderer.domElement.addEventListener('click', this.handleClick, false);
        window.addEventListener('keydown', this.handleKeyDown, false);
    }

    // Clean up if needed
    dispose() {
        this.renderer.domElement.removeEventListener('click', this.handleClick);
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    handleClick(event: MouseEvent) {
        // Convert mouse to normalized device coords
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            // Get first intersected object
            const clicked = intersects[0].object;
            // Mark it as selected
            this.selectedObject = clicked;

            window.debugObject = this.selectedObject;
            // for access and manipulation via browser console.

            console.log(`Selected object: ${clicked.name || '(unnamed mesh)'}`);
            this.logStatus(); // show updated status
        } else {
            // Clicked empty space: deselect
            this.selectedObject = null;
            console.log('No object selected.');
            this.logStatus();
        }
    }

    handleKeyDown(event: KeyboardEvent) {
        // SHIFT => move, CTRL => rotate
        const isShift = event.shiftKey;
        const isCtrl = event.ctrlKey || event.metaKey; // e.g. Cmd on Mac

        if (!isShift && !isCtrl) return; // ignore arrow keys without SHIFT or CONTROL for this scenario
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(event.key)) return;

        // Decide whether to act on selected object or camera
        const target = this.selectedObject ?? this.camera;

        if (isShift) {
            // Move up/down/left/right in world space
            this.moveTarget(target, event.key);
        } else if (isCtrl) {
            // Rotate up/down/left/right by rotateAmount
            this.rotateTarget(target, event.key);
        }

        this.logStatus();
    }

    moveTarget(target: THREE.Object3D, arrowKey: string) {
        console.log(`Moving ${target.name || '(unnamed mesh)'} with key: ${arrowKey}`);
        // We'll interpret: Up => +Y, Down => -Y, Left => -X, Right => +X
        switch (arrowKey) {
            case 'ArrowUp':
                target.position.y += this.moveAmount;
                break;
            case 'ArrowDown':
                target.position.y -= this.moveAmount;
                break;
            case 'ArrowLeft':
                target.position.x -= this.moveAmount;
                break;
            case 'ArrowRight':
                target.position.x += this.moveAmount;
                break;
            case 'PageUp':
                target.position.z += this.moveAmount;
                break;
            case 'PageDown':
                target.position.z -= this.moveAmount;
                break;
        }
    }

    rotateTarget(target: THREE.Object3D, arrowKey: string) {
        // We'll interpret:
        //  ArrowUp => rotate +X axis
        //  ArrowDown => rotate -X axis
        //  ArrowLeft => rotate +Y axis
        //  ArrowRight => rotate -Y axis

        // If it's the camera, keep in mind the camera's orientation might also use .lookAt(...)
        // but for a simple approach, we can just spin them:

        switch (arrowKey) {
            case 'ArrowUp':
                target.rotation.x += this.rotateAmount;
                break;
            case 'ArrowDown':
                target.rotation.x -= this.rotateAmount;
                break;
            case 'ArrowLeft':
                target.rotation.y += this.rotateAmount;
                break;
            case 'ArrowRight':
                target.rotation.y -= this.rotateAmount;
                break;
            case 'PageUp':
                target.rotation.z += this.rotateAmount;
                break;
            case 'PageDown':
                target.rotation.z -= this.rotateAmount;
                break;
        }
    }

    logStatus() {
        if (this.selectedObject) {
            console.log(`Selected Object => position:
                (${this.selectedObject.position.x.toFixed(2)},
                 ${this.selectedObject.position.y.toFixed(2)},
                 ${this.selectedObject.position.z.toFixed(2)})
              rotation:
                (${radToDeg(this.selectedObject.rotation.x).toFixed(1)}°,
                 ${radToDeg(this.selectedObject.rotation.y).toFixed(1)}°,
                 ${radToDeg(this.selectedObject.rotation.z).toFixed(1)}°)`);
        } else {
            // No object selected => camera is the target
            console.log(`Camera => position:
                (${this.camera.position.x.toFixed(2)},
                 ${this.camera.position.y.toFixed(2)},
                 ${this.camera.position.z.toFixed(2)})
              rotation:
                (${radToDeg(this.camera.rotation.x).toFixed(1)}°,
                 ${radToDeg(this.camera.rotation.y).toFixed(1)}°,
                 ${radToDeg(this.camera.rotation.z).toFixed(1)}°)`);
        }
    }
}


export { ClickAndKeyControls };
