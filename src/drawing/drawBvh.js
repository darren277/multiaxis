import { Clock, SkeletonHelper, AnimationMixer, GridHelper } from 'three';

import { BVHLoader } from 'bvhloader';

const clock = new Clock();

let mixer;

const loader = new BVHLoader();


function drawBvh(scene, threejsDrawing) {
    loader.load('models/bvh/pirouette.bvh', function (result) {
        const skeletonHelper = new SkeletonHelper(result.skeleton.bones[0]);

        scene.add(result.skeleton.bones[0]);
        scene.add(skeletonHelper);

        mixer = new AnimationMixer(result.skeleton.bones[0]);
        mixer.clipAction(result.clip).play();
    });
    scene.add(new GridHelper(400, 10));
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
}