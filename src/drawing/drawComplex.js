import { drawLibrary } from './library/drawLibrary.js';
import { animateRoom } from './drawRoom.js';
import { onKeyDownWalking, onKeyUpWalking } from '../config/walking.js';
import { loadThenDraw } from '../config/loadThenDraw.js';
import { drawTV, animationCallback as tvAnimation, onClick as tvOnClick } from './drawTV.js';
import { drawScreen, onClickScreen, onKeyScreen } from './drawScreen.js';
import { drawMultipleSvgs } from './drawSvg.js';

function drawComplex(scene, threejsDrawing) {
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
    const { mesh: screenMesh, css: screenCss, pickPlane } = drawScreen(scene, threejsDrawing.data.css3DRenderer.scene, 'https://www.darrenmackenzie.com', 'mythumbnail.png');

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
        'click': (event, data) => {
            const target = event.target;
            //if (target && target.classList.contains('tv-screen')) {
            //    tvOnClick(event, {camera: null, data: null, controls: null, renderer: null, scene: null});
            //}
            tvOnClick(event, data.scene, data.camera, data.renderer, data.data);
        },
        //'mousemove': (event) => {},
        'keydown': (event, data) => {
            const keyManager = data.data.keyManager;
            onKeyDownWalking(event, keyManager);
            const screen = data.data.screenMesh;
            const cssObj = data.data.screenCss;
            onKeyScreen(event, screen, cssObj)
        },
        'keyup': (event, data) => {
            const keyManager = data.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
        'pointerdown': (event, data) => {
            // onClickScreen(ev, dom, screen, camera)
            const dom = data.renderer.domElement;
            const screen = data.data.screenMesh;
            const cssObj = data.data.screenCss;
            const cssRenderer = data.data.css3DRenderer;
            const pickPlane = data.data.pickPlane;
            onClickScreen(event, dom, screen, data.camera, cssObj, cssRenderer.domElement, pickPlane);
        }
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        if (!threejsDrawing.data.staticBoxes || !threejsDrawing.data.movingMeshes || !threejsDrawing.data.worldMeshes) {
            console.warn('No static boxes, moving meshes, or world meshes found.');
            return;
        }
        animateRoom(renderer, timestamp, threejsDrawing, camera);
        tvAnimation(renderer, timestamp, threejsDrawing, camera);
    },
    'data': {
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
