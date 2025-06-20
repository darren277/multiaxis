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

import { ThreeJSDrawing } from '../threejsDrawing'
import { defaultSceneConfig, setupScene } from '../config/sceneSetup'
import { parseQueryParams, prepareDrawingContext } from '../config/utils'
import { buildSceneConfig } from './sceneConfig'
import { toOverlayElements } from './overlay'
import { runDrawFuncs } from './drawExecutor'
import { addListeners } from './addListeners'
import { startRenderLoop } from './startRenderLoop'
import { QueryOptions } from '../types'
import { readDataSelected } from './queries'
import { addOptionals } from './addOptionals'

type SceneElements = {
    scene: any
    camera: any
    renderer: any
    controls?: any
    stats?: { update: () => void }
    css2DRenderer?: any
    css3DRenderer?: any
    css3DScene?: any
    tweenGroup?: any
}

export function parseEnvironment(
    drawingName: string,
    threejsDrawing: ThreeJSDrawing,
    DEBUG = false,
) {
    const dataSelected = readDataSelected()

    console.log(`Drawing name: ${drawingName}. Data selected: ${dataSelected}`)

    const queryOptions: QueryOptions = parseQueryParams(window.location.search)

    const debugMode: boolean = DEBUG || queryOptions.debug === true

    // Merge threejsDrawing.sceneConfig with defaults
    let sceneConfig = buildSceneConfig(
        defaultSceneConfig,
        threejsDrawing.sceneConfig,
        queryOptions,
    )

    const overlayElements = toOverlayElements(threejsDrawing.sceneElements)

    return {
        dataSelected,
        queryOptions,
        debugMode,
        sceneConfig,
        overlayElements,
    }
}

export function checkDrawingData(
    drawingName: string,
    threejsDrawing: ThreeJSDrawing,
) {
    if (!drawingName || !threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`)
        return false
    }

    const funcs = Array.isArray(threejsDrawing.drawFuncs)
        ? threejsDrawing.drawFuncs
        : []

    if (funcs.length === 0) {
        console.warn(`No draw functions found for ${drawingName}.`)
        return false
    }
    console.log(`Found ${funcs.length} draw functions for ${drawingName}.`)

    return true
}

export async function contentLoadedCallback(
    drawingName: string,
    threejsDrawing: ThreeJSDrawing,
) {
    const validDrawing = checkDrawingData(drawingName, threejsDrawing)
    if (!validDrawing) {
        throw new Error(`Drawing data is not available for ${drawingName}.`)
    }

    const {
        dataSelected,
        queryOptions,
        debugMode,
        sceneConfig,
        overlayElements,
    } = parseEnvironment(drawingName, threejsDrawing, false)

    console.log('About to setup scene with config:', sceneConfig)
    // TODO: Define this returned object as a type...
    // Ensure all required sceneConfig properties are present
    const mergedSceneConfig = { ...defaultSceneConfig, ...sceneConfig }
    let {
        scene,
        camera,
        renderer,
        controls,
        stats,
        css2DRenderer,
        css3DRenderer,
        css3DScene,
        tweenGroup,
    } = (await setupScene(
        'c',
        overlayElements,
        mergedSceneConfig,
    )) as SceneElements

    addOptionals(scene, threejsDrawing, queryOptions, debugMode)

    console.log(
        'Scene setup complete:',
        scene,
        camera,
        renderer,
        controls,
        stats,
        css2DRenderer,
        css3DRenderer,
        css3DScene,
        tweenGroup,
    )

    await prepareDrawingContext(
        threejsDrawing,
        scene,
        camera,
        renderer,
        controls,
        css2DRenderer,
        css3DRenderer,
        css3DScene,
        tweenGroup,
        queryOptions,
    )

    console.log('Drawing context prepared:', threejsDrawing.data)

    addListeners(threejsDrawing)

    const drawFuncObjs = Array.isArray(threejsDrawing.drawFuncs)
        ? threejsDrawing.drawFuncs.map((f) => ({ func: f }))
        : []
    await runDrawFuncs(drawFuncObjs as any, {
        scene,
        camera,
        drawing: threejsDrawing,
        dataSelected,
    })

    console.log(`All draw functions executed for ${drawingName}.`)

    startRenderLoop(renderer, {
        scene,
        camera,
        controls,
        stats,
        css2DRenderer,
        css3DRenderer,
        threejsDrawing: threejsDrawing,
        outlineEffectEnabled:
            typeof sceneConfig.outlineEffect === 'boolean'
                ? sceneConfig.outlineEffect
                : false,
        tweenGroup,
    })
}
