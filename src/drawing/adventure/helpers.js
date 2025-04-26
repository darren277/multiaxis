import {Tween, Easing} from 'tween'


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
           goToStep(camera, stepData.autoNext.step, adventureSteps, controls, uiState);
        }, stepData.autoNext.delay);
    }

    return stepId;
}

export { goToStep };
