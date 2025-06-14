import { defaultSceneConfig, setupScene } from './config/sceneSetup';
import { ClickAndKeyControls } from './config/clickControlHelper';
import { prepareDrawingContext, drawHelpers, parseQueryParams } from './config/utils';
import { loadThenDraw } from './config/loadThenDraw';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { drawNavCubes, onClickNav, ALL_CUBE_DEFS } from './config/navigation';
import {update as tweenUpdate} from '@tweenjs/tween.js'

import { QueryOptions, ThreeJSDrawing, ALL_CUBE_DEFS as ALL_CUBE_DEFS_TYPE } from './types';
import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);
import { THREEJS_DRAWINGS } from './drawings';
import type { ThreeJSDrawingsMap } from './types';

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
        const drawing = (THREEJS_DRAWINGS as unknown as ThreeJSDrawingsMap)[drawingName];
        if (!drawing) {
            console.error(`No drawing found for ${drawingName}`);
            return;
        }
        console.log(`Loading drawing: ${drawingName}`);

        contentLoadedCallback(drawingName, drawing as unknown as ThreeJSDrawing);
    } catch (error) {
        console.warn(`Error loading drawing ${drawingName}:`, error);
        console.log('Trying local drawings...');
        import('./drawings_local.js').then(({ LOCAL_THREEJS_DRAWINGS }) => {
            const localDrawing: (() => Promise<ThreeJSDrawing>) | undefined = (LOCAL_THREEJS_DRAWINGS as unknown as Record<string, () => Promise<ThreeJSDrawing>>)[drawingName];
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

async function contentLoadedCallback(drawingName: string, threejsDrawing: ThreeJSDrawing) {
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

    const debugMode: boolean = (DEBUG) || queryOptions.debug === true;

    // Define the default scene config with all required properties

    // Merge threejsDrawing.sceneConfig with defaults
    let sceneConfig = { ...defaultSceneConfig, ...(threejsDrawing.sceneConfig || {}) };

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

    // Convert sceneElements to OverlayElement[] if necessary
    const overlayElements = (threejsDrawing.sceneElements ?? []).map((el: any) => ({
        tagName: el.tagName ?? 'div',
        className: el.className,
        id: el.id,
        attrs: el.attrs
    }));

    let { scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer } = await setupScene('c', overlayElements, sceneConfig) as {
        scene: any,
        camera: any,
        renderer: any,
        controls?: any,
        stats?: { update: () => void },
        css2DRenderer?: any,
        css3DRenderer?: any
    };

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, queryOptions);

    await Promise.all(threejsDrawing.drawFuncs.map((drawFuncObj: any) => 
        drawFuncObj.dataSrc 
            ? loadThenDraw(
                scene, 
                drawFuncObj.func, 
                drawFuncObj.dataSrc, 
                drawFuncObj.dataType ?? undefined, 
                camera, 
                threejsDrawing, 
                dataSelected
            ) 
            : drawFuncObj.func(scene, threejsDrawing)
    ));

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
        const allCubeDefs = ALL_CUBE_DEFS as ALL_CUBE_DEFS_TYPE
        const cubeDefs = allCubeDefs[drawingName];
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
                if (typeof eventFunc === 'function') {
                    eventFunc(e, {data: threejsDrawing.data, controls, renderer, scene});
                }
            });
        }
    }

    let effect: OutlineEffect | undefined = undefined;
    if (outlineEffectEnabled) {
        effect = new OutlineEffect(renderer);
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
            stats.update();
        }

        renderer.render(scene, camera);

        if (css2DRenderer) {
            css2DRenderer.render(css2DRenderer.scene, camera);
        }

        if (css3DRenderer) {
            css3DRenderer.render(css3DRenderer.scene, camera);
        }

        if (outlineEffectEnabled && effect) {
            effect.render(scene, camera);
        }
    });
}
