function importOrbitControls() {
    return import('orbitcontrols').then(module => {
        return module.OrbitControls;
    });
}

function importPointerLockControls() {
    return import('pointerlockcontrols').then(module => {
        return module.PointerLockControls;
    });
}

function importTrackballControls() {
    return import('trackballcontrols').then(module => {
        return module.TrackballControls;
    });
}

function importCSS3DRenderer() {
    return import('css3drenderer').then(module => {
        return module.CSS3DRenderer;
    });
}

function importCSS2DRenderer() {
    return import('css2drenderer').then(module => {
        return module.CSS2DRenderer;
    });
}

function importVRButton() {
    return import('vrbutton').then(module => {
        return module.VRButton;
    });
}

function importStats() {
    return import('stats').then(module => {
        return module.Stats;
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