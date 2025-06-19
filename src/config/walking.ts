// walking.ts ── TS‑friendly helpers for the refactored physics stack
//------------------------------------------------------------
import * as THREE from 'three';
import { CollisionManager, InputManager } from './collisionManager';
import { ThreeJSDrawing } from '../types';

let sharedInputManager: InputManager | null = null;

/**
 * Call this once with your app's real `InputManager`
 * so the compatibility wrappers can forward events to it.
 */
export function setInputManager(manager: InputManager) {
  sharedInputManager = manager;
}

/**
 * Legacy keyboard down handler — wraps new InputManager logic.
 */
export function onKeyDownWalking(event: KeyboardEvent, keyManager: InputManager) {
  event.preventDefault();
  if (!sharedInputManager) {
    console.warn('onKeyDownWalking called before InputManager was set.');
    return;
  }

  if (keyManager) mutateLegacyFlags(true, event.code, keyManager);

  // 2) Feed the new InputManager if it's ready
  if (sharedInputManager) (sharedInputManager as any).keys[event.code] = true;
}

/**
 * Legacy keyboard up handler — wraps new InputManager logic.
 */
export function onKeyUpWalking(event: KeyboardEvent, keyManager: InputManager) {
  event.preventDefault();
  if (!sharedInputManager) {
    console.warn('onKeyUpWalking called before InputManager was set.');
    return;
  }

  if (keyManager) mutateLegacyFlags(false, event.code, keyManager);

  // 2) Feed the new InputManager if it's ready
  if (sharedInputManager) (sharedInputManager as any).keys[event.code] = false;
}

function mutateLegacyFlags(down: boolean, code: string, km: any) {
  switch (code) {
    case 'ShiftLeft': case 'ShiftRight': km.isShiftDown = down; break;
    case 'KeyW': case 'ArrowUp':         km.moveForward  = down; break;
    case 'KeyA': case 'ArrowLeft':       km.moveLeft     = down; break;
    case 'KeyS': case 'ArrowDown':       km.moveBackward = down; break;
    case 'KeyD': case 'ArrowRight':      km.moveRight    = down; break;
    case 'Space': if (down && km.canJump) km.jumpPressed = true; break;
  }
}

//------------------------------------------------------------
// Utilities
//------------------------------------------------------------

/** Register a world mesh the avatar can stand on. */
export function addGround(threejsDrawing: ThreeJSDrawing, mesh: THREE.Mesh) {
  threejsDrawing.data.worldMeshes.push(mesh);
}

function createBox3Helper(box: THREE.Box3, scene: THREE.Scene) {
    const helper = new THREE.Box3Helper(box, 0xffff00); // Yellow color
    scene.add(helper);
}

/** Register a static obstacle (mesh or pre‑built Box3). */
export function addObstacle(threejsDrawing: ThreeJSDrawing, source: THREE.Object3D | THREE.Box3, scene: THREE.Scene) {
    if (!threejsDrawing.data) {
        threejsDrawing.data = {
            staticBoxes: [],
            worldMeshes: [],
            movingMeshes: [],
        };
    }

    if (source instanceof THREE.Box3) {
        threejsDrawing.data.staticBoxes.push(source);

        //createBox3Helper(source, scene);
    } else {
        const box = new THREE.Box3().setFromObject(source);

        console.log(`[Obstacle Created] Name: ${source.name}, Min: ${box.min.x.toFixed(2)}, ${box.min.y.toFixed(2)}, ${box.min.z.toFixed(2)}, Max: ${box.max.x.toFixed(2)}, ${box.max.y.toFixed(2)}, ${box.max.z.toFixed(2)}`);

        //createBox3Helper(box, scene);

        // Make the box taller to ensure it collides with the player,
        // even if the mesh's base is at y=0.
        box.max.y += 3; // Add 3 units to the top of the box.
        
        source.userData.box = box;
        threejsDrawing.data.staticBoxes.push(box);
    }
}


/**
 * Create a ready‑to‑go CollisionManager for this level.
 * You call this once during setup, then call `update()` every frame.
 */
export function makeCollisionManager(
  threejsDrawing: ThreeJSDrawing,
  playerObj: THREE.Object3D,
  scene: THREE.Scene,
  opts: { debugRay?: boolean } = {},
) {
  const debugArrow = opts.debugRay
    ? new THREE.ArrowHelper()
    : undefined;

  if (debugArrow) scene.add(debugArrow);

  // Build and return the manager
  return new CollisionManager({
    player: playerObj,
    targets: { worldMeshes: threejsDrawing.data.worldMeshes, staticBoxes: threejsDrawing.data.staticBoxes, movingMeshes: threejsDrawing.data.movingMeshes },
    debugArrow,
  });
}

/**
 * Convenience animation‑loop wrapper.
 *
 * Example usage:
 * ```ts
 * const collision = makeCollisionManager(player, scene, { debugRay: true });
 *
 * renderer.setAnimationLoop((dt) => {
 *   collision.update();          // input + physics + collisions
 *   renderer.render(scene, cam);
 * });
 * ```
 */
export function runFrame(collision: CollisionManager) {
  collision.update();
}


function simpleBoxClamp(yawObject: { position: { x: any; z: any; }; }, obstacleBoxes: any) {
    // ———————————————— simple box clamp ————————————————
    // snap to the highest static box under your feet
    const px = yawObject.position.x, pz = yawObject.position.z;
    let bestY = -Infinity;

    for (const box of obstacleBoxes) {
        if (px >= box.min.x && px <= box.max.x && pz >= box.min.z && pz <= box.max.z) {
            bestY = Math.max(bestY, box.max.y);
        }
    }

    return bestY;
}

export function walkingAnimationCallback(scene: THREE.Scene, controls: any, _: any, elapsed: number, override = false) {
    const collision = (controls?.threejsDrawing?.data?.collision || (controls?.collision));
    if (!collision) return;

    if (controls.isLocked === true || (override === true && controls.name === 'PointerLockControls')) {
        //const delta = clock.getDelta(); // measure time between frames
        //const yawObject = controls.getObject();   // outer object of PLC
        //const yawObject = getYawObject(controls);
        const ignore =
                collision.player.userData.currentPlatform?.userData.box        // moving lift
             || collision.player.userData.currentGround?.userData.box          // static ground (walkway, floor)
             || null;

        collision.update(controls, elapsed, ignore);
    }
}


export function updateObstacleBoxes(staticBoxes: THREE.Box3[], movingMeshes: THREE.Mesh[], obstacleBoxes: THREE.Box3[]) {
    obstacleBoxes.length = 0;               // recycle the array

    // 1) copy all the static ones
    staticBoxes.forEach(b => obstacleBoxes.push(b));

    // 2) refresh & copy each moving mesh
    movingMeshes.forEach(mesh => {
        if (!mesh.userData.box) mesh.userData.box = new THREE.Box3();
        mesh.userData.box.setFromObject(mesh);   // track its new position

        // make it tall enough to collide with the player
        mesh.userData.box.expandByVector(new THREE.Vector3(0, 2, 0));
        mesh.userData.box.object = mesh;

        obstacleBoxes.push(mesh.userData.box);
    });
}

