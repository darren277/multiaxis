export default {
    containerId: 'ui-container', // The ID of some DOM element in your HTML
    elements: [
        {
            type: 'button',
            id: 'orbit-toggle-btn',
            text: 'Orbit: ON',
            onClick: (state, event) => {
                // We'll toggle the orbit controls in here
                state.orbitEnabled = !state.orbitEnabled;
                state.controls.enabled = state.orbitEnabled;
                event.target.innerText = state.orbitEnabled ? 'Orbit: ON' : 'Orbit: OFF';
            },
        },
        {
            type: 'slider',
            id: 'zoom-slider',
            min: 1,
            max: 100,
            value: 5,
            step: 1,
            onChange: (state, event) => {
                // Maybe we adjust the camera position magnitude
                const val = parseFloat(event.target.value);
                // e.g., keep camera at (val, val, val)
                state.camera.position.set(val, val, val);
            },
        },
    // Add more UI elements (checkboxes, text inputs, etc.) as needed
    ],
};
