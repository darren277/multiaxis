import { TextureLoader, Clock, Group, Object3D, ShaderMaterial, PlaneGeometry, Mesh, MeshBasicMaterial, CanvasTexture } from 'three';
import { GLTFLoader } from 'gltfloader';
import { drawBasicLights, drawSun } from './drawLights.js';
import { Tween, Easing } from 'tween';


const loader = new TextureLoader();

//const angryMouth = new Mesh(new PlaneGeometry(0.4, 0.2), new MeshBasicMaterial({map: loader.load('textures/mouth_open.png'), transparent: true}));

// angryMouth.position.set(0, 0.1, 0.25); // front of face
// yourHeadMesh.add(angryMouth); // stick it to the head
// new Tween(angryMouth.scale).to({ y: 1.5 }, 300).yoyo(true).repeat(1).start();


// Alternatively:
// Option B: Swap facial texture maps
// If your head model uses a texture, you can hot‑swap parts of it:
// headMesh.material.map = loader.load('textures/head_angry.png');
// If the mouth/eyes are on a separate UV region, you can animate the offset of a sprite sheet using material.map.offset.x.


async function loadGltfModel(data_src) {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync(`${data_src}`);
    return gltf;
}

const stretchUniform = { value: 3.0 };

const stretchyMaterial = new ShaderMaterial({
    uniforms: {
        stretch: stretchUniform
    },
    vertexShader: `
        uniform float stretch;
        void main() {
            vec3 p = position;
            if (p.z < 0.3) {
                p.z *= stretch;
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
    `,
    fragmentShader: `
        void main() {
            gl_FragColor = vec4(1.0); // white for now
        }
    `
});


const BODY = 'Object_2';

const LEFT_EYE = 'Object_4';
const HEAD = 'Object_5';

//const ANIMATABLE_PART = [LEFT_EYE, HEAD, 'Object_3', 'Object_6'];
const ANIMATABLE_NAMES = [LEFT_EYE, HEAD];

const originalTraverse = Object3D.prototype.traverse;


function drawMouth() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Optional: skin-tone background
    ctx.fillStyle = '#fce0bd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw triangle mouth
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(128, 160);     // bottom center
    ctx.lineTo(96, 192);      // left
    ctx.lineTo(160, 192);     // right
    ctx.closePath();
    ctx.fill();

    const mouthTexture = new CanvasTexture(canvas);
    mouthTexture.needsUpdate = true;

    return mouthTexture;
}


// Optional: Dynamic drawing updates
// You can redraw the canvas anytime and the texture will update live:
function drawAngryMouth(mouthTexture) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(128, 160);
    ctx.lineTo(96, 192);
    ctx.lineTo(160, 192);
    ctx.closePath();
    ctx.fill();

    mouthTexture.needsUpdate = true;
}

/*
Bonus: Combine Mouth and Eyes on Same Canvas

You could also use one canvas for the whole face and update eyes, brows, mouth, etc., in one go — kind of like an MS Paint Skibidi face generator.

Let me know if you want a mini face expression system built on this — with toggles like setExpression('angry'), setExpression('scream'), etc.
*/



async function drawMale07(scene, threejsDrawing) {
    const { scene: gltfScene } = await loadGltfModel('imagery/skibidi/male-07_v1.glb');

    // 1) Find the meshes you want to animate
    const animMeshes = [];
    gltfScene.traverse(node => {
        // exclude body from scene...
        if (node.name === BODY) {
            node.visible = false;
        }
        if (node.isMesh && ANIMATABLE_NAMES.includes(node.name)) {
            if (node.name === HEAD) {
                //node.material = stretchyMaterial; // replace with custom shader
                const originalMaterial = node.material;

                originalMaterial.onBeforeCompile = (shader) => {
                    // Inject your uniform
                    shader.uniforms.stretch = stretchUniform;

                    shader.vertexShader = `
                        uniform float stretch;
                        uniform float time;
                    ` + shader.vertexShader;

                    // Inject stretch logic into vertex shader
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        `
                            vec3 transformed = vec3(position);
                            if (position.z < 0.3) {
                                transformed.z *= stretch;
                            }
                            // WIP:
//                            if (position.y > 0.05 && position.y < 0.1 && position.z > 0.2) {
//                                transformed.z += sin(time * 10.0) * 0.05; // jiggle mouth
//                            }
                        `
                    );
                };

                // Make sure the material re-compiles
                originalMaterial.needsUpdate = true;
            }
            animMeshes.push(node);
        }
    });

    // 2) Store that array for the animation loop
    threejsDrawing.data.animatableMeshes = animMeshes;

    // 3) Add the GLTF into the scene normally
    scene.add(gltfScene);

    // 4) Set the position
    gltfScene.position.set(0, -1, 0);

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

function animateStretchingMeshes(camera, meshes) {
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
            stretchUniform.value = proxy.stretch;
        }
        position.needsUpdate = true;
        //yourModel.userData.shader.uniforms.stretch.value = proxy.stretch
        //mesh.userData.shader.uniforms.stretch.value = proxy.stretch;
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

    // Head wobble...
    const proxy1 = { ry: 0 };
    new Tween(proxy1).to({ ry: Math.PI / 64 }, 400).yoyo(true).repeat(2).onUpdate(() => mesh.rotation.y = proxy1.ry).start();

    // Sudden camera zoom...
    //new Tween(camera.position).to({ z: 2 }, 300).easing(Easing.Back.Out).yoyo(true).repeat(1).start();
}

function animateMouth(mouthPlane) {
    // Animate the expression
    //new Tween(mouthPlane.scale).to({ y: 1.5 }, 300).yoyo(true).repeat(2).start();

    // Or animate it mouth-opening-style:
    // squash
    new Tween(mouthPlane.scale).to({ y: 0.01 }, 200).yoyo(true).repeat(1).start();
}

const clock = new Clock();
let prevTime = 0;

function animate(renderer, timestamp, threejsDrawing, uiState, camera) {
    // timestamp is already in ms
    if (prevTime === 0) prevTime = timestamp;

    if (timestamp - prevTime > 3000) {
        prevTime = timestamp;
        const meshes = threejsDrawing.data.animatableMeshes || [];
        animateStretchingMeshes(camera, meshes);

        const mouthPlane = threejsDrawing.data.mouthPlane;
        animateMouth(mouthPlane);
    }
}

function drawSkibidi(scene, threejsDrawing) {
    // Draw the lights
    drawBasicLights(scene, threejsDrawing);

    // Draw the models
    drawMale07(scene, threejsDrawing);
    drawToilet(scene, threejsDrawing);

    drawSun(scene, threejsDrawing);

    const mouthTexture = drawMouth();
    // 0.4, 0.4
    //const mouthPlaneSize = 0.4;
    const mouthPlaneSize = 5.0;
    const mouthPlane = new Mesh(new PlaneGeometry(mouthPlaneSize, mouthPlaneSize), new MeshBasicMaterial({map: mouthTexture, transparent: true}));

    // Position it in front of the face
    //mouthPlane.position.set(0, 0.1, 0.25); // adjust as needed
    mouthPlane.position.set(10, 5, 5);
    // TODO: headMesh.add(mouthPlane);

    threejsDrawing.data.mouthPlane = mouthPlane;
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
