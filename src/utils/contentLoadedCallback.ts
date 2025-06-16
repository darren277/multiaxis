import * as THREE from 'three';
import { ThreeJSDrawing } from '../threejsDrawing';
import { defaultSceneConfig, setupScene } from '../config/sceneSetup';
import { parseDebugFlag, readDataSelected } from './queries';
import { buildSceneConfig } from './sceneConfig';
import { parseQueryParams, prepareDrawingContext } from '../config/utils';
import { toOverlayElements } from './overlay';
import { runDrawFuncs } from './drawExecutor';
import { addListeners } from './addListeners';
import { startRenderLoop } from './startRenderLoop';
// const outlineEffectEnabled = sceneConfig && sceneConfig.outlineEffect || false;

// TODO Update this as they have deprecated the old way of doing this
//import { update as tweenUpdate } from '@tweenjs/tween.js';

import {
  assert,
  assertString,
  assertObject,
  debugLog,
} from './assertUtils';

/**
 * Callback function to be executed when the content is loaded.
 * It sets up the Three.js scene, prepares the drawing context,
 * and starts the render loop.
 *
 * @param drawingName - The name of the drawing to load.
 * @param threeJSDrawing - The ThreeJSDrawing object containing scene elements and draw functions.
 * @param debug - Optional flag to enable debug mode (default: false).
 */
export async function contentLoadedCallback(
    drawingName: string,
    threeJSDrawing: ThreeJSDrawing,
    debug = false
) {
    if (!drawingName || !threeJSDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }
    assertString(drawingName, 'drawingName');
    //assertObject<ThreeJSDrawing>(threeJSDrawing, 'threeJSDrawing');
    assertObject(threeJSDrawing, 'threeJSDrawing');

    // --- 1. IO-heavy pieces kept tiny so they're easy to stub ---
    // readDataSelected()
    // Params: none
    // Returns: dataSelected (string or null)
    const dataSelected = readDataSelected();

    assert(
        typeof dataSelected === 'string' || dataSelected === null,
        `[dataSelected] expected string | null, got ${typeof dataSelected}`
    );
    debugLog('dataSelected', dataSelected);

    // parseQueryParams(window.location.search)
    // Params: window.location.search (string)
    // Returns: query (object with parsed query parameters)
    const query = parseQueryParams(window.location.search);
    assertObject(query, 'query');
    debugLog('query', query);

    // parseDebugFlag(query, debug)
    // Params: query (object), debug (boolean)
    // Returns: debug (boolean)
    debug = parseDebugFlag(query, debug);
    debugLog('debug flag', debug);

    // --- 2. Pure helpers ---
    // buildSceneConfig(defaultSceneConfig, threeJSDrawing.sceneConfig, query)
    // Params: defaultSceneConfig (SceneConfig), threeJSDrawing.sceneConfig (Partial<SceneConfig> | undefined), query (QueryOptions)
    // Returns: sceneConfig (object with merged scene configuration)
    const sceneConfig = buildSceneConfig(defaultSceneConfig, threeJSDrawing.sceneConfig, query);
    assertObject(sceneConfig, 'sceneConfig');
    debugLog('sceneConfig', sceneConfig);

    const overlays = toOverlayElements(threeJSDrawing.sceneElements);
    assert(Array.isArray(overlays), '[overlays] expected array');
    debugLog('overlays', overlays);

    // Ensure all required properties are present by merging with defaultSceneConfig
    const mergedSceneConfig = { ...defaultSceneConfig, ...sceneConfig };

    // --- 3. Imperative orchestration (minimal logic) ---
    // setupScene('c', overlays, mergedSceneConfig)
    // Params: 'c' (string), overlays (OverlayElement[]), mergedSceneConfig (SceneConfig)
    // Returns: sceneElements (SceneElements object containing scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer, css3DScene, tweenGroup)
    const {
        scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer, css3DScene, tweenGroup
    } = await setupScene('c', overlays, mergedSceneConfig);
    debugLog('sceneElements', {
        scene,
        camera,
        renderer,
        controls,
        stats,
        css2DRenderer,
        css3DRenderer,
        css3DScene,
        tweenGroup
    });

    // --- 4. Context preparation ---
    // prepareDrawingContext(threeJSDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, css3DScene, tweenGroup, query)
    // Params: threeJSDrawing (ThreeJSDrawing), scene (THREE.Scene), camera (THREE.Camera), renderer (THREE.WebGLRenderer),
    //         controls (any), css2DRenderer (any), css3DRenderer (any), css3DScene (any), tweenGroup (Group), query (QueryOptions)
    // Returns: void (prepares the drawing context by populating threeJSDrawing.data with scene references)
    await prepareDrawingContext(threeJSDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, css3DScene, tweenGroup, query);

    const drawFuncsArray = Array.isArray(threeJSDrawing.drawFuncs) ? threeJSDrawing.drawFuncs : [];
    const drawFuncObjs = drawFuncsArray
        .map(f => typeof f === 'function' ? { func: f } : f)
        .filter(f => typeof f.func === 'function');
    
    if (drawFuncObjs.length === 0) {
        console.warn(`No valid draw functions found for ${drawingName}.`);
        return;
    }

    assert(
        drawFuncObjs.length > 0,
        `No valid draw functions found for ${drawingName}`
    );
    debugLog('drawFuncObjs', drawFuncObjs);

    // --- 5. Run draw functions ---
    // runDrawFuncs(drawFuncObjs, { scene, camera, drawing: threeJSDrawing, dataSelected })
    // Params: drawFuncObjs (Array<{ func: Function }>) - array of draw function objects,
    //         context (object with scene, camera, drawing, dataSelected)
    // Returns: void (executes the draw functions with the provided context)
    await runDrawFuncs(drawFuncObjs as any, {scene, camera, drawing: threeJSDrawing, dataSelected});

    //if (debug) enableDebug(scene, camera, renderer, threeJSDrawing);

    //wireNavigation(query, drawingName, scene, threeJSDrawing, renderer, camera, debug);

    // --- 6. Add listeners ---
    // addListeners(threeJSDrawing, { scene, controls, renderer })
    // Params: threeJSDrawing (ThreeJSDrawing), context (object with scene, controls, renderer)
    // Returns: void (adds event listeners to the scene, controls, and renderer)
    addListeners(threeJSDrawing);

    // --- 7. Animation Loop ---
    // startRenderLoop(renderer, { scene, camera, controls, stats, css2DRenderer, css3DRenderer, threejsDrawing, tweenUpdate })
    // Params: renderer (THREE.WebGLRenderer), renderables (object with scene, camera, controls, stats, css2DRenderer, css3DRenderer, threejsDrawing, tweenUpdate)
    // Returns: void (starts the render loop for the Three.js scene)
    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer, css3DScene: css3DRenderer ? css3DScene : undefined,
        threejsDrawing: threeJSDrawing, outlineEffectEnabled: typeof sceneConfig.outlineEffect === 'boolean' ? sceneConfig.outlineEffect : false,
        tweenGroup
    });

    debugLog('🚀 Render loop started', { drawingName });
}
