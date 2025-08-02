import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ThreeJSDrawing } from '../types'
import { drawBasicLights } from './reusables/drawLights'

// Extend the Window interface to include 'drawing'
declare global {
    interface Window {
        drawing: any
    }
}

function extractHierarchy(object: THREE.Object3D): any {
    return {
        name: object.name,
        type: object.type,
        children: object.children.map((child) => extractHierarchy(child)),
    }
}

const loader = new GLTFLoader()

// Get center of a GLTF model
function getCenter(gltfScene: THREE.Object3D): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(gltfScene)
    const center = new THREE.Vector3()
    box.getCenter(center)
    return center
}

// Align one model to another by centering
function alignToReference(
    referenceScene: THREE.Object3D,
    targetScene: THREE.Object3D,
) {
    const refCenter = getCenter(referenceScene)
    const tgtCenter = getCenter(targetScene)

    const offset = new THREE.Vector3().subVectors(refCenter, tgtCenter)
    targetScene.position.add(offset) // Move the target so its center matches reference
}

function drawSystem(
    scene: THREE.Scene,
    systemName: string,
    reference: THREE.Object3D,
) {
    loader.load(
        `imagery/anatomy/${systemName}.glb`,
        (gltf) => {
            const model = gltf.scene
            alignToReference(reference, model)
            model.name = systemName
            scene.add(model)

            const hierarchy = extractHierarchy(gltf.scene)
            console.log(JSON.stringify(hierarchy, null, 2))
        },
        undefined,
        (error) => {
            console.error(error)
        },
    )
}

const SYSTEMS = [
    //'Skeletal',
    'MuscularInsertions',
    'MuscularSystem',
    'Cardiovascular',
    'Nervous',
    'Joints',
    'Lymphoid',
    'CrossSection',
    'Reference',
    'Regions',
    'Visceral',
]

function drawAnatomy(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    // Add basic lights
    drawBasicLights(scene, threejsDrawing)

    // ambient light...
    const ambientLight = new THREE.DirectionalLight(0xffffff, 0.5)
    ambientLight.position.set(0, 0, 1)

    scene.background = new THREE.Color(0x050505)

    const light1 = new THREE.DirectionalLight(0xffffff, 2.5)
    light1.position.set(1, 1, 1)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight(0xffffff, 1.5)
    light2.position.set(-1, -1, 1)
    scene.add(light2)

    const root = new THREE.Group()
    scene.add(root)

    loader.load('imagery/anatomy/Skeletal.glb', (skeletal) => {
        const reference = skeletal.scene
        reference.name = 'Skeletal'
        scene.add(reference)
        for (const systemName of SYSTEMS) {
            drawSystem(scene, systemName, reference)
        }

        const hierarchy = extractHierarchy(reference)
        console.log(JSON.stringify(hierarchy, null, 2))
    })

    //threejsDrawing.data.molecules[params.molecule] = root;

    // attach drawing to window...
    window.drawing = threejsDrawing || {}
}

const anatomyDrawing = {
    sceneElements: [],
    drawFuncs: [{ func: drawAnatomy, dataSrc: null, dataType: null }],
    log: null,
    eventListeners: null,
    animationCallback: (
        renderer: THREE.WebGLRenderer,
        timestamp: number,
        threejsDrawing: ThreeJSDrawing,
        camera: THREE.Camera,
    ) => {},
    data: {},
    sceneConfig: {
        startPosition: {
            x: -50,
            y: 50,
            z: 200,
        },
        clippingPlane: 200000,
        //cssRenderer: '2D',
    },
}

export { anatomyDrawing }
