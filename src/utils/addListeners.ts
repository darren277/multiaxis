import { onClickNav } from '../config/navigation';
import { ThreeJSDrawing } from '../threejsDrawing';

export function addListeners(
threejsDrawing: ThreeJSDrawing, p0: unknown) {
    const { scene, renderer, camera, controls } = threejsDrawing.data;

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
                    eventFunc(e, {data: threejsDrawing.data, controls, renderer, scene});
                }
            });
        }
    }
}