import * as THREE from 'three';
import * as d3 from "d3-hierarchy";
import { ThreeJSDrawing } from '../types';

interface Node {
    imageUrl: null;
    id: number;
    name: string;
    birthYear: number;   //  <-- add this
    x?: number;
    y?: number;
}

interface Link {
    source: number;      // child
    target: number;      // parent
    type: "parent";
}

interface FamilyGraph {
    nodes: Node[];
    links: Link[];
}


function layoutFamilyYearScale(graph: FamilyGraph, rootId: number) {
    const X_STEP      = 5;    // 10 world‑units between paternal ↔ maternal
    const YEAR_SCALE  = 0.05;  // 0.05 world‑units per calendar year

    // Map look‑ups
    const byId       = new Map(graph.nodes.map(n => [n.id, n]));
    const parentsOf  = new Map();        // child → [parents…]

    graph.links.forEach(({source, target}) => {
        if (!parentsOf.has(source)) parentsOf.set(source, []);
        parentsOf.get(source).push(target);
    });

    const root        = byId.get(rootId);
    if (!root) {
        throw new Error(`Root node with id ${rootId} not found`);
    }
    const refYear     = root.birthYear;  // y=0 at viewer’s birth year
    root.x = 0;
    root.y = 0;

    // BFS queue ⟨id, direction⟩ ; dir = −1left branch, +1right branch
    const q = [{id: rootId, dir: 0}];
    while (q.length) {
        const item = q.shift();
        if (!item) continue;
        const {id, dir} = item;
        const child     = byId.get(id);
        const parents   = parentsOf.get(id) || [];

        parents.forEach((pid: number, idx: number) => {
            const p   = byId.get(pid);
            if (!p || !child || child.x === undefined) return;
            const sgn = idx === 0 ? -1 : 1;        // first parent left, second right
            p.x = child.x + sgn * X_STEP;
            p.y = (p.birthYear - refYear) * YEAR_SCALE;  // older → positive y
            q.push({id: pid, dir: sgn});
        });
    }

    return graph;   // nodes now carry x&y
}


function layoutFamily(graph: FamilyGraph, rootId: number) {
    const X_STEP      = 5;    // 10 world‑units between paternal ↔ maternal
    const GEN_STEP    = 5;     // constant vertical distance per generation

    // Map look‑ups
    const byId       = new Map(graph.nodes.map(n => [n.id, n]));
    const parentsOf  = new Map();        // child → [parents…]

    graph.links.forEach(({source, target}) => {
        if (!parentsOf.has(source)) parentsOf.set(source, []);
        parentsOf.get(source).push(target);
    });

    const root        = byId.get(rootId);
    if (!root) {
        throw new Error(`Root node with id ${rootId} not found`);
    }
    root.x = 0;
    root.y = 0;

    // depth = 0 for “myself”, increases by 1 per generation
    const q = [{id: rootId, dir: 0, depth: 0}];
    while (q.length) {
        const item = q.shift();
        if (!item) continue;
        const {id, dir, depth} = item;
        const child     = byId.get(id);
        const parents   = parentsOf.get(id) || [];

        parents.forEach((pid: number, idx: number) => {
            const p   = byId.get(pid);
            if (!p || !child || child.x === undefined) return;
            const sgn = idx === 0 ? -1 : 1;        // first parent left, second right

            const step = X_STEP / (depth + 1);     // narrower each generation
            p.x = child.x + sgn * step;
            p.y = (depth + 1) * GEN_STEP;          // even spacing by generation
            q.push({id: pid, dir: sgn, depth: depth + 1});
        });
    }

    return graph;   // nodes now carry x&y
}


function layoutFamilyWithSpread(graph: FamilyGraph, rootId: number) {
    const X_STEP      = 5;    // 10 world‑units between paternal ↔ maternal
    const GEN_STEP    = 5;     // constant vertical distance per generation
    const SPOUSE_GAP  = 2;     // slight left/right split between the two parents

    // Map look‑ups
    const byId       = new Map(graph.nodes.map(n => [n.id, n]));
    const parentsOf  = new Map();        // child → [parents…]

    graph.links.forEach(({source, target}) => {
        if (!parentsOf.has(source)) parentsOf.set(source, []);
        parentsOf.get(source).push(target);
    });

    const root        = byId.get(rootId);
    if (!root) {
        throw new Error(`Root node with id ${rootId} not found`);
    }
    root.x = 0;
    root.y = 0;

    // depth = 0 for “myself”, increases by 1 per generation
    const q = [{id: rootId, dir: 0, depth: 0}];
    while (q.length) {
        const item = q.shift();
        if (!item) continue;
        const {id, dir, depth} = item;
        const child     = byId.get(id);
        const parents   = parentsOf.get(id) || [];

        parents.forEach((pid: number, idx: number) => {
            const p   = byId.get(pid);
            if (!p) return;
            // inherit branch side unless we’re the first split at depth‑0
            const branchDir = dir || (idx === 0 ? -1 : 1);

            // fan‑out rule: farther back → farther left or right
            p.x = branchDir * (depth + 1) * X_STEP           // main offset
                + (idx === 0 ? -SPOUSE_GAP : SPOUSE_GAP);   // parent pair gap

            p.y = (depth + 1) * GEN_STEP;                    // even vertical spacing

            q.push({id: pid, dir: branchDir, depth: depth + 1});
        });
    }

    return graph;   // nodes now carry x&y
}


function layoutWithD3(graph: FamilyGraph, rootId: number) {
    const X_STEP   = 4;   // tweak to taste (horizontal separation)
    const GEN_STEP =  4;   // vertical gap between generations

    // Build a lookup from node ID → node object
    const byId = new Map(graph.nodes.map(n => [n.id, n]));

    // Build child → parents map
    const parentsOf = new Map();
    graph.links.forEach(link => {
        if (!parentsOf.has(link.source)) parentsOf.set(link.source, []);
        parentsOf.get(link.source).push(link.target);
    });

    // Build a recursive hierarchy tree *from the child upward*
    type HierarchyNode = { id: number; children: HierarchyNode[] };
    
    function buildHierarchy(nodeId: number): HierarchyNode {
            const node: HierarchyNode = { id: nodeId, children: [] };
            const parentIds = parentsOf.get(nodeId) || [];
    
            for (const pid of parentIds) {
                node.children.push(buildHierarchy(pid));
            }
    
            return node;
        }

    const treeRoot = buildHierarchy(rootId);
    const root     = d3.hierarchy(treeRoot);

    // Layout using d3.tree()
    d3.tree().nodeSize([X_STEP, GEN_STEP]).separation((a: any, b: any) => a.parent === b.parent ? 1 : 1.4)(root);

    // Copy x/y positions back to original graph nodes
    root.each((d: any) => {
        const orig = byId.get(d.data.id);
        if (orig) {
            orig.x = d.x;
            orig.y = d.depth * GEN_STEP;
        }
    });

    return graph;
}


function labelSprite(text: string) {
    const canvas   = document.createElement("canvas");
    const ctx      = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }
    
    ctx.font       = "24px sans-serif";
    const w        = ctx.measureText(text).width + 20;
    const h        = 40;
    canvas.width   = w;  canvas.height = h;

    ctx.fillStyle  = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle  = "#000000";
    ctx.fillText(text, 10, 28);

    const texture  = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({map: texture, transparent: true});
    const sprite   = new THREE.Sprite(material);
    sprite.scale.set(w * 0.01, h * 0.01, 1);  // shrink canvas→world
    return sprite;
}

function labelSpriteWithImage(name: string, imageUrl: string | null = null) {
    return new Promise(resolve => {
        const canvas   = document.createElement("canvas");
        const ctx      = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }

        const fontSize = 24;
        ctx.font       = `${fontSize}px sans-serif`;

        const MAX_TEXT_WIDTH = 150;     // ← tweak this to control wrap width

        const padding  = 10;
        // measure text but cap at our max, so wrapping kicks in
        const rawTextW = Math.min(ctx.measureText(name).width, MAX_TEXT_WIDTH);
        const imgSize  = imageUrl ? fontSize + padding : 0;
        // content height = image + gap + one line of text
        const contentH = imgSize + padding + fontSize;
        // square side = max(text + paddings, content height + padding)
        const side     = Math.max(rawTextW + padding*2, contentH + padding);
        canvas.width   = side;
        canvas.height  = side;

        // precompute for draw
        const imageX = (side - imgSize) / 2;
        const textY  = imgSize + padding;

        // Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, side, side);

        const texture  = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({map: texture, transparent: true});
        const sprite   = new THREE.Sprite(material);

        // Scale canvas pixels → world units
        sprite.scale.set(side * 0.01, side * 0.01, 1);

        let img: HTMLImageElement | null = null;
        function drawLabel() {
            if (!ctx) return;  // safety check

            if (imageUrl && img && img.complete) {
                ctx.drawImage(img, imageX, padding, imgSize, imgSize);
            }
            ctx.fillStyle = "#000000";
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = "middle";
            // word-wrap & center text under the image
            ctx.textBaseline = "top";
            const maxTextW = side - padding*2;
            const words    = name.split(" ");
            let line       = "";
            let yPos       = textY;
            for (const w of words) {
                const test = line ? line + " " + w : w;
                if (ctx.measureText(test).width <= maxTextW) {
                    line = test;
                } else {
                    ctx.fillText(line, (side - ctx.measureText(line).width) / 2, yPos);
                    line = w;
                    yPos += fontSize + 2;
                }
            }
            if (line) {
              ctx.fillText(line, (side - ctx.measureText(line).width) / 2, yPos);
            }
            texture.needsUpdate = true;
        }

        // Optional image (asynchronously)
        if (imageUrl) {
            img = new Image();
            img.crossOrigin = "anonymous"; // Required if loading from another domain
            img.onload = () => {
                drawLabel();  // call after image loads
                resolve(sprite);
            };
            img.src = imageUrl;
        } else {
            drawLabel();
            resolve(sprite);
        }

        return sprite;
    });
}


async function drawFamilyTree(scene: THREE.Scene, data: any, threejsDrawing: ThreeJSDrawing) {
    // --- draw nodes ------------------------------------------------------
    const nodes = data.nodes;
    const links = data.links;

    //const graph = layoutFamily(data, /*rootId=*/1);
    //const graph = layoutFamilyWithSpread(data, /*rootId=*/1);
    const graph = layoutWithD3(data, /*rootId=*/1);
    graph.nodes.forEach(async n => {
        //const sprite = labelSprite(n.name);
        const sprite = await labelSpriteWithImage(n.name, n.imageUrl || null) as THREE.Sprite;
        sprite.position.set(n.x ?? 0, n.y ?? 0, 0);
        scene.add(sprite);
    });

    // --- draw links -------------------------------------------------------
    const material = new THREE.LineBasicMaterial({color: 0x888888});
    graph.links.forEach(({source, target}) => {
        const a = graph.nodes.find(n => n.id === source);
        const b = graph.nodes.find(n => n.id === target);
        if (a && b && a.x !== undefined && a.y !== undefined && b.x !== undefined && b.y !== undefined) {
            const g = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(a.x, a.y, 0),
                new THREE.Vector3(b.x, b.y, 0)
            ]);
            scene.add(new THREE.Line(g, material));
        }
    });

    // draw ambient light...
    const light = new THREE.AmbientLight(0x404040, 1);
    scene.add(light);
}

const familyTreeDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawFamilyTree, 'dataSrc': 'familytree', 'dataType': 'json'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
    },
    'data': {
        'sheetMusic': null,
    }
}

export { familyTreeDrawing };
