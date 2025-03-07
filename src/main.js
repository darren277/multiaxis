import * as THREE from 'three';

import { TextGeometry} from 'textgeometry';
import { FontLoader } from 'fontloader';
import { OrbitControls } from 'orbitcontrols';

const surrounding_opacity = 0.1;

const container = document.getElementById('c');
const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();

renderer.setSize(width, height);

renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const loader = new THREE.FileLoader();

const controls = new OrbitControls( camera, renderer.domElement );

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);


var data_src = document.getElementsByName('datasrc')[0].content;

loader.load(
    `./data/${data_src}.json`,
    function ( data ) {
        const graphData = JSON.parse(data);

        let box = new THREE.BoxGeometry(graphData.axes[0].max, graphData.axes[1].max, graphData.axes[2].max);
        box.translate(graphData.axes[0].max / 2, graphData.axes[1].max / 2, graphData.axes[2].max / 2);
        let boxMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: surrounding_opacity});
        let boxMesh = new THREE.Mesh(box, boxMaterial);
        scene.add(boxMesh);

        // draw the axes...
        for (let axis of graphData.axes) {
            let label = axis.label;

            let axisGeometry = new THREE.BoxGeometry(axis.max, 0.1, 0.1);
            if (axis.label === 'x') {
                axisGeometry = new THREE.BoxGeometry(axis.max, 0.1, 0.1);
            }
            else if (axis.label === 'y') {
                axisGeometry = new THREE.BoxGeometry(0.1, axis.max, 0.1);
            }
            else if (axis.label === 'z') {
                axisGeometry = new THREE.BoxGeometry(0.1, 0.1, axis.max);
            }

            let axisMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
            let axisMesh = new THREE.Mesh(axisGeometry, axisMaterial);
            scene.add(axisMesh);

            // draw the labels...
            const loader = new FontLoader();
            loader.load( 'scripts/helvetiker_regular.typeface.json', function ( font ) {
                let axisLabel = new TextGeometry(axis.label, {font: font, size: 1, depth: 0.01});
                if (axis.label === 'x') {
                    axisLabel.translate(axis.max, 0, 0);
                }
                else if (axis.label === 'y') {
                    axisLabel.translate(0, axis.max, 0);
                }
                else if (axis.label === 'z') {
                    axisLabel.translate(0, 0, axis.max);
                }
                let axisLabelMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
                let axisLabelMesh = new THREE.Mesh(axisLabel, axisLabelMaterial);
                scene.add(axisLabelMesh);
            });

            // draw the ticks...
            for (let i = axis.min; i <= axis.max; i += axis.step) {
            let tickGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                if (axis.label === 'x') {
                    tickGeometry.translate(i, 0, 0);
                }
                else if (axis.label === 'y') {
                    tickGeometry.translate(0, i, 0);
                }
                else if (axis.label === 'z') {
                    tickGeometry.translate(0, 0, i);
                }

                let tickMaterial = new THREE.MeshBasicMaterial({color: 0x00ffff});
                let tickMesh = new THREE.Mesh(tickGeometry, tickMaterial);
                scene.add(tickMesh);
            }
        }

        // draw the points...
        for (let point of graphData.points) {
            let pointGeometry = new THREE.SphereGeometry(point[4]?.size ?? 0.1);
            pointGeometry.translate(point[0], point[1], point[2]);
            let pointMaterial = new THREE.MeshBasicMaterial({color: point[3]});
            let pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            scene.add(pointMesh);

            if (point[4]?.label) {
                const loader = new FontLoader();
                loader.load( 'scripts/helvetiker_regular.typeface.json', function ( font ) {
                    let pointLabel = new TextGeometry(point[4].label, {font: font, size: point[4]?.size ?? 1, depth: 0.01});
                    let labelCoordinates = determineLabelCoordinates(point[0], point[1], point[2], point[4]?.size ?? 0.1);
                    pointLabel.translate(labelCoordinates[0], labelCoordinates[1], labelCoordinates[2]);
                    let pointLabelMaterial = new THREE.MeshBasicMaterial({color: point[3]});
                    let pointLabelMesh = new THREE.Mesh(pointLabel, pointLabelMaterial);
                    scene.add(pointLabelMesh);
                });
            }
        }

        // Set initial camera position based on the data
        const maxDimension = Math.max(
            graphData.axes[0].max,
            graphData.axes[1].max,
            graphData.axes[2].max
        );
    }
);

const testGeo = new THREE.BoxGeometry(1, 1, 1);
const testMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const testCube = new THREE.Mesh(testGeo, testMat);
scene.add(testCube);

camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);


const orbitToggleBtn = document.getElementById('orbit-toggle-btn');
let orbitEnabled = true;

orbitToggleBtn.addEventListener('click', () => {
  orbitEnabled = !orbitEnabled;
  controls.enabled = orbitEnabled;
  orbitToggleBtn.innerText = orbitEnabled ? 'Orbit: ON' : 'Orbit: OFF';
});


function determineLabelCoordinates(p1, p2, p3, radius) {
    let x = p1 + (radius * 2);
    let y = p2;
    let z = p3;
    return [x, y, z];
};


function animate() {
    requestAnimationFrame(animate);

    controls.update();

    testCube.rotation.x += 0.01;
    testCube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();
