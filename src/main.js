import * as THREE from 'three';

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const surrounding_opacity = 0.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const loader = new THREE.FileLoader();

const controls = new OrbitControls( camera, renderer.domElement );


loader.load(
    'data.json',
    function ( data ) {
        const graphData = JSON.parse(data);

        // draw the surrounding box...
        let box = new THREE.BoxGeometry(graphData.axes[0].max, graphData.axes[1].max, graphData.axes[2].max);
        // center the box...
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
            loader.load( 'three/fonts/helvetiker_regular.typeface.json', function ( font ) {
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
            let pointGeometry = new THREE.SphereGeometry(0.1);
            pointGeometry.translate(point[0], point[1], point[2]);
            let pointMaterial = new THREE.MeshBasicMaterial({color: point[3]});
            let pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            scene.add(pointMesh);
        }
    }
);


camera.position.z = 25;

function animate() { renderer.render( scene, camera ); }
renderer.setAnimationLoop( animate );
