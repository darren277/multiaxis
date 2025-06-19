import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {
    importOrbitControls, importPointerLockControls, importTrackballControls, importCSS3DRenderer, importCSS2DRenderer,
    importVRButton, importStats
} from './dynamicImports';
import { assert, assertString, debugLog } from '../utils/assertUtils';
export { assert, assertString, assertObject, debugLog } from '../utils/assertUtils';

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

export type SceneConfig = typeof defaultSceneConfig & Partial<Record<keyof typeof defaultSceneConfig, any>>;

export type SceneElements = {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: THREE.EventDispatcher | null;
    stats?: any;
    css2DRenderer?: any;
    css3DRenderer?: any;
    css3DScene?: THREE.Scene;
    tweenGroup?: TWEEN.Group;
};

export type OverlayElement = {
    tagName: string;
    className?: string;
    id?: string;
    attrs?: { [key: string]: string };
};

function getContainer(containerId: string): HTMLElement {
    const el = document.getElementById(containerId);
    assert(el, `Container element '${containerId}' not found`);
    return el;
}

function makeScene(bg: number): THREE.Scene {
    const s = new THREE.Scene();
    s.background = new THREE.Color(bg);
    return s;
}

function makeCamera(
    { x, y, z }: { x: number; y: number; z: number },
    aspect: number,
    clipping: number
): THREE.PerspectiveCamera {
    const cam = new THREE.PerspectiveCamera(75, aspect, 0.1, clipping);
    cam.position.set(x, y, z);
    return cam;
}

function makeWebGLRenderer(
    container: HTMLElement,
    vrEnabled: boolean
): THREE.WebGLRenderer {
    const existingCanvas = container.querySelector('canvas');
    const r = new THREE.WebGLRenderer(
        existingCanvas ? { canvas: existingCanvas, antialias: true } : { antialias: true }
    );
    r.setPixelRatio(window.devicePixelRatio);
    if (vrEnabled) {
        importVRButton().then((VRButton) => {
            r.xr.enabled = true;
            document.body.appendChild(VRButton.createButton(r));
        });
    }
    return r;
}

async function makeCssRenderers(
    container: HTMLElement,
    cssFlag: string | boolean
) {
    let css2DRenderer: any;
    let css3DRenderer: any;

    const is3D = cssFlag === '3D' || cssFlag === 'DUAL';
    const is2D = cssFlag === '2D' || cssFlag === 'DUAL';

    if (is2D) {
        const CSS2DRenderer = await importCSS2DRenderer();
        css2DRenderer = new CSS2DRenderer();
        css2DRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(css2DRenderer.domElement);
    }

    if (is3D) {
        const CSS3DRenderer = await importCSS3DRenderer();
        css3DRenderer = new CSS3DRenderer();
        
        const css3DScene = new THREE.Scene();
        css3DRenderer.scene = css3DScene;

        css3DRenderer.setSize(container.clientWidth, container.clientHeight);
        css3DRenderer.domElement.style.position = 'absolute';
        css3DRenderer.domElement.style.top = container.offsetTop + 'px';
        css3DRenderer.domElement.style.left = container.offsetLeft + 'px';

        css3DRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(css3DRenderer.domElement);
    }

    return { css2DRenderer, css3DRenderer };
}

async function makeControls(
    kind: string,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    lookAt: { x: number; y: number; z: number }
) {
    switch (kind) {
    case 'orbital': {
        const OrbitControls = await importOrbitControls();
        const c = new OrbitControls(camera, renderer.domElement);
        c.target.set(lookAt.x, lookAt.y, lookAt.z);
        c.update();
        return c;
    }
    case 'pointerlock':
    case 'walking': {
        const PointerLockControls = await importPointerLockControls();
        const c = new PointerLockControls(camera, renderer.domElement);

        const crosshair = document.getElementById('crosshair');

        c.addEventListener('lock', () => {
            console.log('Pointer locked. Showing crosshair.');
            if (crosshair) {
                crosshair.style.display = 'block';
            }
        });

        c.addEventListener('unlock', () => {
            console.log('Pointer unlocked. Hiding crosshair.');
            if (crosshair) {
                crosshair.style.display = 'none';
            }
        });
        
        document.body.addEventListener('click', () => c.lock());
        scene.add(c.object);
        return c;
    }
    case 'trackball': {
        const TrackballControls = await importTrackballControls();
        const c = new TrackballControls(camera, renderer.domElement);
        c.minDistance = 500;
        c.maxDistance = 6000;
        return c;
    }
    case 'none':
    default:
        return null;
    }
}

async function addStatsIfNeeded(
    container: HTMLElement,
    enabled: boolean
): Promise<any | undefined> {
    if (!enabled) return;
    const Stats = await importStats();
    const s = new Stats();
    s.showPanel(0);
    container.appendChild(s.dom);
    return s;
}

function addOverlayElements(container: HTMLElement, overlays: OverlayElement[]) {
    overlays.forEach((element) => {
        const el = document.createElement(element.tagName);
        if (element.className) el.className = element.className;
        if (element.id) el.id = element.id;
        Object.entries(element.attrs ?? {}).forEach(([k, v]) => el.setAttribute(k, v));
        container.appendChild(el);
    });
}


export async function setupScene(
    containerId = 'c',
    overlayElements: OverlayElement[] = [],
    sceneConfig: SceneConfig = defaultSceneConfig
): Promise<SceneElements> {
    // ── 1 · Merge & sanity‑check config ──────────────────────────────
    const cfg = { ...defaultSceneConfig, ...sceneConfig };
    assertString(cfg.controller, 'controller');
    debugLog('sceneConfig', cfg);

    // ── 2 · DOM & basic objects ──────────────────────────────────────
    const container = getContainer(containerId);
    debugLog('container', container);

    const aspect = container.clientWidth / container.clientHeight;
    const scene = makeScene(cfg.background);
    const camera = makeCamera(cfg.startPosition, aspect, cfg.clippingPlane);
    debugLog('scene/camera', { scene, camera });

    const renderer = makeWebGLRenderer(container, cfg.vrEnabled);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    debugLog('renderer', renderer);

    // ── 3 · CSS renderers (optional)──────────────────────────────────
    const { css2DRenderer, css3DRenderer } = await makeCssRenderers(
        container,
        cfg.cssRendererEnabled as any
    );
    debugLog('cssRenderers', { css2DRenderer, css3DRenderer });

    // ── 4 · Stats (optional)──────────────────────────────────────────
    const stats = await addStatsIfNeeded(container, cfg.statsEnabled);
    debugLog('stats', stats);

    // ── 5 · Overlays ────────────────────────────────────────────────
    addOverlayElements(container, overlayElements);
    camera.lookAt(cfg.lookAt.x, cfg.lookAt.y, cfg.lookAt.z);

    // ── 6 · Controls ────────────────────────────────────────────────
    const controls = await makeControls(cfg.controller, camera, renderer, scene, cfg.lookAt);
    debugLog('controls', controls);

    // ── 7 · Resize handler ──────────────────────────────────────────
    window.addEventListener(
        'resize',
        () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        },
        false
    );

    const tweenGroup = new TWEEN.Group();

    // ── 8 · Return fully‑typed bundle ───────────────────────────────
    return {
        scene,
        camera,
        renderer,
        controls,
        stats,
        tweenGroup,
        css2DRenderer,
        css3DRenderer,
        css3DScene: css3DRenderer ? new THREE.Scene() : undefined,
    };
}
