import * as THREE from 'three';
import Stats from 'stats';
import { OrbitControls } from 'orbitcontrols';

export function setupScene(containerId = 'c', overlayElements = [], startPosition = { x: 0, y: 2, z: 5 }) {
    // 1) Setup container
    const container = document.getElementById(containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2) Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 3) Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    //camera.position.set(5, 5, 5); // or wherever
    camera.position.set(startPosition.x, startPosition.y, startPosition.z);

    // 4) Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: container.querySelector('canvas'),
        antialias: true
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);


    // Stats (optional)
    console.log("stats", Stats);
    const stats = new Stats();
    container.appendChild( stats.dom );


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

    camera.lookAt(0, 0, 0); // look at the origin
    controls.target.set(0, 0, 0); // set the target to the origin
    controls.update();

    // 6) Resize handling
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    return { scene, camera, renderer, controls, stats };
}
