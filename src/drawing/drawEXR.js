import { SphereGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PMREMGenerator, EquirectangularReflectionMapping } from 'three';



function drawExrPMREM(scene, texture, threejsDrawing) {
    const { renderer } = threejsDrawing.data;
    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = envMap;

    texture.dispose();
    pmremGenerator.dispose();
}

function drawExprEquirectangular(scene, texture, threejsDrawing) {
    texture.mapping = EquirectangularReflectionMapping;

    const geometry = new SphereGeometry(50, 64, 64);
    geometry.scale(-1, 1, 1); // Flip normals to render inside

    const material = new MeshBasicMaterial({ map: texture });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
}


function drawExr(scene, texture, threejsDrawing) {
    const { drawingMode } = threejsDrawing.data;

    if (drawingMode === 'PMREM') {
        drawExrPMREM(scene, texture, threejsDrawing);
    } else if (drawingMode === 'Equirectangular') {
        drawExprEquirectangular(scene, texture, threejsDrawing);
    }

    const geometry = new SphereGeometry(1, 64, 64);
    const material = new MeshStandardMaterial({ metalness: 1, roughness: 0 });
    const sphere = new Mesh(geometry, material);
    //scene.add(sphere);

    //camera.position.z = 3;
}

const exrDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawExr, 'dataSrc': 'golden_gate_hills_1k', 'dataType': 'exr'},
    ],
    'uiState': {tempoScale: 1.0},
    // domElement.addEventListener('click', (e) => onMouseClick(e, camera, domElement));
    'eventListeners': {
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
        //'drawingMode': 'PMREM',
        'drawingMode': 'Equirectangular',
    }
}

export { exrDrawing };

