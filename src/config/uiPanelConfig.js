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
        // tempo-slider
        {
            type: 'slider',
            id: 'tempo-slider',
            min: 0.5,
            max: 2.0,
            value: 1.0,
            step: 0.1,
            onChange: (state, event) => {
                const val = parseFloat(event.target.value);
                state.tempoScale = val;
                //state.tempoValue.textContent = `${val.toFixed(2)}x`;

                // Update the tempo value in the UI
                const tempoValue = document.getElementById('tempo-value');
                if (tempoValue) {
                    tempoValue.textContent = `${val.toFixed(2)}x`;
                }
            },
        },
    ],
};
