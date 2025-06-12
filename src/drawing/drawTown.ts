import { drawHouses } from './drawHouse.js';
import { drawSun } from './drawLights.js';
import { createPerlinGrassTexture } from './drawGround.js';
// @ts-ignore-next-line
import * as THREE from 'three';
import { onKeyDownWalking, onKeyUpWalking, updateObstacleBoxes, walkingAnimationCallback } from '../config/walking.js';
import { instantiateCollision } from '../config/instantiateCollision.js';
import { ThreeJSDrawing } from '../types.js';
import { animateElevator } from './drawRoom.js';


function drawTown(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    //const floor = new Mesh(floorGeometry, grassMaterial);
    //const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createGrassTexture()}));
    threejsDrawing.data.floor = new THREE.Mesh(floorGeometry, new THREE.MeshStandardMaterial({map: createPerlinGrassTexture()}));
    (threejsDrawing.data.floor as THREE.Mesh).userData.isGround = true;
    if (!threejsDrawing.data.worldMeshes) {
        threejsDrawing.data.worldMeshes = [];
    }
    threejsDrawing.data.worldMeshes.push(threejsDrawing.data.floor);

    (threejsDrawing.data.floor as THREE.Mesh).rotation.x = -Math.PI / 2;
    (threejsDrawing.data.floor as THREE.Mesh).receiveShadow = true;

    scene.add(threejsDrawing.data.floor);

    // Add basic lights
    //drawBasicLights(scene);
    drawSun(scene);

    drawHouses(scene);

    scene.updateMatrixWorld(true);

    instantiateCollision(threejsDrawing);
}

let lastTime = 0;

function animateTown(
    renderer: THREE.Renderer,
    timestamp: number,
    threejsDrawing: ThreeJSDrawing,
    camera: THREE.Camera
) {
    const scene = threejsDrawing.data.scene as THREE.Scene;
    const controls = threejsDrawing.data.controls as { object: THREE.Object3D };
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

    walkingAnimationCallback(scene, controls, threejsDrawing.data.collision, elapsed, true);
}

function animationCallback(
    renderer: THREE.Renderer,
    timestamp: number,
    threejsDrawing: ThreeJSDrawing,
    camera: THREE.Camera
) {
    if (!threejsDrawing.data.ready) return;
    if (!threejsDrawing.data.staticBoxes || !threejsDrawing.data.movingMeshes || !threejsDrawing.data.worldMeshes) {
        console.warn('No static boxes, moving meshes, or world meshes found.');
        return;
    }
    animateTown(renderer, timestamp, threejsDrawing, camera);
}

const townDrawing: { [key: string]: () => Promise<ThreeJSDrawing> } = {
    'sceneElements': async () => Promise.resolve({} as ThreeJSDrawing),
    'drawFuncs': [
        {'func': drawTown, 'dataSrc': null}
    ],
    'eventListeners': {
        'keydown': (
            event: KeyboardEvent,
            stuff: { data: { keyManager: any } }
        ) => {
            const keyManager = stuff.data.keyManager;
            onKeyDownWalking(event, keyManager);
        },
        'keyup': (event: KeyboardEvent, stuff: { data: { keyManager: any } }) => {
            const keyManager = stuff.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
    },
    'animationCallback': animationCallback,
    'data': {
        'staticBoxes': [],
        'movingMeshes': [],
        'obstacleBoxes': [],
        'worldMeshes': [],
        'collision': null,
        'keyManager': null,
    },
    'sceneConfig': {
        'startPosition': { x: 0, y: 10, z: 0 },
        'lookAt': { x: 0, y: 10, z: 10 },
    }
}

export { townDrawing };
