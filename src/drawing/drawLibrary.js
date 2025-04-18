import * as THREE from 'three'; // for any references you still need

function drawFloor(scene) {
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // make it horizontal
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
}


const textureLoader = new THREE.TextureLoader();


function createBookCaseMesh(scene,
{
    name, texturePath,
    width = 10, height = 10, depth = 0.5,
    position = new THREE.Vector3(), rotation = new THREE.Vector3()
}) {
    // Load the bookcase texture
    const bookCaseTexture = textureLoader.load(texturePath);

    // Option A: Just a plane (front face)
    // const geometry = new THREE.PlaneGeometry(width, height);
    // const material = new THREE.MeshBasicMaterial({
    //   map: bookCaseTexture,
    //   side: THREE.DoubleSide
    // });
    // const bookCaseMesh = new THREE.Mesh(geometry, material);

    // Option B: A thin box for a bit more realism
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    // We'll put the texture on the front face only:
    //  - For a quick approach, set 'map' for all faces or
    //  - Create different materials for front/back/sides
    const materials = [
        new THREE.MeshBasicMaterial({ color: 0xcccccc }), // left
        new THREE.MeshBasicMaterial({ color: 0xcccccc }), // right
        new THREE.MeshBasicMaterial({ color: 0xcccccc }), // top
        new THREE.MeshBasicMaterial({ color: 0xcccccc }), // bottom
        new THREE.MeshBasicMaterial({ map: bookCaseTexture }), // front
        new THREE.MeshBasicMaterial({ color: 0xcccccc })  // back
    ];

    const bookCaseMesh = new THREE.Mesh(boxGeometry, materials);

    bookCaseMesh.name = name;
    // Position/rotate
    bookCaseMesh.position.copy(position);
    bookCaseMesh.rotation.set(rotation.x, rotation.y, rotation.z);

    scene.add(bookCaseMesh);
    return bookCaseMesh;
}

// Instantiate Some Bookcases in a Row or “Aisle”
// Now we can create multiple shelves, labeling them book_case_1a, book_case_1b, etc. Suppose we have two bookcases in “Row 1”, spaced out along the x axis.

//const SPACE_BETWEEN = 10;
const SPACE_BETWEEN = 8;

function createBookCases(scene, caseCount = 3, z_pos = 5) {
    // Example usage:
    const row1StartX = -20;

    const y_pos = 5;

    let bookCaseI = 0;

    for (let i = 0; i < caseCount; i++) {
        const x_pos = row1StartX + i * SPACE_BETWEEN;

        createBookCaseMesh(
        scene,
        {
            name: `book_case_1${String.fromCharCode(97 + i)}`, // e.g., 1a, 1b, 1c
            texturePath: `textures/bookcase${bookCaseI+1}.png`,
            width: 8,
            height: 10,
            depth: 0.5,
            position: new THREE.Vector3(x_pos, y_pos, z_pos)
        });

        // draw reverse side...
        const reverse_z_pos = z_pos - 0.5;

        const rotation = new THREE.Vector3(0, Math.PI, 0);

        createBookCaseMesh(
        scene,
        {
            name: `book_case_1${String.fromCharCode(97 + i)}_back`, // e.g., 1a, 1b, 1c
            texturePath: `textures/bookcase${bookCaseI+1}.png`,
            width: 8,
            height: 10,
            depth: 0.5,
            position: new THREE.Vector3(x_pos, y_pos, reverse_z_pos),
            rotation: rotation
        });

        bookCaseI++;

        if (bookCaseI > 5) {
            bookCaseI = 0;
        }
    }
    /*
    Here we’re:
        Spacing them out by 10 units in x.
        Positioning them so their base is on the floor if the center is at y=5 and the height is 10.
    You could similarly create additional rows, or place them in parallel aisles, and so on.
    */
}

function createLights(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Directional or point light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
}


function drawLibrary(scene, threejsDrawing) {
    const rowCount = 10;
    const caseCount = 20;
    const SPACE_BETWEEN_ROWS_MULTIPLIER = 10;

    // Draw the floor
    drawFloor(scene);

    // Create the bookcases
    for (let i = 0; i < rowCount; i++) {
        const zPos = (i+1)*SPACE_BETWEEN_ROWS_MULTIPLIER;
        createBookCases(scene, caseCount, zPos - 100);
    }

    // Create lights
    createLights(scene);
}



const libraryDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawLibrary, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    },
    'sceneConfig': {
        'cssRenderer': '2D',
    }
}


export { libraryDrawing };
