import { TextureLoader } from 'three';
import { GUI } from 'lil-gui';

// Import our modular “draw” functions
import { drawLights, updateLights, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances } from './drawLights.js';
import { drawFloor } from './drawFloor.js';
import { drawWalls } from './drawWalls.js';

let previousShadowMap = false;

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
    threejsDrawing.data.floorMat = drawFloor(scene, textureLoader);

    // ~~~~~~~~~~~~~~~~~~
    // Draw walls (and sphere)
    const { cubeMat, ballMat } = drawWalls(scene, textureLoader);
    threejsDrawing.data.cubeMat = cubeMat;
    threejsDrawing.data.ballMat = ballMat;


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
    'eventListeners': null,
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
