import * as THREE from 'three' // for texture loading
import { ThreeJSDrawing } from '../threejsDrawing'
import { ClickAndKeyControls } from '../config/clickControlHelper'
import { Group } from '@tweenjs/tween.js'

function drawTestCube(scene: THREE.Scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
}

function determineLabelCoordinates(
    p1: number,
    p2: number,
    p3: number,
    radius: number,
) {
    let x = p1 + radius * 2
    let y = p2
    let z = p3
    return [x, y, z]
}

async function loadDataSource(dataSrc: string) {
    if (!dataSrc || typeof dataSrc !== 'string') {
        throw new Error(
            `Invalid data source provided. It must be a non-empty string. Received: ${dataSrc}`,
        )
    }
    let path = dataSrc.startsWith('home_')
        ? dataSrc.replace('home_', 'threejs/data/')
        : `data/${dataSrc}`
    path = `./${path}.json`

    // FileLoader has a .loadAsync() that returns a Promise<string>
    const loader = new THREE.FileLoader()
    const raw = await loader.loadAsync(path)
    const rawStr = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
    return JSON.parse(rawStr)
}

function drawHelpers(scene: THREE.Scene, threejsDrawing: any) {
    console.log('Debug mode enabled')

    const refGeometry = new THREE.BoxGeometry(1, 1, 1) // 1x1x1 cube
    const refMaterial = new THREE.MeshNormalMaterial({ wireframe: true })
    const refCube = new THREE.Mesh(refGeometry, refMaterial)
    refCube.position.set(0, 0.5, 0) // sit on ground
    scene.add(refCube)

    const gridHelper = new THREE.GridHelper(10, 10) // 10x10 units
    scene.add(gridHelper)

    const camera = threejsDrawing.data.camera as THREE.PerspectiveCamera
    const renderer = threejsDrawing.data.renderer as THREE.WebGLRenderer

    const clickKeyControls = new ClickAndKeyControls(scene, camera, renderer)

    //window.debugObject = object; // now accessible from console

    //    document.addEventListener('keydown', (e) => {
    //        if (e.key === 'ArrowUp') window.debugObject.position.z -= 0.1;
    //        if (e.key === 'ArrowDown') window.debugObject.position.z += 0.1;
    //        if (e.key === 'ArrowLeft') window.debugObject.position.x -= 0.1;
    //        if (e.key === 'ArrowRight') window.debugObject.position.x += 0.1;
    //    });
}

function pixelToWorldUnits(
    pixelSize: number,
    distance: number,
    camera: THREE.PerspectiveCamera,
) {
    const fovInRad = camera.fov * (Math.PI / 180)
    const screenHeight = 2 * Math.tan(fovInRad / 2) * distance
    const pixelHeightInWorld = screenHeight / window.innerHeight
    return pixelSize * pixelHeightInWorld
}

async function prepareDrawingContext(
    threejsDrawing: ThreeJSDrawing,
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    controls: any,
    css2DRenderer: any = null,
    css3DRenderer: any = null,
    css3DScene: THREE.Scene | null = null,
    tweenGroup?: Group,
    queryOptions: any = {},
) {
    // ensure data exists
    if (
        threejsDrawing.data == null ||
        typeof threejsDrawing.data !== 'object'
    ) {
        threejsDrawing.data = {}
        console.warn(
            `threejsDrawing.data was not set, initializing as empty object for ${threejsDrawing.name}.`,
        )
    }

    Object.assign(threejsDrawing.data, {
        scene,
        camera,
        renderer,
        controls,
        css2DRenderer,
        css3DRenderer,
        css3DScene,
        tweenGroup,
        queryOptions,
    })
    return threejsDrawing
}

function parseQueryParams(queryString: string) {
    const urlParams = new URLSearchParams(queryString)
    const queryParams: { [key: string]: any } = {}
    for (const [key, value] of urlParams.entries()) {
        if (key === 'nav') {
            if (value === 'true') {
                queryParams[key] = true
            } else if (value === 'false') {
                queryParams[key] = false
            } else {
                console.warn(
                    `Invalid value for ${key}: ${value}. Expected 'true' or 'false'.`,
                )
            }
            queryParams[key] = value
        } else if (key === 'controls') {
            if (value === 'walking') {
                queryParams[key] = value
            } else if (value === 'orbit') {
                queryParams[key] = value
            } else {
                console.warn(
                    `Invalid value for ${key}: ${value}. Expected 'walking' or 'orbit'.`,
                )
            }
        } else if (key === 'debug') {
            if (value === 'true') {
                queryParams[key] = true
            } else if (value === 'false') {
                queryParams[key] = false
            } else {
                console.warn(
                    `Invalid value for ${key}: ${value}. Expected 'true' or 'false'.`,
                )
            }
        } else if (key === 'prev') {
            queryParams[key] = value
        } else {
            console.warn(`Unknown query parameter: ${key}`)
        }
    }
    console.log(`Query params: ${JSON.stringify(queryParams)}`)

    // Handle boolean conversion for nav and debug
    if (queryParams.nav === 'true') {
        queryParams.nav = true
    } else if (queryParams.nav === 'false') {
        queryParams.nav = false
    }
    if (queryParams.debug === 'true') {
        queryParams.debug = true
    } else if (queryParams.debug === 'false') {
        queryParams.debug = false
    }

    return queryParams
}

export {
    drawTestCube,
    determineLabelCoordinates,
    loadDataSource,
    pixelToWorldUnits,
    prepareDrawingContext,
    drawHelpers,
    parseQueryParams,
}
