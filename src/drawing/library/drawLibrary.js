import * as THREE from 'three'; // for any references you still need
import { CSS2DObject } from 'css2drenderer';
import { sortAlphabeticallyByName } from './sortResources.js';
import { calculatePositionOfResource, casePitchX, rowPitchZ, worldX, worldZ } from './calculatePosition.js';
import { onKeyDownWalking, onKeyUpWalking, walkingAnimationCallback } from '../../config/walking.js';

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


function createBookCases(scene, width, height, depth, row1StartX, spaceBetween, caseCount = 3, z_pos = 5) {
    // Example usage:
    const y_pos = 5;

    let bookCaseI = 0;

    for (let i = 0; i < caseCount; i++) {
        //const x_pos = row1StartX + i * spaceBetween;
        const x_pos = row1StartX + i * spaceBetween;   // now 18 per case

        createBookCaseMesh(
        scene,
        {
            name: `book_case_1${String.fromCharCode(97 + i)}`, // e.g., 1a, 1b, 1c
            texturePath: `textures/bookcase${bookCaseI+1}.png`,
            width: width,
            height: height,
            depth: depth,
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
            width: width,
            height: height,
            depth: depth,
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


const SHELVES_PER_CASE = 6;

function calculateNumberOfShelves(library) {
    // 20 cases per row x 10 rows = 200 cases...
    // 200 cases * 6 shelves = 1200 shelves
    const { numberOfRows, numberOfCases, spaceBetweenRows, spaceBetweenCases } = library;
    const shelves = numberOfRows * numberOfCases * SHELVES_PER_CASE;
    return shelves;
}

const DATA = {
    'library': {
        'bookcase': {
            'width': 10,
            'height': 10,
            'depth': 0.5
        },
        'numberOfRows': 10,
        'numberOfCases': 20,
        'spaceBetweenRows': 10,
        'spaceBetweenCases': 0,
        'numberOfFloors': 1,
    },
    'resources': [
        {'name': 'Encyclopedia of Cognitive Science', 'author': 'Robert A. Wilson', 'year': 2003, 'dewey': '153.3 WIL', 'word_count': 100000, 'personal_rating': 9.5, 'description': 'A comprehensive overview of <strong>cognitive science</strong>, covering various aspects of the field.'},
        {'name': 'How to Read a Book', 'author': 'Mortimer J. Adler', 'year': 1940, 'dewey': '001.4 ADL', 'word_count': 50000, 'personal_rating': 8.5, 'description': 'A guide to reading comprehension and critical thinking.'},
        {'name': 'The Art of Computer Programming', 'author': 'Donald E. Knuth', 'year': 1968, 'dewey': '005.1 KNU', 'word_count': 200000, 'personal_rating': 10, 'description': 'A comprehensive series on algorithms and programming techniques.'},
        {'name': 'Introduction to the Theory of Computation', 'author': 'Michael Sipser', 'year': 1997, 'dewey': '004.5 SIP', 'word_count': 150000, 'personal_rating': 9.0, 'description': 'An introduction to the theory of computation, including automata and complexity.'},
        {'name': 'Artificial Intelligence: A Modern Approach', 'author': 'Stuart Russell and Peter Norvig', 'year': 1995, 'dewey': '006.3 RUS', 'word_count': 250000, 'personal_rating': 9.5, 'description': 'A comprehensive introduction to the field of artificial intelligence.'},
        {'name': 'The Pragmatic Programmer', 'author': 'Andrew Hunt and David Thomas', 'year': 1999, 'dewey': '005.1 HUN', 'word_count': 80000, 'personal_rating': 8.0, 'description': 'A guide to software development best practices and methodologies.'},
        {'name': 'Clean Code', 'author': 'Robert C. Martin', 'year': 2008, 'dewey': '005.1 MAR', 'word_count': 120000, 'personal_rating': 9.0, 'description': 'A guide to writing clean, maintainable code.'},
        {'name': 'Design Patterns', 'author': 'Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides', 'year': 1994, 'dewey': '005.1 GAM', 'word_count': 100000, 'personal_rating': 9.0, 'description': 'A guide to software design patterns and best practices.'},
    ]
}

function drawLibrary(scene, threejsDrawing) {
    // Draw the floor
    drawFloor(scene);

    const resources = DATA.resources;
    const library = DATA.library;

    // row1StartX matches the hard‑coded −20 you used earlier.
    const row1StartX = -20;                        // CHANGE in one place if you move the aisle.
    const row0StartZ = library.spaceBetweenCases - 100; // mirrors   zPos - 100   in your loop

    const { width, height, depth } = DATA.library.bookcase;
    const rowCount = DATA.library.numberOfRows;
    const caseCount = DATA.library.numberOfCases;
    // -  const spaceBetweenRows   = DATA.library.spaceBetweenRows;   // 10
    // -  const spaceBetweenCases  = DATA.library.spaceBetweenCases;  // 8
    const caseSpacing = casePitchX(DATA.library);  // 18
    const rowSpacing  = rowPitchZ(DATA.library);  // 10.5

    // Create the bookcases
    for (let i = 0; i < rowCount; i++) {
        //const zPos = (i+1)*spaceBetweenCases;   // 8 → wrong
        const zPos = row0StartZ + i * rowSpacing;   // –92, –81.5, …
        createBookCases(
            scene,
            width, height, depth,
            row1StartX,
            //spaceBetweenRows,                       // 10 → wrong
            caseSpacing,                            // 18 → matches placer
            caseCount,
            //zPos - 100                              // –92, –84, …
            zPos                                     // already absolute
        );
    }

    // Create lights
    createLights(scene);

    // Draw the resources
    const camera = threejsDrawing.data.camera;
    const renderer = threejsDrawing.data.renderer;

    drawResources(scene, library, resources, row1StartX, row0StartZ, camera, renderer);
}


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


function drawResources(scene, library, resources, row1StartX, row0StartZ, camera, renderer) {
    // Sort the resources alphabetically by name
    const sorted = sortAlphabeticallyByName([...resources]);

    // keep a list so the raycaster only tests resource spheres
    const resourceMeshes = [];

    sorted.forEach((resource, i) => {
        const {x, y, z} = calculatePositionOfResource(resource, library, row1StartX, row0StartZ, i, sorted.length);
        console.log(`Resource: ${resource.name}, Position: (${x}, ${y}, ${z})`);

        // simple sphere for now...
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        );

        sphere.position.set(x, y, z);
        sphere.userData = { resource };          // store whole record for later
        scene.add(sphere);

        resourceMeshes.push(sphere);

        // 2‑b  Label -------------------------------------------------------------
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = resource.name;         // plain text or truncate if long
        div.style.padding       = '2px 6px';
        div.style.borderRadius  = '4px';
        div.style.background    = 'rgba(0,0,0,0.6)';
        div.style.color         = '#fff';
        div.style.fontSize      = '12px';
        div.style.whiteSpace    = 'nowrap';

        const label = new CSS2DObject(div);
        //const y_delta = 0.2; // 0.2 units above sphere centre
        const y_delta = 0;
        // and a bit in front
        //const z_delta = 0.5 * Math.sqrt(2) * Math.sin(Math.PI / 4); // 0.5 units in front
        const z_delta = 0;
        label.position.set(x, y + y_delta, z + z_delta);
        sphere.add(label);                       // follows the sphere automatically

        if ('Artificial Intelligence: A Modern Approach' === resource.name) {
            sphere.material.color.set(0xff0000); // highlight it
            console.log('Found the AI book! Color set to red.');
        }
        if ('The Art of Computer Programming' === resource.name) {
            sphere.material.color.set(0x0000ff); // highlight it
            console.log('Found the Knuth book! Color set to blue.');
        }
        if ('How to Read a Book' === resource.name) {
            sphere.material.color.set(0x00ffff); // highlight it
            console.log('Found the Adler book! Color set to cyan.');
        }
        if ('Encyclopedia of Cognitive Science' === resource.name) {
            sphere.material.color.set(0xffff00); // highlight it
            console.log('Found the Wilson book! Color set to yellow.');
        }
        if ('Introduction to the Theory of Computation' === resource.name) {
            sphere.material.color.set(0xff00ff); // highlight it
            console.log('Found the Sipser book! Color set to magenta.');
        }
    });

    console.log(
        'Book‑case centres X:',
        [...Array(DATA.library.numberOfCases).keys()].map(i => worldX(row1StartX, DATA.library, i))
    );

    // 2‑c  Ray‑picking once per click -----------------------------------------
    window.addEventListener('click', onClick, false);

    function onClick(event) {
        console.log('onClick', event);
        // normalised device coords
        const rect = renderer.domElement.getBoundingClientRect();   // ← key line
        mouse.x =  ( (event.clientX - rect.left) / rect.width  ) * 2 - 1;
        mouse.y = -( (event.clientY - rect.top ) / rect.height ) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObjects(resourceMeshes, /* recursive = */ false)[0];
        console.log('resourceMeshes', resourceMeshes);
        if (hit) showOverlay(hit.object.userData.resource);
    }
}

function showOverlay(resource) {
    console.log('showOverlay', resource);
    document.getElementById('overlayTitle'     ).textContent = resource.name;
    document.getElementById('overlayAuthorYear').textContent = `${resource.author} • ${resource.year}`;
    document.getElementById('overlayBody'      ).innerHTML   = resource.description || '<em>No description yet.</em>';
    document.getElementById('resourceOverlay').style.display = 'block';
}

// document.addEventListener('keydown', onKeyDownWalking);
// document.addEventListener('keyup', onKeyUpWalking);

const libraryDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawLibrary, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': {
        //'click': (event) => {},
        //'mousemove': (event) => {},
        'keydown': (event) => {
            // Handle key down events here
            console.log('Key pressed:', event);
            onKeyDownWalking(event);
        },
        'keyup': (event) => {
            // Handle key up events here
            console.log('Key released:', event);
            onKeyUpWalking(event);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        const scene = threejsDrawing.data.scene;
        const controls = threejsDrawing.data.controls;
        if (!controls) {
            console.warn('No controls found.');
            return;
        }
        walkingAnimationCallback(scene, controls);
    },
    'data': {
    },
    'sceneConfig': {
        'cssRenderer': '2D',
    }
}


// TODO: Add a function for determining position based off of specific shelf attribute...
// For example, if you use a library inventory system that corresponds with actual physical bookshelves (or even boxes), you can specify which shelf each book (or other resource) is in...

export { libraryDrawing };
