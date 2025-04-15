import * as THREE from 'three';
import Stats from 'stats';
import { OrbitControls } from 'orbitcontrols';
import { VRButton } from 'vrbutton';

export function setupScene(containerId = 'c', overlayElements = [], startPosition = { x: 0, y: 2, z: 5 }, clippingPlane = 1000, controller = 'orbital') {
    // 1) Setup container
    const container = document.getElementById(containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2) Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 3) Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, clippingPlane);
    //camera.position.set(5, 5, 5); // or wherever
    camera.position.set(startPosition.x, startPosition.y, startPosition.z);

    // 4) Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: container.querySelector('canvas'),
        antialias: true
    });

    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);


    // Stats (optional)
    const stats = new Stats();
    //container.appendChild( stats.dom );


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

    // 5) Controls
    let controls;
    if (controller === 'none') {
        // Controls are explicitly set to none (ex: Adventure)
        controls = null;
    } else if (controller === 'orbital') {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = true; // we can toggle later

        controls.target.set(0, 0, 0); // set the target to the origin
        controls.update();
    } else if (controller === 'walking') {
        // TODO...
        controls = null;
    } else {
        controls = null;
    }


    camera.lookAt(0, 0, 0); // look at the origin

    // 6) Resize handling
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    return { scene, camera, renderer, controls, stats };
}
