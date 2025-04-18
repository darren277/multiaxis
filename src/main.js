import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';
import { ClickAndKeyControls } from './config/clickControlHelper.js';

import { drawImage } from './drawing/drawImage.js';

import { usePanoramicCubeBackground, useProceduralBackground } from './drawing/drawBackground.js';

import uiPanelConfig from './config/uiPanelConfig.js';

//import * as THREE from 'three'; // for any references you still need
import { TextureLoader, FileLoader } from 'three'; // for texture loading
// Or import { FileLoader } from 'three'; if you just need the loader

import {update as tweenUpdate} from 'tween'

import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);

const DEBUG = false;


const textureLoader = new TextureLoader();
const fileLoader = new FileLoader();


const loadDataSource = (scene, dataSrc, drawFunc, state) => {
    const jsonPath = `./data/${dataSrc}.json`;

    fileLoader.load(
        jsonPath,
        (dataString) => {
            const data = JSON.parse(dataString);
            drawFunc(scene, data, state);
        },
        undefined, // onProgress
        (err) => {
            console.error(`Error loading ${jsonPath}`, err);
        }
    );
}

const THREEJS_DRAWINGS = {
    'room': () => import('./drawing/drawRoom.js').then(m => m.roomDrawing),
    'adventure': () => import('./drawing/adventure/drawAdventure.js').then(m => m.adventureDrawing),
    'music': () => import('./drawing/drawSheetMusic.js').then(m => m.musicDrawing),
    'multiaxis': () => import('./drawing/drawChart.js').then(m => m.multiAxisDrawing),
    'cayley': () => import('./drawing/drawGraph.js').then(m => m.cayleyDrawing),
    'force': () => import('./drawing/drawGraph.js').then(m => m.forceDrawing),
    'geo': () => import('./drawing/drawGeo.js').then(m => m.geoDrawing),
    'geo3d': () => import('./drawing/drawGeo.js').then(m => m.geoDrawing3d),
    'quantum': () => import('./drawing/drawQuantum.js').then(m => m.quantumDrawing),
    'svg': () => import('./drawing/drawSvg.js').then(m => m.svgDrawing),
    'library': () => import('./drawing/library/drawLibrary.js').then(m => m.libraryDrawing),
    'plot': () => import('./drawing/drawPlotFunction.js').then(m => m.plotFunctionDrawing),
    'rubiks': () => import('./drawing/drawRubiksCube.js').then(m => m.rubiksCubeDrawing),
    'chess': () => import('./drawing/drawChess.js').then(m => m.chessDrawing),
    'clustering': () => import('./drawing/drawClustering.js').then(m => m.clusteringDrawing),
    'orbits': () => import('./drawing/drawOrbits.js').then(m => m.orbitsDrawing),
    'force3d': () => import('./drawing/drawForce.js').then(m => m.force3dDrawing),
    'cards': () => import('./drawing/drawCards.js').then(m => m.cardsDrawing),
    'gltf': () => import('./drawing/drawGLTF.js').then(m => m.gltfDrawing),
};


function drawHelpers(scene, threejsDrawing) {
    const refGeometry = new THREE.BoxGeometry(1, 1, 1); // 1x1x1 cube
    const refMaterial = new THREE.MeshNormalMaterial({ wireframe: true });
    const refCube = new THREE.Mesh(refGeometry, refMaterial);
    refCube.position.set(0, 0.5, 0); // sit on ground
    scene.add(refCube);

    const gridHelper = new THREE.GridHelper(10, 10); // 10x10 units
    scene.add(gridHelper);

    //window.debugObject = object; // now accessible from console

//    document.addEventListener('keydown', (e) => {
//        if (e.key === 'ArrowUp') window.debugObject.position.z -= 0.1;
//        if (e.key === 'ArrowDown') window.debugObject.position.z += 0.1;
//        if (e.key === 'ArrowLeft') window.debugObject.position.x -= 0.1;
//        if (e.key === 'ArrowRight') window.debugObject.position.x += 0.1;
//    });
}

function pixelToWorldUnits(pixelSize, distance, camera) {
    const fovInRad = camera.fov * (Math.PI / 180);
    const screenHeight = 2 * Math.tan(fovInRad / 2) * distance;
    const pixelHeightInWorld = screenHeight / window.innerHeight;
    return pixelSize * pixelHeightInWorld;
}

document.addEventListener('DOMContentLoaded', () => {
    const drawingName = document.querySelector('meta[name="threejs_drawing_name"]').content;

    THREEJS_DRAWINGS[drawingName]().then(threejsDrawing => {
        contentLoadedCallback(threejsDrawing);
    })
})

async function contentLoadedCallback(threejsDrawing) {
    const dataSelected = document.querySelector('meta[name="data_selected"]').content;

    console.log(`Drawing name: ${threejsDrawing.name}. Data selected: ${dataSelected}`);

    // 1) Setup the scene
    if (!threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const startPosition = threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.startPosition || {x: 0, y: 2, z: 5};
    const clippingPlane = threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.clippingPlane || 1000;
    const controller = threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.controller || 'orbital';
    const cssRendererEnabled = threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.cssRenderer || false;

    const { scene, camera, renderer, controls, stats, cssRenderer } = await setupScene('c', threejsDrawing.sceneElements, startPosition, clippingPlane, controller, cssRendererEnabled);

    // TODO: Are these all necessary?
    // And if any of them are, only conditionally?
    // Also, possibly redundant with `uiState`.
    threejsDrawing.data.camera = camera;
    threejsDrawing.data.renderer = renderer;
    threejsDrawing.data.scene = scene;
    threejsDrawing.data.controls = controls;

    for (const {func, dataSrc, dataType} of threejsDrawing.drawFuncs) {
        if (dataSrc) {
            const data_src = dataSelected ? dataSelected : dataSrc;
            console.log(`Loading data source: ${data_src}`);
            threejsDrawing.data.dataSrc = data_src;
            if (dataType === 'svg') {
                import('svgloader').then(m => {
                    const SVGLoader = m.SVGLoader;
                    svgLoader.load(`./imagery/${data_src}_out_annotated.svg`, (data) => {
                        func(scene, data, threejsDrawing);
                    });
                });
            } else if (dataType === 'json') {
                const worldWidth = pixelToWorldUnits(480, 5, camera); // 480px at 5 units away
                const worldHeight = pixelToWorldUnits(360, 5, camera);
                threejsDrawing.data.worldWidth = worldWidth;
                threejsDrawing.data.worldHeight = worldHeight;
                if (threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.isForceGraph) {
                    threejsDrawing.data.renderer = renderer;
                    threejsDrawing.data.camera = camera;
                    threejsDrawing.data.controls = controls;
                }
                loadDataSource(scene, data_src, func, threejsDrawing);
            } else if (dataType === 'gltf') {
                import('gltfloader').then(m => {
                    const GLTFLoader = m.GLTFLoader;
                    const gltfLoader = new GLTFLoader();
                    gltfLoader.load(`./imagery/${data_src}.glb`, (gltf) => {
                        console.log(`Loaded GLTF model: ${data_src}`, gltf);
                        func(scene, gltf, threejsDrawing);
                    });
                });
            } else {
                console.error(`Unknown data type: ${dataType}`);
            }
        } else {
            func(scene, threejsDrawing);
        }
    }

    if (DEBUG === true) {
        drawHelpers(scene, threejsDrawing);
        const clickKeyControls = new ClickAndKeyControls(scene, camera, renderer);
    }

    // 2) Create a shared state for the UI
    const uiState = {
        camera,
        controls,
        orbitEnabled: true,
        // anything else we might want the UI to manipulate
    };

    // update uiState to add the threejsDrawing uiState...
    if (threejsDrawing) {
        Object.assign(uiState, threejsDrawing.uiState);
    }

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene);

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');

    // 4) Setup UI listeners
    attachUIListeners(uiPanelConfig, uiState);

    // Add any event listeners from the threejsDrawing
    if (threejsDrawing.eventListeners) {
        for (const [eventName, eventFunc] of Object.entries(threejsDrawing.eventListeners)) {
            window.addEventListener(eventName, (e) => {
                eventFunc(e, {camera, data: threejsDrawing.data, controls, uiState, renderer, scene});
            });
        }
    }

    // 5) Animate loop
    renderer.setAnimationLoop((timestamp, frame) => {
        // Update controls (if using OrbitControls or similar)
        if (controls) {
            controls.update();
        }

        // Update UI state and call your animation callback
        uiState.rect = renderer.domElement.getBoundingClientRect();
        if (threejsDrawing.animationCallback) {
            threejsDrawing.data.controls = controls;
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, uiState, camera);
        }

        // Update camera projection if needed
        camera.updateProjectionMatrix();

        // Run any tweens or animations
        tweenUpdate();

        // Update debug stats
        if (stats) {
            stats.update();
        }

        // Final render
        renderer.render(scene, camera);

        // CSS Renderer (2d or 3d)
        if (cssRenderer) {
            cssRenderer.render(scene, camera);
        }
    });
}
