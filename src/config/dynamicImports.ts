function importOrbitControls() {
    return import('three/examples/jsm/controls/OrbitControls.js').then(module => {
        return module.OrbitControls;
    });
}

function importPointerLockControls() {
    return import('three/examples/jsm/controls/PointerLockControls.js').then(module => {
        return module.PointerLockControls;
    });
}

function importTrackballControls() {
    return import('three/examples/jsm/controls/TrackballControls.js').then(module => {
        return module.TrackballControls;
    });
}

function importCSS3DRenderer() {
    return import('three/examples/jsm/renderers/CSS3DRenderer.js').then(module => {
        return module.CSS3DRenderer;
    });
}

function importCSS2DRenderer() {
    return import('three/examples/jsm/renderers/CSS2DRenderer.js').then(module => {
        return module.CSS2DRenderer;
    });
}

function importVRButton() {
    return import('three/examples/jsm/webxr/VRButton.js').then(module => {
        return module.VRButton;
    });
}

function importStats() {
    return import('stats.js').then(module => {
        //return module.Stats;
        return module.default; // stats.js exports default
    });
}


export {
    importOrbitControls,
    importPointerLockControls,
    importTrackballControls,
    importCSS3DRenderer,
    importCSS2DRenderer,
    importVRButton,
    importStats
}