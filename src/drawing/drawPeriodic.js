/* Adapted from https://github.com/mrdoob/three.js/blob/master/examples/css3d_periodictable.html */

import { Vector3, Object3D } from 'three';
import { Tween, Easing, removeAll } from 'tween';
import { CSS3DRenderer, CSS3DObject } from 'css3drenderer';

const vector = new Vector3();

function drawTable(scene, objects, targets, data) {
    const table = data;

    for (let i = 0; i < table.length; i+=5) {
        const element = document.createElement('div');
        element.className = 'element';
        element.style.backgroundColor = 'rgba(0,127,127,' + (Math.random() * 0.5 +0.25) + ')';

        const number = document.createElement('div');
        number.className = 'number';
        number.textContent = (i/5) + 1;
        element.appendChild(number);

        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.textContent = table[i];
        element.appendChild(symbol);

        const details = document.createElement('div');
        details.className = 'details';
        details.innerHTML = table[i+1] + '<br>' + table[i+2];
        element.appendChild(details);

        const objectCSS = new CSS3DObject(element);
        objectCSS.position.x = Math.random() * 4000 - 2000;
        objectCSS.position.y = Math.random() * 4000 - 2000;
        objectCSS.position.z = Math.random() * 4000 - 2000;
        scene.add(objectCSS);
        objects.push(objectCSS);

        const object = new Object3D();
        object.position.x = (table[i+3]*140) - 1330;
        object.position.y = -(table[i+4]*180) + 990;

        targets.table.push(object);
    }
};

function drawSphere(scene, objects, targets) {
    for (let i = 0, l = objects.length; i < l; i++) {
        const phi = Math.acos(-1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;

        const object = new Object3D();
        object.position.setFromSphericalCoords(800, phi, theta);
        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);
        targets.sphere.push(object);
    }
}

function drawHelix(scene, objects, targets) {
    for (let i = 0, l = objects.length; i < l; i++) {
        const theta = i * 0.175 + Math.PI;
        const y = - (i * 8) + 450;

        const object = new Object3D();

        object.position.setFromCylindricalCoords(900, theta, y);

        vector.x = object.position.x * 2;
        vector.y = object.position.y;
        vector.z = object.position.z * 2;

        object.lookAt(vector);

        targets.helix.push(object);
    }
}

function drawGrid(scene, objects, targets) {
    for (let i = 0; i < objects.length; i++) {
        const object = new Object3D();

        object.position.x = ((i % 5) * 400) - 800;
        object.position.y = (-(Math.floor(i / 5) % 5) * 400) + 800;
        object.position.z = (Math.floor(i / 25)) * 1000 - 2000;

        targets.grid.push(object);
    }
}

function drawButtons(scene, objects, targets) {
    const buttonTable = document.getElementById('table');
    buttonTable.addEventListener('click', function () {
        transform(targets.table, objects, 2000);
    });

    const buttonSphere = document.getElementById('sphere');
    buttonSphere.addEventListener('click', function () {
        transform(targets.sphere, objects, 2000);
    });

    const buttonHelix = document.getElementById('helix');
    buttonHelix.addEventListener('click', function () {
        transform(targets.helix, objects, 2000);
    });

    const buttonGrid = document.getElementById('grid');
    buttonGrid.addEventListener('click', function () {
        transform(targets.grid, objects, 2000);
    });

    transform(targets.table, objects, 2000);
}

function transform(targets, objects, duration) {
    removeAll();

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const target = targets[i];

        new Tween(object.position)
            .to({x: target.position.x, y: target.position.y, z: target.position.z}, Math.random() * duration + duration)
            .easing(Easing.Exponential.InOut).start();

        new Tween(object.rotation)
            .to({x: target.rotation.x, y: target.rotation.y, z: target.rotation.z}, Math.random() * duration + duration)
            .easing(Easing.Exponential.InOut).start();
    }
}

function drawPeriodic(scene, data, threejsDrawing) {
    const objects = [];
    const targets = { table: [], sphere: [], helix: [], grid: [] };
    drawTable(scene, objects, targets, data);
    drawSphere(scene, objects, targets);
    drawHelix(scene, objects, targets);
    drawGrid(scene, objects, targets);
    drawButtons(scene, objects, targets);
}


const periodicDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawPeriodic, 'dataSrc': 'periodic', 'dataType': 'json'}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    },
    'sceneConfig': {
        'cssRenderer': '3D',
        'controller': 'trackball',
    }
}

export { periodicDrawing };
