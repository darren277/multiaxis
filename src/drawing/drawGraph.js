import { SphereGeometry, Mesh, MeshStandardMaterial, Vector2, Vector3, BufferGeometry, Line, LineBasicMaterial, Raycaster, Plane } from 'three';
import { forceSimulation, forceManyBody, forceLink, forceCenter } from 'd3-force-3d';
import { drawBasicLights } from './drawLights.js';

function drawGraph(scene, data, state) {
    console.log('data', data);
    const nodeMap = {};

    // Layout nodes in a circle
    const radius = 5;
    const angleStep = (2 * Math.PI) / data.nodes.length;

    data.nodes.forEach((node, i) => {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const y = 0;
        const z = radius * Math.sin(angle);

        const geometry = new SphereGeometry(0.2, 16, 16);
        const material = new MeshStandardMaterial({ color: 0x00ffcc });
        const sphere = new Mesh(geometry, material);

        sphere.position.set(x, y, z);
        scene.add(sphere);

        nodeMap[node] = new Vector3(x, y, z);
    });

    // Add edges
    data.edges.forEach(edge => {
        const start = nodeMap[edge.source];
        const end = nodeMap[edge.target];

        const points = [start, end];
        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new LineBasicMaterial({ color: edge.color || 0xffffff });

        const line = new Line(geometry, material);
        scene.add(line);
    });
}

function drawForceDirectedGraph(scene, data) {
    const graphData = data;

    const simulation = forceSimulation(graphData.nodes)
        .force('charge', forceManyBody().strength(-50))
        .force('link', forceLink(graphData.links).id(d => d.id).distance(2))
        .force('center', forceCenter(0, 0, 0))
        .alphaDecay(0.02); // Allow some time to settle

    const nodeSpheres = {};
    graphData.nodes.forEach(node => {
        const geometry = new SphereGeometry(1, 16, 16);
        const material = new MeshStandardMaterial({ color: 0xffff00 });
        const sphere = new Mesh(geometry, material);
        scene.add(sphere);
        nodeSpheres[node.id] = sphere;

        if (isNaN(node.x) || isNaN(node.y) || isNaN(node.z)) {
            node.x = Math.random() * 10;
            node.y = Math.random() * 10;
            node.z = Math.random() * 10;
        }
        sphere.position.set(node.x, node.y, node.z);
    });

    const linkLines = [];
    graphData.links.forEach(link => {
        const material = new LineBasicMaterial({ color: 0xcccccc });
        const geometry = new BufferGeometry().setFromPoints([
            new Vector3(), // placeholder
            new Vector3()
        ]);
        const line = new Line(geometry, material);
        scene.add(line);
        linkLines.push({ line, link });
    });

    return {
        simulation,
        nodeSpheres,
        linkLines,
    }
};

// Update on each frame
function updateForceGraph(graphData, nodeSpheres, linkLines) {
    // Update node positions
    for (const node of graphData.nodes) {
        const sphere = nodeSpheres[node.id];
        sphere.position.set(node.x, node.y, node.z);
    }

    // Update edge positions
    for (const { line, link } of linkLines) {
        const src = graphData.nodes.find(n => n.id === link.source.id || n.id === link.source);
        const tgt = graphData.nodes.find(n => n.id === link.target.id || n.id === link.target);
        const positions = line.geometry.attributes.position.array;

        positions[0] = src.x;
        positions[1] = src.y;
        positions[2] = src.z;

        positions[3] = tgt.x;
        positions[4] = tgt.y;
        positions[5] = tgt.z;

        line.geometry.attributes.position.needsUpdate = true;
    }
}

const raycaster = new Raycaster();
const mouse = new Vector2();

function onMouseMove(camera, data, event, rect) {
    if (!data.dragging) return;

    // convert screen coords to normalized device coords
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // update raycaster
    raycaster.setFromCamera(mouse, camera);

    // project onto an invisible plane near the dragged node
    const planeZ = new Plane(new Vector3(0, 0, 1), 0);
    const intersection = new Vector3();
    raycaster.ray.intersectPlane(planeZ, intersection);

    const node = data.draggedNode;
    if (node) {
        node.fx = intersection.x;
        node.fy = intersection.y;
        node.fz = intersection.z;
    }
}

function onMouseDown(camera, data, event, rect) {
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const nodeMeshes = Object.values(data.nodeSpheres);
    const intersects = raycaster.intersectObjects(nodeMeshes);

    if (intersects.length > 0) {
        data.dragging = true;

        const mesh = intersects[0].object;
        const nodeId = Object.entries(data.nodeSpheres).find(([id, obj]) => obj === mesh)[0];

        data.draggedNode = data.graphData.nodes.find(n => n.id == nodeId);
    }
}

function onMouseUp(state) {
    if (state.draggedNode) {
        state.draggedNode.fx = null;
        state.draggedNode.fy = null;
        state.draggedNode.fz = null;
    }

    state.dragging = false;
    state.draggedNode = null;
}


// 1. Define your graph data
const graphData = {
    nodes: [
        { id: '0' },
        { id: '1' },
        { id: '2' },
        { id: '3' }
    ],
    links: [
        { source: '0', target: '1' },
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '0' }
    ]
};

function drawForceGraph(scene, threejsDrawing, state) {
    // Random tree
    const N = 40;
    const gData = {
        nodes: [...Array(N).keys()].map(i => ({ id: i })),
        links: [...Array(N).keys()].filter(id => id).map(id => ({source: id, target: Math.round(Math.random() * (id-1))}))
    };

    // assign random stating position...
    gData.nodes.forEach(node => {node.x = Math.random() * 5; node.y = Math.random() * 5; node.z = Math.random() * 5;});

    const {
        simulation,
        nodeSpheres,
        linkLines,
    } = drawForceDirectedGraph(scene, gData);

    simulation.tick(10); // progress the simulation some steps

    threejsDrawing.data.simulation = simulation;
    threejsDrawing.data.nodeSpheres = nodeSpheres;
    threejsDrawing.data.linkLines = linkLines;

    threejsDrawing.data.graphData = gData;

    drawBasicLights(scene, threejsDrawing);
}



const cayleyDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawGraph, 'dataSrc': 'cayley', 'dataType': 'json'},
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
        'sheetMusic': null,
    }
}

const forceDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        //{'func': drawForceGraph, 'dataSrc': 'force'}
        {'func': drawForceGraph, 'dataSrc': null}
    ],
    'eventListeners': {
        'mousedown': (e, other) => {
            const {camera, data, controls, renderer} = other;
            const rect = renderer.domElement.getBoundingClientRect();
            onMouseDown(camera, data, e, rect);
        },
        'mouseup': (e, other) => {
            const {camera, data, controls} = other;
            onMouseUp(data);
        },
        'mousemove': (e, other) => {
            const {camera, data, controls, renderer} = other;
            const rect = renderer.domElement.getBoundingClientRect();
            onMouseMove(camera, data, e, rect);
        }
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        threejsDrawing.data.simulation.tick(); // progress the simulation
        updateForceGraph(threejsDrawing.data.graphData, threejsDrawing.data.nodeSpheres, threejsDrawing.data.linkLines); // reflect new positions
    },
    'data': {
        'simulation': null,
        'dragging': false,
        'draggedNode': null
    }
}

export { cayleyDrawing, forceDrawing };
