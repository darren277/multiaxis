import { MeshStandardMaterial, PlaneGeometry, Mesh, Group, ShaderMaterial, CanvasTexture, RepeatWrapping, Raycaster, Vector2, MathUtils, Clock } from 'three';
import { drawBasicLights, drawSun } from './drawLights.js';
import { GLTFLoader } from 'gltfloader'
import { createPerlinGrassTexture } from './drawGrass.js';


const raycaster = new Raycaster();
const mouse = new Vector2();
const clock = new Clock();
const clickableDoors = [];
const doorAnimations = new Map();

const gltfLoader = new GLTFLoader();

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
    'eventListeners': {
        'click': (event, data) => {
            const renderer = data.renderer;
            const threejsDrawing = data.threejsDrawing;
            const camera = data.camera;
            onDoorClick(event, renderer, camera);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        const delta = clock.getDelta();
        animateDoors(delta);
    },
    'data': {
    }
}

export { farmDrawing };
