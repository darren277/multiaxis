import * as THREE from 'three';
import { onClickNav } from '../config/navigation';
import { ThreeJSDrawing } from '../threejsDrawing';

export type EventListenerContext = {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    controls?: any; // OrbitControls or similar
    data: any; // Additional data if needed
};

export function addListeners(threejsDrawing: ThreeJSDrawing) {
    const { scene, renderer, camera } = threejsDrawing.data;

    // Add event listener for navigation
    window.addEventListener('click', (event) => {
        onClickNav(event, scene, renderer, camera);
    });

    // Setup UI listeners
    //attachUIListeners(uiPanelConfig, uiState);

    // Add any event listeners from the threejsDrawing
    if (threejsDrawing.eventListeners) {
        for (const [eventName, eventFunc] of Object.entries(threejsDrawing.eventListeners)) {
            window.addEventListener(eventName, (e) => {
                if (typeof eventFunc === 'function') {
                    eventFunc(e, { renderer, scene, camera, data: threejsDrawing.data } as EventListenerContext);
                }
            });
        }
    }
}