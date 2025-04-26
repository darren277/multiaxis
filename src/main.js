import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';
import { ClickAndKeyControls } from './config/clickControlHelper.js';
import { drawImage } from './drawing/drawImage.js';
import { loadDataSource, pixelToWorldUnits, prepareDrawingContext, drawHelpers } from './config/utils.js';
import { loadThenDraw } from './config/loadThenDraw.js';
import { OutlineEffect } from 'outline-effect';
import { usePanoramicCubeBackground, useProceduralBackground, usePanoramicCubeBackgroundSixFaces } from './drawing/drawBackground.js';
import uiPanelConfig from './config/uiPanelConfig.js';
import { drawNavCubes, onClickNav, CUBE_DEFS } from './config/navigation.js';
import { TextureLoader, FileLoader } from 'three';
import { BoxGeometry, Mesh, MeshNormalMaterial, GridHelper, FloatType } from 'three';
import {update as tweenUpdate} from 'tween'

import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);
import { THREEJS_DRAWINGS } from './drawings.js';

const DEBUG = false;
const textureLoader = new TextureLoader();

document.addEventListener('DOMContentLoaded', () => {
    const drawingName = document.querySelector('meta[name="threejs_drawing_name"]').content;

    THREEJS_DRAWINGS[drawingName]().then(threejsDrawing => {
        contentLoadedCallback(threejsDrawing);
    })
})



async function contentLoadedCallback(threejsDrawing) {
    const dataSelected = document.querySelector('meta[name="data_selected"]').content;
    console.log(`Drawing name: ${threejsDrawing.name}. Data selected: ${dataSelected}`);

    if (!threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const outlineEffectEnabled = threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.outlineEffect || false;

    const { scene, camera, renderer, controls, stats, cssRenderer } = await setupScene('c', threejsDrawing.sceneElements, threejsDrawing.sceneConfig);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, cssRenderer);

    for (const {func, dataSrc, dataType} of threejsDrawing.drawFuncs) {
        if (dataSrc) {
            loadThenDraw(scene, func, dataSrc, dataType, camera, threejsDrawing, dataSelected);
        } else {
            await func(scene, threejsDrawing);
        }
    }

    if (DEBUG === true) {
        drawHelpers(scene, threejsDrawing);
        const clickKeyControls = new ClickAndKeyControls(scene, camera, renderer);
    }

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene, 'textures/sun_temple_stripe.jpg');
    //usePanoramicCubeBackgroundSixFaces(scene, 'textures/exr/golden_gate_hills_1k');

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    // NAV CUBE //
    //drawNavCubes(scene, threejsDrawing, CUBE_DEFS);

    // Add event listener for navigation
    window.addEventListener('click', (event) => {
        onClickNav(event, scene, renderer, camera);
    });

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');

    // Setup UI listeners
    //attachUIListeners(uiPanelConfig, uiState);

    // Add any event listeners from the threejsDrawing
    if (threejsDrawing.eventListeners) {
        for (const [eventName, eventFunc] of Object.entries(threejsDrawing.eventListeners)) {
            window.addEventListener(eventName, (e) => {
                eventFunc(e, {camera, data: threejsDrawing.data, controls, renderer, scene});
            });
        }
    }

    if (outlineEffectEnabled) {
        const effect = new OutlineEffect(renderer);
    }

    renderer.setAnimationLoop((timestamp, frame) => {
        // Update controls (if using OrbitControls or similar)
        if (controls) {
            controls.update();
        }

        if (threejsDrawing.animationCallback) {
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, camera);
        }

        // Update camera projection if needed
        camera.updateProjectionMatrix();

        tweenUpdate();

        if (stats) {
            stats.update();
        }

        renderer.render(scene, camera);

        // CSS Renderer (2d or 3d)
        if (cssRenderer) {
            cssRenderer.render(scene, camera);
        }

        if (outlineEffectEnabled) {
            effect.render(scene, camera);
        }
    });
}
