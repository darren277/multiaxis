import { setupScene } from './config/sceneSetup.js';
import { attachUIListeners } from './config/attachUIListeners.js';
import { ClickAndKeyControls } from './config/clickControlHelper.js';

import { drawImage } from './drawing/drawImage.js';

import { loadDataSource, pixelToWorldUnits, prepareDrawingContext, drawHelpers } from './config/utils.js';

import { loadThenDraw } from './config/loadThenDraw.js';

import { OutlineEffect } from 'outline-effect';

import { usePanoramicCubeBackground, useProceduralBackground, usePanoramicCubeBackgroundSixFaces } from './drawing/drawBackground.js';

import uiPanelConfig from './config/uiPanelConfig.js';

import { drawNavCubes, onClickNav } from './config/navigation.js';

//import * as THREE from 'three'; // for any references you still need
import { TextureLoader, FileLoader } from 'three'; // for texture loading
// Or import { FileLoader } from 'three'; if you just need the loader

import { BoxGeometry, Mesh, MeshNormalMaterial, GridHelper, FloatType } from 'three';

import {update as tweenUpdate} from 'tween'

import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);

const DEBUG = false;


const textureLoader = new TextureLoader();

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
    'synapse': () => import('./drawing/drawNeuro.js').then(m => m.synapseDrawing),
    'brain': () => import('./drawing/drawBrain.js').then(m => m.brainDrawing),
    'chemistry': () => import('./drawing/drawChemistry.js').then(m => m.chemistryDrawing),
    'game': () => import('./drawing/drawGame.js').then(m => m.gameDrawing),
    'ammo': () => import('./drawing/drawAmmo.js').then(m => m.ammoDrawing),
    'periodic': () => import('./drawing/drawPeriodic.js').then(m => m.periodicDrawing),
    'monitor': () => import('./drawing/drawMonitor.js').then(m => m.monitorDrawing),
    'tv': () => import('./drawing/drawTV.js').then(m => m.tvDrawing),
    'drive': () => import('./drawing/drawDrive.js').then(m => m.driveDrawing),
    'farm': () => import('./drawing/drawFarm.js').then(m => m.farmDrawing),
    'exr': () => import('./drawing/drawEXR.js').then(m => m.exrDrawing),
    'skibidi': () => import('./drawing/drawSkibidi.js').then(m => m.skibidiDrawing),
    'physics': () => import('./drawing/drawPhysics.js').then(m => m.physicsDrawing),
    'audioviz': () => import('./drawing/drawAudioViz.js').then(m => m.audioVizDrawing),
    'network': () => import('./drawing/drawNetwork.js').then(m => m.networkDrawing),
    'smoke': () => import('./drawing/drawSmoke.js').then(m => m.smokeDrawing),
    'buildings': () => import('./drawing/drawGeo.js').then(m => m.buildingsDrawing),
};


document.addEventListener('DOMContentLoaded', () => {
    const drawingName = document.querySelector('meta[name="threejs_drawing_name"]').content;

    THREEJS_DRAWINGS[drawingName]().then(threejsDrawing => {
        contentLoadedCallback(threejsDrawing);
    })
})


const CUBE_DEFS = [
    { targetScene: 'library', position: [1, 0.25, -2], color: 0x00ff00 },
    { targetScene: 'farm', position: [2, 0.25, -2], color: 0x0000ff },
    { targetScene: 'room', position: [3, 0.25, -2], color: 0xff0000 },
    { targetScene: 'kitchen', position: [4, 0.25, -2], color: 0xffff00 },
    { targetScene: 'bathroom', position: [5, 0.25, -2], color: 0xff00ff },
    { targetScene: 'livingroom', position: [6, 0.25, -2], color: 0x00ffff }
]


async function contentLoadedCallback(threejsDrawing) {
    const dataSelected = document.querySelector('meta[name="data_selected"]').content;
    console.log(`Drawing name: ${threejsDrawing.name}. Data selected: ${dataSelected}`);

    if (!threejsDrawing) {
        console.error(`No drawing found for ${drawingName}`);
        return;
    }

    const outlineEffectEnabled = threejsDrawing.sceneConfig && threejsDrawing.sceneConfig.outlineEffect || false;

    const { scene, camera, renderer, controls, stats, cssRenderer } = await setupScene('c', threejsDrawing.sceneElements, threejsDrawing.sceneConfig);

    await prepareDrawingContext(threejsDrawing, scene, camera, renderer, controls, cssRenderer);

    for (const {func, dataSrc, dataType} of threejsDrawing.drawFuncs) {
        if (dataSrc) {
            loadThenDraw(scene, func, dataSrc, dataType, camera, threejsDrawing, dataSelected);
        } else {
            await func(scene, threejsDrawing);
        }
    }

    if (DEBUG === true) {
        drawHelpers(scene, threejsDrawing);
        const clickKeyControls = new ClickAndKeyControls(scene, camera, renderer);
    }

    // --- OPTION 1: Panoramic cube skybox ---
    //usePanoramicCubeBackground(scene, 'textures/sun_temple_stripe.jpg');
    //usePanoramicCubeBackgroundSixFaces(scene, 'textures/exr/golden_gate_hills_1k');

    // --- OPTION 2: Simple procedural background ---
    /////useProceduralBackground(scene);

    // NAV CUBE //
    //drawNavCubes(scene, threejsDrawing, CUBE_DEFS);

    // Add event listener for navigation
    window.addEventListener('click', (event) => {
        onClickNav(event, scene, renderer, camera);
    });

    //drawImage(scene, 'textures/Canestra_di_frutta_Caravaggio.jpg');

    // Setup UI listeners
    //attachUIListeners(uiPanelConfig, uiState);

    // Add any event listeners from the threejsDrawing
    if (threejsDrawing.eventListeners) {
        for (const [eventName, eventFunc] of Object.entries(threejsDrawing.eventListeners)) {
            window.addEventListener(eventName, (e) => {
                eventFunc(e, {camera, data: threejsDrawing.data, controls, renderer, scene});
            });
        }
    }

    if (outlineEffectEnabled) {
        const effect = new OutlineEffect(renderer);
    }

    renderer.setAnimationLoop((timestamp, frame) => {
        // Update controls (if using OrbitControls or similar)
        if (controls) {
            controls.update();
        }

        if (threejsDrawing.animationCallback) {
            threejsDrawing.animationCallback(renderer, timestamp, threejsDrawing, camera);
        }

        // Update camera projection if needed
        camera.updateProjectionMatrix();

        tweenUpdate();

        if (stats) {
            stats.update();
        }

        renderer.render(scene, camera);

        // CSS Renderer (2d or 3d)
        if (cssRenderer) {
            cssRenderer.render(scene, camera);
        }

        if (outlineEffectEnabled) {
            effect.render(scene, camera);
        }
    });
}
