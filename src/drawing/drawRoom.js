import { TextureLoader } from 'three';
import { GUI } from 'lil-gui';

// Import our modular “draw” functions
import { drawLights, updateLights, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances } from './drawLights.js';
import { drawFloor } from './drawFloor.js';
import { drawWalls } from './drawWalls.js';
import { walkingAnimationCallback, addObstacle, onKeyDownWalking, onKeyUpWalking } from '../config/walking.js';

let previousShadowMap = false;

const obstacleBoxes = [];

const textureLoader = new TextureLoader();

function drawRoom(scene, threejsDrawing) {
    // ~~~~~~~~~~~~~~~~~~
    // Draw lights
    const lights = drawLights(scene, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances);
    threejsDrawing.data.bulbLight = lights.bulbLight;
    threejsDrawing.data.bulbMat   = lights.bulbMat;
    threejsDrawing.data.hemiLight = lights.hemiLight;

    // ~~~~~~~~~~~~~~~~~~
    // Draw floor
    threejsDrawing.data.floor = drawFloor(scene, textureLoader, 200);
    addObstacle(obstacleBoxes, threejsDrawing.data.floor);

    // Draw ceiling
    threejsDrawing.data.ceiling = drawFloor(scene, textureLoader, 200);
    threejsDrawing.data.ceiling.rotation.x = Math.PI / 2;
    threejsDrawing.data.ceiling.position.y = 200;
    addObstacle(obstacleBoxes, threejsDrawing.data.ceiling);

    // Draw walls
    threejsDrawing.data.southWall = drawFloor(scene, textureLoader, 200);
    threejsDrawing.data.southWall.rotation.x = Math.PI;
    threejsDrawing.data.southWall.position.z = -100;
    threejsDrawing.data.southWall.position.y = 100;
    addObstacle(obstacleBoxes, threejsDrawing.data.southWall);

    threejsDrawing.data.northWall = drawFloor(scene, textureLoader, 200);
    threejsDrawing.data.northWall.rotation.x = Math.PI;
    threejsDrawing.data.northWall.position.z = 100;
    threejsDrawing.data.northWall.position.y = 100;
    addObstacle(obstacleBoxes, threejsDrawing.data.northWall);

    threejsDrawing.data.eastWall = drawFloor(scene, textureLoader, 200);
    threejsDrawing.data.eastWall.rotation.y = Math.PI / 2;
    threejsDrawing.data.eastWall.position.x = 100;
    threejsDrawing.data.eastWall.position.y = 100;
    addObstacle(obstacleBoxes, threejsDrawing.data.eastWall);

    threejsDrawing.data.westWall = drawFloor(scene, textureLoader, 200);
    threejsDrawing.data.westWall.rotation.y = -Math.PI / 2;
    threejsDrawing.data.westWall.position.x = -100;
    threejsDrawing.data.westWall.position.y = 100;
    addObstacle(obstacleBoxes, threejsDrawing.data.westWall);

    // ~~~~~~~~~~~~~~~~~~
    // Draw walls (and sphere)
    const { cubeMesh, cubeMat, ballMesh, ballMat } = drawWalls(scene, textureLoader);
    threejsDrawing.data.cubeMat = cubeMat;
    threejsDrawing.data.ballMat = ballMat;
    threejsDrawing.data.cubeMesh = cubeMesh;
    threejsDrawing.data.ballMesh = ballMesh;
    addObstacle(obstacleBoxes, cubeMesh);
    addObstacle(obstacleBoxes, ballMesh);


    // ~~~~~~~~~~~~~~~~~~
    // GUI
    const gui = new GUI();
    gui.add(lightingParams, 'hemiIrradiance', Object.keys(hemiLuminousIrradiances));
    gui.add(lightingParams, 'bulbPower', Object.keys(bulbLuminousPowers));
    gui.add(lightingParams, 'exposure', 0, 1);
    gui.add(lightingParams, 'shadows');
    gui.open();
}

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
