import * as THREE from 'three';
import { addAxes } from './drawPlotFunction.js'

function drawClustering(scene, data, threejsDrawing) {
    // Add axes
    addAxes(scene, 5);

    // Plot some functions
    data.forEach(point => {
        // Create a small sphere for each data point
        const geometry = new THREE.SphereGeometry(0.05, 12, 12);

        // Color material differently by cluster
        // (You might want to define a mapping from cluster -> color)
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const clusterColor = colors[point.cluster % colors.length];

        const material = new THREE.MeshBasicMaterial({ color: clusterColor });
        const sphere = new THREE.Mesh(geometry, material);

        // Set 3D position
        sphere.position.set(point.x, point.y, point.z);

        // Add to scene
        scene.add(sphere);
      });

    // Add any additional scene elements from threejsDrawing
//    for (const element of threejsDrawing.sceneElements) {
//        scene.add(element);
//    }
}



const clusteringDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawClustering, 'dataSrc': 'clustering', 'dataType': 'json'}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    }
}


export { clusteringDrawing };
