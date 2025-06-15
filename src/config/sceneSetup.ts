import * as THREE from 'three';
import {
    importOrbitControls, importPointerLockControls, importTrackballControls, importCSS3DRenderer, importCSS2DRenderer,
    importVRButton, importStats
} from './dynamicImports';

export const defaultSceneConfig = {
    startPosition: { x: 0, y: 2, z: 5 },
    lookAt: { x: 0, y: 0, z: 0 },
    clippingPlane: 1000,
    background: 0x000000,
    controller: 'orbital',
    cssRendererEnabled: false,
    statsEnabled: false,
    vrEnabled: false,
    outlineEffect: false
}

export type OverlayElement = {
    tagName: string;
    className?: string;
    id?: string;
    attrs?: { [key: string]: string };
};

export async function setupScene(
    containerId = 'c',
    overlayElements: OverlayElement[] = [],
    sceneConfig = defaultSceneConfig
    ) {
    let controls: any = null;
    let stats;
    let css2DRenderer;
    let css3DRenderer;

    // fill in any missing sceneConfig values with defaults
    const {startPosition, lookAt, clippingPlane, background, controller, cssRendererEnabled, statsEnabled, vrEnabled} = {...defaultSceneConfig, ...sceneConfig};

    const css3DRendererEnabled = (typeof cssRendererEnabled === 'string') && (cssRendererEnabled === '3D' || cssRendererEnabled === 'DUAL');
    const css2DRendererEnabled = (typeof cssRendererEnabled === 'string') && (cssRendererEnabled === '2D' || cssRendererEnabled === 'DUAL');

    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container element with id '${containerId}' not found.`);
    }
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, clippingPlane);
    camera.position.set(startPosition.x, startPosition.y, startPosition.z);

    const existingCanvas = container.querySelector('canvas');
    const renderer = new THREE.WebGLRenderer(
        existingCanvas ? { canvas: existingCanvas, antialias: true } : { antialias: true }
    );

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
        const CSS2DRenderer = await importCSS2DRenderer();
        css2DRenderer = new CSS2DRenderer();
        css2DRenderer.setSize(container.clientWidth, container.clientHeight);
        css2DRenderer.domElement.style.position = 'absolute';
        css2DRenderer.domElement.style.top = container.offsetTop + 'px';
        css2DRenderer.domElement.style.left = container.offsetLeft + 'px';
        css2DRenderer.domElement.style.pointerEvents = 'none';
        css2DRenderer.domElement.style.zIndex        = '10';   // ⟵ new

        // place it *on top of* the existing WebGL canvas
        container.appendChild(css2DRenderer.domElement);
    }

    if (css3DRendererEnabled) {
        console.log('CSS3DRenderer enabled');
        const CSS3DRenderer = await importCSS3DRenderer();
        const css3DScene = new THREE.Scene();
        css3DRenderer = new CSS3DRenderer();
        //cssRenderer.setSize(window.innerWidth, window.innerHeight);
        css3DRenderer.setSize(container.clientWidth, container.clientHeight);
        css3DRenderer.domElement.style.position = 'absolute';
        css3DRenderer.domElement.style.top = container.offsetTop + 'px';
        css3DRenderer.domElement.style.left = container.offsetLeft + 'px';

        css3DRenderer.domElement.style.pointerEvents = 'none';

        // place it *on top of* the existing WebGL canvas
        //document.body.appendChild(cssRenderer.domElement);
        container.appendChild(css3DRenderer.domElement);
        //cssRenderer.domElement.style.zIndex = 1;
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
        if (element.className !== undefined) {
            el.className = element.className;
        }
        if (element.id !== undefined) {
            el.id = element.id;
        }
        if (element.attrs) {
            for (const [key, value] of Object.entries(element.attrs)) {
                el.setAttribute(key, value);
            }
        }
        container.appendChild(el);
    }

    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    function onWindowResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    // Controls
    if (controller === 'none') {
        // Controls are explicitly set to none (ex: Adventure)
        controls = null;
    } else if (controller === 'orbital') {
        const OrbitControls = await importOrbitControls();
        controls = new OrbitControls(camera, renderer.domElement);
        controls!.enabled = true; // we can toggle later

        //controls.target.set(0, 0, 0); // set the target to the origin
        controls!.target.set(lookAt.x, lookAt.y, lookAt.z); // set the target to the origin
        controls!.update();
    } else if (controller === 'walking' || controller === 'pointerlock') {
        console.log('PointerLockControls enabled');
        const PointerLockControls = await importPointerLockControls();
        controls = new PointerLockControls(camera, renderer.domElement);
        document.body.addEventListener('click', () => controls!.lock());
        controls!.name = 'PointerLockControls';
        scene.add(controls!.object);
    } else if (controller === 'trackball') {
        const TrackballControls = await importTrackballControls();
        controls = new TrackballControls(camera, renderer.domElement);
        controls!.minDistance = 500;
        controls!.maxDistance = 6000;
    } else {
        controls = null;
    }

    return { scene, camera, renderer, controls, stats, css2DRenderer, css3DRenderer };
}
