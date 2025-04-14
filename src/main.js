import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';

import { drawImage } from './drawing/drawImage.js';

import { usePanoramicCubeBackground, useProceduralBackground } from './drawing/drawBackground.js';

import { drawChart } from './drawing/drawChart.js';
import { musicDrawing } from './drawing/drawSheetMusic.js';
import { roomDrawing } from './drawing/drawRoom.js';
import { cayleyDrawing, forceDrawing } from './drawing/drawGraph.js';
import { geoDrawing, geoDrawing3d } from './drawing/drawGeo.js';
import { quantumDrawing } from './drawing/drawQuantum.js';
import { svgDrawing } from './drawing/drawSvg.js';
import { libraryDrawing } from './drawing/drawLibrary.js';
import { plotFunctionDrawing } from './drawing/drawPlotFunction.js';
import { rubiksCubeDrawing } from './drawing/drawRubiksCube.js';
import { chessDrawing } from './drawing/drawChess.js';

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
    'cayley': cayleyDrawing,
    'force': forceDrawing,
    'geo': geoDrawing,
    'geo3d': geoDrawing3d,
    'quantum': quantumDrawing,
    'svg': svgDrawing,
    'library': libraryDrawing,
    'plot': plotFunctionDrawing,
    'rubiks': rubiksCubeDrawing,
    'chess': chessDrawing,
};


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

