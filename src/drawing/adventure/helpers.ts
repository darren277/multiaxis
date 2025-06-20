import * as TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'
import { ThreeJSDrawing } from '../../threejsDrawing'

function tweenCameraToView(
    tweenGroup: TWEEN.Group,
    camera: THREE.Camera,
    view: { position: THREE.Vector3 },
    lookAt: THREE.Vector3,
    duration = 2000,
) {
    const cameraTween = new TWEEN.Tween(camera.position)
        .to(
            { x: view.position.x, y: view.position.y, z: view.position.z },
            duration,
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            // continuously update aim as we move
            camera.lookAt(lookAt)
            camera.up.set(0, 1, 0)

            // if you're using OrbitControls (or similar):
            //            if (controls) {
            //                controls.target.copy(lookAt);
            //                controls.update();
            //            }
        })
        .start()

    tweenGroup.add(cameraTween)

    // For lookAt, you could keep a separate vector and tween that,
    // then in your render loop do camera.lookAt( thatVector ).
}

let autoNextTimeoutId:
    | string
    | number
    | ReturnType<typeof setTimeout>
    | null
    | undefined = null

// Function to set camera to a particular view
function goToStep(
    tweenGroup: TWEEN.Group,
    camera: THREE.Camera,
    stepId: string,
    adventureSteps: { [key: string]: any },
    controls: any,
) {
    const stepData = adventureSteps[stepId]

    if (!stepData) {
        console.error('Invalid step:', stepId)
        return
    }

    // Clear previous timeout
    if (autoNextTimeoutId) {
        clearTimeout(autoNextTimeoutId)
        autoNextTimeoutId = null
    }

    // Move camera
    tweenCameraToView(
        tweenGroup,
        camera,
        stepData.camera,
        stepData.camera.lookAt,
    )
    camera.lookAt(stepData.camera.lookAt)

    // If using OrbitControls
    if (controls) {
        controls.target.copy(stepData.camera.lookAt)
        controls.update()
    }

    // If using OrbitControls, also update controls.target
    // controls.target.copy(stepData.camera.lookAt);
    // controls.update();

    // Update overlay text
    const overlayText = document.getElementById('overlayText')
    if (overlayText) {
        overlayText.innerHTML = stepData.text
    }

    // If the step has an autoNext property, schedule it
    if (stepData.autoNext) {
        autoNextTimeoutId = setTimeout(() => {
            goToStep(
                tweenGroup,
                camera,
                stepData.autoNext.step,
                adventureSteps,
                controls,
            )
        }, stepData.autoNext.delay)
    }

    return stepId
}

function precomputeBackgroundPlanes(
    scene: THREE.Scene,
    threejsDrawing: ThreeJSDrawing,
    renderer: THREE.WebGLRenderer,
) {
    // assume computeBackgroundPlane(item.position, fov, aspect, camOffset, bgDistance)
    // returns { position:{x,y,z}, width, height }

    const bgLoader = new THREE.TextureLoader()
    const bgMeshes: { [key: string]: THREE.Mesh } = {}

    if (
        !threejsDrawing.data ||
        !Array.isArray(threejsDrawing.data.allPhotoEntries)
    ) {
        console.warn(
            'BRUH!@!!!! No photo entries found in threejsDrawing data.',
        )
        return
    }

    threejsDrawing.data.allPhotoEntries.forEach(({ item }: { item: any }) => {
        console.log(
            'Processing item:',
            item.id,
            'with background image:',
            item.bg_img,
            item,
        )
        if (!item.bg_img) return // skip if no BG

        //        const { position, width, height } = computeBackgroundPlane(
        //            item.position,
        //            threejsDrawing.data.camera.fov,
        //            renderer.domElement.clientWidth / renderer.domElement.clientHeight,
        //            /* camOffset= */ 6,
        //            /* bgDistance= */ 10
        //        );
        const position = item.bg_pos

        const geo = new THREE.PlaneGeometry(
            item.bg_width + 50,
            item.bg_height + 50,
        )
        const mat = new THREE.MeshBasicMaterial({
            map: bgLoader.load(item.bg_img),
            depthWrite: false, // so it never occludes your slides
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(position[0], position[1], position[2] - 25)

        // initially invisible
        mesh.visible = false

        scene.add(mesh)
        console.log(
            `Added background mesh for item ${item.id} at position`,
            position,
        )
        bgMeshes[item.id] = mesh
    })

    threejsDrawing.data.bgMeshes = bgMeshes
}

export { goToStep, precomputeBackgroundPlanes }
