import { Vector3 } from 'three';

// For pointer lock movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const velocity = new Vector3();
const direction = new Vector3();

function onKeyDownWalking(event) {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyD': moveRight = true; break;
    default: break;
  }
}

function onKeyUpWalking(event) {
  switch (event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyD': moveRight = false; break;
    default: break;
  }
}


// Then in your animation loop, apply movement
const speed = 5.0; // units per second

function walkingAnimationCallback(scene, controls) {
    if (controls.isLocked === true) {
        // handle movement
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // so diagonal movement isn't faster

        const delta = clock.getDelta(); // measure time between frames
        velocity.x = direction.x * speed * delta;
        velocity.z = direction.z * speed * delta;

        controls.moveRight(velocity.x);
        controls.moveForward(velocity.z);
    }
};


export {
    onKeyDownWalking,
    onKeyUpWalking,
    walkingAnimationCallback
};
