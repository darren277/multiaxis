import * as THREE from 'three';
import { forceSimulation, forceManyBody, forceLink, forceCenter } from 'd3-force-3d';
import { drawBasicLights } from './reusables/drawLights';
import { ThreeJSDrawing } from '../threejsDrawing';

function drawGraph(scene: THREE.Scene, data: any, state: any) {
    console.log('data', data);
    const nodeMap: { [key: string]: THREE.Vector3 } = {};

    // Layout nodes in a circle
    const radius = 5;
    const angleStep = (2 * Math.PI) / data.nodes.length;

    data.nodes.forEach((node: any, i: number) => {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const y = 0;
        const z = radius * Math.sin(angle);

        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(x, y, z);
        scene.add(sphere);

        nodeMap[node] = new THREE.Vector3(x, y, z);
    });

    // Add edges
    data.edges.forEach((edge: any) => {
        const start = nodeMap[edge.source];
        const end = nodeMap[edge.target];

        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: edge.color || 0xffffff });

        const line = new THREE.Line(geometry, material);
        scene.add(line);
    });
}

function drawForceDirectedGraph(scene: THREE.Scene, data: any) {
    const graphData = data;

    const simulation = forceSimulation(graphData.nodes)
        .force('charge', forceManyBody().strength(-50))
        .force('link', forceLink(graphData.links).id((d: { id: any; }) => d.id).distance(2))
        .force('center', forceCenter(0, 0, 0))
        .alphaDecay(0.02); // Allow some time to settle

    const nodeSpheres: { [key: string]: THREE.Mesh } = {};
    graphData.nodes.forEach((node: any) => {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        nodeSpheres[node.id] = sphere;

        if (isNaN(node.x) || isNaN(node.y) || isNaN(node.z)) {
            node.x = Math.random() * 10;
            node.y = Math.random() * 10;
            node.z = Math.random() * 10;
        }
        sphere.position.set(node.x, node.y, node.z);
    });

    const linkLines: { line: THREE.Line, link: any }[] = [];
    graphData.links.forEach((link: any) => {
        const material = new THREE.LineBasicMaterial({ color: 0xcccccc });
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(), // placeholder
            new THREE.Vector3()
        ]);
        const line = new THREE.Line(geometry, material);
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
function updateForceGraph(graphData: any, nodeSpheres: { [key: string]: THREE.Mesh }, linkLines: { line: THREE.Line, link: any }[]) {
    // Update node positions
    for (const node of graphData.nodes) {
        const sphere = nodeSpheres[node.id];
        sphere.position.set(node.x, node.y, node.z);
    }

    // Update edge positions
    for (const { line, link } of linkLines) {
        const src = graphData.nodes.find((n: any) => n.id === link.source.id || n.id === link.source);
        const tgt = graphData.nodes.find((n: any) => n.id === link.target.id || n.id === link.target);
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(camera: THREE.Camera, data: any, event: MouseEvent, rect: DOMRect) {
    if (!data.dragging) return;

    // convert screen coords to normalized device coords
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // update raycaster
    raycaster.setFromCamera(mouse, camera);

    // project onto an invisible plane near the dragged node
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersection);

    const node = data.draggedNode;
    if (node) {
        node.fx = intersection.x;
        node.fy = intersection.y;
        node.fz = intersection.z;
    }
}

function onMouseDown(camera: THREE.Camera, data: any, event: MouseEvent, rect: DOMRect) {
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const nodeMeshes = Object.values(data.nodeSpheres);
    const intersects = raycaster.intersectObjects(nodeMeshes as THREE.Object3D[]);

    if (intersects.length > 0) {
        data.dragging = true;

        const mesh = intersects[0].object;
        const foundEntry = Object.entries(data.nodeSpheres).find(([id, obj]) => obj === mesh);
        const nodeId = foundEntry ? foundEntry[0] : null;

        data.draggedNode = nodeId ? data.graphData.nodes.find((n: { id: string; }) => n.id == nodeId) : null;
    }
}

function onMouseUp(state: any) {
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

function drawForceGraph(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing, state: any) {
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
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
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
        'mousedown': (e: MouseEvent, other: any) => {
            const {camera, data, controls, renderer} = other;
            const rect = renderer.domElement.getBoundingClientRect();
            onMouseDown(camera, data, e, rect);
        },
        'mouseup': (e: MouseEvent, other: any) => {
            const {camera, data, controls} = other;
            onMouseUp(data);
        },
        'mousemove': (e: MouseEvent, other: any) => {
            const {camera, data, controls, renderer} = other;
            const rect = renderer.domElement.getBoundingClientRect();
            onMouseMove(camera, data, e, rect);
        }
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        (threejsDrawing.data.simulation as d3.Simulation<any, any>).tick(); // progress the simulation
        updateForceGraph(
            threejsDrawing.data.graphData,
            threejsDrawing.data.nodeSpheres as { [key: string]: THREE.Mesh },
            threejsDrawing.data.linkLines as { line: THREE.Line, link: any }[]
        ); // reflect new positions
    },
    'data': {
        'simulation': null,
        'dragging': false,
        'draggedNode': null
    }
}

export { cayleyDrawing, forceDrawing };
