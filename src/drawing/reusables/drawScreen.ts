import * as THREE from "three";

import { CSS3DObject } from 'css3drenderer';

type Screen = {
    mesh: THREE.Mesh;
    css: CSS3DObject;
    pickPlane: THREE.Mesh;
};

type ScreenParams = {
    webglScene: THREE.Scene;
    cssScene: THREE.Scene;
    url: string;
    thumbnail: string;
    width?: number;
    height?: number;
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
};

/**
 * Adds a black WebGL plane *and* a CSS3D iframe that rides on top of it.
 *
 * @param {Object}   opts
 * @param {THREE.Scene}  opts.webglScene  – the scene rendered by WebGLRenderer
 * @param {THREE.Scene}  opts.cssScene    – the scene rendered by CSS3DRenderer
 * @param {string}       opts.url         – iframe src
 * @param {string}       opts.thumbnail   – URL of the .png thumbnail
 * @param {number}       [opts.width=25]
 * @param {number}       [opts.height=15]
 * @param {THREE.Vector3}[opts.position]
 * @param {THREE.Euler}  [opts.rotation]
 *
 * @returns {{mesh:THREE.Mesh, css:CSS3DObject}}
 */
function drawScreen(
    { webglScene, cssScene, url, thumbnail, width = 25, height = 15, position = new THREE.Vector3(0, 5, -98), rotation = new THREE.Euler(0, 0, 0) }: ScreenParams
) {
    const texLoader = new THREE.TextureLoader();
    const tex       = texLoader.load(thumbnail);

    /* ---------- 1. WebGL “screen” for lighting & occlusion ---------- */
    const geom = new THREE.PlaneGeometry(width, height);
    const mat  = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    webglScene.add(mesh);

    /* ---------- 2. Real <iframe> as a CSS3D object ---------- */
    const iframe = document.createElement('iframe');
    iframe.src   = url;
    iframe.style.border        = 'none';
    iframe.style.pointerEvents = 'auto'; // let user interact!

    const PPU = 80;                 //   “pixels per unit”  ← tweak to taste
    iframe.style.width  = `${width  * PPU}px`;
    iframe.style.height = `${height * PPU}px`;

    const cssObj = new CSS3DObject(iframe);
    cssObj.position.copy(position);
    cssObj.rotation.copy(rotation);

    /* Scale the DOM element so one Three.js unit ≈ 1m visually.
     Tune this factor until the DOM element’s apparent size matches the plane. */
    const cssScale = 1 / PPU;
    cssObj.scale.set(cssScale, cssScale, cssScale);

    cssObj.visible = false;

    cssScene.add(cssObj);

    /* Visibility toggle so the iframe hides when obstructed */
//    function updateOcclusion(camera) {
//        caster.set(camera.position, mesh.position.clone().sub(camera.position).normalize());
//        const hit = caster.intersectObjects(webglScene.children, true)[0];
//        iframe.style.visibility = (hit && hit.object === mesh) ? 'visible' : 'hidden';
//    }

    const pickPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.4, height * 1.4), // 40% margin
        new THREE.MeshBasicMaterial({ visible: false })
    );
    pickPlane.position.copy(mesh.position);
    pickPlane.rotation.copy(mesh.rotation);
    webglScene.add(pickPlane);

    return { mesh, css: cssObj, pickPlane };
}



const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClickScreen(ev: MouseEvent, dom: HTMLElement, screen: THREE.Mesh, camera: THREE.Camera, cssObj: CSS3DObject, cssDom: HTMLElement, pickPlane: THREE.Mesh) {
    if (document.pointerLockElement === dom) {
        // pointer is locked → centre of the screen
        mouse.set(0, 0);
    } else {
        // convert screen coords → NDC
        const rect = (ev.target === dom ? dom : cssDom).getBoundingClientRect();

        mouse.x =  (ev.clientX - rect.left)  / rect.width  * 2 - 1;
        mouse.y = -(ev.clientY - rect.top)   / rect.height * 2 + 1;
    }

    console.log('onClickScreen', mouse.x, mouse.y);

    /* Make sure the ray can see the plane at any layer / distance */
    raycaster.layers.enableAll();
    raycaster.far = camera.far;

     /* Force‑update matrix if the plane moves each frame */
    screen.updateMatrixWorld(true);

    raycaster.setFromCamera(mouse, camera);

    console.groupCollapsed('screen debug');
    console.log('1. screen.visible         ', screen.visible);
    console.log('2. screen.layers.mask     ', screen.layers.mask.toString(2));
    console.log('3. camera layers mask     ', camera.layers.mask.toString(2));
    console.log('4. raycaster far / near   ', raycaster.near, raycaster.far);
    console.log('5. camera → screen dist   ', camera.position.distanceTo(screen.getWorldPosition(new THREE.Vector3())));
    console.log('6. point is inside frustum', (new THREE.Frustum()).setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)).containsPoint(screen.getWorldPosition(new THREE.Vector3())));
    console.log('7. ray origin', raycaster.ray.origin);
    console.log('8. ray direction', raycaster.ray.direction);
    console.groupEnd();

//    const hits = raycaster.intersectObject(screen, true);
//    if (!hits.length) {
//        const box = new Box3().setFromObject(screen);
//        if (!raycaster.ray.intersectsBox(box)) return;   // still a miss
//    }
    if (!raycaster.intersectObject(pickPlane).length) return;

    //console.log('hit', hit);

    const showIframe = !cssObj.visible;
    cssObj.visible   = showIframe;
    screen.visible   = !showIframe;
}

function onKeyScreen(ev: KeyboardEvent, screen: THREE.Mesh, cssObj: CSS3DObject) {
    if (ev.code === 'Escape' && cssObj.visible) {
        cssObj.visible = false;
        screen.visible = true;
    };
}

export { drawScreen, onClickScreen, onKeyScreen };
