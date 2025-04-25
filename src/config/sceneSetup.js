import { Scene, Color, PerspectiveCamera, WebGLRenderer } from 'three';

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


export async function setupScene(
    containerId = 'c',
    overlayElements = [],
    startPosition = { x: 0, y: 2, z: 5 },
    lookAt = { x: 0, y: 0, z: 0 },
    clippingPlane = 1000,
    background = 0x000000,
    controller = 'orbital',
    cssRendererEnabled = false,
    statsEnabled = false,
    vrEnabled = false
    ) {
    let controls;
    let stats;
    let cssRenderer;

    const css3DRendererEnabled = cssRendererEnabled && cssRendererEnabled === '3D';
    const css2DRendererEnabled = cssRendererEnabled && cssRendererEnabled === '2D';

    // 1) Setup container
    const container = document.getElementById(containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2) Scene
    const scene = new Scene();
    scene.background = new Color(background);

    // 3) Camera
    const camera = new PerspectiveCamera(75, width / height, 0.1, clippingPlane);
    //camera.position.set(5, 5, 5); // or wherever
    camera.position.set(startPosition.x, startPosition.y, startPosition.z);

    // 4) Renderer
    const renderer = new WebGLRenderer({
        canvas: container.querySelector('canvas'),
        antialias: true
    });

    if (vrEnabled) {
        importVRButton().then(VRButton => {
            renderer.xr.enabled = true;
            document.body.appendChild(VRButton.createButton(renderer));
        });
    };

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    if (css2DRendererEnabled) {
        console.log('CSS2DRenderer enabled');
        importCSS2DRenderer().then(CSS2DRenderer => {
            cssRenderer = new CSS2DRenderer();
            cssRenderer.setSize(container.clientWidth, container.clientHeight);
            cssRenderer.domElement.style.position = 'absolute';
            cssRenderer.domElement.style.top = container.offsetTop + 'px';
            cssRenderer.domElement.style.left = container.offsetLeft + 'px';
            cssRenderer.domElement.style.pointerEvents = 'none';
            cssRenderer.domElement.style.zIndex        = '10';   // ⟵ new

            // place it *on top of* the existing WebGL canvas
            container.appendChild(cssRenderer.domElement);
        });
    }

    if (css3DRendererEnabled) {
        console.log('CSS3DRenderer enabled');
        importCSS3DRenderer().then(CSS3DRenderer => {
            cssRenderer = new CSS3DRenderer();
            //cssRenderer.setSize(window.innerWidth, window.innerHeight);
            cssRenderer.setSize(container.clientWidth, container.clientHeight);
            cssRenderer.domElement.style.position = 'absolute';
            cssRenderer.domElement.style.top = container.offsetTop + 'px';
            cssRenderer.domElement.style.left = container.offsetLeft + 'px';

            cssRenderer.domElement.style.pointerEvents = 'none';

            // place it *on top of* the existing WebGL canvas
            //document.body.appendChild(cssRenderer.domElement);
            container.appendChild(cssRenderer.domElement);
            //cssRenderer.domElement.style.zIndex = 1;
        });
    }


    // Stats (optional)
    if (statsEnabled) {
        importStats().then(Stats => {
            const stats = new Stats();
            stats.showPanel(0); // 0: fps, 1: ms, 2: memory
            container.appendChild(stats.dom);
        });
    }


    // Add any optional overlay elements
    for (const element of overlayElements) {
        const el = document.createElement(element.tagName);
        el.className = element.className;
        el.id = element.id;
        for (const [key, value] of Object.entries(element.attrs)) {
            el.setAttribute(key, value);
        }
        container.appendChild(el);
    }

    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    // 6) Resize handling
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    // 5) Controls
    if (controller === 'none') {
        // Controls are explicitly set to none (ex: Adventure)
        controls = null;
    } else if (controller === 'orbital') {
        const OrbitControls = await importOrbitControls();
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = true; // we can toggle later

        //controls.target.set(0, 0, 0); // set the target to the origin
        controls.target.set(lookAt.x, lookAt.y, lookAt.z); // set the target to the origin
        controls.update();
    } else if (controller === 'walking') {
        // TODO...
        controls = null;
    } else if (controller === 'pointerlock') {
        const PointerLockControls = await importPointerLockControls();
        controls = new PointerLockControls(camera, renderer.domElement);
        document.body.addEventListener('click', () => controls.lock());
        scene.add(controls.object);
    } else if (controller === 'trackball') {
        const TrackballControls = await importTrackballControls();
        controls = new TrackballControls(camera, renderer.domElement);
        controls.minDistance = 500;
        controls.maxDistance = 6000;
    } else {
        controls = null;
    }

    return { scene, camera, renderer, controls, stats, cssRenderer };
}
