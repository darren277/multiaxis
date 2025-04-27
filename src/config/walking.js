import { Vector3, Clock, Quaternion } from 'three';

// For pointer lock movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let isShiftDown = false;

let canJump = true;
const GRAVITY = 9.8 * 10; // units per second squared
const WORLD_Y   = new Vector3( 0, 1, 0 );
const WORLD_X   = new Vector3( 1, 0, 0 );
const GROUND_Y  = 0.25; // height of the ground plane
const turnSpeed = Math.PI / 2;      // 90 ° per second
const qTmp      = new Quaternion(); // reused tmp to avoid GC

const speed = 20.0; // units per second

const velocity = new Vector3();
const direction = new Vector3();

const clock = new Clock();

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


function walkingAnimationCallback(scene, controls, override = false) {
    if (controls.isLocked === true || (override === true && controls.getObject)) {
        const delta = clock.getDelta(); // measure time between frames
        const yawObject = controls.getObject();   // outer object of PLC

        if (isShiftDown) {
            // Rotate instead of move sideways
            if (moveLeft) {
                qTmp.setFromAxisAngle( WORLD_Y,  turnSpeed * delta ); // left
                yawObject.quaternion.premultiply( qTmp );
            }
            if (moveRight) {
                qTmp.setFromAxisAngle( WORLD_Y, -turnSpeed * delta ); // right
                yawObject.quaternion.premultiply( qTmp );
            }
            if (moveForward) {
                // TODO...
            }
            if (moveBackward) {
                // TODO...
            }
        } else {
            // Normal WASD movement
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            velocity.x = direction.x * speed;
            velocity.z = direction.z * speed;

            controls.moveRight(velocity.x * delta);
            controls.moveForward(velocity.z * delta);
        }

        velocity.y -= GRAVITY * delta;
        yawObject.position.y += velocity.y * delta;

        if ( yawObject.position.y < GROUND_Y ) {
            velocity.y = 0;
            yawObject.position.y = GROUND_Y;
            canJump = true;
        }
    }
};


export {
    onKeyDownWalking,
    onKeyUpWalking,
    walkingAnimationCallback
};
