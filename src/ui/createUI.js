export function createUI(uiConfig, uiState) {
    const container = document.getElementById(uiConfig.containerId);
    if (!container) {
        console.warn(`UI Container #${uiConfig.containerId} not found!`);
        return;
    }

    uiConfig.elements.forEach((elemConfig) => {
        let element;

        switch (elemConfig.type) {
            case 'button':
                element = document.createElement('button');
                element.id = elemConfig.id;
                element.innerText = elemConfig.text || 'Button';
                element.addEventListener('click', (event) => {
                    if (typeof elemConfig.onClick === 'function') {
                        elemConfig.onClick(uiState, event);
                    }
                });
                break;

            case 'slider':
                element = document.createElement('input');
                element.type = 'range';
                element.id = elemConfig.id;
                element.min = elemConfig.min;
                element.max = elemConfig.max;
                element.value = elemConfig.value;
                element.step = elemConfig.step;
                element.addEventListener('input', (event) => {
                    if (typeof elemConfig.onChange === 'function') {
                    elemConfig.onChange(uiState, event);
                    }
                });
                break;

            // You can define more types: checkbox, text input, etc.
            // ...
            default:
                console.warn(`Unsupported UI element type: ${elemConfig.type}`);
                return;
        }

        container.appendChild(element);
    });
}
