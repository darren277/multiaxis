import { Vector3, Clock, Quaternion, Box3, Raycaster } from 'three';

// For pointer lock movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let isShiftDown = false;

let canJump = true;
const GRAVITY = 9.8 * 10; // units per second squared
const WORLD_Y   = new Vector3(0, 1, 0);
const WORLD_X   = new Vector3(1, 0, 0);
const GROUND_Y  = 0.25; // height of the ground plane
const turnSpeed = Math.PI / 2;      // 90 ° per second
const qTmp      = new Quaternion(); // reused tmp to avoid GC

const tempBox = new Box3();        // temporary box for the player
const tempPosition = new Vector3(); // for calculating next pos
const playerSize = 1.0;             // rough player "radius" (adjust if needed)

const speed = 20.0; // units per second

const velocity = new Vector3();
const direction = new Vector3();

const clock = new Clock();

export const staticBoxes   = [];   // immovable stuff
export const movingMeshes  = [];   // meshes that move every frame
export const obstacleBoxes = [];   // what the player collides with

const groundRay = new Raycaster();
const DOWN      = new Vector3(0, -1, 0);

export const worldMeshes = []; // meshes to check for ground

function onKeyDownWalking(event) {
    event.preventDefault();
    switch (event.code) {
        case 'ShiftLeft':
        case 'ShiftRight':
            isShiftDown = true; break;
        case 'KeyW':
        case 'ArrowUp':
            moveForward = true; break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true; break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = true; break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true; break;
        case 'Space':
            if (canJump === true) {
                velocity.y = 50;
                canJump = false;
            }
            break;
        default: break;
    }
}

function onKeyUpWalking(event) {
    event.preventDefault();
    switch (event.code) {
        case 'ShiftLeft':
        case 'ShiftRight':
            isShiftDown = false; break;
        case 'KeyW':
        case 'ArrowUp':
            moveForward = false; break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false; break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = false; break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false; break;
        default: break;
    }
}

function checkCollision(position, obstacleBoxes = [], ignore = null) {
    tempBox.setFromCenterAndSize(position, new Vector3(playerSize, playerSize * 2, playerSize));

    for (const box of obstacleBoxes) {
        if (box === ignore) continue;
        if (box.intersectsBox(tempBox)) {
            return true; // collision detected
        }
    }

    return false; // no collision
}

function walkingAnimationCallback(scene, controls, player, override = false) {
    if (controls.isLocked === true || (override === true && controls.name === 'PointerLockControls')) {
        const delta = clock.getDelta(); // measure time between frames
        const yawObject = controls.getObject();   // outer object of PLC

        if (isShiftDown) {
            // Rotate instead of move sideways
            if (moveLeft) {
                qTmp.setFromAxisAngle(WORLD_Y,  turnSpeed * delta); // left
                yawObject.quaternion.premultiply(qTmp);
            }
            if (moveRight) {
                qTmp.setFromAxisAngle(WORLD_Y, -turnSpeed * delta); // right
                yawObject.quaternion.premultiply(qTmp);
            }
            if (moveForward) {
                // TODO...
            }
            if (moveBackward) {
                // TODO...
            }
        } else {
            // Normal WASD movement
            direction.z = Number(moveBackward) - Number(moveForward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            const moveVector = new Vector3(direction.x, 0, direction.z);
            moveVector.applyQuaternion(yawObject.quaternion);

            velocity.x = moveVector.x * speed;
            velocity.z = moveVector.z * speed;

            tempPosition.copy(yawObject.position);

            const ignore =
                player.userData.currentPlatform?.userData.box        // moving lift
             || player.userData.currentGround?.userData.box          // static ground (walkway, floor)
             || null;

            // Attempt to move sideways
            tempPosition.x += velocity.x * delta;
            if (!checkCollision(tempPosition, obstacleBoxes, ignore)) {
                yawObject.position.x = tempPosition.x;
            }

            // Attempt to move forward/backward
            tempPosition.copy(yawObject.position);
            tempPosition.z += velocity.z * delta;
            if (!checkCollision(tempPosition, obstacleBoxes, ignore)) {
                yawObject.position.z = tempPosition.z;
            }
        }

        velocity.y -= GRAVITY * delta;
        yawObject.position.y += velocity.y * delta;

        // ───── New: raycast straight down for ground ────────────────
        const halfHeight = playerSize;               // from your earlier code
        groundRay.set(yawObject.position, DOWN);
        groundRay.far = halfHeight + 0.05;           // just past the player's feet

        const hit = groundRay.intersectObjects(worldMeshes, false)[0];
        if (hit) {
            // stand exactly on the hit point
            yawObject.position.y = hit.point.y + halfHeight;
            velocity.y = 0;
            canJump = true;
            // store the mesh we’re standing on
            player.userData.currentGround = hit.object;
        } else {
            player.userData.currentGround = null;
        }
    }
};

function addObstacle(mesh) {
    const box = new Box3().setFromObject(mesh);
    box.object = mesh;
    mesh.userData.box = box;
    staticBoxes.push(box);
}

export function updateObstacleBoxes() {
    obstacleBoxes.length = 0;               // recycle the array

    // 1) copy all the static ones
    staticBoxes.forEach(b => obstacleBoxes.push(b));

    // 2) refresh & copy each moving mesh
    movingMeshes.forEach(mesh => {
        if (!mesh.userData.box) mesh.userData.box = new Box3();
        mesh.userData.box.setFromObject(mesh);   // track its new position

        // make it tall enough to collide with the player
        mesh.userData.box.expandByVector(new Vector3(0, 2, 0));
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
