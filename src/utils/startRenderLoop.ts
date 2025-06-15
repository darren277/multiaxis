import * as THREE from 'three';
import { ThreeJSDrawing } from '../threejsDrawing';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';

type Renderables = {
    scene: THREE.Scene;
    camera: THREE.Camera;
    controls?: any; // OrbitControls or similar
    threejsDrawing: ThreeJSDrawing;
    stats?: any; // Stats.js or similar
    css2DRenderer?: any; // CSS2DRenderer or similar
    css3DRenderer?: any; // CSS3DRenderer or similar
    tweenUpdate: () => void; // Function to update tweens
    outlineEffectEnabled: boolean; // Whether to enable outline effect
};

export function startRenderLoop(renderer: THREE.WebGLRenderer, renderables: Renderables) {
    const {
        scene,
        camera,
        controls,
        threejsDrawing,
        stats,
        css2DRenderer,
        css3DRenderer,
        tweenUpdate,
        outlineEffectEnabled = false, // Default to false if not provided
    } = renderables;

    let effect: OutlineEffect | undefined = undefined;
    if (outlineEffectEnabled) {
        effect = new OutlineEffect(renderer);
    }

    renderer.setAnimationLoop((
        timestamp: number,
        frame?: XRFrame,
    ) => {
        // Update controls (if using OrbitControls or similar)
        if (controls) {
            controls.update();
        }

        if (threejsDrawing.animationCallback) {
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, camera);
        }

        // Update camera projection if needed
        if ('updateProjectionMatrix' in camera && typeof (camera as any).updateProjectionMatrix === 'function') {
            (camera as any).updateProjectionMatrix();
        }

        tweenUpdate();

        if (stats) {
            stats.update();
        }

        renderer.render(scene, camera);

        if (css2DRenderer) {
            css2DRenderer.render(css2DRenderer.scene, camera);
        }

        if (css3DRenderer) {
            css3DRenderer.render(css3DRenderer.scene, camera);
        }

        if (outlineEffectEnabled && effect) {
            effect.render(scene, camera);
        }
    });
}