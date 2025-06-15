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

    // --- 3. Imperative orchestration (minimal logic) ---
    const {
        scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer
    } = await setupScene('c', overlays, sceneConfig);

    await prepareDrawingContext(threeJSDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, query);

    await runDrawFuncs(Array.isArray(threeJSDrawing.drawFuncs) ? threeJSDrawing.drawFuncs : [], {scene, camera, threeJSDrawing, dataSelected});

    //if (debug) enableDebug(scene, camera, renderer, threeJSDrawing);

    //wireNavigation(query, drawingName, scene, threeJSDrawing, renderer, camera, debug);

    addListeners(threeJSDrawing, { scene, controls, renderer });
    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer,
        threeJSDrawing, outline: sceneConfig.outlineEffect
    });
}
