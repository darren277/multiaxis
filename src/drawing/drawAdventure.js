import * as THREE from 'three'; // for any references you still need
import {Tween, Easing} from 'tween'

let currentViewIndex = 0;



// 1) SCENE_ITEMS, vantagePointForItem, createPhotoMesh
// 2) We'll generate ADVENTURE_STEPS from SCENE_ITEMS


function createPhotoMesh(item) {
    // Use TextureLoader to load the image
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(item.image);

    // Adjust geometry size as you like (width, height)
    const geometry = new THREE.PlaneGeometry(4, 3);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);

    // Position in 3D from item data
    mesh.position.set(item.position.x, item.position.y, item.position.z);

    // Optionally face the camera by default if you want (billboard effect):
    // mesh.lookAt(camera.position);

    mesh.name = item.id; // store ID

    return mesh;
}


function createCaptionedPhoto(scene, item) {
    const mesh = createPhotoMesh(item); // your mesh creation function
    scene.add(mesh);

    const labelEl = document.createElement('div');
    labelEl.className = 'caption-label' + item.customClasses;
    labelEl.innerHTML = item.caption; // HTML content allowed
    labelEl.style.position = 'absolute';
    labelEl.style.transform = 'translate(-50%, 0)';

    labelEl.style.color = 'black';

    labelEl.style.padding = '4px 8px';

    //labelEl.style.background = 'rgba(0,0,0,0.7)';
    // white background...
    labelEl.style.background = 'white';

    labelEl.style.fontFamily = 'sans-serif';
    labelEl.style.pointerEvents = 'none'; // allow clicks to pass through

    document.getElementById('labelContainer').appendChild(labelEl);

    return { mesh, labelEl, item };
}

const vector = new THREE.Vector3(); // reuse this

function updateLabelPosition(mesh, labelEl, camera, renderer, yOffset = -1.8) {
    const pos = mesh.position.clone();
    pos.y += yOffset; // shift downward

    // Project to normalized device coordinates
    const projected = pos.project(camera);

    // Convert to screen space within the renderer canvas
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;

    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (1 - (projected.y * 0.5 + 0.5)) * height;

    // Position the label
    labelEl.style.left = `${x}px`;
    labelEl.style.top = `${y}px`;

    // Optional: hide if behind camera
    const isVisible = projected.z < 1;
    labelEl.style.display = isVisible ? "block" : "none";
}



function vantagePointForItem(item) {
    // Where the item is
    const itemPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);

    // Define a small offset so the camera is in front of the plane
    // For example, 6 units “in front” along the negative Z axis
    const offset = new THREE.Vector3(0, 0, 6);

    // We'll assume the plane faces the camera’s negative Z by default
    // So the camera is itemPos + offset
    const cameraPos = itemPos.clone().add(offset);

    // The camera will look directly at the item
    return {position: cameraPos, lookAt: itemPos};
}



function buildSceneItems(scene, sceneItems) {
    // Where allPhotoEntries is your array of { mesh, labelEl, item } returned from createCaptionedPhoto.

    const allPhotoEntries = [];

    // Build photo meshes
    sceneItems.forEach((item) => {
        const photoEntry = createCaptionedPhoto(scene, item);
        scene.add(photoEntry.mesh);
        allPhotoEntries.push(photoEntry);
    });

    // Generate steps
    const adventureSteps = {};
    sceneItems.forEach((item, index) => {
        const vantage = vantagePointForItem(item);
        const stepId = `view_${item.id}`;

        adventureSteps[stepId] = {
            id: stepId,
            camera: {
                position: vantage.position,
                lookAt: vantage.lookAt,
            },
            text: item.caption,
            choices: {},
        };
    });

    // Link them in a linear chain
    const stepIds = Object.keys(adventureSteps);
    console.log("Step IDs:", stepIds);
    for (let i = 0; i < stepIds.length; i++) {
        const currentId = stepIds[i];
        const nextId = stepIds[(i + 1) % stepIds.length]; // cyclical
        const prevId = stepIds[(i - 1 + stepIds.length) % stepIds.length];
        adventureSteps[currentId].choices = { left: prevId, right: nextId };
        console.log("Linking steps:", currentId, "->", nextId, "and", prevId);
    }

    return {adventureSteps, allPhotoEntries};
}



/*
Summary & Extensions
    More Realistic Shelves & Books:
        Instead of just a single image, you can model multiple “book spines” as small boxes lined up on each shelf, each with its own texture or color or label.
    Click Interaction:
        Raycast from camera to detect which “book” you’re looking at, pop up metadata or a bigger preview.
    Dynamic Sorting or Positioning:
        If you want to rearrange bookcases or books by different dimensions (Dewey Decimal vs. category vs. rating), you can animate them into new positions in the 3D environment.
    Labels/Overlays:
        Use CSS2DRenderer or CSS3DRenderer (from Three.js examples) for text labels that don’t distort in 3D or to show additional info about each shelf.
*/



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
function goToStep(camera, stepId, adventureSteps, controls, uiState) {
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

    uiState.currentStepId = stepId;
    console.log("Current step:", stepId);

    // Move camera
    tweenCameraToView(camera, stepData.camera);
    camera.lookAt(stepData.camera.lookAt);

    // If using OrbitControls
    controls.target.copy(stepData.camera.lookAt);
    controls.update();

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
}

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



// labelContainerAttrs = {position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1'};
// labelContainerId = 'labelContainer'
// labelContainerTagName = 'div'

function constructElement(document, tagName, id, attrs) {
    const element = document.createElement(tagName);
    element.id = id;
    for (const [key, value] of Object.entries(attrs)) {
        element.style[key] = value;
    }
    return element;
}

// Usage (given an array of element definitions to construct)

const drawAdventureElements = [
    {
        tagName: 'div',
        id: 'labelContainer',
        className: '',
        attrs: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1'
        }
    },
    {
        tagName: 'div',
        id: 'overlayText',
        className: '',
        attrs: {
            position: 'absolute',
            top: '10px',
            left: '10px',
            color: '#fff',
            fontSize: '20px',
            pointerEvents: 'none'
        }
    }
]

export { goToStep, onAdventureKeyDown, buildSceneItems, updateLabelPosition, drawAdventureElements };
