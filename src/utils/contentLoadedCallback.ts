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
import { update as tweenUpdate } from '@tweenjs/tween.js';

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

    // --- 1. IO-heavy pieces kept tiny so they're easy to stub ---
    const dataSelected = readDataSelected();
    const query = parseQueryParams(window.location.search);
    debug = parseDebugFlag(query, debug);

    // --- 2. Pure helpers ---
    const sceneConfig = buildSceneConfig(defaultSceneConfig, threeJSDrawing.sceneConfig, query);
    const overlays    = toOverlayElements(threeJSDrawing.sceneElements);

    // Ensure all required properties are present by merging with defaultSceneConfig
    const mergedSceneConfig = { ...defaultSceneConfig, ...sceneConfig };

    // --- 3. Imperative orchestration (minimal logic) ---
    const {
        scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer
    } = await setupScene('c', overlays, mergedSceneConfig);

    await prepareDrawingContext(threeJSDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, query);

    const drawFuncsArray = Array.isArray(threeJSDrawing.drawFuncs) ? threeJSDrawing.drawFuncs : [];
    const drawFuncObjs = drawFuncsArray
        .map(f => typeof f === 'function' ? { func: f } : f)
        .filter(f => typeof f.func === 'function');
    await runDrawFuncs(drawFuncObjs as any, {scene, camera, drawing: threeJSDrawing, dataSelected});

    //if (debug) enableDebug(scene, camera, renderer, threeJSDrawing);

    //wireNavigation(query, drawingName, scene, threeJSDrawing, renderer, camera, debug);

    addListeners(threeJSDrawing, { scene, controls, renderer });
    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer,
        threejsDrawing: threeJSDrawing, outlineEffectEnabled: typeof sceneConfig.outlineEffect === 'boolean' ? sceneConfig.outlineEffect : false,
        tweenUpdate
    });
}
