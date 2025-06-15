export async function contentLoadedCallback(drawingName: string, threejsDrawing: ThreeJSDrawing) {
    if (!drawingName || !threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const dataSelected = readDataSelect();

    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`);

    const queryOptions: QueryOptions = parseQueryParams(window.location.search);

    // Add navigation cubes if defined
    if (queryOptions.nav) {
        addNavigation(threejsDrawing)
    }

    const debugMode: boolean = (DEBUG) || queryOptions.debug === true;

    addListeners(drawing);

    // Define the default scene config with all required properties

    // Merge threejsDrawing.sceneConfig with defaults
    let sceneConfig = { ...defaultSceneConfig, ...(threejsDrawing.sceneConfig || {}) };

    buildSceneConfig(sceneConfig, queryOptions);

    cosnt overlayElements = toOverlayElements(drawing.sceneElements);

    console.log('About to setup scene with config:', sceneConfig);

    addOptionals(scene, drawing);

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

    if (debugMode) {
        drawHelpers(scene, threejsDrawing);
    }

    console.log('Scene setup complete:', scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer, css3DRenderer, queryOptions);

    console.log('Drawing context prepared:', threejsDrawing.data);

    const funcs = Array.isArray(threejsDrawing.drawFuncs) ? threejsDrawing.drawFuncs : [];

    if (funcs.length === 0) {
        console.warn(`No draw functions found for ${drawingName}.`);
        return;
    }
    console.log(`Found ${funcs.length} draw functions for ${drawingName}.`);

    await runDrawFuncs(Array.isArray(drawing.drawFuncs) ? drawing.drawFuncs : [], {scene, camera, drawing, dataSelected});

    console.log(`All draw functions executed for ${drawingName}.`);

    startRenderLoop(renderer, {
        scene, camera, controls, stats, css2DRenderer, css3DRenderer,
        drawing, outline: sceneConfig.outlineEffect
    });
}
