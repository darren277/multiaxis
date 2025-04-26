import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
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


const loadDataSource = (scene, dataSrc, drawFunc, state) => {
    const jsonPath = `./data/${dataSrc}.json`;

    fileLoader.load(
        jsonPath,
        (dataString) => {
            const data = JSON.parse(dataString);
            drawFunc(scene, data, state);
        },
        undefined, // onProgress
        (err) => {
            console.error(`Error loading ${jsonPath}`, err);
        }
    );
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

async function prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, cssRenderer) {
    Object.assign(threejsDrawing.data, {
        scene,
        camera,
        renderer,
        controls,
        cssRenderer,
    });
    return threejsDrawing;
}

export { drawTestCube, determineLabelCoordinates, loadDataSource, pixelToWorldUnits, prepareDrawingContext, drawHelpers };
