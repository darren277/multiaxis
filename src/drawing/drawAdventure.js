import * as THREE from 'three'; // for any references you still need
import {Tween, Easing} from 'tween'
import { CSS3DObject } from 'css3drenderer';

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

function createVideoMesh(item, worldWidth, worldHeight) {
    // 1) Create an HTML video element
    const video = document.createElement('video');
    //video.src = 'path-to-video-file.mp4';
    video.src = 'textures/CleanSocialVideoSalesLetter.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.play();

    // 2) Create a texture from the video
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    // 3) Use that texture in a MeshBasicMaterial
    const geometry = new THREE.PlaneGeometry(4, 3);
    const material = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);

    const x = item.position.x;
    const y = item.position.y;
    const z = item.position.z;

    mesh.position.set(x, y, z);

    // 🔑 Store the video element for later
    mesh.userData.videoElement = video;

    return mesh;
}

function createVideoMeshOLD(item, worldWidth, worldHeight) {
    var div = document.createElement( 'div' );
    div.style.width = `${worldWidth}px`;
    div.style.height = `${worldHeight}px`;
    //div.style.backgroundColor = '#000';
    div.style.backgroundColor = 'lime';
    var iframe = document.createElement( 'iframe' );
    iframe.style.width = `${worldWidth}px`;
    iframe.style.height = `${worldHeight}px`;
    iframe.style.border = '0px';
    iframe.src = item.video;
    //iframe.src = 'https://www.darrenmackenzie.com'

    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;

    iframe.style.pointerEvents = 'auto';

    div.appendChild( iframe );
    var object = new CSS3DObject( div );

    object.position.set( item.position.x, item.position.y, item.position.z );
    //object.rotation.set( 0, Math.PI, 0 );

    object.name = item.id; // store ID

    window.debugObject = object;

    return object;
}

function create3DLabelWithAnimation(captionText, className) {
    // Outer DIV that CSS3DRenderer will transform in 3D space
    const outerDiv = document.createElement('div');
    // No special styles here; let Three.js apply its inline transform

    // Inner DIV that we animate with our bounce/pulse classes
    const labelEl = document.createElement('div');
    //labelEl.className = 'caption-label-3d bounce'; // for example
    labelEl.className = 'caption-label-3d ' + className; // for example
    //labelEl.textContent = captionText;
    labelEl.innerHTML = captionText;

    // Put the animated label inside the outer container
    outerDiv.appendChild(labelEl);

    // Now create the CSS3DObject from the outer container
    const labelObject = new CSS3DObject(outerDiv);

    // Optionally scale the entire label if it’s too big
    labelObject.scale.set(0.01, 0.01, 0.01);

    return labelObject;
}


function createCaptionedItem(scene, item, isVideo, worldWidth = null, worldHeight = null, use3dRenderer = false) {
    console.log('item', item);

    let mesh = null;

    // 1. Create Mesh
    if (!item.image || item.image !== 'NO_IMAGE') {
        if (isVideo) {
            mesh = createVideoMesh(item, worldWidth, worldHeight);
        } else {
            mesh = createPhotoMesh(item);
        }
        scene.add(mesh);
    }

    // 2) Build the caption
    const captionText = item.caption;
    const customClasses = item.customClasses || ''; // e.g. "bounce" or "pulse"

    // 2. Create label element
    const labelEl = document.createElement('div');

    labelEl.innerHTML = item.caption;
    labelEl.style.color = 'black';
    labelEl.style.padding = '4px 8px';
    labelEl.style.background = 'white';
    labelEl.style.fontFamily = 'sans-serif';

     if (use3dRenderer) {
        // -- 3D Caption with CSS3DRenderer --

        // Use the nested approach so animations don't conflict
        const labelObject = create3DLabelWithAnimation(captionText, customClasses);

        // Position the label slightly below the mesh (optional)
        const offsetY = -0.5;
        const position = item.position || { x: 0, y: 0, z: 0 };
        labelObject.position.set(position.x, position.y + offsetY, position.z);

        // Alternatively, if you want it to follow the mesh exactly:
        // labelObject.position.copy(mesh.position).add(new THREE.Vector3(0, offsetY, 0));

        scene.add(labelObject);

        return { mesh, labelObject, item }; // return the CSS3DObject
    } else {
        // -- 2D DOM Overlay --

        const labelEl = document.createElement('div');
        labelEl.className = 'caption-label ' + customClasses;
        labelEl.innerHTML = captionText;

        labelEl.style.position = 'absolute';
        labelEl.style.transform = 'translate(-50%, 0)';
        labelEl.style.pointerEvents = 'none';

        // You probably have a container for 2D overlays
        document.getElementById('labelContainer2d').appendChild(labelEl);

        return { mesh, labelEl, item }; // return the DOM element
    }
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
        id: 'labelContainer2d',
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
        id: 'overlayContainer3d',
        className: '',
        attrs: {
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    // Draw directional light...
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
