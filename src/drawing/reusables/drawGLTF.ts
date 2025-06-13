import * as THREE from 'three';
import { drawBasicLights } from './drawLights.js';
import { ThreeJSDrawing } from '../../threejsDrawing.js';

type GLTF = {
    scene: THREE.Scene;
    animations: THREE.AnimationClip[];
    asset: {
        version: string;
        generator: string;
    };
    userData: {
        [key: string]: any;
    };
}

function animateParts(gltf: GLTF, time: number) {
    const leftArm = gltf.scene.getObjectByName("UpperArm_L");

    if (leftArm) {
        leftArm.rotation.z = Math.sin(time / 800) * Math.PI / 2;
    }

    const rightArm = gltf.scene.getObjectByName("UpperArm_R");

    if (rightArm) {
        rightArm.rotation.z = Math.sin(time / 800) * -(Math.PI / 2);
    }
}

function drawGLTF(scene: THREE.Scene, data: GLTF, threejsDrawing: ThreeJSDrawing) {
    const gltf = data;
    scene.add(gltf.scene);

    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // make it horizontal
    floor.position.y = 0;
    floor.receiveShadow = true;

    scene.add(floor);

    // Add basic lights
    drawBasicLights(scene, threejsDrawing);

    const leftArm = gltf.scene.getObjectByName("UpperArm_L");
    const rightArm = gltf.scene.getObjectByName("UpperArm_R");

    // starting rotation of forward 90 degrees...
    if (leftArm) {
        ///leftArm.rotation.x = Math.PI / 2;
        //leftArm.rotation.z = Math.PI / 2;
    }
    if (rightArm) {
        //rightArm.rotation.x = Math.PI / 2;
        ///rightArm.rotation.z = Math.PI / 2;
    }

    threejsDrawing.data.gltf = gltf;
}


const gltfDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawGLTF, 'dataSrc': 'humanoid', 'dataType': 'gltf'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        const gltf = threejsDrawing.data.gltf as GLTF | undefined;
        const scene = threejsDrawing.data.scene;
        if (!gltf) {
            return;
        }
        animateParts(gltf, timestamp);
    },
    'data': {
        gltf: undefined
    }
}

export { gltfDrawing };
