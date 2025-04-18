import { Vector3, AmbientLight, DirectionalLight } from 'three'; // for any references you still need
import { CSS3DObject } from 'css3drenderer';

import {onAdventureKeyDown, onClick} from './interactions.js';
import {createCaptionedItem} from './createItems.js';
import {drawAdventureElements} from './styleDefs.js';

let currentViewIndex = 0;


const vector = new Vector3(); // reuse this

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
    const itemPos = new Vector3(item.position.x, item.position.y, item.position.z);

    // Define a small offset so the camera is in front of the plane
    // For example, 6 units “in front” along the negative Z axis
    const offset = new Vector3(0, 0, 6);

    // We'll assume the plane faces the camera’s negative Z by default
    // So the camera is itemPos + offset
    const cameraPos = itemPos.clone().add(offset);

    // The camera will look directly at the item
    return {position: cameraPos, lookAt: itemPos};
}



function buildSceneItems(scene, sceneItems, worldWidth = 4, worldHeight = 3) {
    // Where allPhotoEntries is your array of { mesh, labelEl, item } returned from createCaptionedPhoto.

    const allPhotoEntries = [];

    // Build photo meshes
    sceneItems.forEach((item) => {
        let entry;
        const isVideo = item.video && item.video !== "";
        entry = createCaptionedItem(scene, item, isVideo, worldWidth, worldHeight);
        scene.add(entry.mesh);
        allPhotoEntries.push(entry);
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


function drawAdventure(scene, data, threejsDrawing) {
    const {adventureSteps, allPhotoEntries} = buildSceneItems(scene, data.sceneItems, threejsDrawing.data.worldWidth, threejsDrawing.data.worldHeight);

    // build data.otherItems...
    const otherItems = data.otherItems.map((item) => {
        console.log('creating other item', item);
        const isVideo = item.video && item.video !== "";
        const use3dRenderer = true;
        const { mesh, labelEl } = createCaptionedItem(scene, item, isVideo, threejsDrawing.data.worldWidth, threejsDrawing.data.worldHeight, use3dRenderer);
        scene.add(mesh);
        return { mesh, labelEl, item };
    });

    // TODO: draw data.otherItems...

    threejsDrawing.data.adventureSteps = adventureSteps;
    threejsDrawing.data.allPhotoEntries = allPhotoEntries;

    threejsDrawing.uiState.currentStepId = `view_${data.sceneItems[0].id}`;
    threejsDrawing.data.currentStepId = `view_${data.sceneItems[0].id}`;

    // Draw ambient light...
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    // Draw directional light...
    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
}

const adventureDrawing = {
    'sceneElements': drawAdventureElements,
    'drawFuncs': [
        // NOTE: var data_sources = document.getElementsByName('datasrc')
        // This whole thing was WAY overcomplicating it...
        // We will define the data sources right here instead.
        {'func': drawAdventure, 'dataSrc': 'adventure1', 'dataType': 'json'}
    ],
    'uiState': {
        'currentStepId': null
    },
    'eventListeners': {
        'keydown': (e, other) => {
            // Handle keydown events for the adventure
            //{camera, event, adventureSteps, controls, uiState}
            console.log('other', other);
            const {camera, data, controls, uiState} = other;
            console.log('uiState ---', uiState);
            const {adventureSteps, currentStepId} = data;
            // `currentStepId`: Kinda messy like this but it works for now.
            // TODO: `uiState` and `data` should probably be different entities as one is mutable and the other is not.
            // Not super important, though.

            // COMMENT OUT FOLLOWING TWO LINES FOR DEBUG VIA CLICK CONTROL HELPER...
            uiState.currentStepId = currentStepId;
            onAdventureKeyDown(camera, e, adventureSteps, controls, uiState);
        },
        'click': (e, other) => {
            const {renderer, camera, scene} = other;
            onClick(scene, renderer, camera, e);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        // Update label positions
        if (!threejsDrawing.data.allPhotoEntries) return;
        threejsDrawing.data.allPhotoEntries.forEach(({ mesh, labelEl }) => {
            updateLabelPosition(mesh, labelEl, camera, renderer);
        });
    },
    'data': {
        'adventureSteps': null,
        'allPhotoEntries': null,
    },
    'sceneConfig': {
        //'controller': 'none'
        // when debugging...
        'controller': 'orbital',
        'cssRenderer': true,
    }
}

export { adventureDrawing };
