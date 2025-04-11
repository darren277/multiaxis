import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';

import { drawImage } from './drawing/drawImage.js';

import { GUI } from 'lil-gui';

// Import our modular “draw” functions
import { drawLights, updateLights, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances } from './drawing/drawLights.js';
import { drawFloor } from './drawing/drawFloor.js';
import { drawWalls } from './drawing/drawWalls.js';

import { usePanoramicCubeBackground, useProceduralBackground } from './drawing/drawBackground.js';

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

let state = {
    sheetMusic: null,

    // Add any other state variables you need to track
}


const textureLoader = new THREE.TextureLoader();


function drawRoom(scene) {
    // ~~~~~~~~~~~~~~~~~~
    // Draw lights
    const lights = drawLights(scene, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances);
    let bulbLight = lights.bulbLight;
    let bulbMat   = lights.bulbMat;
    let hemiLight = lights.hemiLight;

    // ~~~~~~~~~~~~~~~~~~
    // Draw floor
    const floorMat = drawFloor(scene, textureLoader);

    // ~~~~~~~~~~~~~~~~~~
    // Draw walls (and sphere)
    const { cubeMat, ballMat } = drawWalls(scene, textureLoader);


    // ~~~~~~~~~~~~~~~~~~
    // GUI
    const gui = new GUI();
    gui.add(lightingParams, 'hemiIrradiance', Object.keys(hemiLuminousIrradiances));
    gui.add(lightingParams, 'bulbPower', Object.keys(bulbLuminousPowers));
    gui.add(lightingParams, 'exposure', 0, 1);
    gui.add(lightingParams, 'shadows');
    gui.open();

    return {bulbLight, bulbMat, hemiLight, floorMat, cubeMat, ballMat};
}

document.addEventListener('DOMContentLoaded', () => {
    // 1) Setup the scene
    const { scene, camera, renderer, controls, stats } = setupScene('c', drawAdventureElements);

    const {adventureSteps, allPhotoEntries} = buildSceneItems(scene, SCENE_ITEMS);

    const {bulbLight, bulbMat, hemiLight, floorMat, cubeMat, ballMat} = drawRoom(scene);

    // 2) Create a shared state for the UI
    const uiState = {
        camera,
        controls,
        orbitEnabled: true,
        // anything else we might want the UI to manipulate
        tempoScale: 1.0,
        currentStepId: `view_${SCENE_ITEMS[0].id}`,
    };

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene);

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    // 3) Load data & run the drawing pipeline
    // We’ll use a FileLoader to grab each data file
    const fileLoader = new THREE.FileLoader();

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');

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
                //////else {drawFunc(scene, data);}
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
        //presentationKeyDownHandler(camera, event);

        onAdventureKeyDown(camera, event, adventureSteps, controls, uiState);
    });

    console.log("camera.position: ", camera.position);
    //console.log("camera.lookAt: ", camera.getWorldDirection());
    console.log("camera", camera);
    //console.log("controls.target: ", controls.target);

    // 5) Animate loop
    function animate() {
        requestAnimationFrame(animate);

        camera.updateProjectionMatrix();
        //controls.target.copy({ x: 0, y: 2, z: -10 });
        //controls.target.copy(camera.position);
        //controls.update();

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

        // Update label positions
        allPhotoEntries.forEach(({ mesh, labelEl }) => {
            updateLabelPosition(mesh, labelEl, camera, renderer);
        });

        // LIGHT STUFF //
        // Tone Mapping
        renderer.toneMappingExposure = Math.pow(lightingParams.exposure, 5.0);

        // Shadows
        renderer.shadowMap.enabled = lightingParams.shadows;
        bulbLight.castShadow = lightingParams.shadows;
        if (lightingParams.shadows !== previousShadowMap) {
            previousShadowMap = lightingParams.shadows;
        }

        // Update the lights
        updateLights({bulbLight, bulbMat, hemiLight, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances});

        // Animate the bulb bouncing
        const time = Date.now() * 0.0005;
        bulbLight.position.y = Math.cos(time) * 0.75 + 1.25;

        tweenUpdate();

        controls.update();

        stats.update();

        renderer.render(scene, camera);
    }

    animate();
})

