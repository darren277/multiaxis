import * as THREE from 'three';

import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';
import { ThreeJSDrawing } from '../../threejsDrawing';

const clock = new THREE.Clock();

let mixer: THREE.AnimationMixer | null = null;

const loader = new BVHLoader();


function drawBvh(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing, renderer: THREE.WebGLRenderer) {
    loader.load('models/bvh/pirouette.bvh', function (result: { skeleton: THREE.Skeleton; clip: THREE.AnimationClip }) {
        const skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);

        scene.add(result.skeleton.bones[0]);
        scene.add(skeletonHelper);

        mixer = new THREE.AnimationMixer(result.skeleton.bones[0]);
        mixer.clipAction(result.clip).play();
    });
    scene.add(new THREE.GridHelper(400, 10));
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
}