import * as THREE from 'three';
import { getYawObject, CollisionManager } from './collisionManager';

//export const staticBoxes   = [];   // immovable stuff
//export const movingMeshes  = [];   // meshes that move every frame
//export const obstacleBoxes = [];   // what the player collides with


export const worldMeshes = []; // meshes to check for ground


function onKeyDownWalking(event: KeyboardEvent, keyManager: KeyManager) {
    event.preventDefault();
    switch (event.code) {
        case 'ShiftLeft':
        case 'ShiftRight':
            keyManager.isShiftDown = true; break;
        case 'KeyW':
        case 'ArrowUp':
            keyManager.moveForward = true; break;
        case 'KeyA':
        case 'ArrowLeft':
            keyManager.moveLeft = true; break;
        case 'KeyS':
        case 'ArrowDown':
            keyManager.moveBackward = true; break;
        case 'KeyD':
        case 'ArrowRight':
            keyManager.moveRight = true; break;
        case 'Space':
            if (keyManager.canJump === true) {
                //keyManager.velocity.y = 50;
                keyManager.jumpPressed = true;
            }
            break;
        default: break;
    }
}

function onKeyUpWalking(event, keyManager) {
    event.preventDefault();
    switch (event.code) {
        case 'ShiftLeft':
        case 'ShiftRight':
            keyManager.isShiftDown = false; break;
        case 'KeyW':
        case 'ArrowUp':
            keyManager.moveForward = false; break;
        case 'KeyA':
        case 'ArrowLeft':
            keyManager.moveLeft = false; break;
        case 'KeyS':
        case 'ArrowDown':
            keyManager.moveBackward = false; break;
        case 'KeyD':
        case 'ArrowRight':
            keyManager.moveRight = false; break;
        default: break;
    }
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

function walkingAnimationCallback(scene: THREE.Scene, controls: any, collision: any, elapsed: number, override = false) {
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

function addObstacle(staticBoxes: THREE.Box3[], source: THREE.Object3D) {
    if (source instanceof THREE.Box3) {            // already a Box3, just store it
        staticBoxes.push(source);
        return;
    }

    // otherwise expect an Object3D mesh
    const box = new THREE.Box3().setFromObject(source);
    // box.object = source; // Removed: Box3 has no 'object' property
    source.userData.box = box;
    staticBoxes.push(box);
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

export {
    onKeyDownWalking,
    onKeyUpWalking,
    walkingAnimationCallback,
    addObstacle,
};
