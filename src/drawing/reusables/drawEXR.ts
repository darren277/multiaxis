import * as THREE from 'three'
import { ThreeJSDrawing } from '../../threejsDrawing'

function drawExrPMREM(
    scene: THREE.Scene,
    texture: THREE.Texture,
    threejsDrawing: ThreeJSDrawing,
) {
    const { renderer } = threejsDrawing.data as {
        renderer: THREE.WebGLRenderer
    }
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    const envMap = pmremGenerator.fromEquirectangular(texture).texture

    scene.environment = envMap
    scene.background = envMap

    texture.dispose()
    pmremGenerator.dispose()
}

function drawExprEquirectangular(
    scene: THREE.Scene,
    texture: THREE.Texture,
    threejsDrawing: ThreeJSDrawing,
) {
    texture.mapping = THREE.EquirectangularReflectionMapping

    const geometry = new THREE.SphereGeometry(50, 64, 64)
    geometry.scale(-1, 1, 1) // Flip normals to render inside

    const material = new THREE.MeshBasicMaterial({ map: texture })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
}

function drawExr(
    scene: THREE.Scene,
    texture: THREE.Texture,
    threejsDrawing: ThreeJSDrawing,
) {
    const { drawingMode } = threejsDrawing.data

    if (drawingMode === 'PMREM') {
        drawExrPMREM(scene, texture, threejsDrawing)
    } else if (drawingMode === 'Equirectangular') {
        drawExprEquirectangular(scene, texture, threejsDrawing)
    }

    const geometry = new THREE.SphereGeometry(1, 64, 64)
    const material = new THREE.MeshStandardMaterial({
        metalness: 1,
        roughness: 0,
    })
    const sphere = new THREE.Mesh(geometry, material)
    //scene.add(sphere);

    //camera.position.z = 3;
}

const exrDrawing = {
    sceneElements: [],
    drawFuncs: [
        { func: drawExr, dataSrc: 'golden_gate_hills_1k', dataType: 'exr' },
    ],
    // domElement.addEventListener('click', (e) => onMouseClick(e, camera, domElement));
    eventListeners: {},
    animationCallback: (
        renderer: THREE.WebGLRenderer,
        timestamp: number,
        threejsDrawing: ThreeJSDrawing,
        camera: THREE.Camera,
    ) => {},
    data: {
        //'drawingMode': 'PMREM',
        drawingMode: 'Equirectangular',
    },
}

export { exrDrawing }
