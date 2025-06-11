import { BoxGeometry, Mesh, MeshBasicMaterial, MeshNormalMaterial, GridHelper } from 'three';
import { FileLoader } from 'three'; // for texture loading

function drawTestCube(scene) {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);
}

function determineLabelCoordinates(p1, p2, p3, radius) {
    let x = p1 + (radius * 2);
    let y = p2;
    let z = p3;
    return [x, y, z];
};

const fileLoader = new FileLoader();


async function loadDataSource(dataSrc) {
    let path = dataSrc.startsWith('home_') ? dataSrc.replace('home_', 'threejs/data/') : `data/${dataSrc}`;
    path = `./${path}.json`;

    // FileLoader has a .loadAsync() that returns a Promise<string>
    const loader = new FileLoader();
    const raw = await loader.loadAsync(path);
    return JSON.parse(raw);
}

function drawHelpers(scene, threejsDrawing) {
    const refGeometry = new BoxGeometry(1, 1, 1); // 1x1x1 cube
    const refMaterial = new MeshNormalMaterial({ wireframe: true });
    const refCube = new Mesh(refGeometry, refMaterial);
    refCube.position.set(0, 0.5, 0); // sit on ground
    scene.add(refCube);

    const gridHelper = new GridHelper(10, 10); // 10x10 units
    scene.add(gridHelper);

    //window.debugObject = object; // now accessible from console

//    document.addEventListener('keydown', (e) => {
//        if (e.key === 'ArrowUp') window.debugObject.position.z -= 0.1;
//        if (e.key === 'ArrowDown') window.debugObject.position.z += 0.1;
//        if (e.key === 'ArrowLeft') window.debugObject.position.x -= 0.1;
//        if (e.key === 'ArrowRight') window.debugObject.position.x += 0.1;
//    });
}

function pixelToWorldUnits(pixelSize, distance, camera) {
    const fovInRad = camera.fov * (Math.PI / 180);
    const screenHeight = 2 * Math.tan(fovInRad / 2) * distance;
    const pixelHeightInWorld = screenHeight / window.innerHeight;
    return pixelSize * pixelHeightInWorld;
}

async function prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, css2DRenderer = null, css3DRenderer = null, queryOptions = {}) {
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

function parseQueryParams(queryString) {
    const urlParams = new URLSearchParams(queryString);
    const queryParams = {};
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
