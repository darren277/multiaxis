import { TextureLoader, Clock } from 'three';
import { GUI } from 'lil-gui';

// Import our modular “draw” functions
import { drawLights, updateLights, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances } from './drawLights.js';
import { drawFloor, loadWoodTextures, makeWoodMaterial, drawPerimeterWalkway, drawElevator, playerOnPlatform } from './drawFloor.js';
import { drawWalls } from './drawWalls.js';
import { walkingAnimationCallback, addObstacle, onKeyDownWalking, onKeyUpWalking, updateObstacleBoxes, movingMeshes, obstacleBoxes } from '../config/walking.js';

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
    addObstacle(threejsDrawing.data.floor);

    // Draw ceiling
    threejsDrawing.data.ceiling = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.ceiling.rotation.x = Math.PI / 2;
    threejsDrawing.data.ceiling.position.y = 200;
    addObstacle(threejsDrawing.data.ceiling);

    // Draw walls
    threejsDrawing.data.southWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.southWall.rotation.x = Math.PI;
    threejsDrawing.data.southWall.position.z = -100;
    threejsDrawing.data.southWall.position.y = 100;
    addObstacle(threejsDrawing.data.southWall);

    threejsDrawing.data.northWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.northWall.rotation.x = Math.PI;
    threejsDrawing.data.northWall.position.z = 100;
    threejsDrawing.data.northWall.position.y = 100;
    addObstacle(threejsDrawing.data.northWall);

    threejsDrawing.data.eastWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.eastWall.rotation.y = Math.PI / 2;
    threejsDrawing.data.eastWall.position.x = 100;
    threejsDrawing.data.eastWall.position.y = 100;
    addObstacle(threejsDrawing.data.eastWall);

    threejsDrawing.data.westWall = drawFloor(scene, woodMat, 200);
    threejsDrawing.data.westWall.rotation.y = -Math.PI / 2;
    threejsDrawing.data.westWall.position.x = -100;
    threejsDrawing.data.westWall.position.y = 100;
    addObstacle(threejsDrawing.data.westWall);

    // ~~~~~~~~~~~~~~~~~~
    // Draw walls (and sphere)
    const { cubeMesh, cubeMat, ballMesh, ballMat } = drawWalls(scene, textureLoader);
    threejsDrawing.data.cubeMat = cubeMat;
    threejsDrawing.data.ballMat = ballMat;
    threejsDrawing.data.cubeMesh = cubeMesh;
    threejsDrawing.data.ballMesh = ballMesh;
    addObstacle(cubeMesh);
    addObstacle(ballMesh);

    // Draw second floor walkway...
    threejsDrawing.data.secondFloorWalkway = drawPerimeterWalkway(scene, woodMat, 200, 25, 50);
    const { east, west, north, south } = threejsDrawing.data.secondFloorWalkway;
    addObstacle(east);
    addObstacle(west);
    addObstacle(north);
    addObstacle(south);

    const elevator = drawElevator(scene, woodMat, {size: 20, thick: 0.4, floorY: 0.2, targetY: 90, rimClear: 25});
    threejsDrawing.data.elevator = elevator;
    movingMeshes.push(elevator);

    // ~~~~~~~~~~~~~~~~~~
    // GUI
    const gui = new GUI();
    gui.add(lightingParams, 'hemiIrradiance', Object.keys(hemiLuminousIrradiances));
    gui.add(lightingParams, 'bulbPower', Object.keys(bulbLuminousPowers));
    gui.add(lightingParams, 'exposure', 0, 1);
    gui.add(lightingParams, 'shadows');
    gui.open();
}

function animateElevator(lift, player, elapsed) {
    console.log('movingMeshes', movingMeshes);
    console.log(movingMeshes[0].userData.box);
    if (lift.userData.state === 'down') {
        if (playerOnPlatform(lift, player)) {
            lift.userData.state = 'moving';
            lift.userData.vy    = 10;           // units per second
        }
    }

    if (lift.userData.state === 'moving') {
        const deltaY = lift.userData.vy * elapsed;

        // simple linear rise
        lift.position.y += deltaY;

        // move player with the lift *if* they’re still on it
        if (playerOnPlatform(lift, player)) {
            player.position.y  += deltaY;
        }

        if (lift.position.y >= lift.userData.targetY) {
            // clamp, switch to 'up' state
            const overshoot = lift.position.y - lift.userData.targetY;
            lift.position.y -= overshoot;
            if (playerOnPlatform(lift, player)) {
                player.position.y -= overshoot;
            }
            lift.userData.state = 'up';
        }
    }
}

const clock    = new Clock();

const roomDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawRoom, 'dataSrc': null},
    ],
    'eventListeners': {
        'keydown': (event) => {
            onKeyDownWalking(event);
        },
        'keyup': (event) => {
            onKeyUpWalking(event);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        // LIGHT STUFF //
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

        const scene = threejsDrawing.data.scene;
        const controls = threejsDrawing.data.controls;
        if (!controls) {
            console.warn('No controls found.');
            return;
        }

        const lift     = threejsDrawing.data.elevator;
        const player   = controls.object;

        const elapsed  = clock.getDelta();

        updateObstacleBoxes();

        if (lift) {
            animateElevator(lift, player, elapsed);
        }

        walkingAnimationCallback(scene, controls, true, obstacleBoxes);
    },
    'data': {
        'bulbLight': null,
        'bulbMat': null,
        'hemiLight': null,
        'floorMat': null,
        'cubeMat': null,
        'ballMat': null
    }
}

export { roomDrawing };
