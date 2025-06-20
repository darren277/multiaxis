import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

import { onAdventureKeyDown, onClick } from './interactions'
import { createCaptionedItem, Item } from './createItems'
import { drawAdventureElements } from './styleDefs'
import { precomputeBackgroundPlanes, goToStep } from './helpers'

import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { assert, debugLog } from '../../utils/assertUtils'
import { EventListenerContext } from '../../utils/addListeners'

type LabelObject = CSS3DObject | HTMLDivElement

let currentViewIndex = 0

const vector = new THREE.Vector3() // reuse this

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
export function updateLabelPosition(
    anchor:
        | THREE.Object3D
        | THREE.Vector3
        | { x: number; y: number; z: number },
    labelEl: HTMLElement,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    yOffset = -1.8,
) {
    /* ---------------------------------------------------------------
     * 1.  Resolve a Vector3
     * ------------------------------------------------------------- */
    let pos
    if (anchor && anchor instanceof THREE.Object3D) {
        // Real Three.js object
        pos = anchor.position.clone()
    } else if (anchor && anchor instanceof THREE.Vector3) {
        // Already a Vector3
        pos = anchor.clone()
    } else if (anchor && 'x' in anchor && 'y' in anchor && 'z' in anchor) {
        // Plain {x,y,z}
        pos = new THREE.Vector3(anchor.x, anchor.y, anchor.z)
    } else {
        console.warn('updateLabelPosition: invalid anchor', anchor)
        return
    }

    pos.y += yOffset // vertical offset (world units)

    /* ---------------------------------------------------------------
     * 2.  Project to NDC and then to screen space
     * ------------------------------------------------------------- */
    const projected = pos.project(camera)

    const w = renderer.domElement.clientWidth
    const h = renderer.domElement.clientHeight

    const screenX = (projected.x * 0.5 + 0.5) * w
    const screenY = (1 - (projected.y * 0.5 + 0.5)) * h

    /* ---------------------------------------------------------------
     * 3.  Move / toggle the label element
     * ------------------------------------------------------------- */
    //const visible = projected.z < 1 && projected.z > -1;   // in front of camera
    const isVisible = projected.z < 1

    labelEl.style.left = `${screenX}px`
    labelEl.style.top = `${screenY}px`

    //labelEl.style.transform = `translate(-50%, -50%) translate(${screenX}px,${screenY}px)`;
    labelEl.style.display = isVisible ? 'block' : 'none'
}

// --- NEW ZOOM CONTROL ---
// This is the single value you can tweak to adjust the camera distance.
// 1.0 = default distance
// 1.5 = 50% further away (zoomed out)
// 0.75 = 25% closer (zoomed in)
//const OVERALL_ZOOM_MULTIPLIER = 1.0;
const OVERALL_ZOOM_MULTIPLIER = 1.5

// These constants now define the BASE camera offset before the multiplier is applied.
const BASE_X_OFFSET = 0
const BASE_Y_OFFSET = 0
const BASE_Z_OFFSET = 8 // The neutral distance, which we will scale.

const Y_FACTOR = 0 // This adjusts the look-at point's height, not zoom.

export function vantagePointForItem(item: Item): {
    position: THREE.Vector3
    lookAt: THREE.Vector3
} {
    const itemPos = new THREE.Vector3(
        item.position.x,
        item.position.y + Y_FACTOR,
        item.position.z,
    )

    // Create a vector for the base camera offset
    const baseOffset = new THREE.Vector3(
        BASE_X_OFFSET,
        BASE_Y_OFFSET,
        BASE_Z_OFFSET,
    )

    // Scale the offset by our multiplier to get the final offset
    const finalOffset = baseOffset
        .clone()
        .multiplyScalar(OVERALL_ZOOM_MULTIPLIER)

    // Add the final, scaled offset to the item's position to get the camera position
    const cameraPos = itemPos.clone().add(finalOffset)

    return { position: cameraPos, lookAt: itemPos }
}

export type PhotoEntry = {
    mesh: THREE.Mesh | null
    labelObject: THREE.Object3D | any
    item: Item
}

export type AdventureStep = {
    id: string
    camera: { position: THREE.Vector3; lookAt: THREE.Vector3 }
    text: string
    choices: Record<string, string> | null
}

// ---------------------------------------------------------------------------
// 1 · buildPhotoEntries  →  THREE‑related side effects only
// ---------------------------------------------------------------------------
// const allPhotoEntries: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap> | null; labelObject: any; item: { id: string; image?: string; video?: string; caption: string; position: { x: number; y: number; z: number; }; customClasses?: string; dataAttributes?: { [key: string]: string; }; }; }[] = [];
export function buildPhotoEntries(
    scene: THREE.Scene,
    items: Item[],
    worldWidth: number,
    worldHeight: number,
    css3DRenderer?: any,
    css3DScene?: THREE.Scene,
): PhotoEntry[] {
    const entries: PhotoEntry[] = []

    items.forEach((item) => {
        const isVideo = Boolean(item.video?.trim())
        const entry = createCaptionedItem(
            scene,
            item,
            isVideo,
            worldWidth,
            worldHeight,
            true /* use3dRenderer */,
        )

        assert(entry, `Failed to create entry for item ${item.id}`)

        if (entry.mesh) scene.add(entry.mesh)

        if (css3DRenderer && css3DScene) {
            /*
            Argument of type 'CSS3DObject | HTMLDivElement' is not assignable to parameter of type 'Object3D<Object3DEventMap>'.
            Type 'HTMLDivElement' is missing the following properties from type 'Object3D<Object3DEventMap>': isObject3D, uuid, name, type, and 66 more.
            */
            if (entry.labelObject instanceof THREE.Object3D) {
                console.log(
                    '-=-=-=-=-=-=-=- Adding labelObject to CSS3DScene:',
                    entry.labelObject,
                )
                css3DScene.add(entry.labelObject)
                // TODO: We're doing this twice for debugging purposes...
                css3DRenderer.scene.add(entry.labelObject)
            } else {
                console.warn(
                    '!?!?!?!?!?!?!?!?!?! Expected labelObject to be a CSS3DObject or HTMLDivElement, but got:',
                    entry.labelObject,
                )
            }
        } else if (entry.labelObject instanceof THREE.Object3D) {
            console.log(
                '!!!!-=-=-=-=-=-=-=- Adding labelObject to scene:',
                entry.labelObject,
            )
            scene.add(entry.labelObject)
        } else {
            console.warn(
                ';;;;;;;;;;; Expected labelObject to be a THREE.Object3D, but got:',
                entry.labelObject,
            )
        }

        entries.push(entry)
    })

    debugLog('photoEntries', entries)
    return entries
}

// ---------------------------------------------------------------------------
// 2 · buildAdventureSteps  →  pure data construction
// ---------------------------------------------------------------------------
export function buildAdventureSteps(
    items: Item[],
): Record<string, AdventureStep> {
    const steps: Record<string, AdventureStep> = {}

    items.forEach((item) => {
        const vantage = vantagePointForItem(item)
        steps[item.id] = {
            id: item.id,
            camera: { position: vantage.position, lookAt: vantage.lookAt },
            text: item.caption,
            choices: Array.isArray(item.choices)
                ? Object.fromEntries(
                      item.choices.map((choice: string, idx: number) => [
                          String(idx),
                          choice,
                      ]),
                  )
                : (item.choices ?? null),
        }
    })

    debugLog('adventureSteps-initial', steps)
    return steps
}

// ---------------------------------------------------------------------------
// 3 · linkStepsLinear  →  mutates the step map if needed
// ---------------------------------------------------------------------------
export function linkStepsLinear(steps: Record<string, AdventureStep>): void {
    const ids = Object.keys(steps)
    ids.forEach((id, idx) => {
        if (steps[id].choices) return // already linked manually
        const next = ids[(idx + 1) % ids.length]
        const prev = ids[(idx - 1 + ids.length) % ids.length]

        steps[id].choices = { left: prev, right: next }
        debugLog('linkSteps', { from: id, left: prev, right: next })
    })
}

// ---------------------------------------------------------------------------
// Orchestrator  (what callers will use)
// ---------------------------------------------------------------------------
export function buildSceneItems(
    scene: THREE.Scene,
    sceneItems: Item[],
    worldWidth = 4,
    worldHeight = 3,
    css3DRenderer: any = null,
    css3DScene: THREE.Scene | undefined = undefined,
) {
    // 1. meshes + labels
    const allPhotoEntries = buildPhotoEntries(
        scene,
        sceneItems,
        worldWidth,
        worldHeight,
        css3DRenderer,
        css3DScene,
    )

    // 2. convert step objects
    const adventureSteps = buildAdventureSteps(sceneItems)

    // 3. default linear links (mutates in place)
    linkStepsLinear(adventureSteps)

    return { adventureSteps, allPhotoEntries }
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

export function drawMassiveBackdrop(scene: THREE.Scene) {
    const bgLoader = new THREE.TextureLoader()

    const position = [0.0, 0.0, -20.0]

    const geo = new THREE.PlaneGeometry(500, 500)
    const mat = new THREE.MeshBasicMaterial({
        map: bgLoader.load('textures/8k_stars.jpg'),
        depthWrite: false, // so it never occludes your slides
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(position[0], position[1], position[2])

    // initially invisible
    mesh.visible = false

    scene.add(mesh)
}

// labelContainerAttrs = {position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1'};
// labelContainerId = 'labelContainer'
// labelContainerTagName = 'div'

function constructElement(
    document: Document,
    tagName: string,
    id: string,
    attrs: { [key: string]: string },
) {
    const element = document.createElement(tagName)
    element.id = id
    for (const [key, value] of Object.entries(attrs)) {
        ;(element.style as any)[key as any] = value
    }
    return element
}

export async function drawAdventure(
    scene: THREE.Scene,
    data: any,
    threejsDrawing: any,
) {
    const use3DRenderer = !!threejsDrawing.data.use3DRenderer
    const css3DRenderer = use3DRenderer
        ? threejsDrawing.data.css3DRenderer
        : null
    const css3DScene = use3DRenderer ? threejsDrawing.data.css3DScene : null
    const { adventureSteps, allPhotoEntries } = buildSceneItems(
        scene,
        data.sceneItems,
        threejsDrawing.data.worldWidth,
        threejsDrawing.data.worldHeight,
        css3DRenderer,
        css3DScene,
    )

    // build data.otherItems...
    const otherItems = data.otherItems.map((item: Item) => {
        // TODO: Add a mechanism to render the other items with relative positions, and toggle their visibility so that only when they are in the viewport, they are rendered...
        // This means that if `item.visibleOn` == `['allSlides']`, then you will have to iterate over every regular slide and define the position of the item relative to the slide.
        console.log('creating other item', item)
        const isVideo = item.video && item.video !== ''
        //const use3dRenderer = false;
        const entry = createCaptionedItem(
            scene,
            item,
            isVideo || false,
            threejsDrawing.data.worldWidth,
            threejsDrawing.data.worldHeight,
            use3DRenderer,
        )
        if (!entry) {
            console.warn('Failed to create entry for other item:', item)
            return null // Skip this item if creation failed
        }
        const { mesh, labelObject } = entry
        console.log('other item', mesh, labelObject)
        // Mesh gets added inside of function: scene.add(mesh);
        if (use3DRenderer && css3DRenderer) {
            console.log('-------- Adding labelObject to CSS3DRenderer scene')
            threejsDrawing.data.css3DScene.add(labelObject)
        } else {
            if (css3DRenderer) {
                css3DRenderer.scene.add(entry.labelObject)
            } else if (entry.labelObject instanceof THREE.Object3D) {
                scene.add(entry.labelObject) // now safely typed
            }
        }
        return { mesh, labelObject, item }
    })

    // TODO: draw data.otherItems...

    threejsDrawing.data.adventureSteps = adventureSteps
    threejsDrawing.data.allPhotoEntries = allPhotoEntries
    threejsDrawing.data.otherItems = otherItems

    //threejsDrawing.data.currentStepId = `view_${data.sceneItems[0].id}`;
    const firstStepId = data.sceneItems[0].id
    threejsDrawing.data.currentStepId = firstStepId

    // Set the initial camera position and lookAt to match the first slide perfectly.
    // This ensures the view is "straight on" from the very beginning, overriding any defaults.
    const camera = threejsDrawing.data.camera
    const firstStep = adventureSteps[firstStepId]
    if (camera && firstStep) {
        camera.position.copy(firstStep.camera.position)
        camera.lookAt(firstStep.camera.lookAt)
        // If OrbitControls are in use, its target must also be updated.
        if (threejsDrawing.data.controls) {
            threejsDrawing.data.controls.target.copy(firstStep.camera.lookAt)
            threejsDrawing.data.controls.update()
        }
    }

    // Draw ambient light...
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    // Draw directional light...
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 1, 0)
    scene.add(directionalLight)

    precomputeBackgroundPlanes(
        scene,
        threejsDrawing,
        threejsDrawing.data.renderer,
    )

    // Draw a massive backdrop
    drawMassiveBackdrop(scene)
}

const adventureDrawing = {
    sceneElements: drawAdventureElements,
    drawFuncs: [
        // NOTE: var data_sources = document.getElementsByName('datasrc')
        // This whole thing was WAY overcomplicating it...
        // We will define the data sources right here instead.
        { func: drawAdventure, dataSrc: 'adventure1', dataType: 'json' },
    ],
    eventListeners: {
        keydown: (e: KeyboardEvent, other: any) => {
            // Handle keydown events for the adventure
            //{camera, event, adventureSteps, controls}
            const { camera, data, controls } = other
            const { adventureSteps, currentStepId } = data
            const tweenGroup = data.tweenGroup as TWEEN.Group
            // `currentStepId`: Kinda messy like this but it works for now.
            // TODO: `uiState` and `data` should probably be different entities as one is mutable and the other is not.
            // Not super important, though.
            // NOTE ON THE ABOVE: I've started using `data` as both so for the sake of decluttering, we are now getting rid of `uiState` altogether.

            e.preventDefault()

            // COMMENT OUT FOLLOWING LINE FOR DEBUG VIA CLICK CONTROL HELPER...
            const nextStepId = onAdventureKeyDown(
                tweenGroup,
                camera,
                e,
                adventureSteps,
                controls,
                currentStepId,
            )
            if (!nextStepId) return
            data.currentStepId = nextStepId
        },
        click: (e: MouseEvent, other: EventListenerContext) => {
            const { renderer, camera, scene, data, controls } = other
            onClick(scene, renderer, camera, e)

            const { tweenGroup } = data

            const label =
                e.target && (e.target as Element).closest
                    ? (e.target as Element).closest(
                          '.caption-label-3d, .label-child',
                      )
                    : null

            if (!label) return // clicked outside of a label

            // Always resolve the root label (in case we clicked on child)
            const rootLabel = label.classList.contains('caption-label-3d')
                ? label
                : label.closest('.caption-label-3d')

            if (!rootLabel || !(rootLabel as HTMLElement).dataset.direction)
                return

            const direction = (rootLabel as HTMLElement).dataset.direction

            const stepData = data.adventureSteps[data.currentStepId]
            if (!stepData || !stepData.choices) return

            if (typeof direction === 'undefined') return
            const nextStepId =
                stepData.choices[direction as keyof typeof stepData.choices]
            if (!nextStepId) return

            data.currentStepId = nextStepId
            goToStep(
                tweenGroup,
                camera,
                nextStepId,
                data.adventureSteps,
                controls,
            )
        },
    },
    animationCallback: (
        renderer: THREE.WebGLRenderer,
        timestamp: number,
        threejsDrawing: any,
        camera: THREE.Camera,
    ) => {
        const { bgMeshes, currentStepId } = threejsDrawing.data
        if (bgMeshes) {
            // show only the current slide’s background
            Object.entries(bgMeshes).forEach(([slideId, mesh]) => {
                ;(mesh as THREE.Mesh).visible = slideId === currentStepId
            })
        }

        // Update label positions
        if (!threejsDrawing.data.allPhotoEntries) return
        if (threejsDrawing.data.use3DRenderer) return
        threejsDrawing.data.allPhotoEntries.forEach(
            ({
                mesh,
                labelObject,
                item,
            }: {
                mesh: THREE.Mesh<
                    THREE.PlaneGeometry,
                    THREE.MeshBasicMaterial,
                    THREE.Object3DEventMap
                > | null
                labelObject: any
                item: {
                    id: string
                    image?: string
                    video?: string
                    caption: string
                    position: { x: number; y: number; z: number }
                    customClasses?: string
                    dataAttributes?: { [key: string]: string }
                }
            }) => {
                let anchor, labelEl
                anchor = mesh || item.position
                if (labelObject.element) {
                    labelEl = labelObject.element
                } else {
                    labelEl = labelObject
                }
                updateLabelPosition(anchor, labelEl, camera, renderer)
            },
        )
        // Update other items
        if (!threejsDrawing.data.otherItems) return
        threejsDrawing.data.otherItems.forEach(
            ({
                mesh,
                labelObject,
                item,
            }: {
                mesh: THREE.Mesh<
                    THREE.PlaneGeometry,
                    THREE.MeshBasicMaterial,
                    THREE.Object3DEventMap
                > | null
                labelObject: any
                item: {
                    id: string
                    image?: string
                    video?: string
                    caption: string
                    position: { x: number; y: number; z: number }
                    customClasses?: string
                    dataAttributes?: { [key: string]: string }
                }
            }) => {
                let anchor, labelEl
                anchor = mesh || item.position
                if (labelObject.element) {
                    labelEl = labelObject.element
                } else {
                    labelEl = labelObject
                }
                updateLabelPosition(anchor, labelEl, camera, renderer)
            },
        )
    },
    data: {
        adventureSteps: null,
        allPhotoEntries: null,
        otherItems: null,
        currentStepId: null,
        use3DRenderer: true,
    },
    sceneConfig: {
        controller: 'none',
        // when debugging...
        //'controller': 'orbital','
        cssRendererEnabled: 'DUAL',
        // looking slightly higher up...
        //'lookAt': new THREE.Vector3(0, 0, 0),
    },
}

export { adventureDrawing }
