import * as THREE from 'three'
import { ThreeJSDrawing } from '../threejsDrawing'
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js'
import { Group } from '@tweenjs/tween.js'

type Renderables = {
    scene: THREE.Scene
    camera: THREE.Camera
    controls?: any // OrbitControls or similar
    threejsDrawing: ThreeJSDrawing
    stats?: any // Stats.js or similar
    css2DRenderer?: any // CSS2DRenderer or similar
    css3DRenderer?: any // CSS3DRenderer or similar
    css3DScene?: THREE.Scene // Scene for CSS3DRenderer
    //tweenUpdate: () => void; // Function to update tweens
    tweenGroup?: Group // Tween.js or similar
    outlineEffectEnabled: boolean // Whether to enable outline effect
}

export function startRenderLoop(
    renderer: THREE.WebGLRenderer,
    renderables: Renderables,
) {
    const {
        scene,
        camera,
        controls,
        threejsDrawing,
        stats,
        css2DRenderer,
        css3DRenderer,
        css3DScene,
        tweenGroup = new Group(), // Default to a new Group if not provided
        outlineEffectEnabled = false, // Default to false if not provided
    } = renderables

    let effect: OutlineEffect | undefined = undefined
    if (outlineEffectEnabled) {
        effect = new OutlineEffect(renderer)
    }

    renderer.setAnimationLoop((timestamp: number, frame?: XRFrame) => {
        // Update controls (if using OrbitControls or similar)
        if (controls) {
            controls.update()
        }

        if (threejsDrawing.animationCallback) {
            threejsDrawing.animationCallback(
                renderer,
                timestamp,
                threejsDrawing,
                camera,
            )
        }

        // Update camera projection if needed
        if (
            'updateProjectionMatrix' in camera &&
            typeof (camera as any).updateProjectionMatrix === 'function'
        ) {
            ;(camera as any).updateProjectionMatrix()
        }

        tweenGroup.update(timestamp)

        if (stats) {
            stats.update()
        }

        renderer.render(scene, camera)

        if (css2DRenderer) {
            css2DRenderer.render(scene, camera)
        }

        if (css3DRenderer && css3DScene) {
            css3DRenderer.render(css3DScene, camera)
        }

        if (css3DRenderer && css3DRenderer.scene) {
            css3DRenderer.render(css3DRenderer.scene, camera)
        }

        if (outlineEffectEnabled && effect) {
            effect.render(scene, camera)
        }

        if (threejsDrawing.data.collision) {
            //threejsDrawing.data.collision.update(null, timestamp);

            //console.log('Direction:', threejsDrawing.data.collision.keyManager.direction.toArray());
            //console.log('Jump?', threejsDrawing.data.collision.keyManager.consumeJump());

            threejsDrawing.data.keyManager.syncFromInput()
        }
    })
}
