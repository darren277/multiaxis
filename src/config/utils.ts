import { BoxGeometry, Mesh, MeshBasicMaterial, MeshNormalMaterial, GridHelper } from 'three';
import * as THREE from 'three'; // for texture loading

function drawTestCube(scene: THREE.Scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
}

function determineLabelCoordinates(p1: number, p2: number, p3: number, radius: number) {
    let x = p1 + (radius * 2);
    let y = p2;
    let z = p3;
    return [x, y, z];
};

const fileLoader = new THREE.FileLoader();


async function loadDataSource(dataSrc: string) {
    if (!dataSrc || typeof dataSrc !== 'string') {
        throw new Error(`Invalid data source provided. It must be a non-empty string. Received: ${dataSrc}`);
    }
    let path = dataSrc.startsWith('home_') ? dataSrc.replace('home_', 'threejs/data/') : `data/${dataSrc}`;
    path = `./${path}.json`;

    // FileLoader has a .loadAsync() that returns a Promise<string>
    const loader = new THREE.FileLoader();
    const raw = await loader.loadAsync(path);
    const rawStr = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
    return JSON.parse(rawStr);
}

function drawHelpers(scene: THREE.Scene, threejsDrawing: any) {
    const refGeometry = new THREE.BoxGeometry(1, 1, 1); // 1x1x1 cube
    const refMaterial = new THREE.MeshNormalMaterial({ wireframe: true });
    const refCube = new THREE.Mesh(refGeometry, refMaterial);
    refCube.position.set(0, 0.5, 0); // sit on ground
    scene.add(refCube);

    const gridHelper = new THREE.GridHelper(10, 10); // 10x10 units
    scene.add(gridHelper);

    //window.debugObject = object; // now accessible from console

//    document.addEventListener('keydown', (e) => {
//        if (e.key === 'ArrowUp') window.debugObject.position.z -= 0.1;
//        if (e.key === 'ArrowDown') window.debugObject.position.z += 0.1;
//        if (e.key === 'ArrowLeft') window.debugObject.position.x -= 0.1;
//        if (e.key === 'ArrowRight') window.debugObject.position.x += 0.1;
//    });
}

function pixelToWorldUnits(pixelSize: number, distance: number, camera: THREE.PerspectiveCamera) {
    const fovInRad = camera.fov * (Math.PI / 180);
    const screenHeight = 2 * Math.tan(fovInRad / 2) * distance;
    const pixelHeightInWorld = screenHeight / window.innerHeight;
    return pixelSize * pixelHeightInWorld;
}

async function prepareDrawingContext(threejsDrawing: any, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, controls: any, css2DRenderer: any = null, css3DRenderer: any = null, queryOptions: any = {}) {
    Object.assign(threejsDrawing.data, {
        scene,
        camera,
        renderer,
        controls,
        css2DRenderer,
        css3DRenderer,
        queryOptions,
    });
    return threejsDrawing;
}

function parseQueryParams(queryString: string) {
    const urlParams = new URLSearchParams(queryString);
    const queryParams: { [key: string]: any } = {};
    for (const [key, value] of urlParams.entries()) {
        if (key === 'nav') {
            if (value === 'true') {
                queryParams[key] = true;
            } else if (value === 'false') {
                queryParams[key] = false;
            } else {
                console.warn(`Invalid value for ${key}: ${value}. Expected 'true' or 'false'.`);
            }
            queryParams[key] = value;
        } else if (key === 'controls') {
            if (value === 'walking') {
                queryParams[key] = value;
            } else if (value === 'orbit') {
                queryParams[key] = value;
            } else {
                console.warn(`Invalid value for ${key}: ${value}. Expected 'walking' or 'orbit'.`);
            }
        } else if (key === 'debug') {
            if (value === 'true') {
                queryParams[key] = true;
            } else if (value === 'false') {
                queryParams[key] = false;
            } else {
                console.warn(`Invalid value for ${key}: ${value}. Expected 'true' or 'false'.`);
            }
        } else if (key === 'prev') {
            queryParams[key] = value;
        } else {
            console.warn(`Unknown query parameter: ${key}`);
        }
    }
    console.log(`Query params: ${JSON.stringify(queryParams)}`);
    return queryParams;
}

export { drawTestCube, determineLabelCoordinates, loadDataSource, pixelToWorldUnits, prepareDrawingContext, drawHelpers, parseQueryParams };
