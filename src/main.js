import * as THREE from 'three';

import { TextGeometry} from 'textgeometry';
import { FontLoader } from 'fontloader';
import { OrbitControls } from 'orbitcontrols';

import { drawChart } from './drawChart.js';
import { determineLabelCoordinates } from './utils.js';

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

//controls.enableDamping = true; // Add smooth damping
//controls.dampingFactor = 0.05;
//controls.screenSpacePanning = false;
//controls.minDistance = 5;
//controls.minDistance = 0.1;
//controls.maxDistance = 50;
//controls.maxPolarAngle = Math.PI / 2;
//controls.target.set(0, 0, 0);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);


var data_src = document.getElementsByName('datasrc')[0].content;

loader.load(
    `./data/${data_src}.json`,
    (data) => drawChart(scene, data)
);

//camera.position.set(maxDimension * 1.5, maxDimension * 1.5, maxDimension * 1.5);
//camera.lookAt(maxDimension / 2, maxDimension / 2, maxDimension / 2);
//camera.position.set( 10, 10, 10 );
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);


const orbitToggleBtn = document.getElementById('orbit-toggle-btn');
let orbitEnabled = true;

orbitToggleBtn.addEventListener('click', () => {
  orbitEnabled = !orbitEnabled;
  controls.enabled = orbitEnabled;
  orbitToggleBtn.innerText = orbitEnabled ? 'Orbit: ON' : 'Orbit: OFF';
});



function animate() {
    requestAnimationFrame(animate);

    controls.update();

    //testCube.rotation.x += 0.01;
    //testCube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();
