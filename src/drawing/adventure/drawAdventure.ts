import * as THREE from 'three'; // for any references you still need
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import {onAdventureKeyDown, onClick} from './interactions.js';
import {createCaptionedItem} from './createItems.js';
import {drawAdventureElements} from './styleDefs.js';
import { precomputeBackgroundPlanes, goToStep } from './helpers.js';

let currentViewIndex = 0;


const vector = new THREE.Vector3(); // reuse this

/**
 * Re‑positions a DOM label so it sits under a mesh **or** an arbitrary world‑space point.
 *
 * @param {THREE.Object3D|THREE.Vector3|{x:number,y:number,z:number}} anchor
 *        Either the object you want to track, OR just its position.
 * @param {HTMLElement} labelEl   The DOM element to move.
 * @param {THREE.Camera} camera   Scene camera.
 * @param {THREE.WebGLRenderer} renderer
 * @param {number} yOffset        How far (world units) below the anchor to show the label.  Negative = downward.
 */
function updateLabelPosition(anchor: THREE.Object3D | THREE.Vector3 | { x: number, y: number, z: number }, labelEl: HTMLElement, camera: THREE.Camera, renderer: THREE.WebGLRenderer, yOffset = -1.8) {
    /* ---------------------------------------------------------------
    * 1.  Resolve a Vector3
    * ------------------------------------------------------------- */
    let pos;
    if (anchor && anchor instanceof THREE.Object3D) {
        // Real Three.js object
        pos = anchor.position.clone();
    } else if (anchor && anchor instanceof THREE.Vector3) {
        // Already a Vector3
        pos = anchor.clone();
    } else if (anchor && 'x' in anchor && 'y' in anchor && 'z' in anchor) {
        // Plain {x,y,z}
        pos = new THREE.Vector3(anchor.x, anchor.y, anchor.z);
    } else {
        console.warn('updateLabelPosition: invalid anchor', anchor);
        return;
    }

    pos.y += yOffset;                 // vertical offset (world units)

    /* ---------------------------------------------------------------
    * 2.  Project to NDC and then to screen space
    * ------------------------------------------------------------- */
    const projected = pos.project(camera);

    const w  = renderer.domElement.clientWidth;
    const h  = renderer.domElement.clientHeight;

    const screenX =  (projected.x * 0.5 + 0.5) * w;
    const screenY =  (1 - (projected.y * 0.5 + 0.5)) * h;

    /* ---------------------------------------------------------------
    * 3.  Move / toggle the label element
    * ------------------------------------------------------------- */
    //const visible = projected.z < 1 && projected.z > -1;   // in front of camera
    const isVisible = projected.z < 1;

    labelEl.style.left = `${screenX}px`;
    labelEl.style.top = `${screenY}px`;

    //labelEl.style.transform = `translate(-50%, -50%) translate(${screenX}px,${screenY}px)`;
    labelEl.style.display   = isVisible ? 'block' : 'none';
}


const X = 0;
//const X = 12;

const Y = 0;
//const Y = -12;

//const Z = 6;
const Z = 6; // 6 units in front of the item, along the negative Z axis

const Y_FACTOR = 0; // Adjust this factor to position the camera above the item

function vantagePointForItem(item: Item): {position: THREE.Vector3, lookAt: THREE.Vector3} {
    // Where the item is
    const itemPos = new THREE.Vector3(item.position.x, item.position.y + Y_FACTOR, item.position.z);

    console.log("Vantage point for item:", item.id, "at position", itemPos);

    // Define a small offset so the camera is in front of the plane
    // For example, 6 units “in front” along the negative Z axis
    const offset = new THREE.Vector3(X, Y, Z);

    // We'll assume the plane faces the camera’s negative Z by default
    // So the camera is itemPos + offset
    const cameraPos = itemPos.clone().add(offset);

    // The camera will look directly at the item
    return {position: cameraPos, lookAt: itemPos};
}



function buildSceneItems(scene: THREE.Scene, sceneItems: Item[], worldWidth: number = 4, worldHeight: number = 3, css3DRenderer: any = null) {
    // Where allPhotoEntries is your array of { mesh, labelEl, item } returned from createCaptionedPhoto.

    const allPhotoEntries: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap> | null; labelObject: any; item: { id: string; image?: string; video?: string; caption: string; position: { x: number; y: number; z: number; }; customClasses?: string; dataAttributes?: { [key: string]: string; }; }; }[] = [];

    // Build photo meshes
    sceneItems.forEach((item) => {
        let entry;
        const isVideo = item.video && item.video !== "";
        const use3dRenderer = true;
        entry = createCaptionedItem(scene, item, isVideo, worldWidth, worldHeight, use3dRenderer);
        if (!entry) {
            console.warn('Failed to create entry for item:', item);
            return; // Skip this item if creation failed
        }
        if (entry.mesh) scene.add(entry.mesh);
        if (css3DRenderer) {
            css3DRenderer.scene.add(entry.labelObject);
        } else {
            scene.add(entry.labelObject);
        }
        allPhotoEntries.push(entry);
    });

    // Generate steps
    const adventureSteps: { [key: string]: any } = {};
    sceneItems.forEach((item, index) => {
        const vantage = vantagePointForItem(item);
        //const stepId = `view_${item.id}`;
        const stepId = item.id;

        adventureSteps[stepId] = {
            id: stepId,
            camera: {
                position: vantage.position,
                lookAt: vantage.lookAt,
            },
            text: item.caption,
            choices: item.choices || null, // Use item.choices if it exists
        };
    });

    // Link them in a linear chain (but only IF the step doesn't already have predefined choices).
    const stepIds = Object.keys(adventureSteps);
    console.log("Step IDs:", stepIds);
    for (let i = 0; i < stepIds.length; i++) {
        const currentId = stepIds[i];
        if (!adventureSteps[currentId].choices) {
            const nextId = stepIds[(i + 1) % stepIds.length]; // cyclical
            const prevId = stepIds[(i - 1 + stepIds.length) % stepIds.length];
            adventureSteps[currentId].choices = { left: prevId, right: nextId };
            console.log("Linking steps:", currentId, "->", nextId, "and", prevId);
        }
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


function drawMassiveBackdrop(scene: THREE.Scene) {
    const bgLoader = new THREE.TextureLoader();

    const position = [0.0, 0.0, -20.0];

    const geo  = new THREE.PlaneGeometry(500, 500);
    const mat  = new THREE.MeshBasicMaterial({
        map: bgLoader.load("textures/8k_stars.jpg"),
        depthWrite: false,    // so it never occludes your slides
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position[0], position[1], position[2]);

    // initially invisible
    mesh.visible = false;

    scene.add(mesh);
}


// labelContainerAttrs = {position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1'};
// labelContainerId = 'labelContainer'
// labelContainerTagName = 'div'

function constructElement(document: Document, tagName: string, id: string, attrs: { [key: string]: string }) {
    const element = document.createElement(tagName);
    element.id = id;
    for (const [key, value] of Object.entries(attrs)) {
        (element.style as any)[key as any] = value;
    }
    return element;
}


async function drawAdventure(scene: THREE.Scene, data: any, threejsDrawing: any) {
    const use3DRenderer = !!threejsDrawing.data.use3DRenderer;
    const css3DRenderer = use3DRenderer ? threejsDrawing.data.css3DRenderer : null;
    const {adventureSteps, allPhotoEntries} = buildSceneItems(scene, data.sceneItems, threejsDrawing.data.worldWidth, threejsDrawing.data.worldHeight, css3DRenderer);

    // build data.otherItems...
    const otherItems = data.otherItems.map((item: Item) => {
        // TODO: Add a mechanism to render the other items with relative positions, and toggle their visibility so that only when they are in the viewport, they are rendered...
        // This means that if `item.visibleOn` == `['allSlides']`, then you will have to iterate over every regular slide and define the position of the item relative to the slide.
        console.log('creating other item', item);
        const isVideo = item.video && item.video !== "";
        //const use3dRenderer = false;
        const entry = createCaptionedItem(scene, item, isVideo, threejsDrawing.data.worldWidth, threejsDrawing.data.worldHeight, use3DRenderer);
        if (!entry) {
            console.warn('Failed to create entry for other item:', item);
            return null; // Skip this item if creation failed
        }
        const { mesh, labelObject } = entry;
        console.log('other item', mesh, labelObject);
        // Mesh gets added inside of function: scene.add(mesh);
        if (use3DRenderer && css3DRenderer) {
            console.log('-------- Adding labelObject to CSS3DRenderer scene');
            threejsDrawing.data.css3DRenderer.scene.add(labelObject);
        } else {
            scene.add(labelObject);
        }
        return { mesh, labelObject, item };
    });

    // TODO: draw data.otherItems...

    threejsDrawing.data.adventureSteps = adventureSteps;
    threejsDrawing.data.allPhotoEntries = allPhotoEntries;
    threejsDrawing.data.otherItems = otherItems;

    //threejsDrawing.data.currentStepId = `view_${data.sceneItems[0].id}`;
    threejsDrawing.data.currentStepId = data.sceneItems[0].id;

    // Draw ambient light...
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    // Draw directional light...
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    precomputeBackgroundPlanes(scene, threejsDrawing, threejsDrawing.data.renderer);

    // Draw a massive backdrop
    drawMassiveBackdrop(scene);
}

const adventureDrawing = {
    'sceneElements': drawAdventureElements,
    'drawFuncs': [
        // NOTE: var data_sources = document.getElementsByName('datasrc')
        // This whole thing was WAY overcomplicating it...
        // We will define the data sources right here instead.
        {'func': drawAdventure, 'dataSrc': 'adventure1', 'dataType': 'json'}
    ],
    'eventListeners': {
        'keydown': (e: KeyboardEvent, other: any) => {
            // Handle keydown events for the adventure
            //{camera, event, adventureSteps, controls}
            const {camera, data, controls} = other;
            const {adventureSteps, currentStepId} = data;
            // `currentStepId`: Kinda messy like this but it works for now.
            // TODO: `uiState` and `data` should probably be different entities as one is mutable and the other is not.
            // Not super important, though.
            // NOTE ON THE ABOVE: I've started using `data` as both so for the sake of decluttering, we are now getting rid of `uiState` altogether.

            e.preventDefault();

            // COMMENT OUT FOLLOWING LINE FOR DEBUG VIA CLICK CONTROL HELPER...
            const nextStepId = onAdventureKeyDown(camera, e, adventureSteps, controls, currentStepId);
            if (!nextStepId) return;
            data.currentStepId = nextStepId;
        },
        'click': (e: MouseEvent, other: any) => {
            const {renderer, camera, scene, data, controls} = other;
            onClick(scene, renderer, camera, e);

            const label = e.target && (e.target as Element).closest
                ? (e.target as Element).closest('.caption-label-3d, .label-child')
                : null;

            if (!label) return; // clicked outside of a label

            // Always resolve the root label (in case we clicked on child)
            const rootLabel = label.classList.contains('caption-label-3d') ? label : label.closest('.caption-label-3d');

            if (!rootLabel || !(rootLabel as HTMLElement).dataset.direction) return;

            const direction = (rootLabel as HTMLElement).dataset.direction;

            const stepData = data.adventureSteps[data.currentStepId];
            if (!stepData || !stepData.choices) return;

            if (typeof direction === 'undefined') return;
            const nextStepId = stepData.choices[direction as keyof typeof stepData.choices];
            if (!nextStepId) return;

            data.currentStepId = nextStepId;
            goToStep(camera, nextStepId, data.adventureSteps, controls);
        },
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: any, camera: THREE.Camera) => {
        const { bgMeshes, currentStepId } = threejsDrawing.data;
        if (bgMeshes) {
            // show only the current slide’s background
            Object.entries(bgMeshes).forEach(([slideId, mesh]) => {
                (mesh as THREE.Mesh).visible = (slideId === currentStepId);
            });
        }

        // Update label positions
        if (!threejsDrawing.data.allPhotoEntries) return;
        if (threejsDrawing.data.use3DRenderer) return;
        threejsDrawing.data.allPhotoEntries.forEach((
            { mesh, labelObject, item }: { 
                mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap> | null, 
                labelObject: any, 
                item: { 
                    id: string; 
                    image?: string; 
                    video?: string; 
                    caption: string; 
                    position: { x: number; y: number; z: number; }; 
                    customClasses?: string; 
                    dataAttributes?: { [key: string]: string; }; 
                } 
            }
        ) => {
            let anchor, labelEl;
            anchor = mesh || item.position;
            if (labelObject.element) {
                labelEl = labelObject.element;
            } else {
                labelEl = labelObject;
            }
            updateLabelPosition(anchor, labelEl, camera, renderer);
        });
        // Update other items
        if (!threejsDrawing.data.otherItems) return;
        threejsDrawing.data.otherItems.forEach((
            { mesh, labelObject, item }: { 
                mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap> | null, 
                labelObject: any, 
                item: { 
                    id: string; 
                    image?: string; 
                    video?: string; 
                    caption: string; 
                    position: { x: number; y: number; z: number; }; 
                    customClasses?: string; 
                    dataAttributes?: { [key: string]: string; }; 
                } 
            }
        ) => {
            let anchor, labelEl;
            anchor = mesh || item.position;
            if (labelObject.element) {
                labelEl = labelObject.element;
            } else {
                labelEl = labelObject;
            }
            updateLabelPosition(anchor, labelEl, camera, renderer);
        });
    },
    'data': {
        'adventureSteps': null,
        'allPhotoEntries': null,
        'otherItems': null,
        'currentStepId': null,
        'use3DRenderer': true,
    },
    'sceneConfig': {
        'controller': 'none',
        // when debugging...
        //'controller': 'orbital','
        'cssRendererEnabled': 'DUAL',
        // looking slightly higher up...
        'lookAt': new THREE.Vector3(0, 1.5, 0),
    }
}

export { adventureDrawing };
