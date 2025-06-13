import { Raycaster, Vector2 } from 'three';
import { goToStep } from './helpers.js';

const raycaster = new Raycaster();
const mouse = new Vector2();

// Event listeners...
function onAdventureKeyDown_BIDIRECTIONAL_ONLY(camera, event, adventureSteps, controls, currentStepId) {
    const stepData = adventureSteps[currentStepId];
    if (!stepData) return;

    if (event.key === "ArrowLeft") {
        const nextStep = stepData.choices.left;
        if (nextStep) return goToStep(camera, nextStep, adventureSteps, controls);
    }
    else if (event.key === "ArrowRight") {
        const nextStep = stepData.choices.right;
        if (nextStep) return goToStep(camera, nextStep, adventureSteps, controls);
    } else if (event.key === "DownArrow") {
        console.log("Go back (not yet implemented).");
    }
}


function onAdventureKeyDown(camera, event, adventureSteps, controls, currentStepId) {
    // In this case, UpArrow is "next", DownArrow is "previous", and LeftArrow and RightArrow are specifically defined for each step.
    const stepData = adventureSteps[currentStepId];
    if (!stepData) return;

    let nextStep;
    if (event.key === "ArrowLeft") {
        nextStep = stepData.choices.left;
    } else if (event.key === "ArrowRight") {
        nextStep = stepData.choices.right;
    } else if (event.key === "ArrowDown") {
        nextStep = stepData.choices.down;
    } else if (event.key === "ArrowUp") {
        nextStep = stepData.choices.up;
    }
    if (nextStep) return goToStep(camera, nextStep, adventureSteps, controls);
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
