import { drawHouses } from './drawHouse.js';
import { drawSun } from './drawLights.js';
import { createPerlinGrassTexture } from './drawGround.js';
import { PlaneGeometry, Mesh, MeshStandardMaterial } from 'three';
import { onKeyDownWalking, onKeyUpWalking, updateObstacleBoxes, walkingAnimationCallback } from '../config/walking.js';
import { instantiateCollision } from '../config/instantiateCollision.js';


function drawTown(scene, threejsDrawing) {
    const floorGeometry = new PlaneGeometry(200, 200);
    //const floor = new Mesh(floorGeometry, grassMaterial);
    //const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createGrassTexture()}));
    threejsDrawing.data.floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createPerlinGrassTexture()}));
    threejsDrawing.data.floor.userData.isGround = true;
    threejsDrawing.data.worldMeshes.push(threejsDrawing.data.floor);

    threejsDrawing.data.floor.rotation.x = -Math.PI / 2;
    threejsDrawing.data.floor.receiveShadow = true;

    scene.add(threejsDrawing.data.floor);

    // Add basic lights
    //drawBasicLights(scene);
    drawSun(scene);

    drawHouses(scene);

    scene.updateMatrixWorld(true);

    instantiateCollision(threejsDrawing);
}

let lastTime = 0;

function animateTown(renderer, timestamp, threejsDrawing, camera) {
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

    walkingAnimationCallback(scene, controls, threejsDrawing.data.collision, elapsed, true);
}


const townDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawTown, 'dataSrc': null}
    ],
    'eventListeners': {
        'keydown': (event, stuff) => {
            const keyManager = stuff.data.keyManager;
            onKeyDownWalking(event, keyManager);
        },
        'keyup': (event, stuff) => {
            const keyManager = stuff.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        if (!threejsDrawing.data.staticBoxes || !threejsDrawing.data.movingMeshes || !threejsDrawing.data.worldMeshes) {
            console.warn('No static boxes, moving meshes, or world meshes found.');
            return;
        }
        animateTown(renderer, timestamp, threejsDrawing, camera);
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
        'startPosition': { x: 0, y: 10, z: 0 },
        'lookAt': { x: 0, y: 10, z: 10 },
    }
}

export { townDrawing };
