import { MeshStandardMaterial, PlaneGeometry, Mesh } from 'three';
import { drawBasicLights } from './drawLights.js';


function animateParts(gltf, time) {
    const leftArm = gltf.scene.getObjectByName("UpperArm_L");

    if (leftArm) {
        leftArm.rotation.z = Math.sin(time / 800) * Math.PI / 2;
    }

    const rightArm = gltf.scene.getObjectByName("UpperArm_R");

    if (rightArm) {
        rightArm.rotation.z = Math.sin(time / 800) * -(Math.PI / 2);
    }
}

function drawGLTF(scene, data, threejsDrawing) {
    const gltf = data;
    scene.add(gltf.scene);

    const floorGeometry = new PlaneGeometry(200, 200);
    const floorMaterial = new MeshStandardMaterial({
        color: 0x888888,
    });

    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // make it horizontal
    floor.position.y = 0;
    floor.receiveShadow = true;

    scene.add(floor);

    // Add basic lights
    drawBasicLights(scene);

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
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        const gltf = threejsDrawing.data.gltf;
        const scene = threejsDrawing.data.scene;
        if (!gltf) {
            return;
        }
        animateParts(gltf, timestamp);
    },
    'data': {
    }
}

export { gltfDrawing };
