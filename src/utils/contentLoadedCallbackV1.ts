/*
    Essential sequence of events:
    1. Check HTML meta tags for data selected.
    2. Parse query parameters to get options.
*/

type SceneElements = {
    scene: any,
    camera: any,
    renderer: any,
    controls?: any,
    stats?: { update: () => void },
    css2DRenderer?: any,
    css3DRenderer?: any
}

export function parseEnvironment() {
    const dataSelected = readDataSelect();

    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`);

    const queryOptions: QueryOptions = parseQueryParams(window.location.search);

    const debugMode: boolean = (DEBUG) || queryOptions.debug === true;

    // Merge threejsDrawing.sceneConfig with defaults
    let sceneConfig = { ...defaultSceneConfig, ...(threejsDrawing.sceneConfig || {}) };
    buildSceneConfig(sceneConfig, queryOptions);

    const overlayElements = toOverlayElements(drawing.sceneElements);

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
