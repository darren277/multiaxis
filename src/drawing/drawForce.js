import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import ForceGraph3D from '3d-force-graph';

function drawForce3dGraph(scene, data, threejsDrawing) {
    const { renderer, camera, controls } = threejsDrawing.data;

    const dataSrc = threejsDrawing.data.dataSrc;
    const dagMode = threejsDrawing.dataSources[dataSrc] && threejsDrawing.dataSources[dataSrc].specialOptions.dagMode;
    console.log('dagMode', dagMode);

    if (threejsDrawing.data._forceGraphInstance) {
        console.warn('ForceGraph already initialized');
        return;
    }

    // TODO: Cannot get this way to work yet...
    //const canvas = renderer.domElement;

    const canvas = document.getElementById('3d-graph');
    console.log('canvas', canvas);

    // TODO: Cannot get this way to work yet...
//    const Graph = new ForceGraph3D({
//        scene,
//        camera,
//        renderer,
//        controls,
//        //extraRenderers: [css2DRenderer],
//        controlType: 'none'
//    })(canvas);

    const Graph = new ForceGraph3D(canvas);

    if (dagMode === true) {
        // --- enable tree layout ---------------
        Graph
            .dagMode('td')          // 'td' = top → down
            .dagLevelDistance(40)   // pixels between layers (tweak to taste)
            .onDagError(() => false)  // ignore cycles instead of throwing
        // --------------------------------------
    }

    Graph
        .graphData(data)
        .nodeLabel('id')
        .nodeAutoColorBy('group')
        .nodeThreeObject(node => {
            // Example: create text labels via three-spritetext
            const sprite = new SpriteText(node.name);
            sprite.material.depthWrite = false; // transparent backgrounds
            sprite.color = node.color || 'red';
            sprite.textHeight = 8;
            return sprite;
        })
        .linkThreeObjectExtend(true)
        .linkThreeObject(link => {
            // If you want custom link labels as well
            //const sprite = new SpriteText(`${link.source.id} > ${link.target.id}`);
            const sprite = new SpriteText(`${link.source} --${link.relation}--> ${link.target}`);
            sprite.color = 'lightgrey';
            sprite.textHeight = 1.5;
            return sprite;
        })
        .linkPositionUpdate((sprite, { start, end }) => {
            // Move link labels to the midpoint
            const middlePos = Object.assign(
                ...['x', 'y', 'z'].map(c => ({
                    [c]: start[c] + (end[c] - start[c]) / 2
                }))
            );
            Object.assign(sprite.position, middlePos);
        });

    // Adjust the force layout (spread nodes a bit)
    Graph.d3Force('charge').strength(-120);

    // Store this ForceGraph instance if you need it later:
    threejsDrawing.data._forceGraphInstance = Graph;
}


const force3dDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawForce3dGraph, 'dataSrc': 'force3d', 'dataType': 'json'},
    ],
    'dataSources': {
        'math': {
            'specialOptions': {'dagMode': true},
        }
    },
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        if (!threejsDrawing.data._forceGraphInstance) {
            console.warn('No ForceGraph3D instance found.');
            return;
        }
        if (threejsDrawing.data._forceGraphInstance && threejsDrawing.data._forceGraphInstance.tickFrame) {
            threejsDrawing.data._forceGraphInstance.tickFrame();
        }
    },
    'data': {
        '_forceGraphInstance': null,
    },
    'sceneConfig': {
        'isForceGraph': true,
        'controller': 'none',
    }
}


export { force3dDrawing };
