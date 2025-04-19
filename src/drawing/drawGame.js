import { HemisphereLight, Mesh, MeshBasicMaterial, BoxGeometry, PlaneGeometry, Clock, Vector3, Raycaster, DoubleSide } from 'three';


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

// === Movement State ===
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function handleMovement(forward, cameraUp, delta) {
    const speed = 3;
    const direction = new Vector3();
    const right = new Vector3();
    const move = new Vector3();

    if (keys['KeyW']) direction.z -= 1;
    if (keys['KeyS']) direction.z += 1;
    if (keys['KeyA']) direction.x -= 1;
    if (keys['KeyD']) direction.x += 1;

    forward.y = 0;
    forward.normalize();

    // Right/left
    right.crossVectors(forward, cameraUp).normalize();

    move.copy(forward).multiplyScalar(direction.z).add(right.multiplyScalar(direction.x));

    //controls.moveRight(move.x * speed * delta);
    //controls.moveForward(move.z * speed * delta);
    return {
        moveRight: move.x * speed * delta,
        moveForward: move.z * speed * delta,
    }
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
function animateGame(forward, cameraUp) {
    const delta = clock.getDelta();
    const {moveRight, moveForward} = handleMovement(forward, cameraUp, delta);
    updateEnemies(delta);

    return {moveRight, moveForward}
}


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

        const cameraRotation = camera.rotation;

        // Forward/backward
        const forward = new Vector3();
        camera.getWorldDirection(forward);

        const cameraUp = camera.up.clone();

        if (scene && controls) {
            const {moveRight, moveForward} = animateGame(forward, cameraUp);
            controls.moveRight(moveRight);
            controls.moveForward(moveForward);

            // every 2 minutes spawn an enemy
            const time = Math.floor(timestamp / 1000);
            if (time % 120 === 0) spawnEnemy(camera.position, 3, 3);
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
