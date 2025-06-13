import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js'
import { ThreeJSDrawing } from "../threejsDrawing";

const cardWidth = 2.5;
const cardHeight = 3.5;
const cardThickness = 0.02; // small enough but noticeable edge
type DeckConfigType = {
    width: number;
    height: number;
    thickness: number;
    faceRotationZ: number;
    orientation: string;
    anisotropy?: number;
};

const DeckConfig: { [key: string]: DeckConfigType } = {
    portrait: {         // classic poker cards
        width: 2.5,
        height: 3.5,
        thickness: 0.02,
        faceRotationZ: 0,           // no extra rotation
        orientation: 'portrait'
    },
    landscape: {       // your new “wide” cards
        width: 3.5,       // swapped
        height: 2.5,
        thickness: 0.02,
        faceRotationZ: Math.PI / 2, // rotate 90° around Z so text reads left‑to‑right
        orientation: 'landscape'
    }
};

const textureCache = new Map();

function hashHtml(htmlString: string): number {
    let hash = 0;
    for (let i = 0; i < htmlString.length; i++) {
        hash = (hash << 5) - hash + htmlString.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}


function getCanvasSizeForCard(cardWidth: number, cardHeight: number, scale = 400) {
    return {
        width:  Math.round(cardWidth  * scale),
        height: Math.round(cardHeight * scale)
    };
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const gridSize = 1; // 1 unit grid spacing

let draggingCard: THREE.Mesh | null = null;
let dragOffset = new THREE.Vector3();

let wasOrbitDisabled = false;

let isDPressed = false;
const dealtCards: Set<number> = new Set(); // track already-dealt cards

const textureLoader = new THREE.TextureLoader();

function htmlToTexture(htmlString: string, width = 256, height = 384) {
    // TODO: textureCache.set(card.id, texture);

    const key = `${hashHtml(htmlString)}-${width}x${height}`;

    if (textureCache.has(key)) {
        return textureCache.get(key);
    }
    //const h1FontSize = 2.0;
    //const cardNumberFontSize = 1.5;
    //const regularFontSize = 1.0;

    const h1FontSize = 3.5;
    const cardNumberFontSize = 2.5;
    const regularFontSize = 2.0;

    const styles = `
<style>
h1.card_name {
    text-align: left;
    font-size: ${h1FontSize}em;
    padding-bottom: 0.3em;
    margin-bottom: 0.3em;
    border-bottom: 3px dotted #76777a;
    margin-top: 0.7em;
    line-height: 1em;
}

span.card_number {
    font-size: ${cardNumberFontSize}em;
}

div.card_info {
    font-size: ${regularFontSize}em;
    text-align: left;
}

div.card_info_space {
    font-size: ${regularFontSize}em;
    text-align: left;
    margin-top: 1em;
}

h2.card_headA {
    font-weight: bold;
    font-size: ${regularFontSize}em;
    text-align: left;
    margin-top: 0.5em;
    margin-top: 0.6em;
}

span.bold {
    font-weight: bold;
}

span.italic {
    font-style: italic;
}

/*NEW COLORS*/
span.red
{color: #b4282e;}
span.dark_blue
{color: #32438c;}
span.gold
{color: #f3c000;}
span.green
{color: #6ead52;}
span.pink
{color: #b7007d;}
span.blue
{color: #0090c5;}
span.lime_green
{color: #9fc54d;}
span.orange
{color: #bf5228;}
span.purple
{color: #52318d;}
span.yellow
/*{color: #ffec00;}*/
{color: #efdd01;}
span.teal
{color: #0aa4b0;}
</style>`;

    return new Promise((resolve, reject) => {
        const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;background:white;color:black;font-family:sans-serif;display:flex;align-items:center;justify-content:center;padding:1em;">
            ${styles}
            ${htmlString}
        </div>
    </foreignObject>
</svg>`;

        console.log('svgString', svgString);

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error('Failed to get canvas context');
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height); // fill with white background

            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            // Cache and return
            textureCache.set(key, texture);
            resolve(texture);
        };

        img.onerror = (err) => {
            console.error('Failed to load SVG image:', err);
            reject(err);
        };

        img.src = url;
    });
}



async function renderCard(card: any, cfg: any) {
    const cardGeometry = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.thickness);

    let cardFrontTexture;

    if (card.html === true) {
        const { width, height } = getCanvasSizeForCard(cfg.width, cfg.height);
        cardFrontTexture = await htmlToTexture(card.htmlContent, width, height);
        cardFrontTexture.anisotropy = cfg.anisotropy;
        cardFrontTexture.minFilter = THREE.LinearMipMapLinearFilter;
        cardFrontTexture.magFilter = THREE.LinearFilter;
    } else {
        cardFrontTexture = textureLoader.load(`textures/${card.texture}`);
    }
    const cardBackTexture = textureLoader.load(`textures/${card.backTexture || 'cards/back_texture.png'}`);

    // Material for the front face
    const frontMaterial = new THREE.MeshBasicMaterial({ map: cardFrontTexture });
    // Material for the back face
    const backMaterial  = new THREE.MeshBasicMaterial({ map: cardBackTexture });
    // Material for the edges – solid color or repeated edge texture
    const edgeMaterial  = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const cardMaterials = [
      edgeMaterial, // +X side
      edgeMaterial, // -X side
      edgeMaterial, // +Y side
      edgeMaterial, // -Y side
      frontMaterial, // +Z side
      backMaterial,  // -Z side
    ];

    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterials);

    // apply extra rotation for landscape cards
    if (cfg.faceRotationZ !== 0) cardMesh.rotation.z = cfg.faceRotationZ;

    return cardMesh;
}


async function renderCards(scene: THREE.Scene, cardDataArr: any[], cfg: any) {
    const cardMeshPromises = cardDataArr.map(async cardData => {
        const cardMesh = await renderCard(cardData, cfg);
        cardMesh.position.copy(cardData.position);
        scene.add(cardMesh);
        return cardMesh;
    });

    const cardMeshes = await Promise.all(cardMeshPromises);
    return cardMeshes;
}


function generateCardPositionsOld(numCards: number, horizontalSpacing = 3) {
    const positions = [];
    for (let i = 0; i < numCards; i++) {
        const x = (i % 10) * horizontalSpacing; // 10 cards per row
        const y = Math.floor(i / 10) * horizontalSpacing;
        positions.push(new THREE.Vector3(x, y, 0));
    }
    return positions;
}

// with verticalSpacing
async function generateCardPositions(numCards: number, horizontalSpacing = 3, verticalSpacing = 3) {
    const positions = [];
    for (let i = 0; i < numCards; i++) {
        const x = (i % 10) * horizontalSpacing; // 10 cards per row
        const y = Math.floor(i / 10) * verticalSpacing;
        positions.push(new THREE.Vector3(x, y, 0));
    }
    return positions;
}


function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function animateCardSwap(card: THREE.Mesh, targetPos: THREE.Vector3, onComplete?: () => void) {
    const liftHeight = 0.5; // how high to lift the card

    // 1) Lift up
    const liftTween = new TWEEN.Tween(card.position).to({ y: card.position.y + liftHeight }, 300).easing(TWEEN.Easing.Cubic.Out);

    // 2) Move horizontally
    const moveTween = new TWEEN.Tween(card.position).to({ x: targetPos.x, z: targetPos.z }, 600).easing(TWEEN.Easing.Cubic.InOut);

    // 3) Drop down
    const dropTween = new TWEEN.Tween(card.position).to({ y: targetPos.y }, 300).easing(TWEEN.Easing.Cubic.In);

    // Chain them together: lift -> move -> drop
    liftTween.chain(moveTween);
    moveTween.chain(dropTween);

    // Finally, call onComplete if needed
    dropTween.onComplete(() => {if (onComplete) onComplete();});

    // Start!
    liftTween.start();
}


function shuffleAndAnimate(cards: THREE.Mesh[], cardPositions: THREE.Vector3[]) {
    // Create an array of indices [0..cards.length-1]
    const indices = Array.from({ length: cards.length }, (_, i) => i);
    shuffleArray(indices); // randomize

    // For each position i, we want the card that was originally at i to go to the new position at indices[i].
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const newIndex = indices[i];
        const targetPos = cardPositions[newIndex]; // e.g., a Vector3

        // Animate the card from current position to target position
        animateCardSwap(card, targetPos);
    }
}


function swapCardsOld(cards: THREE.Mesh[], i: number, j: number, onComplete?: () => void) {
    const cardA = cards[i];
    const cardB = cards[j];
    const posA = cardA.position.clone();
    const posB = cardB.position.clone();

    // Animate cardA -> posB
    animateCardSwap(cardA, posB, () => {
        // Once cardA finishes dropping, do we consider cardB movement?
    });

    // Animate cardB -> posA
    animateCardSwap(cardB, posA, () => {
        // Once cardB finishes dropping, swap references in array
        [cards[i], cards[j]] = [cards[j], cards[i]];
        if (onComplete) onComplete();
    });
}

/**
 * Returns true if we actually launched a swap, false if one of the two
 * cards is busy.
 */
function swapCards(cards: THREE.Mesh[], i: number, j: number, onComplete?: () => void) {
    if (i === j) return false;                    // same index – ignore

    const cardA = cards[i];
    const cardB = cards[j];

    // already part of another swap?
    if (cardA.userData.busy || cardB.userData.busy) return false;

    cardA.userData.busy = cardB.userData.busy = true;

    const posA = cardA.position.clone();
    const posB = cardB.position.clone();

    // move A up and out of the way
    const liftHeight = 0.6;
    const tempPos = posA.clone().add(new THREE.Vector3(0, liftHeight, 0));

    animateCardSwap(cardA, tempPos, () => {

        // slide B into A’s slot
        animateCardSwap(cardB, posA, () => {

            // 3drop A into B’s slot
            animateCardSwap(cardA, posB, () => {
                // final bookkeeping
                [cards[i], cards[j]] = [cards[j], cards[i]];
                cardA.userData.busy = cardB.userData.busy = false;
                onComplete?.();
            });
        });
    });

    return true;
}

const gapBetweenCards = 0.5;

function dealOneCard(cards: THREE.Mesh[], cfg: any) {
    const nthCard = dealtCards.size;

    const available = cards.filter((_, i) => !dealtCards.has(i));
    if (available.length === 0) return;

    // Pick a random undealt card
    const index = Math.floor(Math.random() * available.length);
    const card = available[index];
    const originalIndex = cards.indexOf(card);
    dealtCards.add(originalIndex);

    // Target position and rotation
    //const newPos = card.position.clone().add(new Vector3(0, -2, 4));

    //const newZPos = 5 + nthCard * (cfg.width + gapBetweenCards);
    const cardSpacing = cfg.width + gapBetweenCards;
    const tableOriginZ = 5; // or whatever your table origin is
    const newZPos     = tableOriginZ + nthCard * cardSpacing;

    //let newRot = { y: card.rotation.y + cfg.faceRotationZ };
    //let newRot = { y: card.rotation.y + Math.PI / 2 };
    let newRot;

    if (cfg.orientation === 'landscape') {
        newRot = { x: card.rotation.x + Math.PI / 2, z: card.rotation.z + Math.PI / 2 + Math.PI / 2, y: card.rotation.y + Math.PI / 2 };
    } else {
        newRot = { x: card.rotation.x, y: card.rotation.y + Math.PI / 2, z: card.rotation.z };
    }
    // rotate another 90 degrees around Y

    // Animate position
    new TWEEN.Tween(card.position).to({ x: 0, y: 0, z: newZPos}, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();

    // Animate rotation (Y only)
    new TWEEN.Tween(card.rotation).to({ x: newRot.x, y: newRot.y, z: newRot.z }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
}


function getCardValue(cardName: string) {
    switch (cardName) {
        case 'ace':
            return 11; // or 1, depending on the game rules
        case 'jack':
        case 'queen':
        case 'king':
            return 10;
        case 'two':
            return 2;
        case 'three':
            return 3;
        case 'four':
            return 4;
        case 'five':
            return 5;
        case 'six':
            return 6;
        case 'seven':
            return 7;
        case 'eight':
            return 8;
        case 'nine':
            return 9;
        case 'ten':
            return 10;
        default:
            return parseInt(cardName) || 0; // for numbered cards
    }
}

function calculateHandValue(dealtCards: Set<number>, cardsArray: any[]) {
    let totalValue = 0;
    let aceCount = 0;

    dealtCards.forEach(card => {
        console.log('card', card);
        ///const cardName = card.name.split('_')[0]; // e.g., "ace_of_spaces" -> "ace"
        const cardRank = cardsArray[card].rank;
        const cardSuit = cardsArray[card].suit;
        const value = getCardValue(cardRank);
        totalValue += value;
        if (value === 11) aceCount++;
    });

    // Adjust for Aces
    while (totalValue > 21 && aceCount > 0) {
        totalValue -= 10; // Ace can be 1 instead of 11
        aceCount--;
    }

    return totalValue;
}

function animationCallback(cards: THREE.Mesh[]) {
    const SWAPS_PER_PRESS = 10;
    let launched = 0;
    const maxTries = SWAPS_PER_PRESS * 3;   // prevent infinite loop

    for (let tries = 0; tries < maxTries && launched < SWAPS_PER_PRESS; tries++) {
        const i = Math.floor(Math.random() * cards.length);
        const j = Math.floor(Math.random() * cards.length);
        if (swapCards(cards, i, j)) launched++;
    }
}

// TODO: Is back_texture too high resolution?


function drawCards(scene: THREE.Scene, data: any, threejsDrawing: any) {
    const cards = data.cards || [];
    const metadata = data.metadata || {};
    // cards format: `"ace_of_spaces": { "name": "Ace of Spades", "texture": "ace_of_spades.png", "backTexture": "cards/back_texture.png" }`
    const cardsArray = Object.entries(cards).map(([key, value]) => {
        return {
            name: key,
            ...(value as object),
            position: new THREE.Vector3(0, 0, 0) // default position
        };
    });

    const deckType: 'portrait' | 'landscape' = (metadata.orientation === 'landscape') ? 'landscape' : 'portrait'; // default to portrait

    const cfg = DeckConfig[deckType];

    cfg.anisotropy = threejsDrawing.data.renderer.capabilities.getMaxAnisotropy();

    renderCards(scene, cardsArray, cfg).then(async cardMeshes => {
        const cardPositions = await generateCardPositions(cardsArray.length, 3, 4); // spacing of 3 units
        shuffleAndAnimate(cardMeshes, cardPositions);
        threejsDrawing.data.cards = cardMeshes;
        threejsDrawing.data.cardPositions = cardPositions;
        window.cardPositions = cardPositions;
        threejsDrawing.data.cardsArray = cardsArray;
        threejsDrawing.data.cfg = cfg;

        threejsDrawing.data.ready = true;

        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);

        window.addEventListener('mousedown', (e) => onMouseDown(e, threejsDrawing));
        window.addEventListener('mousemove', (e) => onMouseMove(e, threejsDrawing));
        window.addEventListener('mouseup', (e => onMouseUp(e, threejsDrawing)));
    }).catch(err => {
        console.error("Failed to render cards:", err);
    });
}

function logDealtCards() {
    const dealtCardsArray = Array.from(dealtCards);
    const dealtCardPositions = window.cardPositions.filter((_: any, i: number) => dealtCardsArray.includes(i));
    console.log('Dealt cards:', dealtCardsArray, 'Positions:', dealtCardPositions);
}

let isSpacePressed = false;

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpacePressed) {isSpacePressed = true;}
    if (e.code === 'KeyD'   && !isDPressed)    isDPressed    = true;
    if (e.code === 'KeyL') logDealtCards();
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {isSpacePressed = false;}
    if (e.code === 'KeyD')   isDPressed    = false;
});

function onMouseDown(e: MouseEvent, threejsDrawing: ThreeJSDrawing) {
    if (!threejsDrawing.data?.cards) return;

    const camera = threejsDrawing.data.camera as THREE.Camera;
    if (!camera || !(camera instanceof THREE.Camera)) return;
    const renderer = threejsDrawing.data.renderer as THREE.WebGLRenderer;
    if (!renderer) return;
    const controls = threejsDrawing.data.controls;
    if (!controls) {console.log('no controls'); return;}

    const intersects = getIntersections(e, camera, renderer.domElement, threejsDrawing.data.cards);
    if (intersects.length > 0) {
        if ('enabled' in controls) {
            (controls as { enabled: boolean }).enabled = false;
            wasOrbitDisabled = true;
        }

        draggingCard = intersects[0].object as THREE.Mesh;

        // Find projected point on the table
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(tablePlane, intersectionPoint);

        dragOffset.copy(intersectionPoint).sub(draggingCard.position);
    }
}

function createLockedPlane(axis = 'y', value = 0) {
    const normals = {x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1)};
    return new THREE.Plane(normals[axis], value);
}

const tablePlane = createLockedPlane('y', 0);
const wallPlane = createLockedPlane('x', 0);

function snapToGrid(pos: THREE.Vector3, allowedAxes = ['x', 'z']) {
    const snapped = pos.clone();
    if (allowedAxes.includes('x')) snapped.x = Math.round(snapped.x / gridSize) * gridSize;
    if (allowedAxes.includes('y')) snapped.y = Math.round(snapped.y / gridSize) * gridSize;
    if (allowedAxes.includes('z')) snapped.z = Math.round(snapped.z / gridSize) * gridSize;
    return snapped;
}

function onMouseMove(e: MouseEvent, threejsDrawing: ThreeJSDrawing) {
    if (!draggingCard) return;

    const camera = threejsDrawing.data.camera as THREE.Camera;
    if (!camera || !(camera instanceof THREE.Camera)) return;
    const renderer = threejsDrawing.data.renderer;
    if (!renderer) return;

    // Update mouse coords
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const intersectionPoint = new THREE.Vector3();
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(wallPlane, intersectionPoint);

    if (intersectionPoint) {
        const originalPos = intersectionPoint.sub(dragOffset);
        const snappedPos = snapToGrid(originalPos, ['x', 'y', 'z']);
        snappedPos.x = 0; // lock to table
        draggingCard.position.copy(snappedPos);
    }
}

function onMouseUp(e: MouseEvent, threejsDrawing: ThreeJSDrawing) {
    draggingCard = null;

    if (wasOrbitDisabled) {
        threejsDrawing.data.controls.enabled = true;
        wasOrbitDisabled = false;
    }
}

function getIntersections(event: MouseEvent, camera: THREE.Camera, canvas: HTMLCanvasElement, objects: THREE.Object3D[]) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(objects);
}

const cardsDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawCards, 'dataSrc': 'cards', 'dataType': 'json'},
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        if (!threejsDrawing.data.ready || !threejsDrawing.data.cards) {
            console.warn('No cards found.');
            return;
        }

        if (isSpacePressed) {
            if (Array.isArray(threejsDrawing.data.cards)) {
                animationCallback(threejsDrawing.data.cards);
            }
            isSpacePressed = false; // remove this line if you want it to shuffle continuously while space is held
        }

        if (isDPressed) {
            if (Array.isArray(threejsDrawing.data.cards)) {
                dealOneCard(threejsDrawing.data.cards, threejsDrawing.data.cfg); // deal one card
            }
            isDPressed = false;

            const handValue = calculateHandValue(dealtCards, threejsDrawing.data.cardsArray as any[]);
            console.log(`Hand value: ${handValue}`);
        }
    },
    'data': {
        'cards': null,
    },
    'sceneConfig': {
    }
}

export { cardsDrawing };
