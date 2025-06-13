import { TextureLoader, Clock, Vector3, Box3 } from 'three';
import { GUI } from 'lil-gui';

// Import our modular “draw” functions
import { drawLights, updateLights, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances } from './drawLights.js';
import { drawFloor, loadWoodTextures, makeWoodMaterial, drawPerimeterWalkway, drawElevator, playerOnPlatform } from './drawFloor.js';
import { drawWalls } from './drawWalls.js';
import { walkingAnimationCallback, addObstacle, onKeyDownWalking, onKeyUpWalking, updateObstacleBoxes } from '../config/walking.js';
import { instantiateCollision } from '../config/instantiateCollision.js';

let previousShadowMap = false;

const textureLoader = new TextureLoader();

function drawRoom(scene, threejsDrawing) {
    // ~~~~~~~~~~~~~~~~~~
    // Draw lights
    const lights = drawLights(scene, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances);
    threejsDrawing.data.bulbLight = lights.bulbLight;
    threejsDrawing.data.bulbMat   = lights.bulbMat;
    threejsDrawing.data.hemiLight = lights.hemiLight;

    threejsDrawing.data.hemiLight.groundColor.set(0x666666);

    const woodTex = loadWoodTextures();           // one‑time
    const woodMat = makeWoodMaterial(woodTex);    // one shared material

    // ~~~~~~~~~~~~~~~~~~
    // Draw floor
    threejsDrawing.data.floor = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.floor.userData.isGround = true;   // optional flag
    threejsDrawing.data.worldMeshes.push(threejsDrawing.data.floor);          // add once at scene setup

    // Draw ceiling
    threejsDrawing.data.ceiling = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.ceiling.rotation.x = Math.PI / 2;
    threejsDrawing.data.ceiling.position.y = 200;
    addObstacle(threejsDrawing.data.staticBoxes, threejsDrawing.data.ceiling);

    // Draw walls
    threejsDrawing.data.southWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.southWall.rotation.x = Math.PI;
    threejsDrawing.data.southWall.position.z = -100;
    threejsDrawing.data.southWall.position.y = 100;
    addObstacle(threejsDrawing.data.staticBoxes, threejsDrawing.data.southWall);

    threejsDrawing.data.northWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.northWall.rotation.x = Math.PI;
    threejsDrawing.data.northWall.position.z = 100;
    threejsDrawing.data.northWall.position.y = 100;
    addObstacle(threejsDrawing.data.staticBoxes, threejsDrawing.data.northWall);

    threejsDrawing.data.eastWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.eastWall.rotation.y = Math.PI / 2;
    threejsDrawing.data.eastWall.position.x = 100;
    threejsDrawing.data.eastWall.position.y = 100;
    addObstacle(threejsDrawing.data.staticBoxes, threejsDrawing.data.eastWall);

    threejsDrawing.data.westWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.westWall.rotation.y = -Math.PI / 2;
    threejsDrawing.data.westWall.position.x = -100;
    threejsDrawing.data.westWall.position.y = 100;
    addObstacle(threejsDrawing.data.staticBoxes, threejsDrawing.data.westWall);

    // ~~~~~~~~~~~~~~~~~~
    // Draw walls (and sphere)
    const { cubeMesh, cubeMat, ballMesh, ballMat } = drawWalls(scene, textureLoader);
    threejsDrawing.data.cubeMat = cubeMat;
    threejsDrawing.data.ballMat = ballMat;
    threejsDrawing.data.cubeMesh = cubeMesh;
    threejsDrawing.data.ballMesh = ballMesh;
    addObstacle(threejsDrawing.data.staticBoxes, cubeMesh);
    addObstacle(threejsDrawing.data.staticBoxes, ballMesh);

    // Draw second floor walkway...
    threejsDrawing.data.secondFloorWalkway = drawPerimeterWalkway(scene, woodMat, 200, 25, 50);
    const { east, west, north, south } = threejsDrawing.data.secondFloorWalkway;
    addObstacle(threejsDrawing.data.staticBoxes, east);
    addObstacle(threejsDrawing.data.staticBoxes, west);
    addObstacle(threejsDrawing.data.staticBoxes, north);
    addObstacle(threejsDrawing.data.staticBoxes, south);
    threejsDrawing.data.worldMeshes.push(east);
    threejsDrawing.data.worldMeshes.push(west);
    threejsDrawing.data.worldMeshes.push(north);
    threejsDrawing.data.worldMeshes.push(south);
    [east, west, north, south].forEach(mesh => {mesh.userData.isGround = true; mesh.userData.isPlatform = true;});

    const elevator = drawElevator(scene, woodMat, {size: 20, thick: 0.4, floorY: 2.0, targetY: 90, rimClear: 50});
    threejsDrawing.data.elevator = elevator;
    threejsDrawing.data.movingMeshes.push(elevator);
    threejsDrawing.data.worldMeshes.push(elevator);

    scene.updateMatrixWorld(true);
    threejsDrawing.data.worldMeshes.forEach(m => {console.assert(!m.matrixWorldNeedsUpdate, `${m.uuid.slice(0,8)} still dirty (${m.name || 'unnamed'})`);});

    // ~~~~~~~~~~~~~~~~~~
    // GUI
//    const gui = new GUI();
//    gui.add(lightingParams, 'hemiIrradiance', Object.keys(hemiLuminousIrradiances));
//    gui.add(lightingParams, 'bulbPower', Object.keys(bulbLuminousPowers));
//    gui.add(lightingParams, 'exposure', 0, 1);
//    gui.add(lightingParams, 'shadows');
//    gui.open();

    instantiateCollision(threejsDrawing);
}

function animateElevator(lift, player, elapsed) {
    if (lift.userData.state === 'down') {
        if (playerOnPlatform(lift, player)) {
            lift.userData.state = 'moving';
            lift.userData.vy    = 10;           // units per second

            lift.userData.rider     = player;
            lift.userData.offsetY   = player.position.y - lift.position.y;
            player.userData.currentPlatform = lift;
        }
    }

    if (lift.userData.state === 'moving') {
        const deltaY = lift.userData.vy * elapsed;

        // simple linear rise
        lift.position.y += deltaY;

        // carry the rider, if any
        if (lift.userData.rider) {
            const r = lift.userData.rider;
            r.position.y = lift.position.y + lift.userData.offsetY;
            player.userData.currentPlatform = lift;

            // did the player walk / jump off?
            if (!playerOnPlatform(lift, r)) {
                lift.userData.rider = null;      // drop the latch
            }
        }

        if (lift.position.y >= lift.userData.targetY) {
            lift.position.y = lift.userData.targetY;
            lift.userData.state = 'up';
            lift.userData.rider = null;          // trip is over
            player.userData.currentPlatform = null;
        }

        lift.updateMatrixWorld();
        lift.userData.box.setFromObject(lift);
        lift.userData.box.expandByVector(new Vector3(0, 2, 0));
    }
}


function animateLights(renderer, threejsDrawing) {
    // Tone Mapping
    renderer.toneMappingExposure = Math.pow(lightingParams.exposure, 5.0);

    // Shadows
    renderer.shadowMap.enabled = lightingParams.shadows;
    threejsDrawing.data.bulbLight.castShadow = lightingParams.shadows;
    if (lightingParams.shadows !== previousShadowMap) {
        previousShadowMap = lightingParams.shadows;
    }

    // Update the lights
    updateLights({
        bulbLight: threejsDrawing.data.bulbLight,
        bulbMat: threejsDrawing.data.bulbMat,
        hemiLight: threejsDrawing.data.hemiLight,
        lightingParams,
        bulbLuminousPowers: bulbLuminousPowers,
        hemiLuminousIrradiances: hemiLuminousIrradiances
    });

    // Animate the bulb bouncing
    const time = Date.now() * 0.0005;
    threejsDrawing.data.bulbLight.position.y = Math.cos(time) * 0.75 + 1.25;
}

let lastTime = 0;

export function animateRoom(renderer, timestamp, threejsDrawing, camera) {
    animateLights(renderer, threejsDrawing);

    const scene = threejsDrawing.data.scene;
    const controls = threejsDrawing.data.controls;
    if (!controls) {
        console.warn('No controls found.');
        return;
    }

    if (!threejsDrawing.data.ready) return;

    const lift     = threejsDrawing.data.elevator;
    const player   = controls.object;

    //const elapsed = threejsDrawing.data.collision.clock.getDelta();
    const elapsed = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    scene.updateMatrixWorld(true);

    if (lift) {
        animateElevator(lift, player, elapsed);
    }

    updateObstacleBoxes(threejsDrawing.data.staticBoxes, threejsDrawing.data.movingMeshes, threejsDrawing.data.obstacleBoxes);

    walkingAnimationCallback(scene, controls, threejsDrawing.data.collision, elapsed, true);
}

const roomDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawRoom, 'dataSrc': null},
    ],
    'eventListeners': {
        'keydown': (event, stuff) => {
            const keyManager = stuff.data.keyManager;
            onKeyDownWalking(event, keyManager);
        },
        'keyup': (event, stuff) => {
            const keyManager = stuff.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
    },
    'animationCallback': animateRoom,
    'data': {
        'bulbLight': null,
        'bulbMat': null,
        'hemiLight': null,
        'floorMat': null,
        'cubeMat': null,
        'ballMat': null,
        'worldMeshes': [],
        'movingMeshes': [],
        'staticBoxes': [],
        'obstacleBoxes': [],
        'collision': null,
        'keyManager': null,
    },
    'sceneConfig': {
        'startPosition': { x: 0, y: 2, z: -75 },
    }
}

export { roomDrawing, drawRoom, animateLights, animateElevator };
