import { onClickNav } from './config/navigation';

export function addListeners(
    threejsDrawing: ThreeJSDrawing
) {
    const { scene, renderer, camera, controls, uiPanelConfig, uiState } = threejsDrawing.data;

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