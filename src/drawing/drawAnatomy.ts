import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ThreeJSDrawing } from '../types'
import { drawBasicLights } from './reusables/drawLights'

const loader = new GLTFLoader()

function drawSystem(scene: THREE.Scene, systemName: string) {
    loader.load(
        `imagery/anatomy/${systemName}.glb`,
        (gltf) => {
            const model = gltf.scene
            scene.add(model)
        },
        undefined,
        (error) => {
            console.error(error)
        },
    )
}

const SYSTEMS = [
    'Skeletal',
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

    for (const systemName of SYSTEMS) {
        drawSystem(scene, systemName)
    }

    //threejsDrawing.data.molecules[params.molecule] = root;
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
