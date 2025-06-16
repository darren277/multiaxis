import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { goToStep } from './helpers';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listeners...
function onAdventureKeyDown_BIDIRECTIONAL_ONLY(tweenGroup: TWEEN.Group, camera: THREE.Camera, event: KeyboardEvent, adventureSteps: { [key: string]: any }, controls: any, currentStepId: string) {
    const stepData = adventureSteps[currentStepId];
    if (!stepData) return;

    if (event.key === "ArrowLeft") {
        const nextStep = stepData.choices.left;
        if (nextStep) return goToStep(tweenGroup, camera, nextStep, adventureSteps, controls);
    }
    else if (event.key === "ArrowRight") {
        const nextStep = stepData.choices.right;
        if (nextStep) return goToStep(tweenGroup, camera, nextStep, adventureSteps, controls);
    } else if (event.key === "DownArrow") {
        console.log("Go back (not yet implemented).");
    }
}


function onAdventureKeyDown(tweenGroup: TWEEN.Group, camera: THREE.Camera, event: KeyboardEvent, adventureSteps: { [key: string]: any }, controls: any, currentStepId: string) {
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
    if (nextStep) return goToStep(tweenGroup, camera, nextStep, adventureSteps, controls);
}



function onClick(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera, event: MouseEvent) {
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
