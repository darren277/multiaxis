import { HemisphereLight, Mesh, MeshBasicMaterial, BoxGeometry, PlaneGeometry, Clock, Vector3, Raycaster, DoubleSide } from 'three';

/* PointerLock controls adapted from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html */

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();

function drawGame(scene, threejsDrawing) {
    // === Light ===
    const light = new HemisphereLight(0xffffff, 0x444444);
    scene.add(light);

    // === Map Data ===
    const map = [
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
    ];

    //const tileSize = 1;
    const tileSize = 10;
    const wallHeight = 2;

    // === Materials ===
    const floorMat = new MeshBasicMaterial({ color: 0x222222 });
    const wallMat = new MeshBasicMaterial({ color: 0x8888ff });

    // === Walls Array for Raycasting ===
    const walls = [];

    // === Create Floor and Walls ===
    for (let z = 0; z < map.length; z++) {
        for (let x = 0; x < map[z].length; x++) {
            const tile = map[z][x];

            // Floor
            const floor = new Mesh(new PlaneGeometry(tileSize, tileSize), floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(x * tileSize, 0, z * tileSize);
            scene.add(floor);

            if (tile === 1) {
                const wall = new Mesh(new BoxGeometry(tileSize, wallHeight, tileSize), wallMat);
                wall.position.set(x * tileSize, wallHeight / 2, z * tileSize);
                scene.add(wall);
                walls.push(wall);
            }
        }
    }
}


const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

function handleMovement(controls) {
    const time = performance.now();

    if (controls.isLocked === true) {
        raycaster.ray.origin.copy(controls.object.position);
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects(objects, false);

        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.object.position.y += (velocity.y * delta); // new behavior

        if (controls.object.position.y < 10) {
            velocity.y = 0;
            controls.object.position.y = 10;
            canJump = true;
        }
    }

    prevTime = time;
}


// === Enemy Management ===
const STATE_IDLE = 'idle';
const STATE_CHASE = 'chase';
const enemies = [];

function spawnEnemy(cameraPosition, x, z) {
    const geometry = new PlaneGeometry(1, 2);
    const material = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
    const enemy = new Mesh(geometry, material);
    enemy.position.set(x, 1, z);
    enemy.lookAt(cameraPosition);
    enemy.userData.state = STATE_IDLE;
    scene.add(enemy);
    enemies.push(enemy);
}

function playerInRange(enemy, maxDistance = 10) {
    const distance = enemy.position.distanceTo(camera.position);
    return distance < maxDistance;
}

function hasLineOfSight(enemy) {
    const raycaster = new Raycaster();
    const direction = new Vector3().subVectors(camera.position, enemy.position).normalize();
    raycaster.set(enemy.position, direction);
    const intersects = raycaster.intersectObjects(walls);
    return intersects.length === 0;
}

function moveTowardPlayer(enemy, delta) {
    const speed = 1.0;
    const direction = new Vector3().subVectors(camera.position, enemy.position);
    direction.y = 0;
    direction.normalize();
    enemy.position.addScaledVector(direction, speed * delta);
}

function updateEnemies(delta) {
    enemies.forEach(enemy => {
        switch (enemy.userData.state) {
            case STATE_IDLE:
                if (playerInRange(enemy)) {
                    enemy.userData.state = STATE_CHASE;
                }
                break;
            case STATE_CHASE:
                if (hasLineOfSight(enemy)) {
                    moveTowardPlayer(enemy, delta);
                } else {
                    enemy.userData.state = STATE_IDLE;
                }
                break;
        }
        enemy.lookAt(camera.position);
    });
}


// === Game Loop ===
const clock = new Clock();


const gameDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawGame, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        const canvas = renderer.domElement;
        const scene = threejsDrawing.data.scene;
        const controls = threejsDrawing.data.controls;

        if (scene && controls) {
            // === Handle Movement ===
            handleMovement(controls);

            // every 2 minutes spawn an enemy
            const time = Math.floor(timestamp / 1000);
            if (time % 120 === 0) spawnEnemy(camera.position, 3, 3);

            const delta = clock.getDelta();
            updateEnemies(delta);
        }
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': {
            'x': 1.5,
            'y': 1.6,
            'z': 1.5,
        },
        'controller': 'pointerlock',
    }
}

export { gameDrawing };
