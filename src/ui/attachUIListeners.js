export function attachUIListeners(uiConfig, uiState) {
    // Not strictly necessary to get container if you only want to attach by element IDs, but we can do it if you like:
    const container = document.getElementById(uiConfig.containerId);
    if (!container) {
        console.warn(`UI container #${uiConfig.containerId} not found!`);
    }

    uiConfig.elements.forEach((elementConfig) => {
        const { type, id, onClick, onChange } = elementConfig;

        // We look up the existing element in the DOM by its ID
        const elem = document.getElementById(id);
        if (!elem) {
            console.warn(`Element with id="${id}" not found in DOM. Skipping...`);
            return;
        }

        // We only attach relevant listeners based on "type" or "onClick"/"onChange"
        if (type === 'button' && typeof onClick === 'function') {
            elem.addEventListener('click', (event) => onClick(uiState, event));
        }
        else if (type === 'slider' && typeof onChange === 'function') {
            // For a slider, might do 'input' or 'change' depending on preference
            elem.addEventListener('input', (event) => onChange(uiState, event));
        }

        // In principle, you could also check if the config wants to
        // forcibly set the text, min, max, value, etc. to match config.
        // But if you're relying purely on the pre-existing HTML, you can skip that.
    });
}
