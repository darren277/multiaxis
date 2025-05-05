import { Vector3, Clock, Quaternion, Box3, Raycaster } from 'three';
import { getYawObject, CollisionManager } from './collisionManager.js';

//export const staticBoxes   = [];   // immovable stuff
//export const movingMeshes  = [];   // meshes that move every frame
//export const obstacleBoxes = [];   // what the player collides with


export const worldMeshes = []; // meshes to check for ground


function onKeyDownWalking(event, keyManager) {
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


function simpleBoxClamp(yawObject, obstacleBoxes) {
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

function walkingAnimationCallbackOld(scene, controls, player, worldMeshes, obstacleBoxes, override = false) {
    if (controls.isLocked === true || (override === true && controls.name === 'PointerLockControls')) {
        const delta = clock.getDelta(); // measure time between frames
        //const yawObject = controls.getObject();   // outer object of PLC
        const yawObject = getYawObject(controls);

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
        const halfHeight = playerSize;      // soles‑to‑eyes
        const footPos    = yawObject.position.clone().subScalar(halfHeight - 0.01);

        // ---------------------------------------------------------------
        // 0.1m‑high box under the player's soles
        const footBox = new Box3().setFromCenterAndSize(
            footPos,                               // footPos you already compute
            new Vector3(playerSize * 0.6, 0.1, playerSize * 0.6)
        );

        if (player.userData.currentPlatform) {
            const plat = player.userData.currentPlatform;

            // update its box just in case we haven't yet this frame
            if (plat.userData.boxNeedsRefresh) {
                plat.userData.box.setFromObject(plat);
                plat.userData.box.expandByVector(new Vector3(0, 2, 0));
                plat.userData.boxNeedsRefresh = false;
            }

            // ------- DETACH logic ---------
            if (!footBox.intersectsBox(plat.userData.box)) {
                // soles no longer overlap deck → un‑latch
                player.userData.currentPlatform = null;
                plat.userData.rider = null;
            }
        }

        /* ---------- boot strap ---------- */
        if (player.userData.lastGroundY === undefined) {
            // we have never stood on anything yet → cast long
            groundRay.far = 50;             // long enough for any reasonable spawn
        } else {
            /* ---------- adaptive length ---------- */
            const maxPossibleDrop = Math.max(player.userData.lastGroundY - footPos.y, 0);
            groundRay.far = STEP_DOWN + maxPossibleDrop;   // 0.4 m + drop since last frame
        }
        /* ----------------------------------------- */

        if (player.userData.currentPlatform) {
            const plat = player.userData.currentPlatform;
            yawObject.position.y = plat.position.y + plat.userData.offsetY + halfHeight;
            velocity.y = 0;
            canJump    = true;
            player.userData.lastGroundY   = plat.position.y;
            player.userData.currentGround = plat;
        } else {
            // normal ray logic
            const rayTargets = player.userData.currentPlatform ? [...worldMeshes, player.userData.currentPlatform] : worldMeshes;
            const hit = groundRay.intersectObjects(worldMeshes, true)[0]; // recurse = true
            if (hit) {
                const gap = footPos.y - hit.point.y;
                if (velocity.y <= 0 && gap <= STEP_DOWN + 0.01) { // land **only** when close
                //if (velocity.y <= 0) {
                    // stand exactly on the hit point
                    yawObject.position.y = hit.point.y + halfHeight;
                    velocity.y = 0;
                    canJump = true;

                    player.userData.lastGroundY = hit.point.y;
                    // store the mesh we’re standing on
                    player.userData.currentGround = hit.object;
                } else {
                    console.log('falling', hit, gap, velocity.y);
                }
            } else {
                player.userData.currentGround = null;
            }
        }
    }
};


function walkingAnimationCallback(scene, controls, collision, elapsed, override = false) {
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

function addObstacle(staticBoxes, mesh) {
    const box = new Box3().setFromObject(mesh);
    box.object = mesh;
    mesh.userData.box = box;
    staticBoxes.push(box);
}

export function updateObstacleBoxes(staticBoxes, movingMeshes, obstacleBoxes) {
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
