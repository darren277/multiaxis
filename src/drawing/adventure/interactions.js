import { Raycaster, Vector2 } from 'three';

const raycaster = new Raycaster();
const mouse = new Vector2();

// Event listeners...
function onAdventureKeyDown_BIDIRECTIONAL_ONLY(camera, event, adventureSteps, controls, uiState) {
    const stepData = adventureSteps[uiState.currentStepId];
    console.log("stepData", uiState.currentStepId, stepData, adventureSteps);
    if (!stepData) return;

    if (event.key === "ArrowLeft") {
        const nextStep = stepData.choices.left;
        if (nextStep) goToStep(camera, nextStep, adventureSteps, controls, uiState);
    }
    else if (event.key === "ArrowRight") {
        const nextStep = stepData.choices.right;
        if (nextStep) goToStep(camera, nextStep, adventureSteps, controls, uiState);
    } else if (event.key === "DownArrow") {
        console.log("Go back (not yet implemented).");
    }
}


function onAdventureKeyDown(camera, event, adventureSteps, controls, uiState) {
    // In this case, UpArrow is "next", DownArrow is "previous", and LeftArrow and RightArrow are specifically defined for each step.
    const stepData = adventureSteps[uiState.currentStepId];
    console.log('uiState', uiState);
    console.log("stepData", uiState.currentStepId, stepData, adventureSteps);
    if (!stepData) return;

    if (event.key === "ArrowLeft") {
        const nextStep = stepData.choices.left;
        if (nextStep) goToStep(camera, nextStep, adventureSteps, controls, uiState);
    }
    else if (event.key === "ArrowRight") {
        const nextStep = stepData.choices.right;
        if (nextStep) goToStep(camera, nextStep, adventureSteps, controls, uiState);
    } else if (event.key === "DownArrow") {
        console.log("Go back (not yet implemented).");
    }
}



function onClick(scene, renderer, camera, event) {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clicked = intersects[0].object;

        if (clicked.userData.videoElement) {
            const vid = clicked.userData.videoElement;

            if (vid.paused) {
                vid.play();
            } else {
                vid.pause();
            }
        }
    }
}


export {
    onClick,
    onAdventureKeyDown,
    onAdventureKeyDown_BIDIRECTIONAL_ONLY
}
