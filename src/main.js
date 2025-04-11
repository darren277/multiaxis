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

import { drawGraph, drawForceDirectedGraph, updateForceGraph, onMouseDown, onMouseUp, onMouseMove } from './drawing/drawGraph.js';

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
        },
    'cayley':
        {
            'sceneElements': [],
            'drawFuncs': [
                {'func': drawGraph, 'dataSrc': 'cayley'}
            ],
            'uiState': null,
            'eventListeners': null,
            'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
            },
            'data': {
                'sheetMusic': null,
            }
        },
    'force':
        {
            'sceneElements': [],
            'drawFuncs': [
                //{'func': drawForceGraph, 'dataSrc': 'force'}
                {'func': drawForceGraph, 'dataSrc': null}
            ],
            'uiState': null,
            'eventListeners': {
                'mousedown': (e, other) => {
                    const {camera, data, controls, uiState} = other;
                    onMouseDown(camera, data, e);
                },
                'mouseup': (e, other) => {
                    const {camera, data, controls, uiState} = other;
                    onMouseUp(data);
                },
                'mousemove': (e, other) => {
                    const {camera, data, controls, uiState} = other;
                    data.rect = uiState.rect;
                    onMouseMove(camera, data, e);
                }
            },
            'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
                threejsDrawing.data.simulation.tick(); // progress the simulation
                updateForceGraph(threejsDrawing.data.graphData, threejsDrawing.data.nodeSpheres, threejsDrawing.data.linkLines); // reflect new positions
                for (const node of Object.values(threejsDrawing.data.graphData.nodes)) {
//                    node.x = node.fx;
//                    node.y = node.fy;
//                    node.z = node.fz;
                    if (!Number.isFinite(node.x)) console.warn("Node position invalid", node);
                }
            },
            'data': {
                'simulation': null,
                'dragging': false,
                'draggedNode': null
            }
        }
};

// 1. Define your graph data
const graphData = {
    nodes: [
        { id: '0' },
        { id: '1' },
        { id: '2' },
        { id: '3' }
    ],
    links: [
        { source: '0', target: '1' },
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '0' }
    ]
};

function drawForceGraph(scene, threejsDrawing, state) {
    // Random tree
    const N = 40;
    const gData = {
        nodes: [...Array(N).keys()].map(i => ({ id: i })),
        links: [...Array(N).keys()].filter(id => id).map(id => ({source: id, target: Math.round(Math.random() * (id-1))}))
    };

    // assign random stating position...
    gData.nodes.forEach(node => {node.x = Math.random() * 5; node.y = Math.random() * 5; node.z = Math.random() * 5;});

    const {
        simulation,
        nodeSpheres,
        linkLines,
    } = drawForceDirectedGraph(scene, gData);

    simulation.tick(10); // progress the simulation some steps

    threejsDrawing.data.simulation = simulation;
    threejsDrawing.data.nodeSpheres = nodeSpheres;
    threejsDrawing.data.linkLines = linkLines;

    threejsDrawing.data.graphData = gData;

    drawBasicLights(scene, threejsDrawing);
}

function drawBasicLights(scene, threejsDrawing) {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);
}

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
            uiState.rect = renderer.domElement.getBoundingClientRect();
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, uiState, camera);
        }

        tweenUpdate();

        controls.update();

        stats.update();

        renderer.render(scene, camera);
    }

    animate();
})

