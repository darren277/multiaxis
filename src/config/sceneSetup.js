import * as THREE from 'three';
import { OrbitControls } from 'orbitcontrols';

export function setupScene(containerId = 'c', overlayElements = []) {
    // 1) Setup container
    const container = document.getElementById(containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2) Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 3) Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5); // or wherever

    // 4) Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: container.querySelector('canvas'),
        antialias: true
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);


    // Add any optional overlay elements
    for (const element of overlayElements) {
        const el = document.createElement(element.tagName);
        el.id = element.id;
        for (const [key, value] of Object.entries(element.attrs)) {
            el.setAttribute(key, value);
        }
        container.appendChild(el);
    }

    // 5) Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = true; // we can toggle later

    // 6) Resize handling
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    return { scene, camera, renderer, controls };
}
