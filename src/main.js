import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';

import { drawImage } from './drawing/drawImage.js';

import { usePanoramicCubeBackground, useProceduralBackground } from './drawing/drawBackground.js';

import { drawChart } from './drawing/drawChart.js';
import { musicDrawing } from './drawing/drawSheetMusic.js';

import { roomDrawing } from './drawing/drawRoom.js';

import { drawGraph, drawForceDirectedGraph, updateForceGraph, onMouseDown, onMouseUp, onMouseMove } from './drawing/drawGraph.js';

import drawPipelineConfig from './config/drawPipelineConfig.js';
import uiPanelConfig from './config/uiPanelConfig.js';
import { presentationKeyDownHandler } from './drawing/drawPresentation.js';
import { adventureDrawing } from './drawing/drawAdventure.js';

import * as THREE from 'three'; // for any references you still need
// Or import { FileLoader } from 'three'; if you just need the loader

import {update as tweenUpdate} from 'tween'


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

const THREEJS_DRAWINGS = {
    'room': roomDrawing,
    'adventure': adventureDrawing,
    'music': musicDrawing,
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
    renderer.setAnimationLoop((timestamp, frame) => {
        // Update controls (if using OrbitControls or similar)
        controls.update();

        // Update UI state and call your animation callback
        uiState.rect = renderer.domElement.getBoundingClientRect();
        if (threejsDrawing.animationCallback) {
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, uiState, camera);
        }

        // Update camera projection if needed
        camera.updateProjectionMatrix();

        // Run any tweens or animations
        tweenUpdate();

        // Update debug stats
        stats.update();

        // Final render
        renderer.render(scene, camera);
    });

})

