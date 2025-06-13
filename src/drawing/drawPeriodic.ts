/* Adapted from https://github.com/mrdoob/three.js/blob/master/examples/css3d_periodictable.html */

import { Vector3, Object3D, BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
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

function drawCube(scene, objects, targets) {
    const boxSize = 2000;
    // Draws an invisible cube and then aligns the objects to it, all facing the center...
    const cubeGeometry = new BoxGeometry(boxSize, boxSize, boxSize);
    const cubeMaterial = new MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
    const cubeMesh = new Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(0, 0, 0);

    scene.add(cubeMesh);

    const totalObjects = objects.length;

    // divided by four faces...
    const objectsPerFace = totalObjects / 4;
    const rowsPerFace = Math.sqrt(objectsPerFace);
    const colsPerFace = Math.sqrt(objectsPerFace);
    const faceWidth = boxSize / colsPerFace;
    const faceHeight = boxSize / rowsPerFace;
    const faceOffset = 200 - (faceWidth / 2);
    const faceOffsetY = 200 - (faceHeight / 2);
    const faceOffsetZ = 200 - (faceWidth / 2);

    for (let i = 0; i < objects.length; i++) {
        const object = new Object3D();

        const face = Math.floor(i / objectsPerFace);
        const index = i % objectsPerFace;
        const row = Math.floor(index / colsPerFace);
        const col = index % colsPerFace;

        if (face === 0) {
            object.position.set(col * faceWidth - faceOffset, row * faceHeight - faceOffsetY, -faceOffsetZ);
        } else if (face === 1) {
            object.position.set(col * faceWidth - faceOffset, row * faceHeight - faceOffsetY, faceOffsetZ);
        } else if (face === 2) {
            object.position.set(faceOffsetZ, col * faceWidth - faceOffset, row * faceHeight - faceOffsetY);
        } else if (face === 3) {
            object.position.set(-faceOffsetZ, col * faceWidth - faceOffset, row * faceHeight - faceOffsetY);
        }

        object.lookAt(0, 0, 0);
        object.rotateY(Math.PI / 2);
        object.rotateX(Math.PI / 2);

        targets.cube.push(object);
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

    const buttonCube = document.getElementById('cube');
    buttonCube.addEventListener('click', function () {
        transform(targets.cube, objects, 2000);
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
    const targets = { table: [], sphere: [], helix: [], grid: [], cube: [] };
    drawTable(scene, objects, targets, data);
    drawSphere(scene, objects, targets);
    drawHelix(scene, objects, targets);
    drawGrid(scene, objects, targets);
    drawCube(scene, objects, targets);
    drawButtons(scene, objects, targets);
}


const periodicDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawPeriodic, 'dataSrc': 'periodic', 'dataType': 'json'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
    },
    'sceneConfig': {
        'cssRenderer': '3D',
        'controller': 'trackball',
    }
}

export { periodicDrawing };
