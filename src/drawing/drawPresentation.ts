import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

let currentViewIndex = 0

// === Define your set of "camera views" ===
// Each view has a camera position (x, y, z) and a "lookAt" point
const cameraViews = [
    {
        position: new THREE.Vector3(30, 20, 50),
        lookAt: new THREE.Vector3(0, 0, 0),
    },
    {
        position: new THREE.Vector3(-40, 10, 20),
        lookAt: new THREE.Vector3(0, 0, 0),
    },
    {
        position: new THREE.Vector3(0, 60, 0),
        lookAt: new THREE.Vector3(0, 0, 0),
    },
    // Add as many views as you like...
]

function tweenCameraToView(
    camera: THREE.Camera,
    view: { position: THREE.Vector3; lookAt: THREE.Vector3 },
    duration = 2000,
) {
    new TWEEN.Tween(camera.position)
        .to(
            { x: view.position.x, y: view.position.y, z: view.position.z },
            duration,
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()

    // For lookAt, you could keep a separate vector and tween that,
    // then in your render loop do camera.lookAt( thatVector ).
}

// Function to set camera to a particular view
function setCameraView(camera: THREE.Camera, index: number) {
    const view = cameraViews[index]

    // Option 1: Immediate jump
    //camera.position.copy(view.position);
    //camera.lookAt(view.lookAt);

    // Option 2: Smooth transition
    tweenCameraToView(camera, view)
    camera.lookAt(view.lookAt)

    // Optionally, if using OrbitControls, update control target:
    // controls.target.copy(view.lookAt);
    // controls.update();
}

// Event listeners...
const presentationKeyDownHandler = (
    camera: THREE.Camera,
    event: KeyboardEvent,
) => {
    if (event.key === 'n') {
        currentViewIndex = (currentViewIndex + 1) % cameraViews.length
        setCameraView(camera, currentViewIndex)
    } else if (event.key === 'p') {
        currentViewIndex =
            (currentViewIndex - 1 + cameraViews.length) % cameraViews.length
        setCameraView(camera, currentViewIndex)
    }

    // also, left and right arrows...
    if (event.key === 'ArrowLeft') {
        currentViewIndex =
            (currentViewIndex - 1 + cameraViews.length) % cameraViews.length
        setCameraView(camera, currentViewIndex)
    } else if (event.key === 'ArrowRight') {
        currentViewIndex = (currentViewIndex + 1) % cameraViews.length
        setCameraView(camera, currentViewIndex)
    }
}

export { setCameraView, presentationKeyDownHandler }
