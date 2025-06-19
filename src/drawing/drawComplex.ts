import * as THREE from 'three';
import { drawLibrary } from './library/drawLibrary';
import { animateRoom } from './reusables/drawRoom';
import { onKeyDownWalking, onKeyUpWalking } from '../config/walking';
import { loadThenDraw } from '../config/loadThenDraw';
import { drawTV, animationCallback as tvAnimation, onClick as tvOnClick } from './reusables/drawTV';
import { drawScreen, onClickScreen, onKeyScreen } from './reusables/drawScreen';
import { drawMultipleSvgs } from './reusables/drawSvg';
import { ThreeJSDrawing } from '../types';

function drawComplex(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    if (!threejsDrawing.uniqueId) {
        threejsDrawing.uniqueId = Math.random();
        console.log(`%c[LIFECYCLE] Main threejsDrawing object tagged with ID: ${threejsDrawing.uniqueId}`, 'color: blue; font-weight: bold;');
    }

    // Draw the library
    drawLibrary(scene, threejsDrawing);

    // Draw the TV
    //drawTV(scene, threejsDrawing);
    const dataSrc = 'tv_sony_trinitron';
    const dataType = 'gltf';
    const dataSelected = 'tv_sony_trinitron';
    const camera = threejsDrawing.camera;
    loadThenDraw(scene, drawTV, dataSrc, dataType, camera, threejsDrawing, dataSelected);

    const tv = threejsDrawing.data.tv;

    // Draw the screen
    const css3DRenderer = threejsDrawing.data.css3DRenderer as { scene: THREE.Scene };
    const { mesh: screenMesh, css: screenCss, pickPlane } = drawScreen(
        scene,
        'screen', // or another appropriate string identifier
        'main',   // or another appropriate string identifier
        {
            webglScene: scene,
            cssScene: css3DRenderer.scene,
            url: 'https://www.darrenmackenzie.com',
            thumbnail: 'mythumbnail.png'
        }
    );

    threejsDrawing.data.screenMesh = screenMesh;
    threejsDrawing.data.screenCss = screenCss;
    threejsDrawing.data.pickPlane = pickPlane;

    // Draw multiple SVGs
    drawMultipleSvgs(scene, null, threejsDrawing);
}

const complexDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawComplex, 'dataSrc': null}
    ],
    'eventListeners': {
        'click': (event: MouseEvent, data: any) => {
            const target = event.target;
            //if (target && target.classList.contains('tv-screen')) {
            //    tvOnClick(event, {camera: null, data: null, controls: null, renderer: null, scene: null});
            //}
            console.log(`[EVENT] Click handler sees ID: ${data.uniqueId}`);
            console.log('TV click event:', data);
            const wasTvClickHandled = tvOnClick(event, data.scene, data.camera, data.renderer, data);

            if (wasTvClickHandled) {
                // ...then stop this event from propagating to any other listeners
                // (like the one that enables Pointer Lock).
                event.stopPropagation();
                console.log("TV click handled, stopping event propagation.");
                return; 
            }
        },
        //'mousemove': (event) => {},
        'keydown': (event: KeyboardEvent, data: any) => {
            const keyManager = data.data.keyManager;
            onKeyDownWalking(event, keyManager);
            const screen = data.data.screenMesh;
            const cssObj = data.data.screenCss;
            onKeyScreen(event, screen, cssObj)
        },
        'keyup': (event: KeyboardEvent, data: any) => {
            const keyManager = data.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
        'pointerdown': (event: PointerEvent, data: any) => {
            // onClickScreen(ev, dom, screen, camera)
            const dom = data.renderer.domElement;
            const screen = data.data.screenMesh;
            const cssObj = data.data.screenCss;
            const cssRenderer = data.data.css3DRenderer;
            const pickPlane = data.data.pickPlane;
            onClickScreen(event, dom, screen, data.camera, cssObj, cssRenderer.domElement, pickPlane);
        }
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        if (!threejsDrawing.data.staticBoxes || !threejsDrawing.data.movingMeshes || !threejsDrawing.data.worldMeshes) {
            console.warn('No static boxes, moving meshes, or world meshes found.');
            return;
        }

        if (threejsDrawing.data.tv && !threejsDrawing.data.tv.rotated) {
            threejsDrawing.data.tv.rotated = true;
            threejsDrawing.data.tv.rotation.set(0, Math.PI, 0);
        }

        animateRoom(renderer, timestamp, threejsDrawing, camera);
        tvAnimation(renderer, timestamp, threejsDrawing, camera);
    },
    'data': {
        'tv': null,
        'tvX': 0, 'tvY': 0, 'tvZ': -30,
        'tvScale': 10,
        'movingMeshes': [], 'staticBoxes': [], 'worldMeshes': [], 'obstacleBoxes': [],
    },
    'sceneConfig': {
        'cssRendererEnabled': 'DUAL',
        'startPosition': { x: 0, y: 10, z: 0 },
        'lookAt': { x: 0, y: 10, z: 10 },
    }
}

export { complexDrawing }
