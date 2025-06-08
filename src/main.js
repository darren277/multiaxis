import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';
import { ClickAndKeyControls } from './config/clickControlHelper.js';
import { drawImage } from './drawing/drawImage.js';
import { loadDataSource, pixelToWorldUnits, prepareDrawingContext, drawHelpers, parseQueryParams } from './config/utils.js';
import { loadThenDraw } from './config/loadThenDraw.js';
import { OutlineEffect } from 'outline-effect';
import { usePanoramicCubeBackground, useProceduralBackground, usePanoramicCubeBackgroundSixFaces } from './drawing/drawBackground.js';
import uiPanelConfig from './config/uiPanelConfig.js';
import { drawNavCubes, onClickNav, ALL_CUBE_DEFS } from './config/navigation.js';
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

    try {
        THREEJS_DRAWINGS[drawingName]().then(threejsDrawing => {
            contentLoadedCallback(drawingName, threejsDrawing);
        })
    } catch (error) {
        console.warn(`Error loading drawing ${drawingName}:`, error);
        console.log('Trying local drawings...');
        import('./drawings_local.js').then(({ LOCAL_THREEJS_DRAWINGS }) => {
            if (LOCAL_THREEJS_DRAWINGS[drawingName]) {
                LOCAL_THREEJS_DRAWINGS[drawingName]().then(threejsDrawing => {
                    contentLoadedCallback(drawingName, threejsDrawing);
                });
            } else {
                console.error(`No drawing found for ${drawingName}`);
            }
        }).catch(error => {
            console.error('Error loading local drawings:', error);
        });
    }
})



async function contentLoadedCallback(drawingName, threejsDrawing) {
    const dataSelected = document.querySelector('meta[name="data_selected"]').content;
    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`);

    const queryOptions = parseQueryParams(window.location.search);

    const debugMode = DEBUG === true || queryOptions.debug === true;

    const sceneConfig = threejsDrawing.sceneConfig || {};

    if (queryOptions) {
        if (queryOptions.controls && queryOptions.controls === 'walking') {
            sceneConfig.controller = 'walking';
        }
        if (queryOptions.prev) {
            // TODO: use a detailed lookup map defined elsewhere...
            // override sceneConfig.startPosition
            if (queryOptions.prev === 'town') {
                sceneConfig.startPosition = { x: 0, y: 10, z: -80 };
            }
        }
    }

    if (!threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const outlineEffectEnabled = sceneConfig && sceneConfig.outlineEffect || false;

    let { scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer } = await setupScene('c', threejsDrawing.sceneElements, sceneConfig);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, queryOptions);

    for (const {func, dataSrc, dataType} of threejsDrawing.drawFuncs) {
        if (dataSrc) {
            loadThenDraw(scene, func, dataSrc, dataType, camera, threejsDrawing, dataSelected);
        } else {
            await func(scene, threejsDrawing);
        }
    }

    if (debugMode) {
        console.log('Debug mode enabled');
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
    if (queryOptions.nav) {
        const cubeDefs = ALL_CUBE_DEFS[drawingName];
        drawNavCubes(scene, threejsDrawing, cubeDefs, debugMode);
    }

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

        if (css2DRenderer) {
            css2DRenderer.render(css2DRenderer.scene, camera);
        }

        if (css3DRenderer) {
            css3DRenderer.render(css3DRenderer.scene, camera);
        }

        if (outlineEffectEnabled) {
            effect.render(scene, camera);
        }
    });
}
