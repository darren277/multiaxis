import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';

import { drawImage } from './drawing/drawImage.js';

import { GUI } from 'lil-gui';

// Import our modular “draw” functions
import { drawLights, updateLights, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances } from './drawing/drawLights.js';
import { drawFloor } from './drawing/drawFloor.js';
import { drawWalls } from './drawing/drawWalls.js';

import { usePanoramicCubeBackground, useProceduralBackground } from './drawing/drawBackground.js';

import { drawChart } from './drawing/drawChart.js';
import { drawSheetMusic } from './drawing/drawSheetMusic.js';

import drawPipelineConfig from './config/drawPipelineConfig.js';
import uiPanelConfig from './config/uiPanelConfig.js';
import { presentationKeyDownHandler } from './drawing/drawPresentation.js';
import { onAdventureKeyDown, buildSceneItems, updateLabelPosition, drawAdventureElements } from './drawing/drawAdventure.js';

import { SCENE_ITEMS } from './drawing/sceneItems.js'; // Import your scene items

import * as THREE from 'three'; // for any references you still need
// Or import { FileLoader } from 'three'; if you just need the loader

import {update as tweenUpdate} from 'tween'


let previousShadowMap = false;

let startTime = null;


const textureLoader = new THREE.TextureLoader();
const fileLoader = new THREE.FileLoader();

const loadDataSource = (scene, dataSrc, drawFunc, state) => {
    const jsonPath = `./data/${dataSrc}.json`;

    fileLoader.load(
        jsonPath,
        (dataString) => {
            const data = JSON.parse(dataString);
            drawFunc(scene, data, state);
        },
        undefined, // onProgress
        (err) => {
            console.error(`Error loading ${jsonPath}`, err);
        }
    );
}

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

const THREEJS_DRAWINGS = {
    'room': {
        'sceneElements': [],
        'drawFuncs': [
            {'func': drawRoom, 'dataSrc': null},
        ],
        'uiState': {},
        'eventListeners': null,
        'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
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
    },
    'adventure': {
        'sceneElements': drawAdventureElements,
        'drawFuncs': [
            // NOTE: var data_sources = document.getElementsByName('datasrc')
            // This whole thing was WAY overcomplicating it...
            // We will define the data sources right here instead.
            {'func': drawAdventure, 'dataSrc': null}
        ],
        'uiState': {
            'currentStepId': `view_${SCENE_ITEMS[0].id}`
        },
        'eventListeners': {
            'keydown': (e, other) => {
                // Handle keydown events for the adventure
                //{camera, event, adventureSteps, controls, uiState}
                const {camera, data, controls, uiState} = other;
                const {adventureSteps} = data;
                onAdventureKeyDown(camera, e, adventureSteps, controls, uiState);
            }
        },
        'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
            // Update label positions
            threejsDrawing.data.allPhotoEntries.forEach(({ mesh, labelEl }) => {
                updateLabelPosition(mesh, labelEl, camera, renderer);
            });
        },
        'data': {
            'adventureSteps': null,
            'allPhotoEntries': null,
        }
    },
    'music':
        {
            'sceneElements': [],
            'drawFuncs': [
                {'func': drawMusic, 'dataSrc': 'music'}
            ],
            'uiState': {tempoScale: 1.0},
            'eventListeners': null,
            'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
                if (!startTime) startTime = timestamp;
                const elapsedMs = timestamp - startTime;
                const elapsedSec = elapsedMs / 1000;

                const scaledElapsedSec = elapsedSec * uiState.tempoScale;

                threejsDrawing.data.sheetMusic.update(scaledElapsedSec);
            },
            'data': {
                'sheetMusic': null,
            }
        },
    'multiaxis':
        {
            'sceneElements': [],
            'drawFuncs': [
                {'func': drawChart, 'dataSrc': 'data'}
            ],
            'uiState': null,
            'eventListeners': null,
            'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
            },
            'data': {
                'sheetMusic': null,
            }
        }
};

function drawAdventure(scene, threejsDrawing) {
    const {adventureSteps, allPhotoEntries} = buildSceneItems(scene, SCENE_ITEMS);
    threejsDrawing.data.adventureSteps = adventureSteps;
    threejsDrawing.data.allPhotoEntries = allPhotoEntries;
}

function drawMusic(scene, data, state) {
    state.data.sheetMusic = drawSheetMusic(scene, data);
}

document.addEventListener('DOMContentLoaded', () => {
    const drawingName = document.querySelector('meta[name="threejs_drawing_name"]').content;
    const threejsDrawing = THREEJS_DRAWINGS[drawingName];

    // 1) Setup the scene
    if (!threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const { scene, camera, renderer, controls, stats } = setupScene('c', threejsDrawing.sceneElements);

    for (const {func, dataSrc} of threejsDrawing.drawFuncs) {
        if (dataSrc) {
            loadDataSource(scene, dataSrc, func, threejsDrawing);
        } else {
            func(scene, threejsDrawing);
        }
    }

    // 2) Create a shared state for the UI
    const uiState = {
        camera,
        controls,
        orbitEnabled: true,
        // anything else we might want the UI to manipulate
    };

    // update uiState to add the threejsDrawing uiState...
    if (threejsDrawing) {
        Object.assign(uiState, threejsDrawing.uiState);
    }

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene);

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');

    // 4) Setup UI listeners
    attachUIListeners(uiPanelConfig, uiState);

    // Add any event listeners from the threejsDrawing
    if (threejsDrawing.eventListeners) {
        for (const [eventName, eventFunc] of Object.entries(threejsDrawing.eventListeners)) {
            window.addEventListener(eventName, (e) => {
                eventFunc(e, {camera, data: threejsDrawing.data, controls, uiState});
            });
        }
    }

    // 5) Animate loop
    function animate() {
        requestAnimationFrame(animate);

        camera.updateProjectionMatrix();

        const timestamp = Date.now();

        // Call the animation callback for the current drawing
        if (threejsDrawing.animationCallback) {
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, uiState, camera);
        }

        tweenUpdate();

        controls.update();

        stats.update();

        renderer.render(scene, camera);
    }

    animate();
})

