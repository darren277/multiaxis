import * as THREE from 'three';
import { drawBasicLights, drawSun } from './reusables/drawLights';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { createPerlinGrassTexture, createGroundFromLayout, groundLayout, animateWater } from './reusables/drawGround';
import { onKeyDownWalking, onKeyUpWalking, updateObstacleBoxes, walkingAnimationCallback } from '../config/walking';
import { instantiateCollision } from '../config/instantiateCollision';
import { ThreeJSDrawing } from '../types';
import { animateElevator } from './reusables/drawRoom';


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();
const clickableDoors: THREE.Group[] = [];
const doorAnimations = new Map();

const gltfLoader = new GLTFLoader();

async function loadGltfModel(data_src: string) {
    const gltf = await gltfLoader.loadAsync(`./imagery/farm/${data_src}.glb`);
    return gltf;
}

// Alternative:
// "Barn":          { position: tileToPosition(3, 2), rotation: [0, 0, 0], scale: [1, 5, 1] },
// "Big Barn":      { position: tileToPosition(7, 1), rotation: [0, Math.PI/2, 0], scale: [1, 1, 1] },

const modelLayout = {
    "Barn":          { position: [0, 0, 0],     rotation: [0, 0, 0], scale: [1, 5, 1] },
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

function makeDoorClickable(doorMesh: THREE.Mesh) {
    // --- find door size so we can offset it by half the width ----------
    const bbox  = new THREE.Box3().setFromObject(doorMesh);
    const size  = new THREE.Vector3();
    bbox.getSize(size);      // size.x is the door width

    // --- build pivot at the hinge edge ---------------------------------
    const pivot = new THREE.Group();
    pivot.position.copy(doorMesh.position);           // stay where door was
    doorMesh.parent.add(pivot);                       // insert pivot
    doorMesh.position.set(-size.x * 0.5, 0, 0);       // move mesh so left edge is on pivot
    pivot.add(doorMesh);                              // child of pivot now
    doorMesh.userData.pivot = pivot;

    // --- save references for click & animation handling ----------------
    clickableDoors.push(pivot);                       // pivot is what we click/animate
    doorAnimations.set(pivot, { state: 'closed', tween: null });
}

function reparentToHinge(doorMesh: THREE.Mesh, hingeOffsetX = -0.5) {
    const parent = new THREE.Group();
    if (doorMesh.parent) {
        doorMesh.parent.add(parent); // insert into scene
    }
    parent.position.copy(doorMesh.position);
    doorMesh.position.set(hingeOffsetX, 0, 0); // move the mesh relative to hinge
    parent.add(doorMesh);

    return parent;
}

function easeOutCubic(t: number) {
    // alternative (or Tween): gsap.to(pivot.rotation, { y: end, duration: 1, ease: 'power2.out' });
    return 1 - Math.pow(1 - t, 3);
}

function animateDoors(delta: number) {
    doorAnimations.forEach((record, pivot) => {
        if (!record.tween) return;          // idle door

        record.tween.elapsed += delta;
        const t  = Math.min(record.tween.elapsed / record.tween.duration, 1);
        const te = easeOutCubic(t);      // nice easing curve 0→1

        pivot.rotation.y = THREE.MathUtils.lerp(record.tween.start, record.tween.end, te);

        if (t === 1) record.tween = null;   // finished
    });
}

function drawFarm(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    threejsDrawing.data.farm = {};
    const farmGroup = new THREE.Group();
    scene.add(farmGroup);

    for (let i = 0; i < farmModels.length; i++) {
        const modelName = farmModels[i];
        loadGltfModel(modelName).then((gltf) => {
            gltf.scene.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    console.log(`Mesh name: ${child.name}`);
                    if (child.name.includes("Door")) {
                        makeDoorClickable(child);
                        //child.userData.originalRotationY = child.rotation.y;
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

    //const floorGeometry = new PlaneGeometry(200, 200);
    //const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createPerlinGrassTexture()}));
    const tileSize = 5;
    const terrain = createGroundFromLayout(groundLayout, tileSize);
    //terrain.rotation.x = -Math.PI / 2;
    //terrain.receiveShadow = true;
    scene.add(terrain);

    threejsDrawing.data.floor = terrain;

    (threejsDrawing.data.floor as THREE.Object3D).userData.isGround = true;
    if (!threejsDrawing.data.worldMeshes) {
        threejsDrawing.data.worldMeshes = [];
    }
    threejsDrawing.data.worldMeshes.push(threejsDrawing.data.floor);

    drawSun(scene);

    (scene as THREE.Scene).updateMatrixWorld(true);

    instantiateCollision(threejsDrawing);
}

function onDoorClick(event: MouseEvent, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hit = raycaster.intersectObjects(clickableDoors, true)[0];
    if (!hit) return;

    let pivot = hit.object.userData.pivot || hit.object;
    while (pivot && !doorAnimations.has(pivot)) {
        pivot = pivot.parent;
    }

    if (!pivot) return;

    const record = doorAnimations.get(pivot);

    if (record.tween) return;                // already animating

    const isOpening = record.state === 'closed';
    const start     = pivot.rotation.y;
    const end       = start + (isOpening ? Math.PI / 2 : -Math.PI / 2);

    record.tween = { elapsed: 0, duration: 1.0, start, end };
    record.state = isOpening ? 'open' : 'closed';
}

let lastTime = 0;

function animateFarm(renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) {
    const scene = threejsDrawing.data.scene;
    const controls = threejsDrawing.data.controls;
    if (!controls) {
        console.warn('No controls found.');
        return;
    }

    if (!threejsDrawing.data.ready) return;

    const lift     = threejsDrawing.data.elevator;
    const player   = controls.object;

    //const elapsed = threejsDrawing.data.collision.clock.getDelta();
    const elapsed = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    scene.updateMatrixWorld(true);

    if (lift) {
        animateElevator(lift, player, elapsed);
    }

    updateObstacleBoxes(threejsDrawing.data.staticBoxes, threejsDrawing.data.movingMeshes, threejsDrawing.data.obstacleBoxes);

    walkingAnimationCallback(scene as THREE.Scene, controls, threejsDrawing.data.collision, elapsed, true);
}

const farmDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawFarm, 'dataSrc': null, 'dataType': 'gltf'}
    ],
    'eventListeners': {
        'click': (event: MouseEvent, data: any) => {
            const renderer = data.renderer;
            const threejsDrawing = data.threejsDrawing;
            const camera = data.camera;
            onDoorClick(event, renderer, camera);
        },
        'keydown': (event: KeyboardEvent, stuff: any) => {
            const keyManager = stuff.data.keyManager;
            onKeyDownWalking(event, keyManager);
        },
        'keyup': (event: KeyboardEvent, stuff: any) => {
            const keyManager = stuff.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        const delta = Math.min((timestamp - lastTime) / 1000, 0.1);
        animateDoors(delta);
        animateWater(renderer, timestamp, threejsDrawing, camera);
        animateFarm(renderer, timestamp, threejsDrawing, camera);
    },
    'data': {
        'staticBoxes': [],
        'movingMeshes': [],
        'obstacleBoxes': [],
        'worldMeshes': [],
        'collision': null,
        'keyManager': null,
    },
    'sceneConfig': {
        'startPosition': {
            'x': 0,
            // height above ground
            'y': 2,
            // groundHeight/2 + 5 // a little past the top edge
            'z': -30
        },
        'lookAt': {
            'x': 0,
            'y': 0,
            'z': 0
        }
    }
}

export { farmDrawing };
