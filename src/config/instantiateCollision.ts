import * as THREE from 'three';
import { CollisionManager, InputManager } from '../config/collisionManager';
import { ThreeJSDrawing } from '../threejsDrawing';
import { makeCollisionManager, setInputManager } from './walking';

// Define KeyManager interface if not imported from elsewhere
interface KeyManager {
    isShiftDown: boolean;
    moveForward: boolean;
    moveLeft: boolean;
    moveBackward: boolean;
    moveRight: boolean;
    canJump: boolean;
    jumpPressed: boolean;
    // velocity?: { y: number }; // Uncomment if velocity is used

    syncFromInput(): void;
    debugDump(): any;
}

export function makeLegacyKeyManager(input: InputManager): KeyManager {
  return {
    isShiftDown: false,
    moveForward: false,
    moveLeft: false,
    moveBackward: false,
    moveRight: false,
    canJump: true,
    jumpPressed: false,

    // Old-style `keydown` handler will toggle these booleans
    // But they'll also be updated during input.update()
    syncFromInput() {
      this.moveForward = input.direction.z > 0;
      this.moveBackward = input.direction.z < 0;
      this.moveLeft = input.direction.x < 0;
      this.moveRight = input.direction.x > 0;
      this.canJump = input.canJump;
    },

    // Optional: useful for debugging or replaying input
    debugDump() {
      return {
        dir: input.direction.toArray(),
        jump: input.consumeJump(),
      };
    },
  };
}

export function instantiateCollision(threejsDrawing: ThreeJSDrawing) {
    const playerObject = (threejsDrawing.data.controls as { object: any }).object;

    const worldMeshes = (threejsDrawing.data.worldMeshes as THREE.Object3D[] | undefined)?.filter(
        (obj): obj is THREE.Mesh => obj instanceof THREE.Mesh
    ) ?? [];

    const staticBoxes: THREE.Box3[] =
    (threejsDrawing.data.staticBoxes as any[] | undefined)
        ?.reduce<THREE.Box3[]>((out, candidate) => {
            if (candidate instanceof THREE.Object3D) {
                // ensure its world matrix is current
                candidate.updateMatrixWorld(true);
                const box = new THREE.Box3().setFromObject(candidate);
                out.push(box);
            } else {
                console.warn('Skipping non-Object3D staticBox:', candidate);
            }
            return out;
        }, []) ?? [];

    const movingMeshes = (threejsDrawing.data.movingMeshes as THREE.Object3D[] | undefined)?.filter(
        (obj): obj is THREE.Mesh => obj instanceof THREE.Mesh
    ) ?? [];

    const debugRayHelper = new THREE.ArrowHelper();
    (threejsDrawing.data.scene as THREE.Scene).add(debugRayHelper);

    const collision = new CollisionManager({player: playerObject, targets: {worldMeshes, staticBoxes, movingMeshes}, debugArrow: debugRayHelper});
    //const collision = makeCollisionManager(playerObject, threejsDrawing.data.scene, { debugRay: true });

    setInputManager(collision.keyManager);

    const legacyKeyManager = makeLegacyKeyManager(collision.keyManager);
    threejsDrawing.data.keyManager = legacyKeyManager;
    setInputManager(collision.keyManager);

    // Optional: override config if needed (PhysicsConfig is currently fixed, but could be made dynamic)
    // You can add code here to modify PhysicsConfig directly if using from JSON

    threejsDrawing.data.collision = collision;

    playerObject.position.set(
        threejsDrawing.sceneConfig?.startPosition?.x ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.y ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.z ?? 0
    );

    threejsDrawing.data.ready = true;

    threejsDrawing.data.collision = collision;
}
