import { MeshStandardMaterial, PlaneGeometry, Mesh, Group, ShaderMaterial } from 'three';
import { drawBasicLights } from './drawLights.js';
import { GLTFLoader } from 'gltfloader'

const gltfLoader = new GLTFLoader();

const grassMaterial = new ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        void main() {
            float stripes = step(0.5, fract(vUv.x * 40.0)) * 0.2;
            float noise = fract(sin(dot(vUv.xy ,vec2(12.9898,78.233))) * 43758.5453);
            float green = 0.3 + 0.3 * noise + stripes;
            gl_FragColor = vec4(0.1, green, 0.1, 1.0);
        }
    `
});

function animateParts(gltf, time) {
    const leftArm = gltf.scene.getObjectByName("UpperArm_L");
}

async function loadGltfModel(data_src) {
    const gltf = await gltfLoader.loadAsync(`./imagery/farm/${data_src}.glb`);
    return gltf;
}

const modelLayout = {
    "Barn":          { position: [0, 0, 0],     rotation: [0, 0, 0], scale: [1, 1, 1] },
    "Big Barn":      { position: [20, 0, 10],   rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
    "ChickenCoop":   { position: [-10, 0, 5],   rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
    "Fence":         { position: [5, 0, -15],   rotation: [0, Math.PI / 4, 0], scale: [1, 1, 1] },
    "Open Barn":     { position: [25, 0, -5],   rotation: [0, 0, 0], scale: [1, 1, 1] },
    "Silo House":    { position: [-20, 0, -10], rotation: [0, 0, 0], scale: [1, 1, 1] },
    "Silo":          { position: [-20, 0, -20], rotation: [0, 0, 0], scale: [1, 1, 1] },
    "Small Barn":    { position: [10, 0, 15],   rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8] },
    "Tower Windmill":{ position: [-30, 0, 20],  rotation: [0, 0, 0], scale: [1, 1, 1] },
};


const farmModels = [
    'Barn',
    'Big Barn',
    'ChickenCoop',
    'Fence',
    'Open Barn',
    'Silo House',
    'Silo',
    'Small Barn',
    'Tower Windmill',
]


function drawFarm(scene, threejsDrawing) {
    threejsDrawing.data.farm = {};
    const farmGroup = new Group();
    scene.add(farmGroup);

    for (let i = 0; i < farmModels.length; i++) {
        const modelName = farmModels[i];
        loadGltfModel(modelName).then((gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const layout = modelLayout[modelName];
            if (layout) {
                const [px, py, pz] = layout.position;
                const [rx, ry, rz] = layout.rotation;
                const [sx, sy, sz] = layout.scale;

                gltf.scene.position.set(px, py, pz);
                gltf.scene.rotation.set(rx, ry, rz);
                gltf.scene.scale.set(sx, sy, sz);
            }

            farmGroup.add(gltf.scene);
            threejsDrawing.data.farm[modelName] = gltf;
        });
    }

    const floorGeometry = new PlaneGeometry(200, 200);
    const floor = new Mesh(floorGeometry, grassMaterial);

    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    scene.add(floor);

    // Add basic lights
    drawBasicLights(scene);
}


const farmDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawFarm, 'dataSrc': null, 'dataType': 'gltf'}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    }
}

export { farmDrawing };
