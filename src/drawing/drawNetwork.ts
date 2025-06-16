import * as THREE from 'three';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceX, forceY, forceZ } from 'd3-force-3d';
import { hierarchy, tree } from 'd3-hierarchy';
import type { HierarchyPointNode } from 'd3-hierarchy';
import * as TWEEN from '@tweenjs/tween.js'


const FLOOR_Y = 0.5; // height of the ground plane

type TweenFunctionParams = {
    tweenGroup: TWEEN.Group;
    camera: THREE.Camera;
    controls?: any; // Optional, if using controls like OrbitControls
    toPos: { x: number, y: number, z: number };
    lookAt?: { x: number, y: number, z: number }; // Optional target to look at
    duration?: number; // Duration in milliseconds
};

function tweenCamera(
    tweenGroup: TWEEN.Group,
    camera: THREE.Camera,
    controls: any,
    toPos: { x: number, y: number, z: number },
    lookAt: { x: number, y: number, z: number } | null = null,
    duration: number = 3000
) {
    const from = { x: camera.position.x, y: camera.position.y, z: camera.position.z };

    const tween = new TWEEN.Tween(from).to(toPos, duration).easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            camera.position.set(from.x, from.y, from.z);
            controls?.update();
        })
        .onComplete(() => {
            if (lookAt) {
                controls?.target.set(lookAt.x, lookAt.y, lookAt.z);
                controls?.update();
            }
        })
        .start();
    
    tweenGroup.add(tween);
}

// ground plane = XY plane

/**
 * @typedef {{ id: number|string, name?: string, color?: string, position?: { x: number, y: number, z: number }, x?: number, y?: number, z?: number }} GraphNode
 * @typedef {{ nodes: GraphNode[] }} Graph
 */

/*
{
  "nodes":
    [
      {"id": 1, "name": "ROOT", "color": "black"},
      {"id": 2, "name": "Testing", "color": "yellow"},
      {"id": 3, "name": "3rd Node", "color": "green"},
      {"id": 4, "name": "4th Node", "color":  "red"},
      {"id": 5, "name": "5th Node", "color": "purple"},
      {"id": 6, "name": "6th Node (Layer 2)"},
      {"id": 7, "name": "7th Node (Layer 2)"}
    ],
  "links":
    [
      {"source": 1, "target": 2, "label": "Link1", "color": "blue", "direction": "forward", "thickness": 0.1},
      {"source": 1, "target": 3, "label": "Link2", "color": "orange", "direction": "forward", "thickness": 0.1},
      {"source": 1, "target": 4},
      {"source": 1, "target": 5},
      {"source": 2, "target": 6},
      {"source": 2, "target": 7},
      {"source": 5, "target": 6}
    ]
}
*/

type GraphNode = {
    fz: number;
    fy: any;
    fx: number;
    depth: any;
    data: any;
    id: number | string;
    name?: string;
    color?: string;
    position?: { x: number; y: number; z: number };
    x?: number; // for D3 layout
    y?: number; // for D3 layout
    z?: number; // for D3 layout
    children?: GraphNode[];
};

type GraphLink = {
    source: number | string;
    target: number | string;
    label?: string;
    color?: string | number;
    thickness?: number;
    direction?: string; // e.g. "forward", "backward"
};

type Graph = {
    nodes: GraphNode[];
    links: GraphLink[];
};

/**
 * Turn your nodes + directed links into a nested tree structure.
 * Assumes there’s exactly one root (no incoming links).
 *
 * @param {Array<{id: *, color?:string}>} nodes
 * @param {Array<{source: *, target: *}>} links
 * @returns {*} A nested object with `children` arrays
 */
function buildTreeData(nodes: GraphNode[], links: GraphLink[]) {
    type TreeNode = GraphNode & { children: TreeNode[] };
    const map = new Map<GraphNode['id'], TreeNode>();

    // First, create all nodes with empty children arrays
    nodes.forEach(n => {
        map.set(n.id, { ...n, children: [] } as TreeNode);
    });

    const hasParent = new Set<GraphNode['id']>();

    links.forEach(({ source, target }) => {
        const parent = map.get(source);
        const child  = map.get(target);
        if (parent && child) {
            (parent.children as TreeNode[]).push(child);
            hasParent.add(target);
        }
    });

    // root = the one node that never appears as a link target
    const rootNode = nodes.find(n => !hasParent.has(n.id));
    return rootNode ? map.get(rootNode.id) : undefined;
}

/**
 * Extracts a minimal tree from the full graph by selecting
 * only the first incoming link for each target node.
 * @param {Array} nodes - Flat array of node objects
 * @param {Array} links - Flat array of links (source & target by ID)
 * @returns {{ root: *, treeLinks: *, extraLinks: * }}
 */
function extractMinimalTree(nodes: GraphNode[], links: GraphLink[]) {
    type TreeNode = GraphNode & { children: TreeNode[] };
    const nodeMap = new Map<GraphNode['id'], TreeNode>(
        nodes.map(n => [n.id, { ...n, children: [] } as TreeNode])
    );
    const hasParent = new Set<GraphNode['id']>();
    const treeLinks: GraphLink[] = [];
    const extraLinks: GraphLink[] = [];

    // Track first parent only
    const childToParent = new Map();

    links.forEach(link => {
        const { source, target } = link;
        if (!childToParent.has(target)) {
            childToParent.set(target, source);
            treeLinks.push(link);
        } else {
            extraLinks.push(link); // redundant/multi-parent link
        }
    });

    // Connect children
    treeLinks.forEach(({ source, target }) => {
        const parent = nodeMap.get(source);
        const child  = nodeMap.get(target);
        if (parent && child) {
            parent.children.push(child);
            hasParent.add(target);
        }
    });

    // Find root (no incoming edges)
    const root = nodes.find(n => !hasParent.has(n.id));
    return {
        root: root ? nodeMap.get(root.id) : undefined,
        treeLinks,
        extraLinks
    };
}

/**
 * Given a nested tree object, computes x/y positions.
 * @param {*} rootData  The result of buildTreeData()
 * @param {number} dx   Vertical spacing between levels
 * @param {number} dy   Horizontal spacing between siblings
 * @returns {d3.HierarchyPointNode[]}  Array of laid‑out nodes
 */
function computeTreeLayout(rootData: any, dx = 50, dy = 100) {
    const root = hierarchy(rootData);

    // total depth (Z)  = maxDepth * tightDx
    // total width (X)  = maxBreadth * tightDy
    //const depthLevels  = /* your treeHeight */;
    //const siblingCount = /* maximum siblings at any level */;
    const depthLevels  = root.height;
    const siblingCount = root.children ? root.children.length : 0;

    tree().size([depthLevels * dx, siblingCount * dy])(root);

    // tree layout: root at (0,0), children laid out along +x
    console.log('tree layout', dx, dy);
    //tree().nodeSize([dx, dy])(root);

    // root.descendants() now each has { x, y } in 2D
    return root;
}

// also get the links easily:
function computeTreeLinks(root: { links: () => any; }) {
    // root.links() gives array of { source: node, target: node }
    return root.links();
}

/**
 * @param {THREE.Scene} scene
 * @param {d3.HierarchyPointNode[]} nodes2D   // with .data, .x, .y
 * @param {{source,target}[]} links2D         // with .source, .target each a node2D
 */
function renderD3Tree(scene: THREE.Scene, nodes2D: HierarchyPointNode<any>[], links2D: { source: HierarchyPointNode<any>; target: HierarchyPointNode<any>; }[], floorY: number) {
    const FLOOR_Y = 0.5;

    // draw nodes
    nodes2D.forEach(n2 => {
        const { id, color } = n2.data;
        const mat = new THREE.MeshStandardMaterial({ color: color || 'steelblue' });
        const geo = new THREE.SphereGeometry(2, 16, 16);
        const mesh = new THREE.Mesh(geo, mat);

        // map D3:  x→Z, y→Y
        mesh.position.set(n2.x, FLOOR_Y, n2.y);
        scene.add(mesh);
    });

    // draw links as straight lines (or TubeGeometry if you want thickness)
    links2D.forEach(link => {
        const { source, target } = link;
        const p1 = new THREE.Vector3(source.x, FLOOR_Y, source.y);
        const p2 = new THREE.Vector3(target.x, FLOOR_Y, target.y);
        const pts = [p1, p2];

        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 'gray' });
        scene.add(new THREE.Line(lineGeo, mat));
    });
}

/**
 * Assign a depth to each node by breadth‑first traversal starting from the rootId.
 *
 * @param {Graph} graph
 * @param {number|string} rootId
 */
function computeDepths(graph: Graph, rootId: number | string) {
    const depthMap = Object.create(null);
    depthMap[rootId] = 0;
    const queue: (number | string)[] = [rootId];

    // Treat links as directed from source → target
    const outgoing = graph.links.reduce((m: { [key: string]: any[] }, l) => {
        if (!m[l.source]) m[l.source] = [];
        m[l.source].push(l.target);
        return m;
    }, {} as { [key: string]: any[] });

    while (queue.length) {
        const id = queue.shift();
        if (id === undefined) continue;
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
function layoutNodes(nodes: GraphNode[], nNodes = nodes.length, radius = 10) {
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
function drawNode(node: GraphNode): THREE.Mesh {
    const material = new THREE.MeshStandardMaterial({ color: node.color || "blue" });
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const mesh = new THREE.Mesh(geometry, material);

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
function drawNodes(scene: THREE.Scene, graph: Graph) {
    /** @type {THREE.Mesh[]} */
    const nodeMeshes: THREE.Mesh[] = [];

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
function drawLinks(scene: THREE.Scene, graph: Graph) {
    /** @type {THREE.Mesh[]} */
    const linkMeshes: THREE.Mesh[] = [];

    graph.links.forEach(link => {
        // Find source and target nodes by ID
        const source = graph.nodes.find(n => n.id === link.source);
        const target = graph.nodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const thickness = link.thickness ?? 0.1;
        // Ensure color is always a number for createCurvedLink
        let color: number;
        if (typeof link.color === 'string') {
            color = new THREE.Color(link.color).getHex();
        } else if (typeof link.color === 'number') {
            color = link.color;
        } else {
            color = 0x8888ff;
        }

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
function createCurvedLink(source: GraphNode, target: GraphNode, color = 0x8888ff, thickness = 0.1) {
    const sx = source.x, sy = source.y ?? 0.5, sz = source.z;
    const tx = target.x, ty = target.y ?? 0.5, tz = target.z;

    const start = new THREE.Vector3(sx, sy, sz);
    const end = new THREE.Vector3(tx, ty, tz);

    // Create a control point that lifts the curve upward
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.y += Math.min(2, distance / 2);  // arch height

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geometry = new THREE.TubeGeometry(curve, 20, thickness, 8, false);
    const material = new THREE.MeshStandardMaterial({ color });

    const mesh = new THREE.Mesh(geometry, material);
    // Store the thickness/radius for later updates
    (mesh as any).tubeRadius = thickness;
    return mesh;
}


/**
 * Updates the geometry of an existing curved tube mesh between two nodes.
 *
 * @param {THREE.Mesh} mesh - The mesh to update (created from TubeGeometry)
 * @param {GraphNode} source - The starting node
 * @param {GraphNode} target - The ending node
 */
function updateCurvedLink(mesh: THREE.Mesh, source: GraphNode, target: GraphNode) {
    // Remove old geometry...
    mesh.geometry.dispose();

    const start = new THREE.Vector3(source.x, source.y ?? 0.5, source.z);
    const end = new THREE.Vector3(target.x, target.y ?? 0.5, target.z);

    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.y += Math.min(2, distance / 2);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

    // Retrieve the stored radius (thickness) from the mesh, fallback to 0.1 if not set
    const radius = (mesh as any).tubeRadius ?? 0.1;
    const newGeometry = new THREE.TubeGeometry(curve, 20, radius, 8, false);

    mesh.geometry = newGeometry;
}



/**
 * Updates the positions of node and link meshes based on force simulation output.
 *
 * @param {THREE.Mesh[]} nodeMeshes - Array of node meshes
 * @param {THREE.Mesh[]} linkMeshes - Array of link meshes
 * @param {Graph} graph - The graph object containing updated node/link data
 */
function updateThreeJSPositions(nodeMeshes: THREE.Mesh[], linkMeshes: THREE.Mesh[], graph: Graph) {
    nodeMeshes.forEach((mesh, i) => {
        const node = graph.nodes[i];
        mesh.position.set(node.x ?? 0, node.y ?? 0.5, node.z ?? 0);
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
        if (!src || !tgt) {
            console.warn(`Link ${i} has missing source/target`, src, tgt);
            return;
        }
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
function applyForce(nodeMeshes: THREE.Mesh[], linkMeshes: THREE.Mesh[], graph: Graph) {
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
            n.fy = FLOOR_Y; // fix y = 0.5
            n.fz = FIXED_Z;
        }
    });

    const simulation = forceSimulation(graph.nodes)
        .force('charge', forceManyBody().strength(-30))
        .force('link',   forceLink(graph.links)
                          .id((d: { id: any; }) => d.id)
                          .distance(5))
        // push nodes out along +X based on depth
        //.force('treeX', forceX().x((d: { id: any; depth: any; }) => d.id === ROOT_ID ? 0 : d.depth * SPACING).strength(1))
        // TODO: What is going on here with the typing mismatch??
        .force('treeX', forceX(0).x((d: GraphNode) => d.id === ROOT_ID ? 0 : d.depth * SPACING).strength(1))
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
 * Draws a straight line between two points in Three.js.
 *
 * @param {THREE.Vector3} start - Starting point
 * @param {THREE.Vector3} end - Ending point
 * @param {string|number} color - Line color (e.g. 'orange' or 0xff0000)
 * @param {number} [thickness=1] - Line width (note: ignored in most WebGL renderers)
 * @returns {THREE.Line} - The created line object (in case you want to store/remove it later)
 */
function drawLine(scene: THREE.Scene, start: THREE.Vector3, end: THREE.Vector3, color = 0x000000, thickness = 1) {
    const material = new THREE.LineBasicMaterial({
        color,
        linewidth: thickness  // NOTE: only works in WebGL with special support
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

    const line = new THREE.Line(geometry, material);
    scene.add(line); // assumes you’re in a global scope or pass the scene if needed

    return line;
}

/**
 * Draw non-tree links (extra relationships) between D3-rendered nodes.
 *
 * @param {THREE.Scene} scene
 * @param {*} laidOutNodes - D3 nodes with x/y and .data.id
 * @param {GraphLink[]} rawLinks - All extra links not in the tree
 * @param {*} treeLinks - Links already included in the layout
 * @param {number} floorY
 */
function connectTreeNodes(scene: THREE.Scene, laidOutNodes: any[], rawLinks: GraphLink[], treeLinks: any[], floorY = 0.5) {
    const idToNode = new Map(laidOutNodes.map(n => [n.data.id, n]));

    for (const { source, target, color = 'orange' } of rawLinks) {
        const from = idToNode.get(source);
        const to = idToNode.get(target);

        const isInTree = treeLinks.some(l => l.source.data.id === source && l.target.data.id === target);

        if (from && to && !isInTree) {
            const p1 = new THREE.Vector3(from.x, floorY, from.y);
            const p2 = new THREE.Vector3(to.x, floorY, to.y);
            // Ensure color is a number
            const colorNum = typeof color === 'string' ? new THREE.Color(color).getHex() : color;
            drawLine(scene, p1, p2, colorNum);
        }
    }
}


type TreeLayoutOptions = {
    dx: number;
    dy: number;
    floorY: number;
};

/**
 * @typedef {{ id: number|string, name?: string, color?: string, children?: any[] }} GraphNode
 * @typedef {{ source: number|string, target: number|string, color?: string, label?: string, thickness?: number }} GraphLink
 * @typedef {{ nodes: GraphNode[], links: GraphLink[] }} GraphData
 * @typedef {Object} TreeLayoutOptions
 * @property {number} dx - Vertical spacing between levels (mapped to Z)
 * @property {number} dy - Horizontal spacing between siblings (mapped to X)
 * @property {number} floorY - The Y position at which to place the tree (default 0.5)
 */

/**
 * Renders a tree-based layout with D3.hierarchy, but also supports rendering
 * extra cross-links that don't fit in a strict hierarchy (e.g. multiple parents).
 *
 * @param {THREE.Scene} scene - The Three.js scene to render into
 * @param {GraphData} data - Graph structure with flat nodes and links
 * @param {TreeLayoutOptions} [options] - Layout spacing and floor height
 */
function drawTreeWithExtras(scene: THREE.Scene, data: Graph, options: TreeLayoutOptions = {
    dx: 0,
    dy: 0,
    floorY: 0
}) {
    const {
        dx = 30,
        dy = 60,
        floorY = 0.5
    } = options;

    const { nodes, links } = data;

    // Step 1: Build a minimal tree and extract cross-links
    const { root, treeLinks, extraLinks } = extractMinimalTree(nodes, links);

    // Step 2: Compute D3 hierarchical layout
    const rootNode = hierarchy<GraphNode | undefined>(root);
    const treeLayout = tree<GraphNode | undefined>().nodeSize([dx, dy]);
    treeLayout(rootNode);

    const laidOutNodes: HierarchyPointNode<any>[] = rootNode.descendants() as HierarchyPointNode<any>[];
    const laidOutTreeLinks = rootNode.links();

    // Step 3: Render nodes and tree links
    renderD3Tree(
        scene,
        laidOutNodes,
        laidOutTreeLinks as { source: HierarchyPointNode<any>; target: HierarchyPointNode<any>; }[],
        floorY
    );

    // Step 4: Render extra cross-links that weren’t in the tree
    connectTreeNodes(scene, laidOutNodes, extraLinks, laidOutTreeLinks, floorY);

    return laidOutNodes;
}

const navState: {
    current: GraphNode | null, // currently selected node
    path: GraphNode[],         // previously visited nodes
    selectionIndex: number     // which neighbor is selected
} = {
    current: null,
    path: [],
    selectionIndex: 0
};

function buildAdjacencyMap(links: GraphLink[]): Map<number, number[]> {
    const map = new Map();
    links.forEach(({ source, target }) => {
        if (!map.has(source)) map.set(source, []);
        map.get(source).push(target);
    });
    return map;
}

function handleUp(tweenGroup: TWEEN.Group, camera: THREE.Camera, controls: any, nodeMap: Map<number, GraphNode>, adjacencyMap: Map<number, number[]>) {
    if (!navState.current) {
        // First move → go to root (lowest ID)
        const root = [...nodeMap.values()].reduce((a, b) => a.data.id < b.data.id ? a : b);
        navState.current = root;
        tweenCamera(tweenGroup, camera, controls, { ...rootPosition(root) }, null);
        return;
    }

    const nextIds = adjacencyMap.get(navState.current.data.id) || [];
    if (nextIds.length === 0) return;

    const nextId = nextIds[navState.selectionIndex % nextIds.length];
    const next = nodeMap.get(nextId);
    if (!next) return;

    navState.path.push(navState.current);
    navState.current = next;
    navState.selectionIndex = 0;

    tweenCamera(tweenGroup, camera, controls, { ...rootPosition(next) }, null);
}

function handleLeft(tweenGroup: TWEEN.Group, camera: THREE.Camera, controls: any, adjacencyMap: Map<number, number[]>, nodeMap: Map<number, GraphNode>, selector: any) {
    const currentId = navState.current?.data.id;
    const neighbors = adjacencyMap.get(navState.current?.data.id) || [];
    if (neighbors.length > 1) {
        navState.selectionIndex = (navState.selectionIndex - 1 + neighbors.length) % neighbors.length;

        const nextId = neighbors[navState.selectionIndex];
        const nextNode = nodeMap.get(nextId);

        handleSideways(tweenGroup, camera, controls, nextId, nextNode, selector);
    }
}

function handleRight(tweenGroup: TWEEN.Group, camera: THREE.Camera, controls: any, adjacencyMap: Map<number, number[]>, nodeMap: Map<number, GraphNode>, selector: any) {
    const currentId = navState.current?.data.id;
    const neighbors = adjacencyMap.get(navState.current?.data.id) || [];
    if (neighbors.length > 1) {
        navState.selectionIndex = (navState.selectionIndex + 1 + neighbors.length) % neighbors.length;

        const nextId = neighbors[navState.selectionIndex];
        const nextNode = nodeMap.get(nextId);

        handleSideways(tweenGroup, camera, controls, nextId, nextNode, selector);
    }
}

function handleSideways(tweenGroup: TWEEN.Group, camera: THREE.Camera, controls: any, nextId: number, nextNode: GraphNode | undefined, selector: any) {
    const previewHeight = 5;

    if (nextNode) {
        selector.position.set(nextNode.x ?? 0, FLOOR_Y + 0.05, nextNode.y ?? 0);
        const xyz1 = {x: nextNode.x ?? 0, y: previewHeight, z: nextNode.y ?? 0};
        if (navState.current) {
            const xyz2 = {x: navState.current.x ?? 0, y: navState.current.y ?? 0.5, z: navState.current.y ?? 0};
            tweenCamera(tweenGroup, camera, controls, xyz1, xyz2, 500); // shorter duration for preview
        }
    }
}

function handleDown(tweenGroup: TWEEN.Group, camera: THREE.Camera, controls: any, nodeMap: Map<number, GraphNode>) {
    if (navState.path.length === 0) return;
    const prev = navState.path.pop();
    if (!prev) return;
    navState.current = prev;
    navState.selectionIndex = 0;

    tweenCamera(tweenGroup, camera, controls, { ...rootPosition(prev) }, null);
}

function rootPosition(node: GraphNode) {
    return {
        x: node.x ?? 0,
        y: 5,
        z: node.y ?? 0
    }; // 90° clockwise layout
}


function setupKeyboardNavigation(tweenGroup: TWEEN.Group, camera: THREE.Camera, controls: any, nodeMap: Map<number, GraphNode>, adjacencyMap: Map<number, number[]>, selector: any) {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            handleUp(tweenGroup, camera, controls, nodeMap, adjacencyMap);
        } else if (e.key === 'ArrowLeft') {
            console.log('left', navState.selectionIndex, adjacencyMap);
            handleLeft(tweenGroup, camera, controls, adjacencyMap, nodeMap, selector);
        } else if (e.key === 'ArrowRight') {
            console.log('right', navState.selectionIndex, adjacencyMap);
            handleRight(tweenGroup, camera, controls, adjacencyMap, nodeMap, selector);
        } else if (e.key === 'ArrowDown') {
            handleDown(tweenGroup, camera, controls, nodeMap);
        }
    });
}


/**
 * Draws the full graph network into the Three.js scene: floor, axes, nodes, links, and force layout.
 *
 * @param {THREE.Scene} scene - The Three.js scene to render into
 * @param {Graph} data - Graph structure with nodes and links
 * @param {any} threejsDrawing - Optional reference used by calling framework
 */
function drawNetwork(scene: THREE.Scene, data: Graph, threejsDrawing: any) {
    const tweenGroup = threejsDrawing.data.tweenGroup;
    
    const FLOOR_SIZE = 200;
    // or, define it in `data.metadata`...

    // Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    light.position.set(0, 20, 0);
    scene.add(light);

    // Floor plane (XZ)
    const planeGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate to lie flat
    plane.position.y = 0; // Position it at y=0
    plane.position.z += FLOOR_SIZE / 2; // Center it
    scene.add(plane);

    // Axes helper: red (X), green (Y), blue (Z)
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // GRAPH LAYOUT: Layout + render
    ///layoutNodes(data.nodes);
    ///const nodeMeshes = drawNodes(scene, data);
    ///const linkMeshes = drawLinks(scene, data);
    ///applyForce(nodeMeshes, linkMeshes, data);

    // TREE LAYOUT: Layout + render
    const treeOptions = {
        dx: 30, // vertical spacing
        dy: 60, // horizontal spacing
        floorY: 0.5,
    };

    const laidOutNodes = drawTreeWithExtras(scene, data, treeOptions);

    // After rendering laidOutNodes
    const nodeMap: Map<number, GraphNode> = new Map(
        laidOutNodes
            .filter((n: any) => n.data && typeof n.data.id === 'number')
            .map((n: any) => [n.data.id as number, n])
    );
    const adjacencyMap = buildAdjacencyMap(data.links);

    const camera = threejsDrawing.data.camera;
    const controls = threejsDrawing.data.controls;

    const selector = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 16), new THREE.MeshStandardMaterial({ color: 'orange' }));
    selector.rotation.x = Math.PI / 2;
    scene.add(selector);

    setupKeyboardNavigation(tweenGroup, camera, controls, nodeMap, adjacencyMap, selector);
}

const networkDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawNetwork, 'dataSrc': 'force', 'dataType': 'json'},
    ],
    //'eventListeners': eventListeners,
    'eventListeners': {},
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: any, camera: THREE.Camera) => {
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



/*
TODO:
Swapping in other D3 layouts
    Cluster (dendrogram): import { cluster } from 'd3-hierarchy'; const layout = cluster().nodeSize([dx, dy]);
    Pack (circle‑packing): import { pack } from 'd3-hierarchy'; const layout = pack().size([width, height]).padding(5);
    Partition / Treemap: import { partition, treemap } from 'd3-hierarchy';
All of them compute x, y (and for pack: r), which you can map to Three.js coordinates (e.g. x→Z, y→X, etc.).
*/
