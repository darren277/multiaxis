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
// TODO: Make this an env var...
const INCLUDE_LOCAL = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("👀 Available drawings in THREEJS_DRAWINGS:", THREEJS_DRAWINGS);

    const drawingNameMeta = document.querySelector('meta[name="threejs_drawing_name"]');
    if (!drawingNameMeta) {
        console.error('Meta tag "threejs_drawing_name" not found.');
        return;
    }
    const drawingName = (drawingNameMeta as HTMLMetaElement).content;

    try {
        // ignore for now
        const drawingLoader = (THREEJS_DRAWINGS as unknown as ThreeJSDrawingsMap)[drawingName];
        if (!drawingLoader) {
            console.error(`No drawing found for ${drawingName}`);
            return;
        }
        console.log(`Loading drawing: ${drawingName}`, drawingLoader);
        
        if (typeof drawingLoader !== 'function') {
            console.error(`Drawing loader for ${drawingName} is not a function.`);
            return;
        }
        // @ts-ignore-next-line
        const drawing = await drawingLoader();
        contentLoadedCallback(drawingName, drawing as unknown as ThreeJSDrawing);
    } catch (error) {
        console.warn(`Error loading drawing ${drawingName}:`, error);
        if (INCLUDE_LOCAL) {
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
        } else {
            console.error(`No drawing found for ${drawingName} and INCLUDE_LOCAL is false.`);
        }
    }
})

async function contentLoadedCallback(drawingName: string, threejsDrawing: ThreeJSDrawing) {
    if (!drawingName || !threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const dataSelected = readDataSelect();
    
    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`);

    const queryOptions: QueryOptions = parseQueryParams(window.location.search);

    const debugMode: boolean = (DEBUG) || queryOptions.debug === true;

    // Define the default scene config with all required properties

    // Merge threejsDrawing.sceneConfig with defaults
    let sceneConfig = { ...defaultSceneConfig, ...(threejsDrawing.sceneConfig || {}) };

    buildSceneConfig(sceneConfig, queryOptions);

    // Convert sceneElements to OverlayElement[] if necessary
    const overlayElements = (threejsDrawing.sceneElements ?? []).map((el: any) => ({
        tagName: el.tagName ?? 'div',
        className: el.className,
        id: el.id,
        attrs: el.attrs
    }));

    console.log('About to setup scene with config:', sceneConfig);

    // TODO: Define this returned object as a type...
    let { scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer } = await setupScene('c', overlayElements, sceneConfig) as {
        scene: any,
        camera: any,
        renderer: any,
        controls?: any,
        stats?: { update: () => void },
        css2DRenderer?: any,
        css3DRenderer?: any
    };

    console.log('Scene setup complete:', scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, queryOptions);

    console.log('Drawing context prepared:', threejsDrawing.data);

    const funcs = Array.isArray(threejsDrawing.drawFuncs) ? threejsDrawing.drawFuncs : [];

    if (funcs.length === 0) {
        console.warn(`No draw functions found for ${drawingName}.`);
        return;
    }
    console.log(`Found ${funcs.length} draw functions for ${drawingName}.`);

    await Promise.all(funcs.map((drawFuncObj: any) =>
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
      )
    );

    console.log(`All draw functions executed for ${drawingName}.`);

    if (debugMode) {
        console.log('Debug mode enabled');
        drawHelpers(scene, threejsDrawing);
        const clickKeyControls = new ClickAndKeyControls(scene, camera, renderer);
    }

    // Add navigation cubes if defined
    if (queryOptions.nav) {
        addNavigation(threejsDrawing)
    }

    addCustomListeners(drawing, { scene, controls, renderer });

    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer,
        drawing, outline: sceneConfig.outlineEffect
    });

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene, 'textures/sun_temple_stripe.jpg');
    //usePanoramicCubeBackgroundSixFaces(scene, 'textures/exr/golden_gate_hills_1k');

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');
}
