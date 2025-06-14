// const outlineEffectEnabled = sceneConfig && sceneConfig.outlineEffect || false;

export async function contentLoadedCallback(
    drawingName: string,
    drawing: ThreeJSDrawing
) {
    if (!drawingName || !threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    // --- 1. IO-heavy pieces kept tiny so they're easy to stub ---
    const dataSelected = readDataSelected();
    const query = parseQueryParams(window.location.search);
    const debug = parseDebugFlag(query, DEBUG);

    // --- 2. Pure helpers ---
    const sceneConfig = buildSceneConfig(defaultSceneConfig, drawing.sceneConfig, query);
    const overlays    = toOverlayElements(drawing.sceneElements);

    // --- 3. Imperative orchestration (minimal logic) ---
    const {
        scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer
    } = await setupScene('c', overlays, sceneConfig);

    await prepareDrawingContext(drawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, query);

    await runDrawFuncs(Array.isArray(drawing.drawFuncs) ? drawing.drawFuncs : [], {scene, camera, drawing, dataSelected});

    if (debug) enableDebug(scene, camera, renderer, drawing);

    wireNavigation(query, drawingName, scene, drawing, renderer, camera, debug);
    addCustomListeners(drawing, { scene, controls, renderer });
    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer,
        drawing, outline: sceneConfig.outlineEffect
    });
}
