import { Mesh } from 'three';

import { TextGeometry} from 'textgeometry';
import { FontLoader } from 'fontloader';

import { determineLabelCoordinates } from '../config/utils.js';

import chartConfig from './chartConfig.js';


const surrounding_opacity = 0.1;


/**
 * Draw a 3D chart into the scene, using the given config object.
 * If no config is passed in, we default to the imported 'chartConfig'.
 */
function drawChart( scene, data, state, config = chartConfig ) {
    const graphData = data;

    // --- 1) Surrounding box ---
    const xSize = graphData.axes[0].max;
    const ySize = graphData.axes[1].max;
    const zSize = graphData.axes[2].max;

    const boxGeometry = config.surroundingBox.geometry(xSize, ySize, zSize);
    // Center the box if you want
    boxGeometry.translate(xSize / 2, ySize / 2, zSize / 2);

    const boxMaterial = config.surroundingBox.material();
    const boxMesh = new Mesh(boxGeometry, boxMaterial);
    scene.add(boxMesh);

    // --- 2) Axes, labels, and ticks ---
    const loader = new FontLoader();

    // You probably only want to load your font once, rather than re-loading for each axis/point.
    loader.load(config.fontUrl, (font) => {
        graphData.axes.forEach((axis) => {
            // Axis geometry & material
            const axisGeometry = config.axis.geometry(axis.label, axis.max);
            const axisMaterial = config.axis.material();
            const axisMesh = new Mesh(axisGeometry, axisMaterial);
            scene.add(axisMesh);

            // Axis label
            const axisLabelGeo = new TextGeometry(axis.label, {
                font,
                size: config.axisLabels.size,
                depth: config.axisLabels.depth,
            });
            // Reposition label
            if (axis.label === 'x') {
                axisLabelGeo.translate(axis.max, 0, 0);
            } else if (axis.label === 'y') {
                axisLabelGeo.translate(0, axis.max, 0);
            } else if (axis.label === 'z') {
                axisLabelGeo.translate(0, 0, axis.max);
            }
            const axisLabelMat = config.axisLabels.material(axis.label);
            const axisLabelMesh = new Mesh(axisLabelGeo, axisLabelMat);
            scene.add(axisLabelMesh);

            // Ticks
            for (let i = axis.min; i <= axis.max; i += axis.step) {
                const tickGeometry = config.axisTicks.geometry();
                if (axis.label === 'x') {
                    tickGeometry.translate(i, 0, 0);
                } else if (axis.label === 'y') {
                    tickGeometry.translate(0, i, 0);
                } else if (axis.label === 'z') {
                    tickGeometry.translate(0, 0, i);
                }
                const tickMaterial = config.axisTicks.material();
                const tickMesh = new Mesh(tickGeometry, tickMaterial);
                scene.add(tickMesh);
            }
        });

        // --- 3) Plot data points ---
        graphData.points.forEach((point) => {
            // point is like [ x, y, z, color, { size, label } ]

            // geometry & material
            const pointGeometry = config.points.geometry(point);
            // translate geometry to correct location
            pointGeometry.translate(point[0], point[1], point[2]);

            const pointMaterial = config.points.material(point);
            const pointMesh = new Mesh(pointGeometry, pointMaterial);
            scene.add(pointMesh);

            // If there is a label for this point, draw it
            if (point[4]?.label) {
                const labelGeo = new TextGeometry(point[4].label, {
                    font,
                    size: config.pointLabels.size(point), // call the function
                    depth: config.pointLabels.depth,
                });
                const labelCoordinates = determineLabelCoordinates(
                    point[0],
                    point[1],
                    point[2],
                    point[4]?.size ?? 0.1
                );
                labelGeo.translate(
                    labelCoordinates[0],
                    labelCoordinates[1],
                    labelCoordinates[2]
                );

                const labelMat = config.pointLabels.material(point);
                const labelMesh = new Mesh(labelGeo, labelMat);
                scene.add(labelMesh);
            }
        });

        // 4) Optionally adjust camera, lighting, etc. based on data
        // ...

        // Set initial camera position based on the data
//        const maxDimension = Math.max(
//            graphData.axes[0].max,
//            graphData.axes[1].max,
//            graphData.axes[2].max
//        );
    });
}

const multiAxisDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawChart, 'dataSrc': 'data', 'dataType': 'json'}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
        'sheetMusic': null,
    }
}

export { multiAxisDrawing };
