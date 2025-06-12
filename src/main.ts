import { setupScene } from './config/sceneSetup.js';
import { ClickAndKeyControls } from './config/clickControlHelper.js';
import { prepareDrawingContext, drawHelpers, parseQueryParams } from './config/utils.js';
import { loadThenDraw } from './config/loadThenDraw.js';
// @ts-ignore-next-line
import { OutlineEffect } from 'outline-effect';
import { drawNavCubes, onClickNav, ALL_CUBE_DEFS } from './config/navigation.js';
// @ts-ignore-next-line
import {update as tweenUpdate} from 'tween'

import { QueryOptions, ThreeJSDrawing } from './types';
// @ts-ignore-next-line
import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);
import { THREEJS_DRAWINGS } from './drawings.js';

const DEBUG = false;

document.addEventListener('DOMContentLoaded', () => {
    const drawingNameMeta = document.querySelector('meta[name="threejs_drawing_name"]');
    if (!drawingNameMeta) {
        console.error('Meta tag "threejs_drawing_name" not found.');
        return;
    }
    const drawingName = (drawingNameMeta as HTMLMetaElement).content;

    try {
        // ignore for now
        // TODO: handle this better
        // @ts-ignore-next-line
        const drawing: () => Promise<ThreeJSDrawing> = THREEJS_DRAWINGS[drawingName];
        if (!drawing) {
            console.error(`No drawing found for ${drawingName}`);
            return;
        }
        console.log(`Loading drawing: ${drawingName}`);

        drawing().then((threejsDrawing: ThreeJSDrawing) => {
            contentLoadedCallback(drawingName, threejsDrawing);
        })
    } catch (error) {
        console.warn(`Error loading drawing ${drawingName}:`, error);
        console.log('Trying local drawings...');
        import('./drawings_local.js').then(({ LOCAL_THREEJS_DRAWINGS }) => {
            // @ts-ignore-next-line
            const localDrawing: () => Promise<ThreeJSDrawing> = LOCAL_THREEJS_DRAWINGS[drawingName];
            if (!localDrawing) {
                console.error(`No local drawing found for ${drawingName}`);
                return;
            }
            if (localDrawing) {
                localDrawing().then((threejsDrawing: ThreeJSDrawing) => {
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

async function contentLoadedCallback(drawingName: String, threejsDrawing: ThreeJSDrawing) {
    const dataSelectedMeta = document.querySelector('meta[name="data_selected"]');
    if (!dataSelectedMeta) {
        console.error('Meta tag "data_selected" not found.');
        return;
    }

    const dataSelected = (dataSelectedMeta as HTMLMetaElement).content;
    if (!dataSelected) {
        console.warn('No data selected, using default data.');
    }
    
    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`);

    const queryOptions: QueryOptions = parseQueryParams(window.location.search);

    const debugMode: Boolean = (DEBUG) || queryOptions.debug === true;

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

    // @ts-ignore-next-line
    let { scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer } = await setupScene('c', threejsDrawing.sceneElements, sceneConfig);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, queryOptions);

    // @ts-ignore-next-line
    await Promise.all(threejsDrawing.drawFuncs.map(({func, dataSrc, dataType}) => dataSrc ? loadThenDraw(scene, func, dataSrc, dataType, camera, threejsDrawing, dataSelected) : func(scene, threejsDrawing)));

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
        // @ts-ignore-next-line
        const cubeDefs = ALL_CUBE_DEFS[drawingName];
        // @ts-ignore-next-line
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
        // @ts-ignore-next-line
        for (const [eventName, eventFunc] of Object.entries(threejsDrawing.eventListeners)) {
            window.addEventListener(eventName, (e) => {
                eventFunc(e, {camera, data: threejsDrawing.data, controls, renderer, scene});
            });
        }
    }

    if (outlineEffectEnabled) {
        const effect = new OutlineEffect(renderer);
    }

    renderer.setAnimationLoop((
        timestamp: number,
        frame: number | undefined,
    ) => {
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
            // @ts-ignore-next-line
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
            // @ts-ignore-next-line
            effect.render(scene, camera);
        }
    });
}
