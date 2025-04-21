import {
    SphereGeometry, CylinderGeometry, Mesh, MeshStandardMaterial, Vector3, HemisphereLight,
    Quaternion, TubeGeometry, QuadraticBezierCurve3, AxesHelper, PlaneGeometry
} from 'three';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceX, forceY, forceZ } from 'd3-force-3d';


// ground plane = XY plane

/**
 * @typedef {{ id: number|string, name?: string, color?: string, position?: { x: number, y: number, z: number }, x?: number, y?: number, z?: number }} GraphNode
 * @typedef {{ nodes: GraphNode[] }} Graph
 */



/**
 * Assign a depth to each node by breadth‑first traversal starting from the rootId.
 *
 * @param {Graph} graph
 * @param {number|string} rootId
 */
function computeDepths(graph, rootId) {
    const depthMap = Object.create(null);
    depthMap[rootId] = 0;
    const queue = [rootId];

    // Treat links as directed from source → target
    const outgoing = graph.links.reduce((m, l) => {
        if (!m[l.source]) m[l.source] = [];
        m[l.source].push(l.target);
        return m;
    }, {});

    while (queue.length) {
        const id = queue.shift();
        const d  = depthMap[id];
        (outgoing[id] || []).forEach(childId => {
            if (depthMap[childId] == null) {
                depthMap[childId] = d + 1;
                queue.push(childId);
            }
        });
    }

    graph.nodes.forEach(n => {n.depth = depthMap[n.id] ?? Infinity;});
}

/**
 * Positions nodes in a circle on the XZ plane with fixed Y (height).
 *
 * @param {GraphNode[]} nodes - Array of node objects
 * @param {number} [nNodes=nodes.length] - Total number of nodes (can be overridden if using a subset)
 * @param {number} [radius=10] - Radius of the circle layout
 */
function layoutNodes(nodes, nNodes = nodes.length, radius = 10) {
    const angleStep = (2 * Math.PI) / nNodes;
    nodes.forEach((node, i) => {
        const x = Math.cos(i * angleStep) * radius;
        const y = 0.5; // Fixed height for 2D plane
        const z = Math.sin(i * angleStep) * radius;

        // for your own positioning code:
        node.position = { x, y, z };
        // for D3-force:
        node.x = x;
        node.y = y;
        node.z = z;
    });
}

/**
 * Creates a mesh representing a single node as a sphere.
 *
 * @param {GraphNode} node - The node object with position and optional color
 * @returns {THREE.Mesh} - A mesh representing the node
 */
function drawNode(node) {
    const material = new MeshStandardMaterial({ color: node.color || "blue" });
    const geometry = new SphereGeometry(0.5, 16, 16);
    const mesh = new Mesh(geometry, material);

    // Use explicit position or fallback to layout-generated one
    const x = node.x ?? node.position?.x ?? 0;
    const y = node.y ?? node.position?.y ?? 0.5;
    const z = node.z ?? node.position?.z ?? 0;
    mesh.position.set(x, y, z);

    return mesh;
}


/**
 * Draws all nodes from a graph into the Three.js scene.
 *
 * @param {THREE.Scene} scene - The Three.js scene to add nodes to
 * @param {Graph} graph - The graph object containing nodes
 * @returns {THREE.Mesh[]} - Array of node meshes
 */
function drawNodes(scene, graph) {
    /** @type {THREE.Mesh[]} */
    const nodeMeshes = [];

    graph.nodes.forEach(node => {
        const mesh = drawNode(node);
        mesh.userData = node; // Store reference to original data
        scene.add(mesh);
        nodeMeshes.push(mesh);
    });

    return nodeMeshes;
}


/**
 * @typedef {{ id: number|string, x: number, y?: number, z: number }} GraphNode
 * @typedef {{ source: number|string, target: number|string, label?: string, color?: string|number, thickness?: number, direction?: string }} GraphLink
 * @typedef {{ nodes: GraphNode[], links: GraphLink[] }} Graph
 *
 * @param {THREE.Scene} scene - The Three.js scene to draw into
 * @param {Graph} graph - The graph data containing nodes and links
 * @returns {THREE.Mesh[]} - An array of curved link mesh objects
 */
function drawLinks(scene, graph) {
    /** @type {THREE.Mesh[]} */
    const linkMeshes = [];

    graph.links.forEach(link => {
        // Find source and target nodes by ID
        const source = graph.nodes.find(n => n.id === link.source);
        const target = graph.nodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const thickness = link.thickness ?? 0.1;
        const color = link.color ?? 0x8888ff;

        // Create a curved mesh link between the nodes
        const mesh = createCurvedLink(source, target, color, thickness);
        scene.add(mesh);
        linkMeshes.push(mesh);
    });

    return linkMeshes;
}


/**
 * Creates a smooth curved tube between two nodes.
 *
 * @param {GraphNode} source - The starting node (must have x, y, z)
 * @param {GraphNode} target - The ending node (must have x, y, z)
 * @param {string|number} [color=0x8888ff] - The color of the link
 * @param {number} [thickness=0.1] - Radius of the tube
 * @returns {THREE.Mesh} - A Mesh representing the curved link
 */
function createCurvedLink(source, target, color = 0x8888ff, thickness = 0.1) {
    const sx = source.x, sy = source.y ?? 0.5, sz = source.z;
    const tx = target.x, ty = target.y ?? 0.5, tz = target.z;

    const start = new Vector3(sx, sy, sz);
    const end = new Vector3(tx, ty, tz);

    // Create a control point that lifts the curve upward
    const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.y += Math.min(2, distance / 2);  // arch height

    const curve = new QuadraticBezierCurve3(start, mid, end);
    const geometry = new TubeGeometry(curve, 20, thickness, 8, false);
    const material = new MeshStandardMaterial({ color });

    return new Mesh(geometry, material);
}


/**
 * Updates the geometry of an existing curved tube mesh between two nodes.
 *
 * @param {THREE.Mesh} mesh - The mesh to update (created from TubeGeometry)
 * @param {GraphNode} source - The source node (must have x, y, z)
 * @param {GraphNode} target - The target node (must have x, y, z)
 */
function updateCurvedLink(mesh, source, target) {
    // Remove old geometry...
    mesh.geometry.dispose();

    const start = new Vector3(source.x, source.y ?? 0.5, source.z);
    const end = new Vector3(target.x, target.y ?? 0.5, target.z);

    const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.y += Math.min(2, distance / 2);

    const curve = new QuadraticBezierCurve3(start, mid, end);

    // Fallback in case radius is undefined
    const radius = mesh.geometry.parameters?.radius ?? 0.1;
    const newGeometry = new TubeGeometry(curve, 20, radius, 8, false);

    mesh.geometry = newGeometry;
}



/**
 * Updates the positions of node and link meshes based on force simulation output.
 *
 * @param {THREE.Mesh[]} nodeMeshes - Array of node meshes
 * @param {THREE.Mesh[]} linkMeshes - Array of link meshes
 * @param {Graph} graph - The graph object containing updated node/link data
 */
function updateThreeJSPositions(nodeMeshes, linkMeshes, graph) {
    nodeMeshes.forEach((mesh, i) => {
        const node = graph.nodes[i];
        mesh.position.set(node.x, node.y ?? 0.5, node.z);
    });

    // Potential issue: Are link.source and link.target always full node objects during the force simulation phase?
    // If not, then source.x, etc., will be undefined.

    linkMeshes.forEach((mesh, i) => {
        const { source, target } = graph.links[i];
        console.log('link', i, typeof source, typeof target);
        // Convert from IDs to node references (in case D3 rewrote them)
        const src = typeof source === 'object' ? source : graph.nodes.find(n => n.id === source);
        const tgt = typeof target === 'object' ? target : graph.nodes.find(n => n.id === target);
        console.log('about to update link', i, src, tgt);
        updateCurvedLink(mesh, src, tgt);
    });
}

/**
 * Applies a custom “tree‐like” force layout:
 *   • root is fixed at x=0, z=0
 *   • every other node is pushed to x = depth * SPACING
 *   • everyone is clamped to the XZ plane at y = FLOOR_Y
 *
 * @param {THREE.Mesh[]} nodeMeshes - Array of Three.js node meshes
 * @param {THREE.Mesh[]} linkMeshes - Array of Three.js link meshes
 * @param {Graph} graph - The graph object with mutable simulation data
 */
function applyForce(nodeMeshes, linkMeshes, graph) {
    const ROOT_ID  = graph.nodes[0].id;   // assume first node is your root
    const SPACING  = 15;                   // horizontal gap per generation
    const FLOOR_Y  = 0.5;                  // vertical height of the plane
    const FIXED_Z  = 50;                   // if you’ve shifted floor +50 in Z

    // 1) Seed the sim with your initial positions
    graph.nodes.forEach(n => {
        if (n.position) {
            n.x = n.position.x;
            n.y = n.position.y;
            n.z = n.position.z + FIXED_Z;
        }
    });

    // 2) Compute each node’s depth (0 for root, 1 for its children, etc)
    computeDepths(graph, ROOT_ID);

    // 3) Fix the root in place
    graph.nodes.forEach(n => {
        if (n.id === ROOT_ID) {
            n.fx = 0;       // fix x = 0
            n.fy = Y_LEVEL; // fix y = 0.5
            n.fz = FIXED_Z;
        }
    });

    const simulation = forceSimulation(graph.nodes)
        .force('charge', forceManyBody().strength(-30))
        .force('link',   forceLink(graph.links)
                          .id(d => d.id)
                          .distance(5))
        // push nodes out along +X based on depth
        .force('treeX', forceX(d => d.id === ROOT_ID
                                   ? 0
                                   : d.depth * SPACING)
                          .strength(1))
        // clamp everyone to Y = FLOOR_Y
        .force('clampY', forceY(FLOOR_Y).strength(1))
        // clamp everyone to Z = FIXED_Z
        .force('clampZ', forceZ(FIXED_Z).strength(1))
        .on('tick', () => {
            // keep y pinned (just in case) and update Three.js meshes
            graph.nodes.forEach(n => { n.y = FLOOR_Y; });

            updateThreeJSPositions(nodeMeshes, linkMeshes, graph); // e.g., update spheres in scene
        });
}

/**
 * Draws the full graph network into the Three.js scene: floor, axes, nodes, links, and force layout.
 *
 * @param {THREE.Scene} scene - The Three.js scene to render into
 * @param {Graph} data - Graph structure with nodes and links
 * @param {any} threejsDrawing - Optional reference used by calling framework
 */
function drawNetwork(scene, data, threejsDrawing) {
    // Lighting
    const light = new HemisphereLight(0xffffff, 0x444444, 1);
    light.position.set(0, 20, 0);
    scene.add(light);

    // Floor plane (XZ)
    const planeGeometry = new PlaneGeometry(100, 100);
    const planeMaterial = new MeshStandardMaterial({ color: 0x888888 });
    const plane = new Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate to lie flat
    plane.position.y = 0; // Position it at y=0
    plane.position.z += 50; // Center it
    scene.add(plane);

    // Axes helper: red (X), green (Y), blue (Z)
    const axesHelper = new AxesHelper(5);
    scene.add(axesHelper);

    // Layout + render
    layoutNodes(data.nodes);
    const nodeMeshes = drawNodes(scene, data);
    const linkMeshes = drawLinks(scene, data);
    applyForce(nodeMeshes, linkMeshes, data);
}

const networkDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawNetwork, 'dataSrc': 'force', 'dataType': 'json'},
    ],
    'uiState': null,
    //'eventListeners': eventListeners,
    'eventListeners': {},
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        // Animation logic can go here
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': { 'x': 0, 'y': 100, 'z': -1 },
        'lookAt': { 'x': 0, 'y': 0, 'z': 50 },
    }
}


export { networkDrawing };



// The reason for the network being projected onto a two dimensional plane within a three dimensional canvas is because there will be other entities "floating" somewhere above the nodes, and I plan to include Tweening camera motions triggered by key presses to traverse the nodes.

// Future expansions you’re already planning for
// Tween camera to node.position on keypress (use tween.js or similar)
// Floating entities at y > 1 above each node
// Interactivity (raycasting) on nodes and edges

// Color by direction or magnitude.
// Add subtle glow shaders or MeshToonMaterial.
// Animate dash or pulse effects using custom shaders (ask if you'd like this too).