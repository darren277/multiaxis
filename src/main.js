import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';

import drawPipelineConfig from './config/drawPipelineConfig.js';
import uiPanelConfig from './config/uiPanelConfig.js';
import { presentationKeyDownHandler } from './drawing/drawPresentation.js';

import * as THREE from 'three'; // for any references you still need
// Or import { FileLoader } from 'three'; if you just need the loader

import {update as tweenUpdate} from 'tween'


let startTime = null;

let state = {
    sheetMusic: null,

    // Add any other state variables you need to track
}


document.addEventListener('DOMContentLoaded', () => {
    // 1) Setup the scene
    const { scene, camera, renderer, controls } = setupScene('c');

    // 2) Create a shared state for the UI
    const uiState = {
        camera,
        controls,
        orbitEnabled: true,
        // anything else we might want the UI to manipulate
        tempoScale: 1.0,
    };

    // 3) Load data & run the drawing pipeline
    // We’ll use a FileLoader to grab each data file
    const fileLoader = new THREE.FileLoader();

    var data_sources = document.getElementsByName('datasrc')

    for (let i = 0; i < data_sources.length; i++) {
        var drawFunc;

        // Write now we will be using the following mechanism for defining the pipeline rather than `drawPipelineConfig`:
        var data_src = data_sources[i].content;
        console.log("data_src: ", data_src);

        if (data_src === 'data') {
            drawFunc = drawPipelineConfig[0].drawFunc;
        } else if (data_src === 'music') {
            drawFunc = drawPipelineConfig[1].drawFunc;
        } else {
            console.error(`Unknown data source: ${data_src}`);
            return;
        }

        const jsonPath = `./data/${data_src}.json`;

        fileLoader.load(
            jsonPath,
            (rawData) => {
                const data = JSON.parse(rawData);
                console.log(`Loaded ${jsonPath}`, data);
                // call the draw function
                //pipelineItem.drawFunc(scene, data);
                if (data_src === 'music') {drawFunc(scene, data, state);}
                else {drawFunc(scene, data);}
            },
            undefined, // onProgress
            (err) => {
                console.error(`Error loading ${jsonPath}`, err);
            }
        );
    }

    // If each pipeline entry has a dataSrc property, we can do them one by one:
    drawPipelineConfig.forEach((pipelineItem) => {
        // TODO: For more complex scenarios with multiple data sources: const jsonPath = `./data/${pipelineItem.dataSrc}.json`;
    });

    // 4) Setup UI listeners
    attachUIListeners(uiPanelConfig, uiState);

    // 5) Add any event listeners...
    window.addEventListener('keydown', (event) => {
        // presentationKeyDownHandler = (camera, event)
        presentationKeyDownHandler(camera, event);
    });

    // 5) Animate loop
    function animate() {
        requestAnimationFrame(animate);

        const timestamp = Date.now();

        // If you have any custom animations or updates, do them here

        // sheetMusic...
        if (state.sheetMusic) {
            if (!startTime) startTime = timestamp;
            const elapsedMs = timestamp - startTime;
            const elapsedSec = elapsedMs / 1000;

            const scaledElapsedSec = elapsedSec * uiState.tempoScale;

            state.sheetMusic.update(scaledElapsedSec);
        }


        tweenUpdate();

        controls.update();
        renderer.render(scene, camera);
    }

    animate();
})

