import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { drawBasicLights } from './reusables/drawLights'
import { ThreeJSDrawing } from '../types'
import * as NEURAL_NETWORKS from './educational/neuralNetworks'
import { drawGraphV2 } from './drawGraph'

type TreeNode = {
    id: string
    answers?: Array<{
        child: TreeNode
        text: string
    }>
    // Add any other properties you need for the node
}

type TreeOptions = {
    levelHeight?: number // Vertical distance between levels
    nodeSpacing?: number // Horizontal distance between nodes on the same level
}

type QueueItem = {
    node: TreeNode
    level: number // Depth level in the tree
    parentId?: string | null // ID of the parent node, if any
}

/**
 * Helper to compute a camera stop position for a node, so the camera is always a fixed distance in front of the node (along +z) and slightly above.
 */
function getCameraStopForNode(
    nodePos: THREE.Vector3,
    camera: THREE.PerspectiveCamera,
    radius = 0.5,
    padding = 1.2, // extra space around the node
) {
    const fov = THREE.MathUtils.degToRad(camera.fov)
    const dist = (radius * padding) / Math.tan(fov / 2)

    return nodePos.clone().add(new THREE.Vector3(0, 0, dist))
}

/**
 * Generates 3D layout coordinates for a decision tree.
 * @param {object} rootNode The root node of the decision tree.
 * @param {object} [options] Configuration options.
 * @param {number} [options.levelHeight=8] The vertical distance between levels of the tree.
 * @param {number} [options.nodeSpacing=10] The horizontal distance between nodes on the same level.
 * @returns {{nodes: Array, edges: Array}} An object containing arrays of nodes with their positions and edges connecting them.
 */
export function generateTreeLayout(
    rootNode: TreeNode,
    options: TreeOptions = {},
    camera: THREE.PerspectiveCamera,
) {
    const levelHeight = options.levelHeight || 8
    const nodeSpacing = options.nodeSpacing || 10
    // const cameraOffset = new THREE.Vector3(0, 2, 15) // How far the camera is from the overlay

    type LayoutNode = {
        id: string
        level: number
        sourceNode: TreeNode
        position: THREE.Vector3
        cameraStop: THREE.Vector3
    }
    const layoutNodes: { [id: string]: LayoutNode } = {} // For quick lookup by ID
    const nodesByLevel: LayoutNode[][] = [] // To store nodes at each depth: [[root], [child1, child2], ...]
    const edges = []

    // --- Pass 1: Breadth-First Search (BFS) to analyze structure ---
    const queue: QueueItem[] = [{ node: rootNode, level: 0, parentId: null }]

    while (queue.length > 0) {
        const item = queue.shift()
        if (!item) continue
        const { node, level, parentId } = item

        // Ensure this level's array exists
        if (!nodesByLevel[level]) {
            nodesByLevel[level] = []
        }

        // Store the node with its metadata
        const layoutNode = {
            id: node.id,
            level: level,
            sourceNode: node,
            position: new THREE.Vector3(),
            cameraStop: new THREE.Vector3(),
        }
        layoutNodes[node.id] = layoutNode
        nodesByLevel[level].push(layoutNode)

        if (parentId) {
            edges.push({ from: parentId, to: node.id })
        }

        if (node.answers) {
            for (const answer of node.answers) {
                if (answer.child) {
                    queue.push({
                        node: answer.child,
                        level: level + 1,
                        parentId: node.id,
                    })
                }
            }
        }
    }

    // --- Pass 2: Calculate coordinates based on level and position ---
    nodesByLevel.forEach((levelNodes, level) => {
        const levelWidth = (levelNodes.length - 1) * nodeSpacing
        const startX = -levelWidth / 2 // Center the row of nodes

        levelNodes.forEach((layoutNode, i) => {
            const x = startX + i * nodeSpacing
            const y = -level * levelHeight
            const z = 0 // We'll keep the layout on a 2D plane for clarity

            // Set the final 3D positions
            layoutNode.position.set(x, y, z)
            layoutNode.cameraStop.copy(
                getCameraStopForNode(layoutNode.position, camera),
            )
        })
    })

    return {
        nodes: Object.values(layoutNodes),
        edges: edges,
    }
}

function renderCSS3DOverlay(
    scene: THREE.Scene,
    threejsDrawing: ThreeJSDrawing,
    html: string,
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    targetPoint: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
) {
    const container = document.createElement('div')

    // Note: It's often better to apply styles via a CSS class for cleanliness
    // e.g., container.className = 'css3d-overlay';

    container.innerHTML = html
    container.style.position = 'absolute'
    container.style.top = '0'
    container.style.left = '0'
    container.style.pointerEvents = 'none' // Allow mouse events to pass through

    // Create a CSS3DObject from the container
    const css3DObject = new CSS3DObject(container)
    css3DObject.position.copy(position)

    // Scale the object down to a reasonable size in the scene
    const scaleFactor = 0.01 // This value requires tweaking!
    css3DObject.scale.set(scaleFactor, scaleFactor, scaleFactor)

    // Invert the Y-axis to correct the orientation
    //css3DObject.scale.y *= -1

    // Rotate the object 180 degrees on the Y axis to face the camera.
    // (PI radians = 180 degrees). This replaces the scale.y flip.
    css3DObject.rotation.y = Math.PI

    // Create an invisible pivot Object3D
    const pivot = new THREE.Object3D()
    pivot.position.copy(position)

    // Add the CSS3DObject as a child of the pivot
    pivot.add(css3DObject)

    // Make the PIVOT look at the target point.
    // This orients the entire group without messing up the child's local rotation.
    pivot.lookAt(targetPoint)

    // Add the pivot (which contains the overlay) to the scene
    scene.add(pivot)

    threejsDrawing.data.css3DOverlay = css3DObject
}

function drawLegend(scene: THREE.Scene, legendData: { [key: string]: string }) {
    const legendGroup = new THREE.Group()
    const legendWidth = 4 // Increased width for better spacing
    const rowHeight = 0.5
    const legendHeight = Object.keys(legendData).length * rowHeight

    // --- Build the background plane at the group's origin ---
    const legendGeometry = new THREE.PlaneGeometry(legendWidth, legendHeight)
    const legendMaterial = new THREE.MeshBasicMaterial({
        color: 0x111111, // Dark grey instead of pure black
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
    })
    const legendPlane = new THREE.Mesh(legendGeometry, legendMaterial)
    // We will add other items relative to this.
    legendGroup.add(legendPlane)

    // --- Add shapes and labels relative to the group's center ---
    const startY = legendHeight / 2 - rowHeight / 2
    const shapeX = -legendWidth / 2 + 0.4
    const labelX = -legendWidth / 2 + 0.8
    const zOffset = 0.01 // Tiny offset to prevent shapes/labels from clipping into the plane

    let i = 0
    for (const [type, label] of Object.entries(legendData)) {
        // Calculate the Y position for the current row, starting from the top
        const yPos = startY - i * rowHeight

        const cellClass: NEURAL_NETWORKS.ICell = NEURAL_NETWORKS.CELL_MAP[
            type
        ] as NEURAL_NETWORKS.ICell
        if (
            !cellClass ||
            !(cellClass.prototype instanceof NEURAL_NETWORKS.Cell) ||
            cellClass === NEURAL_NETWORKS.Cell
        ) {
            console.warn(
                `Skipping unknown or abstract cell type in legend: ${type}`,
            )
            continue
        }
        const cell = new cellClass()
        const cellMesh = cell.shape?.clone()

        if (cellMesh) {
            // Position the shape on the left side of the legend plane
            cellMesh.position.set(shapeX, yPos, zOffset)
            cellMesh.scale.set(0.5, 0.5, 0.5) // Scale down the example shape
            legendGroup.add(cellMesh)
        }

        // Create the label text on the right side of the shape
        drawLabel(
            legendGroup, // Add to the group!
            label,
            new THREE.Vector3(labelX, yPos, zOffset),
        )

        i++
    }

    // --- Position, rotate, and scale the ENTIRE group in the world ---
    legendGroup.position.set(4, 3, -5) // Example final position
    // No rotation needed if you want it to face the camera by default
    scene.add(legendGroup)

    // Optional: Make the legend always face the camera (billboarding)
    // This requires passing the camera to the function.
    // legendGroup.quaternion.copy(camera.quaternion);
}

type BarChartOptions = {
    width?: number // Width of each bar
    spacing?: number // Spacing between bars
    color?: string | number // Color of the bars, can be hex or string
}

type Datum = {
    label: string // Label for the bar
    value: number // Height of the bar
}

function createBarChart(data: any, options: BarChartOptions = {}) {
    const group = new THREE.Group()
    const barWidth = options.width || 0.8
    const barSpacing = options.spacing || 1.0
    const baseColor = new THREE.Color(options.color || 0x007bff)

    data.forEach((d: Datum, i: number) => {
        const barHeight = d.value
        const geometry = new THREE.BoxGeometry(barWidth, barHeight, barWidth)
        const material = new THREE.MeshStandardMaterial({ color: baseColor })
        const bar = new THREE.Mesh(geometry, material)

        // Position the bar. We move it up by half its height so its base is at y=0.
        bar.position.set(i * barSpacing, barHeight / 2, 0)

        // *** The Most Important Part for Interactivity ***
        // Store the original data and color right on the 3D object.
        bar.userData = {
            sourceData: d,
            originalColor: baseColor.clone(),
        }

        group.add(bar)
    })

    return group
}

// How you'd call it:
// const myData = [{ label: 'Q1', value: 150 }, { label: 'Q2', value: 220 }];
// const chart = createBarChart(myData);
// scene.add(chart);

function drawLabel(
    scene: THREE.Scene | THREE.Group,
    text: string,
    position: THREE.Vector3,
) {
    const loader = new FontLoader()
    loader.load('/threejs/drawing/helvetiker_regular.typeface.json', (font) => {
        const geometry = new TextGeometry(text, {
            font: font,
            size: 0.1,
            depth: 0.05,
            curveSegments: 12,
            bevelEnabled: false,
        })

        // 1. Compute the bounding box to get the size of the text geometry
        geometry.computeBoundingBox()

        // 2. Calculate the offset to center the text
        let textWidth = 0
        let textHeight = 0
        let textDepth = 0
        if (geometry.boundingBox) {
            textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x
            textHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y
            textDepth = geometry.boundingBox.max.z - geometry.boundingBox.min.z
        }

        const centerOffset = new THREE.Vector3(
            -0.5 * textWidth, // Half the width to center horizontally
            0.8, // A fixed vertical offset to place it above the node
            -0.5 * textDepth, // Half the depth
        )

        const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const mesh = new THREE.Mesh(geometry, material)

        mesh.position.copy(position).add(centerOffset)

        scene.add(mesh)
    })
}

function drawInfographics(
    scene: THREE.Scene,
    data: any,
    threejsDrawing: ThreeJSDrawing,
) {
    // Placeholder for neural networks drawing logic
    console.log('Drawing neural networks...')

    const css3DRenderer = threejsDrawing.data.css3DRenderer
    const css3DScene = threejsDrawing.data.css3DScene

    if (!css3DRenderer || !css3DScene) {
        console.warn('CSS3DRenderer or CSS3DScene not initialized.')
        return
    }

    const tourDestinationsOld = [
        // start position: zoomed way out to see everything...
        {
            cameraStop: new THREE.Vector3(0, 5, 20),
            overlayPosition: new THREE.Vector3(0, 0, 0),
            overlayContent: `<h1>Welcome to the Neural Networks Tour</h1>`,
        },
    ]

    let destinations: Array<{
        cameraStop: [number, number, number]
        overlayPosition: [number, number, number]
        overlayContent: string
    }> = []

    let renders: Array<{
        type: string // e.g., 'BARCHART', 'LEGEND', 'CSS3DOVERLAY', 'GRAPH'
        label?: string // Optional label for graphs
        items?: { [key: string]: string } // Items for legends
        overlayContent?: string // HTML content for CSS3D overlays
        cameraStop?: [number, number, number] // Point to look at for CSS3D overlays
        data?: any // Data for the render type
        width?: number // Width for bar charts
        spacing?: number // Spacing for bar charts
        color?: string | number // Color for bar charts
        position: [number, number, number] // Position for graphs
    }> = []

    if (data.type === 'DECISION_TREE') {
        if (!data.tree) {
            console.warn('No decision tree data provided.')
            return
        }

        // Generate layout for a decision tree
        const treeLayout = generateTreeLayout(
            data.tree,
            {
                levelHeight: 8,
                nodeSpacing: 10,
            },
            threejsDrawing.data.camera as THREE.PerspectiveCamera,
        )

        // Add nodes as CSS3D overlays
        for (const node of treeLayout.nodes) {
            destinations.push({
                cameraStop: new THREE.Vector3(
                    node.cameraStop.x,
                    node.cameraStop.y,
                    node.cameraStop.z,
                ).toArray(),
                overlayPosition: new THREE.Vector3(
                    node.position.x,
                    node.position.y,
                    node.position.z,
                ).toArray(),
                overlayContent: `<div class="css3d-overlay">
                    <h2>${node.sourceNode.id}</h2>
                </div>`,
            })
        }
    } else {
        destinations = data.destinations || []
        renders = data.renders || []
    }

    threejsDrawing.data.destinations = destinations
    threejsDrawing.data.renders = renders

    for (const dest of destinations) {
        // Create a CSS3D overlay for each destination
        renderCSS3DOverlay(
            css3DScene,
            threejsDrawing,
            dest.overlayContent,
            new THREE.Vector3(
                dest.overlayPosition[0],
                dest.overlayPosition[1],
                dest.overlayPosition[2],
            ),
        )
    }

    for (let i = 0; i < renders.length; i++) {
        const r = renders[i]

        if (r.type === 'BARCHART') {
            const barChart = createBarChart(r.data, {
                width: r.width,
                spacing: r.spacing,
                color: r.color, // Can be hex or string
            })
            barChart.position.set(r.position[0], r.position[1], r.position[2])
            scene.add(barChart)
        } else if (r.type === 'LEGEND') {
            if (!r.items || Object.keys(r.items).length === 0) {
                console.warn('No items provided for legend rendering.')
                continue
            }
            drawLegend(scene, r.items)
        } else if (r.type === 'CSS3DOVERLAY') {
            if (!r.overlayContent) {
                console.warn('No overlay content provided for CSS3D overlay.')
                continue
            }
            if (!r.cameraStop) {
                console.warn('No camera stop provided for CSS3D overlay.')
                continue
            }
            renderCSS3DOverlay(
                scene,
                threejsDrawing,
                r.overlayContent, // HTML content for the overlay
                //r.overlayPosition, // Position in 3D space
                new THREE.Vector3(r.position[0], r.position[1], r.position[2]),
                //r.cameraStop, // Point to look at
                new THREE.Vector3(
                    r.cameraStop[0],
                    r.cameraStop[1],
                    r.cameraStop[2],
                ),
            )
        } else if (r.type === 'GRAPH') {
            // Assuming r.data is in the format expected by drawGraphV2
            const center = new THREE.Vector3(
                r.position[0],
                r.position[1],
                r.position[2],
            )
            drawGraphV2(
                scene,
                r as any, // Cast to any to match the expected type
                center,
            )
            console.log('about to draw label', r.label)
            if (r.label) {
                const labelPosition = new THREE.Vector3(
                    r.position[0],
                    r.position[1] + 1, // Offset for label height
                    r.position[2],
                )
                drawLabel(scene, r.label, labelPosition)
            }
        } else {
            console.warn(`Unknown render type: ${r.type}`)
        }
    }

    drawBasicLights(scene, threejsDrawing)
}

const infographicsDrawing = {
    sceneElements: [],
    drawFuncs: [
        {
            func: drawInfographics,
            dataSrc: 'infographics',
            dataType: 'json',
        },
    ],
    eventListeners: {
        keydown: (e: KeyboardEvent, other: any) => {
            const { camera, data, controls } = other
            if (e.key === 'Escape') {
                // Reset camera to initial position
                camera.position.set(0, 5, 20)
                camera.lookAt(new THREE.Vector3(0, 0, 0))
                controls.update()
                return
            }

            const tweenGroup = data.tweenGroup
            if (!tweenGroup) {
                console.warn('TweenGroup not initialized.')
                return
            }

            const destinations = data.destinations || []
            if (destinations.length === 0) {
                console.warn('No destinations defined for camera tweening.')
                return
            }

            // Helper function for tweening camera
            function tweenCameraToDestination(
                camera: THREE.Camera,
                controls: any,
                tweenGroup: any,
                destination: any,
                duration = 1000,
            ) {
                const cameraStop = new THREE.Vector3(...destination.cameraStop)
                const lookAt = new THREE.Vector3(...destination.overlayPosition)
                tweenGroup.add(
                    new TWEEN.Tween(camera.position)
                        .to(cameraStop, duration)
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .onComplete(() => {
                            camera.lookAt(lookAt)
                            controls && controls.update()
                        })
                        .start(),
                )
            }

            // Map keys '1'-'4' to destination indices 0-3
            const keyToIndex: { [key: string]: number } = {
                '1': 0,
                '2': 1,
                '3': 2,
                '4': 3,
            }
            if (e.key in keyToIndex && destinations[keyToIndex[e.key]]) {
                tweenCameraToDestination(
                    camera,
                    controls,
                    tweenGroup,
                    destinations[keyToIndex[e.key]],
                )
            }
        },
    },
    animationCallback: (
        renderer: THREE.WebGLRenderer,
        timestamp: number,
        threejsDrawing: ThreeJSDrawing,
        camera: THREE.Camera,
    ) => {},
    data: {
        simulation: null,
        dragging: false,
        draggedNode: null,
    },
    sceneConfig: {
        cssRendererEnabled: '3D',
    },
}

export { infographicsDrawing }
