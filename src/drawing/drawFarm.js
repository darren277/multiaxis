import { MeshStandardMaterial, PlaneGeometry, Mesh, Group, ShaderMaterial, CanvasTexture, RepeatWrapping, Raycaster, Vector2, MathUtils, Clock } from 'three';
import { drawBasicLights, drawSun } from './drawLights.js';
import { GLTFLoader } from 'gltfloader'
import perlin from 'perlin-noise';

const raycaster = new Raycaster();
const mouse = new Vector2();
const clock = new Clock();
const clickableDoors = [];
const doorAnimations = new Map();

function createPerlinGrassTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const noise = perlin.generatePerlinNoise(size, size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const val = noise[y * size + x];
            const g = 60 + val * 100;
            ctx.fillStyle = `rgb(${g * 0.4}, ${g}, ${g * 0.4})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

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

function createGrassTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;

    const ctx = canvas.getContext('2d');

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const noise = Math.random() * 50;
            const r = 20 + noise;
            const g = 100 + noise * 2;
            const b = 20 + noise;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
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

function reparentToHinge(doorMesh, hingeOffsetX = -0.5) {
    const parent = new Group();
    doorMesh.parent.add(parent); // insert into scene
    parent.position.copy(doorMesh.position);
    doorMesh.position.set(hingeOffsetX, 0, 0); // move the mesh relative to hinge
    parent.add(doorMesh);

    return parent;
}


function animateDoors(delta) {
    doorAnimations.forEach((anim, door) => {
        if (anim.progress < 1) {
            anim.progress += delta; // speed modifier here
            const t = Math.min(anim.progress, 1);

            // Animate a 90-degree (π/2) swing
            const swingAngle = anim.isOpening ? Math.PI / 2 : 0;

            const parent = reparentToHinge(door);

            parent.rotation.y = MathUtils.lerp(anim.originRotation, swingAngle, t);
        }
    });
}

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
                    console.log(`Mesh name: ${child.name}`);
                    if (child.name.includes("Door")) {
                        clickableDoors.push(child);
                        child.userData.originalRotationY = child.rotation.y;
                        // Optionally: set pivot for rotation (see advanced tip below)
                    }
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
    //const floor = new Mesh(floorGeometry, grassMaterial);
    //const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createGrassTexture()}));
    const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createPerlinGrassTexture()}));

    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    scene.add(floor);

    // Add basic lights
    //drawBasicLights(scene);
    drawSun(scene);

    //drawHouses(scene);
}

function onDoorClick(event, renderer, camera) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(clickableDoors, true);
    if (intersects.length > 0) {
        const clickedDoor = intersects[0].object;

        if (!doorAnimations.has(clickedDoor)) {
            doorAnimations.set(clickedDoor, {progress: 0, isOpening: true, originRotation: clickedDoor.rotation.y});
        }
    }
}

const farmDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawFarm, 'dataSrc': null, 'dataType': 'gltf'}
    ],
    'uiState': null,
    'eventListeners': {
        'click': (event, data) => {
            const renderer = data.renderer;
            const threejsDrawing = data.threejsDrawing;
            const camera = data.camera;
            onDoorClick(event, renderer, camera);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        const delta = clock.getDelta();
        animateDoors(delta);
    },
    'data': {
    }
}

export { farmDrawing };
