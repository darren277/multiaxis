import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import { addNavigation } from './addNavigation'
import { drawHelpers } from '../config/utils'
import { ThreeJSDrawing } from '../threejsDrawing'
import { QueryOptions } from '../types'

export function addOptionals(
    scene: THREE.Scene,
    threejsDrawing: ThreeJSDrawing,
    queryOptions: QueryOptions,
    debugMode = false,
) {
    // Add navigation cubes if defined
    if (queryOptions.nav) {
        addNavigation(threejsDrawing)
    }
    if (debugMode) {
        drawHelpers(scene, threejsDrawing)
    }

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene, 'textures/sun_temple_stripe.jpg');
    //usePanoramicCubeBackgroundSixFaces(scene, 'textures/exr/golden_gate_hills_1k');

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');

    // Make debugging tools accessible in the browser console
    const camera = threejsDrawing.data.camera as THREE.PerspectiveCamera
    const controls = threejsDrawing.data.controls as any // Assuming OrbitControls or similar
    if (!camera || !controls) {
        console.error('Camera or controls not found in threejsDrawing data.')
        return
    }

    ;(window as any).CAMERA_DEBUG = {
        camera,
        controls,
        setCamera(pos: [number, number, number]) {
            camera.position.set(...pos)
            controls.update()
        },
        setTarget(pos: [number, number, number]) {
            controls.target.set(...pos)
            controls.update()
        },
        adjustCamera(pos: [number, number, number]) {
            camera.position.x += pos[0]
            camera.position.y += pos[1]
            camera.position.z += pos[2]
            controls.update()
        },
        adjustTarget(pos: [number, number, number]) {
            controls.target.x += pos[0]
            controls.target.y += pos[1]
            controls.target.z += pos[2]
            controls.update()
        },
        resetCamera() {
            camera.position.set(0, 0, 10)
            controls.target.set(0, 0, 0)
            controls.update()
        },
        resetControls() {
            controls.reset()
        },
        tweenTo(
            pos: [number, number, number],
            target: [number, number, number],
            duration = 1000,
        ) {
            const startPos = camera.position.clone()
            const startTgt = controls.target.clone()
            const endPos = new THREE.Vector3(...pos)
            const endTgt = new THREE.Vector3(...target)
            const params = { t: 0 }

            new TWEEN.Tween(params)
                .to({ t: 1 }, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => {
                    camera.position.lerpVectors(startPos, endPos, params.t)
                    controls.target.lerpVectors(startTgt, endTgt, params.t)
                    controls.update()
                })
                .start()
        },
    }
}
