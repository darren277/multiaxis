/*
    Essential sequence of events:
    A) Parse environment:
        1. Check HTML meta tags for data selected.
        2. Parse query parameters to get options.
        3. Check env vars for debug mode.
    B) Setup scene:
        1. Merge scene config with defaults.
        2. Build scene config based on query options.
        3. Convert drawing.sceneElements to overlay elements.
        4. Setup scene (instantiating THREE.Scene, THREE.Camera, THREE.WebGLRenderer, and optional CSS renderers) with any overlay elements.
    C) Add any optional elements (navigation, debug, etc) to the scene.
    D) Prepare drawing context: Attach all THREE objects from `setupScene()` to the drawing data.
    E) Load any data and execute drawing functions.
    F) Start the render loop.
*/

import { ThreeJSDrawing } from '../threejsDrawing';
import { defaultSceneConfig, setupScene } from '../config/sceneSetup';
import { parseQueryParams } from '../config/utils';
import { buildSceneConfig } from './sceneConfig';
import { toOverlayElements } from './overlay';
import { runDrawFuncs } from './drawExecutor';
import { addListeners } from './addListeners';
import { startRenderLoop } from './startRenderLoop';
import { QueryOptions } from '../types';
import { readDataSelected } from './queries';

type SceneElements = {
    scene: any,
    camera: any,
    renderer: any,
    controls?: any,
    stats?: { update: () => void },
    css2DRenderer?: any,
    css3DRenderer?: any
}

export function parseEnvironment(drawingName: string, threejsDrawing: ThreeJSDrawing, DEBUG = false) {
    const dataSelected = readDataSelected();

    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`);

    const queryOptions: QueryOptions = parseQueryParams(window.location.search);

    const debugMode: boolean = (DEBUG) || queryOptions.debug === true;

    // Merge threejsDrawing.sceneConfig with defaults
    let sceneConfig = { ...defaultSceneConfig, ...(threejsDrawing.sceneConfig || {}) };
    buildSceneConfig(sceneConfig, queryOptions);

    const overlayElements = toOverlayElements(threejsDrawing.sceneElements);

    return { dataSelected, queryOptions, debugMode, sceneConfig, overlayElements };
}

export function checkDrawingData(drawingName: string, threejsDrawing: ThreeJSDrawing) {
    if (!drawingName || !threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return false;
    }

    const funcs = Array.isArray(threejsDrawing.drawFuncs) ? threejsDrawing.drawFuncs : [];

    if (funcs.length === 0) {
        console.warn(`No draw functions found for ${drawingName}.`);
        return false;
    }
    console.log(`Found ${funcs.length} draw functions for ${drawingName}.`);

    return true;
}

export async function contentLoadedCallback(drawingName: string, threejsDrawing: ThreeJSDrawing) {
    const validDrawing = checkDrawingData(drawingName, threejsDrawing);
    if (!validDrawing) {
        throw new Error(`Drawing data is not available for ${drawingName}.`);
    }

    const { dataSelected, queryOptions, debugMode, sceneConfig, overlayElements } = parseEnvironment();

    addListeners(drawing);

    console.log('About to setup scene with config:', sceneConfig);
    // TODO: Define this returned object as a type...
    let { scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer } = await setupScene('c', overlayElements, sceneConfig) as SceneElements;

    addOptionals(scene, threejsDrawing, queryOptions, debugMode);

    console.log('Scene setup complete:', scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, queryOptions);

    console.log('Drawing context prepared:', threejsDrawing.data);

    await runDrawFuncs(Array.isArray(drawing.drawFuncs) ? drawing.drawFuncs : [], {scene, camera, drawing, dataSelected});

    console.log(`All draw functions executed for ${drawingName}.`);

    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer,
        drawing, outline: sceneConfig.outlineEffect
    });
}
