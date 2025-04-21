import { TextureLoader, Clock, Group, Object3D } from 'three';
import { GLTFLoader } from 'gltfloader';
import { drawBasicLights, drawSun } from './drawLights.js';
import { Tween, Easing } from 'tween';

async function loadGltfModel(data_src) {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync(`${data_src}`);
    return gltf;
}


const LEFT_EYE = 'Object_4';
const HEAD = 'Object_5';

//const ANIMATABLE_PART = [LEFT_EYE, HEAD, 'Object_3', 'Object_6'];
const ANIMATABLE_NAMES = [LEFT_EYE, HEAD];

const originalTraverse = Object3D.prototype.traverse;



async function drawMale07(scene, threejsDrawing) {
    const { scene: gltfScene } = await loadGltfModel('imagery/skibidi/male-07_v1.glb');

    // 1) Find the meshes you want to animate
    const animMeshes = [];
    gltfScene.traverse(node => {
        if (node.isMesh && ANIMATABLE_NAMES.includes(node.name)) {
            animMeshes.push(node);
        }
    });

    // 2) Store that array for the animation loop
    threejsDrawing.data.animatableMeshes = animMeshes;

    // 3) Add the GLTF into the scene normally
    scene.add(gltfScene);

    return gltfScene;
}

async function drawToilet(scene, threejsDrawing) {
    // toilet
    const toilet = await loadGltfModel('imagery/skibidi/toilet.gltf');

    // Set the position
    toilet.scene.position.set(0, 0, 0);
    toilet.scene.rotation.set(0, 0, 0);
    toilet.scene.scale.set(0.1, 0.1, 0.1);
    scene.add(toilet.scene);

    return toilet.scene;
}


//const duration = 2000; // Duration in milliseconds
//const startPosition = { x: 0, y: 0, z: 0 };
//const endPosition = { x: 0, y: 0, z: 0.5 };
//const startRotation = { x: 0, y: 0, z: 0 };
//const endRotation = { x: 0, y: Math.PI * 2, z: 0 };
//const startScale = { x: 1, y: 1, z: 1 };
//const endScale = { x: 1.5, y: 1.5, z: 1.5 };

function animateMeshes(meshes) {
    if (!meshes.length) return;

    const duration = 2000;
    // This is our “virtual group”
    const proxy = { z: 0, ry: 0, s: 1 };

    // Forward tween: move out, spin, grow
    const forward = new Tween(proxy).to({ z: 0.5, ry: Math.PI * 2, s: 1.5 }, duration).easing(Easing.Quadratic.InOut).onUpdate(() => {
        meshes.forEach(m => {
            m.position.z = proxy.z;
            m.rotation.y = proxy.ry;
            m.scale.set(proxy.s, proxy.s, proxy.s);
        });
    }).onComplete(() => backward.start()).start();

    // Backward tween: return to identity
    const backward = new Tween(proxy).to({ z: 0, ry: 0, s: 1 }, duration).easing(Easing.Quadratic.InOut).onUpdate(() => {
        meshes.forEach(m => {
            m.position.z = proxy.z;
            m.rotation.y = proxy.ry;
            m.scale.set(proxy.s, proxy.s, proxy.s);
        });
    }).onComplete(() => forward.start());
}

function animateStretchingMeshes(meshes) {
    const mesh = meshes[1]; // Assuming you want to animate the first mesh
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    const originalZ = []; // preserve original positions

    // Cache original positions
    for (let i = 0; i < position.count; i++) {
        originalZ[i] = position.getZ(i);
    }

    const proxy = { stretch: 1 };

    new Tween(proxy).to({ stretch: 2.0 }, 3000).easing(Easing.Quadratic.InOut).onUpdate(() => {
        for (let i = 0; i < position.count; i++) {
            const z = originalZ[i];
            // only affect the neck (e.g., vertices below Z=0.3)
            if (z < 0.3) {
                position.setZ(i, z * proxy.stretch);
            }
        }
        position.needsUpdate = true;
      }).start();

    // also increase vertical scale...
    new Tween(mesh.scale).to({ z: 2.0 }, 3000).easing(Easing.Quadratic.InOut).start();
    // ...and return to normal
    new Tween(mesh.scale).to({ z: 1 }, 3000).delay(3000).easing(Easing.Quadratic.InOut).start();
    // ...and return to normal

    // decrease vertical position...
    new Tween(mesh.position).to({ z: -1.0 }, 3000).easing(Easing.Quadratic.InOut).start();
    // ...and return to normal
    new Tween(mesh.position).to({ z: 0 }, 3000).delay(3000).easing(Easing.Quadratic.InOut).start();
}

const clock = new Clock();
let prevTime = 0;

function animate(renderer, timestamp, threejsDrawing, uiState, camera) {
    // timestamp is already in ms
    if (prevTime === 0) prevTime = timestamp;

    if (timestamp - prevTime > 10000) {
        prevTime = timestamp;
        const meshes = threejsDrawing.data.animatableMeshes || [];
        animateStretchingMeshes(meshes);
    }
}

function drawSkibidi(scene, threejsDrawing) {
    // Draw the lights
    drawBasicLights(scene, threejsDrawing);

    // Draw the models
    drawMale07(scene, threejsDrawing);
    drawToilet(scene, threejsDrawing);

    drawSun(scene, threejsDrawing);
}

const skibidiDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawSkibidi, 'dataSrc': null}
    ],
    'uiState': null,
    //'eventListeners': eventListeners,
    'eventListeners': {},
    'animationCallback': animate,
    'data': {
    }
}


export { skibidiDrawing };
