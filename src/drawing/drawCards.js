import { BoxGeometry, TextureLoader, Mesh, MeshBasicMaterial, Vector3, AmbientLight } from 'three';
import { Tween, Easing } from 'tween';

const cardWidth = 2.5;
const cardHeight = 3.5;
const cardThickness = 0.02; // small enough but noticeable edge

let isDPressed = false;
const dealtCards = new Set(); // track already-dealt cards

const textureLoader = new TextureLoader();


function renderCard(card) {
    const cardGeometry = new BoxGeometry(cardWidth, cardHeight, cardThickness);

    const cardFrontTexture = textureLoader.load(`textures/${card.texture}`);
    const cardBackTexture = textureLoader.load(`textures/${card.backTexture || 'cards/back_texture.png'}`);

    // Material for the front face
    const frontMaterial = new MeshBasicMaterial({ map: cardFrontTexture });
    // Material for the back face
    const backMaterial  = new MeshBasicMaterial({ map: cardBackTexture });
    // Material for the edges – solid color or repeated edge texture
    const edgeMaterial  = new MeshBasicMaterial({ color: 0xffffff });

    const cardMaterials = [
      edgeMaterial, // +X side
      edgeMaterial, // -X side
      edgeMaterial, // +Y side
      edgeMaterial, // -Y side
      frontMaterial, // +Z side
      backMaterial,  // -Z side
    ];

    const cardMesh = new Mesh(cardGeometry, cardMaterials);

    return cardMesh;
}


function renderCards(scene, cardDataArr) {
    return cardDataArr.map(cardData => {
        const cardMesh = renderCard(cardData);
        cardMesh.position.copy(cardData.position);   // or set() if you prefer
        scene.add(cardMesh);
        return cardMesh;
    });
}


function generateCardPositionsOld(numCards, horizontalSpacing = 3) {
    const positions = [];
    for (let i = 0; i < numCards; i++) {
        const x = (i % 10) * horizontalSpacing; // 10 cards per row
        const y = Math.floor(i / 10) * horizontalSpacing;
        positions.push(new Vector3(x, y, 0));
    }
    return positions;
}

// with verticalSpacing
function generateCardPositions(numCards, horizontalSpacing = 3, verticalSpacing = 3) {
    const positions = [];
    for (let i = 0; i < numCards; i++) {
        const x = (i % 10) * horizontalSpacing; // 10 cards per row
        const y = Math.floor(i / 10) * verticalSpacing;
        positions.push(new Vector3(x, y, 0));
    }
    return positions;
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Suppose we have an array of indices [0..51]. Shuffle it:
const indices = Array.from({ length: 52 }, (_, i) => i);
shuffleArray(indices);

// Now `indices` is a random permutation, e.g. [10, 33, 1, 7, 20, ...]


function animateCardSwap(card, targetPos, onComplete) {
    const liftHeight = 0.5; // how high to lift the card

    // 1) Lift up
    const liftTween = new Tween(card.position).to({ y: card.position.y + liftHeight }, 300).easing(Easing.Cubic.Out);

    // 2) Move horizontally
    const moveTween = new Tween(card.position).to({ x: targetPos.x, z: targetPos.z }, 600).easing(Easing.Cubic.InOut);

    // 3) Drop down
    const dropTween = new Tween(card.position).to({ y: targetPos.y }, 300).easing(Easing.Cubic.In);

    // Chain them together: lift -> move -> drop
    liftTween.chain(moveTween);
    moveTween.chain(dropTween);

    // Finally, call onComplete if needed
    dropTween.onComplete(() => {if (onComplete) onComplete();});

    // Start!
    liftTween.start();
}


function shuffleAndAnimate(cards, cardPositions) {
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


function swapCardsOld(cards, i, j, onComplete) {
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
function swapCards(cards, i, j, onComplete) {
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
    const tempPos = posA.clone().add(new Vector3(0, liftHeight, 0));

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

function dealOneCard(cards) {
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

    const newZPos = 5 + nthCard * (cardWidth + gapBetweenCards);
    const newRot = { y: card.rotation.y + Math.PI / 2 }; // 90° Y axis

    // Animate position
    new Tween(card.position).to({ x: 0, y: 0, z: newZPos}, 1000).easing(Easing.Quadratic.InOut).start();

    // Animate rotation (Y only)
    new Tween(card.rotation).to({ y: newRot.y }, 1000).easing(Easing.Quadratic.InOut).start();
}


function animationCallback(cards) {
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


function drawCards(scene, data, threejsDrawing) {
    const cards = data.cards || [];
    // cards format: `"ace_of_spaces": { "name": "Ace of Spades", "texture": "ace_of_spades.png", "backTexture": "cards/back_texture.png" }`
    const cardsArray = Object.entries(cards).map(([key, value]) => {
        return {
            name: key,
            ...value,
            position: new Vector3(0, 0, 0) // default position
        };
    });

    console.log('cardsArray', cardsArray);

    const cardMeshes = renderCards(scene, cardsArray);
    const cardPositions = generateCardPositions(cardsArray.length, 3, 4); // spacing of 3 units
    shuffleAndAnimate(cardMeshes, cardPositions);
    threejsDrawing.data.cards = cardMeshes;
    threejsDrawing.data.cardPositions = cardPositions;

    const ambientLight = new AmbientLight(0x404040, 1);
    scene.add(ambientLight);
}

let isSpacePressed = false;

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpacePressed) {isSpacePressed = true;}
    if (e.code === 'KeyD'   && !isDPressed)    isDPressed    = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {isSpacePressed = false;}
    if (e.code === 'KeyD')   isDPressed    = false;
});

const cardsDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawCards, 'dataSrc': 'cards', 'dataType': 'json'},
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        if (!threejsDrawing.data.cards) {
            console.warn('No cards found.');
            return;
        }

        if (isSpacePressed) {
            animationCallback(threejsDrawing.data.cards);
            isSpacePressed = false; // remove this line if you want it to shuffle continuously while space is held
        }

        if (isDPressed) {
            dealOneCard(threejsDrawing.data.cards);             // deal one card
            isDPressed = false;
        }
    },
    'data': {
        'cards': null,
    },
    'sceneConfig': {
    }
}

export { cardsDrawing };
