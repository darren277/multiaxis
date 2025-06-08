import {Tween, Easing} from 'tween'
import { PlaneGeometry, Mesh, MeshBasicMaterial, TextureLoader } from 'three';


function tweenCameraToView(camera, view, duration = 2000) {
    new Tween(camera.position)
        .to({ x: view.position.x, y: view.position.y, z: view.position.z }, duration)
        .easing(Easing.Quadratic.Out)
        .start();

    // For lookAt, you could keep a separate vector and tween that,
    // then in your render loop do camera.lookAt( thatVector ).
}

let autoNextTimeoutId = null;

// Function to set camera to a particular view
function goToStep(camera, stepId, adventureSteps, controls) {
    const stepData = adventureSteps[stepId];

    if (!stepData) {
        console.error("Invalid step:", stepId);
        return;
    }

    // Clear previous timeout
    if (autoNextTimeoutId) {
        clearTimeout(autoNextTimeoutId);
        autoNextTimeoutId = null;
    }

    // Move camera
    tweenCameraToView(camera, stepData.camera);
    camera.lookAt(stepData.camera.lookAt);

    // If using OrbitControls
    if (controls) {
        controls.target.copy(stepData.camera.lookAt);
        controls.update();
    }

    // If using OrbitControls, also update controls.target
    // controls.target.copy(stepData.camera.lookAt);
    // controls.update();

    // Update overlay text
    const overlayText = document.getElementById("overlayText");
    overlayText.innerHTML = stepData.text;

    // If the step has an autoNext property, schedule it
    if (stepData.autoNext) {
        autoNextTimeoutId = setTimeout(() => {
           goToStep(camera, stepData.autoNext.step, adventureSteps, controls);
        }, stepData.autoNext.delay);
    }

    return stepId;
}


function precomputeBackgroundPlanes(scene, threejsDrawing, renderer) {
    // assume computeBackgroundPlane(item.position, fov, aspect, camOffset, bgDistance)
    // returns { position:{x,y,z}, width, height }

    const bgLoader = new TextureLoader();
    const bgMeshes = {};

    if (!threejsDrawing.data || !threejsDrawing.data.allPhotoEntries) {
        console.warn("BRUH!@!!!! No photo entries found in threejsDrawing data.");
        return;
    }

    threejsDrawing.data.allPhotoEntries.forEach(({ item }) => {
        console.log("Processing item:", item.id, "with background image:", item.bg_img, item);
        if (!item.bg_img) return; // skip if no BG

//        const { position, width, height } = computeBackgroundPlane(
//            item.position,
//            threejsDrawing.data.camera.fov,
//            renderer.domElement.clientWidth / renderer.domElement.clientHeight,
//            /* camOffset= */ 6,
//            /* bgDistance= */ 10
//        );
        const position = item.bg_pos;

        const geo  = new PlaneGeometry(item.bg_width + 50, item.bg_height + 50);
        const mat  = new MeshBasicMaterial({
            map: bgLoader.load(item.bg_img),
            depthWrite: false,    // so it never occludes your slides
        });
        const mesh = new Mesh(geo, mat);
        mesh.position.set(position[0], position[1], position[2] - 25);

        // initially invisible
        mesh.visible = false;

        scene.add(mesh);
        console.log(`Added background mesh for item ${item.id} at position`, position);
        bgMeshes[item.id] = mesh;
    });

    threejsDrawing.data.bgMeshes = bgMeshes;
};

export { goToStep, precomputeBackgroundPlanes };
