import { HemisphereLight, Mesh, MeshBasicMaterial, BoxGeometry, PlaneGeometry, Clock, Vector3, Raycaster, DoubleSide } from 'three';

/* PointerLock controls adapted from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html */

// ---------- Constants ----------
const TILE    = 10;          // size of one grid square
const WALL_H  =  4;          // wall height
const ACCEL   = 400;         // player acceleration (units/s²)
const ENEMY_SPEED = 8;       // chasing speed
const STATE_IDLE  = 'idle';
const STATE_CHASE = 'chase';

let canJump = true;

// Simple square map (1 = wall, 0 = empty)
const map = [
    [1,1,1,1,1,1],
    [1,0,0,0,0,1],
    [1,0,0,0,0,1],
    [1,0,0,0,0,1],
    [1,0,0,0,0,1],
    [1,1,1,1,1,1]
];

// ---------- Materials ----------
const floorMat = new MeshBasicMaterial({ color: 0x222222 });
const wallMat  = new MeshBasicMaterial({ color: 0x8888ff });
const enemyMat = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });

// ---------- Input handling ----------
const keyState = Object.create(null);
function onKey(evt) {
    console.log(evt.code, evt.type);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(evt.code)) {
        keyState[evt.code] = evt.type === 'keydown';
        // Prevent page scrolling when using arrow keys
        if (evt.code.startsWith('Arrow')) evt.preventDefault();
    }
    if (evt.code === 'Space' && canJump) {
        velocity.y = 200;
        canJump = false;
    }
}

const velocity  = new Vector3();
const moveTemp = new Vector3();
const direction = new Vector3();

let prevTime = performance.now();

function updatePlayer(controls, camera) {
    const time  = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    // Apply friction
    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;

    // Resolve key state (truthy/falsey)
    const forward = +!!(keyState['KeyW'] || keyState['ArrowUp']);
    const back    = +!!(keyState['KeyS'] || keyState['ArrowDown']);
    const left    = +!!(keyState['KeyA'] || keyState['ArrowLeft']);
    const right   = +!!(keyState['KeyD'] || keyState['ArrowRight']);

    // Build normalized direction vector (X/Z)
    direction.set(left - right, 0, back - forward);
    if (direction.lengthSq() > 0) direction.normalize();

    // Accelerate
    velocity.x -= direction.x * ACCEL * delta;
    velocity.z -= direction.z * ACCEL * delta;

    // Translate camera via controls helper
    if (controls && controls.isObject3D) {
        const playerObj = controls;
        moveTemp.setFromMatrixColumn(playerObj.matrix, 0); // X axis
        playerObj.position.addScaledVector(moveTemp, velocity.x * delta);

        moveTemp.setFromMatrixColumn(playerObj.matrix, 0);
        moveTemp.crossVectors(playerObj.up, moveTemp); // Z axis
        playerObj.position.addScaledVector(moveTemp, velocity.z * delta);

        // Apply vertical movement (jumping / falling)
        playerObj.position.y += velocity.y * delta;
        velocity.y -= 600 * delta; // gravity

        if (playerObj.position.y < 2) {
            velocity.y = 0;
            playerObj.position.y = 2;
            canJump = true;
        }
    } else {
        console.log('No controls helper found', controls.object);
        //console.warn('No controls helper found');
    }
}

// ---------- Enemy helpers ----------
const raycaster = new Raycaster();

function enemyLOS(enemy, camera, walls) {
    const dir = new Vector3().subVectors(camera.position, enemy.position).normalize();
    raycaster.set(enemy.position.clone().setY(3), dir);
    return raycaster.intersectObjects(walls, false).length === 0;
}

function playerDist(enemy, camera) { return enemy.position.distanceTo(camera.position); }

function updateEnemies(delta, data, camera) {
    data.enemies.forEach(e => {
        switch (e.userData.state) {
            case STATE_IDLE:
                if (playerDist(e, camera) < 60 && enemyLOS(e, camera, data.walls)) e.userData.state = STATE_CHASE;
                break;
            case STATE_CHASE:
                if (!enemyLOS(e, camera, data.walls)) { e.userData.state = STATE_IDLE; break; }
                const dir = new Vector3().subVectors(camera.position, e.position);
                dir.y = 0; dir.normalize();
                e.position.addScaledVector(dir, ENEMY_SPEED * delta);
                break;
        }
        e.lookAt(camera.position);
    });
}

function spawnEnemy(scene, data, gridX, gridZ) {
    const enemy = new Mesh(new PlaneGeometry(3, 6), enemyMat);
    enemy.position.set(gridX * TILE, 3, gridZ * TILE);
    enemy.userData.state = STATE_IDLE;
    scene.add(enemy);
    data.enemies.push(enemy);
}

// ---------- drawGame (called once by loader) ----------
function drawGame(scene, threejsDrawing) {
    // Provide a data bucket if not present
    if (!threejsDrawing.data) threejsDrawing.data = {};
    const data = threejsDrawing.data;
    data.walls   = [];
    data.enemies = [];

    // Build floor & walls
    for (let z = 0; z < map.length; z++) {
        for (let x = 0; x < map[z].length; x++) {
            // Floor
            const floor = new Mesh(new PlaneGeometry(TILE, TILE), floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(x * TILE, 0, z * TILE);
            scene.add(floor);

            if (map[z][x] === 1) {
                const wall = new Mesh(new BoxGeometry(TILE, WALL_H, TILE), wallMat);
                wall.position.set(x * TILE, WALL_H / 2, z * TILE);
                scene.add(wall);
                data.walls.push(wall);
            }
        }
    }

    // Initial enemy for demo purposes
    spawnEnemy(scene, data, 4, 4);
}

// ---------- animationCallback (runs every frame) ----------
const clock = new Clock();
function animationCallback(renderer, timestamp, threejsDrawing, uiState, camera) {
    const data     = threejsDrawing.data;
    const controls = data.controls;           // PointerLockControls comes from loader
    if (!controls) {
        console.warn('No controls found');
        return;
    }

    updatePlayer(camera, controls);
    updateEnemies(clock.getDelta(), data, camera);

    // Spawn a new enemy every 120 s (optional demo)
    const t = Math.floor(timestamp / 1000);
    if (!data.lastSpawn) data.lastSpawn = t;
    if (t - data.lastSpawn >= 120) {
        spawnEnemy(renderer.scene || camera.parent, data, 2, 2); // simple spawn
        data.lastSpawn = t;
    }
}

const gameDrawing = {
    sceneElements: [],
    drawFuncs: [ { func: drawGame, dataSrc: null } ],
    uiState: null,
    eventListeners: {
        keydown: (e, data) => onKey(e, data),
        keyup:   (e, data) => onKey(e, data)
    },
    animationCallback,
    data: {},
    sceneConfig: {
        startPosition: { x: 5, y: 2, z: 5 },
        controller: 'pointerlock'
    }
}

export { gameDrawing };
