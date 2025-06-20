import * as THREE from 'three'
import { ThreeJSDrawing } from '../types'

/* PointerLock controls adapted from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html */

// ---------- Constants ----------
const TILE = 10 // size of one grid square
const WALL_H = 4 // wall height
const ACCEL = 400 // player acceleration (units/s²)
const ENEMY_SPEED = 8 // chasing speed
const STATE_IDLE = 'idle'
const STATE_CHASE = 'chase'

let canJump = true

// Simple square map (1 = wall, 0 = empty)
const map = [
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1],
]

// ---------- Materials ----------
const floorMat = new THREE.MeshBasicMaterial({ color: 0x222222 })
const wallMat = new THREE.MeshBasicMaterial({ color: 0x8888ff })
const enemyMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
})

// ---------- Input handling ----------
const keyState = Object.create(null)
function onKey(evt: KeyboardEvent, data: any) {
    console.log(evt.code, evt.type)
    if (
        [
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'KeyW',
            'KeyA',
            'KeyS',
            'KeyD',
        ].includes(evt.code)
    ) {
        keyState[evt.code] = evt.type === 'keydown'
        // Prevent page scrolling when using arrow keys
        if (evt.code.startsWith('Arrow')) evt.preventDefault()
    }
    if (evt.code === 'Space' && canJump) {
        velocity.y = 200
        canJump = false
    }
}

const velocity = new THREE.Vector3()
const moveTemp = new THREE.Vector3()
const direction = new THREE.Vector3()

let prevTime = performance.now()

function collidesWithWalls(pos: THREE.Vector3, walls: THREE.Object3D[]) {
    const radius = 2 // player collision radius
    const playerBox = new THREE.Sphere(pos, radius)
    return walls.some((wall) => {
        const wallBox = new THREE.Box3().setFromObject(wall)
        return wallBox.intersectsSphere(playerBox)
    })
}

function updatePlayer(controls: any, data: any) {
    const time = performance.now()
    const delta = (time - prevTime) / 1000
    prevTime = time

    // Apply friction
    velocity.x -= velocity.x * 10 * delta
    velocity.z -= velocity.z * 10 * delta

    // Resolve key state (truthy/falsey)
    const forward = +!!(keyState['KeyW'] || keyState['ArrowUp'])
    const back = +!!(keyState['KeyS'] || keyState['ArrowDown'])
    const left = +!!(keyState['KeyA'] || keyState['ArrowLeft'])
    const right = +!!(keyState['KeyD'] || keyState['ArrowRight'])

    // Build normalized direction vector (X/Z)
    direction.set(left - right, 0, back - forward)
    if (direction.lengthSq() > 0) direction.normalize()

    // Accelerate
    velocity.x -= direction.x * ACCEL * delta
    velocity.z -= direction.z * ACCEL * delta

    console.log('controls.lock 2:', typeof controls.lock)
    console.log('Received controls 2:', controls.constructor.name)

    // Translate camera via controls helper
    // Use the actual camera held by PointerLockControls decide once per frame which object we actually move
    const playerObj =
        (typeof controls.getObject === 'function' && controls.getObject()) || // classic
        controls.camera || // modern
        (controls.isObject3D ? controls : null) // already the camera

    if (!playerObj) {
        console.warn('Cannot find movable object on controls:', controls)
        return
    }

    const oldPos = playerObj.position.clone()

    // Attempt X movement
    moveTemp.setFromMatrixColumn(playerObj.matrix, 0) // X axis
    const moveX = moveTemp.clone().multiplyScalar(velocity.x * delta)
    playerObj.position.add(moveX)
    if (collidesWithWalls(playerObj.position, data.walls)) {
        playerObj.position.copy(oldPos) // Revert X
    }

    // Attempt Z movement
    moveTemp.setFromMatrixColumn(playerObj.matrix, 0)
    moveTemp.crossVectors(playerObj.up, moveTemp) // Z axis
    const moveZ = moveTemp.clone().multiplyScalar(velocity.z * delta)
    playerObj.position.add(moveZ)
    if (collidesWithWalls(playerObj.position, data.walls)) {
        playerObj.position.copy(oldPos) // Revert Z
    }

    // Apply vertical movement (jumping / falling) (jumping / falling)
    playerObj.position.y += velocity.y * delta
    velocity.y -= 600 * delta // gravity

    if (playerObj.position.y < 2) {
        velocity.y = 0
        playerObj.position.y = 2
        canJump = true
    }
}

// ---------- Enemy helpers ----------
const raycaster = new THREE.Raycaster()

function enemyLOS(
    enemy: THREE.Object3D,
    camera: THREE.Camera,
    walls: THREE.Object3D[],
) {
    const dir = new THREE.Vector3()
        .subVectors(camera.position, enemy.position)
        .normalize()
    raycaster.set(enemy.position.clone().setY(3), dir)
    return raycaster.intersectObjects(walls, false).length === 0
}

function playerDist(enemy: THREE.Object3D, camera: THREE.Camera) {
    return enemy.position.distanceTo(camera.position)
}

function updateEnemies(delta: number, data: any, camera: THREE.Camera) {
    data.enemies.forEach((e: THREE.Object3D) => {
        switch (e.userData.state) {
            case STATE_IDLE:
                if (
                    playerDist(e, camera) < 60 &&
                    enemyLOS(e, camera, data.walls)
                )
                    e.userData.state = STATE_CHASE
                break
            case STATE_CHASE:
                if (!enemyLOS(e, camera, data.walls)) {
                    e.userData.state = STATE_IDLE
                    break
                }
                const dir = new THREE.Vector3().subVectors(
                    camera.position,
                    e.position,
                )
                dir.y = 0
                dir.normalize()
                e.position.addScaledVector(dir, ENEMY_SPEED * delta)
                break
        }
        e.lookAt(camera.position)
    })
}

function spawnEnemy(
    scene: THREE.Scene,
    data: any,
    gridX: number,
    gridZ: number,
) {
    const enemy = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), enemyMat)
    enemy.position.set(gridX * TILE, 3, gridZ * TILE)
    enemy.userData.state = STATE_IDLE
    scene.add(enemy)
    data.enemies.push(enemy)
}

// ---------- drawGame (called once by loader) ----------
function drawGame(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    // Provide a data bucket if not present
    if (!threejsDrawing.data) threejsDrawing.data = {}
    // Explicitly type data to avoid 'unknown' errors
    const data = threejsDrawing.data as {
        walls: THREE.Object3D[]
        enemies: THREE.Object3D[]
        scene?: THREE.Scene
        [key: string]: any
    }
    data.walls = []
    data.enemies = []
    data.scene = scene

    // Build floor & walls
    for (let z = 0; z < map.length; z++) {
        for (let x = 0; x < map[z].length; x++) {
            // Floor
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(TILE, TILE),
                floorMat,
            )
            floor.rotation.x = -Math.PI / 2
            floor.position.set(x * TILE + TILE / 2, 0, z * TILE + TILE / 2)
            scene.add(floor)

            if (map[z][x] === 1) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(TILE, WALL_H, TILE),
                    wallMat,
                )
                wall.position.set(
                    x * TILE + TILE / 2,
                    WALL_H / 2,
                    z * TILE + TILE / 2,
                )
                scene.add(wall)
                data.walls.push(wall)
            }
        }
    }

    // Initial enemy for demo purposes
    spawnEnemy(scene, data, 4, 4)
}

// ---------- animationCallback (runs every frame) ----------
const clock = new THREE.Clock()
function animationCallback(
    renderer: THREE.WebGLRenderer,
    timestamp: number,
    threejsDrawing: ThreeJSDrawing,
    camera: THREE.Camera,
) {
    const data = threejsDrawing.data as {
        walls: THREE.Object3D[]
        enemies: THREE.Object3D[]
        controls?: any
        lastSpawn?: number
        [key: string]: any
    }
    const controls = data.controls // PointerLockControls comes from loader
    if (!controls) {
        console.warn('No controls found')
        return
    }

    updatePlayer(controls, data)
    updateEnemies(clock.getDelta(), data, camera)

    // Spawn a new enemy every 120 s (optional demo)
    const t = Math.floor(timestamp / 1000)
    if (!data.lastSpawn) {
        data.lastSpawn = t
        spawnEnemy(data.scene || camera.parent, data, 2, 2) // simple spawn
        data.lastSpawn = t
    }
}

const gameDrawing = {
    sceneElements: [],
    drawFuncs: [{ func: drawGame, dataSrc: null }],
    eventListeners: {
        keydown: (e: KeyboardEvent, data: any) => onKey(e, data),
        keyup: (e: KeyboardEvent, data: any) => onKey(e, data),
    },
    animationCallback,
    data: {},
    sceneConfig: {
        startPosition: { x: TILE * 1.5, y: 2, z: TILE * 1.5 },
        controller: 'pointerlock',
    },
}

export { gameDrawing }
