import { setupScene } from './sceneSetup.js';
import { attachUIListeners } from './ui/attachUIListeners.js';

import drawPipelineConfig from './config/drawPipelineConfig.js';
import uiPanelConfig from './config/uiPanelConfig.js';

import * as THREE from 'three'; // for any references you still need
// Or import { FileLoader } from 'three'; if you just need the loader

document.addEventListener('DOMContentLoaded', () => {
    // 1) Setup the scene
    const { scene, camera, renderer, controls } = setupScene('c');

    // 2) Create a shared state for the UI
    const uiState = {
        camera,
        controls,
        orbitEnabled: true,
        // anything else we might want the UI to manipulate
    };

    // 3) Load data & run the drawing pipeline
    // We’ll use a FileLoader to grab each data file
    const fileLoader = new THREE.FileLoader();

    // If each pipeline entry has a dataSrc property, we can do them one by one:
    drawPipelineConfig.forEach((pipelineItem) => {
        var data_src = document.getElementsByName('datasrc')[0].content;
        const jsonPath = `./data/${data_src}.json`;

        // TODO: For more complex scenarios with multiple data sources: const jsonPath = `./data/${pipelineItem.dataSrc}.json`;

        fileLoader.load(
            jsonPath,
            (rawData) => {
                const data = JSON.parse(rawData);
                console.log(`Loaded ${jsonPath}`, data);
                // call the draw function
                pipelineItem.drawFunc(scene, data);
            },
            undefined, // onProgress
            (err) => {
                console.error(`Error loading ${jsonPath}`, err);
            }
        );
    });

    // 4) Setup UI listeners
    attachUIListeners(uiPanelConfig, uiState);

    // 5) Animate loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
})

