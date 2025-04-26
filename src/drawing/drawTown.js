import { drawHouses } from './drawHouse.js';
import { drawSun } from './drawLights.js';
import { createPerlinGrassTexture } from './drawGrass.js';
import { PlaneGeometry, Mesh, MeshStandardMaterial } from 'three';


function drawTown(scene, threejsDrawing) {
    const floorGeometry = new PlaneGeometry(200, 200);
    //const floor = new Mesh(floorGeometry, grassMaterial);
    //const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createGrassTexture()}));
    const floor = new Mesh(floorGeometry, new MeshStandardMaterial({map: createPerlinGrassTexture()}));

    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    scene.add(floor);

    // Add basic lights
    //drawBasicLights(scene);
    drawSun(scene);

    drawHouses(scene);
}


const townDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawTown, 'dataSrc': null}
    ],
    'eventListeners': {
        'click': (event, data) => {
//            const renderer = data.renderer;
//            const threejsDrawing = data.threejsDrawing;
//            const camera = data.camera;
//            onDoorClick(event, renderer, camera);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
    }
}

export { townDrawing };
