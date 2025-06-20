import * as THREE from 'three'
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
}
