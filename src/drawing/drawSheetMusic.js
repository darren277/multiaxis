import { Mesh, MeshBasicMaterial, BoxGeometry, SphereGeometry, Raycaster, Vector2 } from 'three';
import { GLTFLoader } from 'gltfloader';
import { drawBasicLights } from './drawLights.js';
import { Tween, Easing } from 'tween';


let startTime = null;

/**
 * A simplistic function that:
 *   1) Draws 5 staff lines
 *   2) Places each note as a black sphere
 *   3) Animates the notes scrolling from right to left at the given tempo
 *
 * This function returns an object with an `update(elapsedTime)` method
 * that you can call from your main animation loop.
 *
 * @param {THREE.Scene} scene The Three.js scene
 * @param {Object} data The parsed JSON data
 */
function drawSheetMusic(scene, data) {
    // 1) Parse the tempo & note info from your data
    //    MIDO typically gives you microseconds_per_beat or 'tempo'
    //    in microseconds (e.g. 600000 => 0.6s per quarter note => 100BPM).
    const tempoMicroseconds = data.metadata.tempo;  // e.g. 600000
    const secondsPerQuarter = tempoMicroseconds / 1e6; // 0.6 for 600k => 100 BPM

    // If you know your ticks-per-quarter from MIDO, you might have:
    // data.metadata.ticks_per_beat or something similar. If not, default to 480 or 960.
    const TICKS_PER_QUARTER = data.metadata.ticks_per_beat || 480;
    // You can artificially scale this if everything is too fast/slow:
    // const TICKS_PER_QUARTER = 480 / 2; // just an example slowdown

    const secondsPerTick = secondsPerQuarter / TICKS_PER_QUARTER;

    // 2) We only use the first track for simplicity
    const track = data.tracks[0];
    const notesRaw = track.notes || [];

    // 3) Draw staff lines (white lines on black background, or vice versa)
    const lineMaterial = new MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 5; i++) {
        const lineGeom = new BoxGeometry(100, 0.02, 0.01);
        const lineMesh = new Mesh(lineGeom, lineMaterial);
        // place lines from x=0..100, spaced in y
        lineMesh.position.set(50, i * 0.5, 0);
        scene.add(lineMesh);
    }

    // 4) Parse note events
    //    We accumulate delta times into a running "currentTick"
    let currentTick = 0;
    const noteOnMap = {};  // key: pitch => the tick at which it started
    const noteObjects = [];

    notesRaw.forEach((msg) => {
        // Accumulate the delta time
        currentTick += msg.time;

        // Recognize note-on vs. note-off
        if (msg.type === 'note_on' && msg.velocity > 0) {
            // Start of a note
            noteOnMap[msg.note] = currentTick;
        }
        else if (msg.type === 'note_off' || (msg.type === 'note_on' && msg.velocity === 0)) {
            // End of a note
            const onTick = noteOnMap[msg.note];
            if (onTick !== undefined) {
                const offTick = currentTick;
                const durationTicks = offTick - onTick;

                // Convert ticks to real seconds
                const startSec = onTick * secondsPerTick;
                const endSec   = offTick * secondsPerTick;
                const durationSec = durationTicks * secondsPerTick;

                // For debugging, let's log the times:
                console.debug(`pitch=${msg.note}, startSec=${startSec.toFixed(2)}, endSec=${endSec.toFixed(2)}`);

                // Vertical position: e.g. pitch 60 => y=2, up/down 0.1 per semitone
                const yPos = 2 + (msg.note - 60) * 0.1;

                // Build a sphere for the note
                const geometry = new SphereGeometry(0.1, 16, 16);
                const material = new MeshBasicMaterial({ color: 0xffffff });
                const noteMesh = new Mesh(geometry, material);

                // We'll place it off to the right (x=100 or so) and animate left.
                // Initially place it at x=100 so we can scroll from x=10..-10 over note duration
                noteMesh.position.set(100, yPos, 0);
                scene.add(noteMesh);

                noteObjects.push({
                    mesh: noteMesh,
                    startSec,
                    endSec,
                    durationSec,
                });

                // Remove from map to handle the next note with the same pitch
                delete noteOnMap[msg.note];
            }
        }
    });

    // 5) Return an object with an update() method for the main animation loop
    return {
        update(currentTimeSec) {
            noteObjects.forEach((note) => {
                const { mesh, startSec, endSec, durationSec } = note;

                // Hide if not started or already ended
                if (currentTimeSec < startSec) {mesh.visible = false;}
                else if (currentTimeSec > endSec) {mesh.visible = false;}
                else {
                    mesh.visible = true;
                    // Simple linear approach: move from x=10 to x=-10 over the note's active duration
                    const progress = (currentTimeSec - startSec) / durationSec;
                    const xPos = 10 + ( -10 - 10 ) * progress; // i.e. 10..-10
                    mesh.position.x = xPos;
                }
            });
        },
    };
}

async function loadGltfModel(data_src) {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync(`./imagery/${data_src}.gltf`);
    return gltf;
}

const raycaster = new Raycaster();
const mouse = new Vector2();
const clickableKeys = [];

const keyZdelta = 5.0;

function onKeyClick(keyMesh) {
    const originalZ = keyMesh.position.z;

    // Animate down
    new Tween(keyMesh.position)
        .to({ z: originalZ - keyZdelta }, 100)
        .easing(Easing.Quadratic.Out)
        .onComplete(() => {
            // Animate up
            new Tween(keyMesh.position)
                .to({ z: originalZ }, 100)
                .easing(Easing.Quadratic.In)
                .start();
        })
        .start();
}

function onMouseClick(event, camera, domElement) {
    // Normalize mouse coordinates
    const rect = domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableKeys);

    if (intersects.length > 0) {
        onKeyClick(intersects[0].object);
    }
}


// Object040 = individual key?
function drawMusic(scene, data, state) {
    state.data.sheetMusic = drawSheetMusic(scene, data);

    loadGltfModel('piano/scene').then((gltf) => {
        const piano = gltf.scene;
        piano.position.set(0, 5, 5);
        piano.scale.set(0.1, 0.1, 0.1);
        scene.add(piano);

        // iterate over all children of the gltf scene
        piano.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
            console.log(`Child: ${child.name}`);

            // Detect key names — adjust if different!
            if (/^Object\d+$/.test(child.name)) {
                console.log(`Clickable key: ${child.name}`);
                clickableKeys.push(child);
            }
        });
    });

    drawBasicLights(scene);
}

const musicDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawMusic, 'dataSrc': 'music', 'dataType': 'json'},
    ],
    'uiState': {tempoScale: 1.0},
    // domElement.addEventListener('click', (e) => onMouseClick(e, camera, domElement));
    'eventListeners': {
        'click': (event, data) => {
            const { scene, renderer, camera } = data;
            onMouseClick(event, camera, renderer.domElement);
        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        if (!startTime) startTime = timestamp;
        const elapsedMs = timestamp - startTime;
        const elapsedSec = elapsedMs / 1000;

        const scaledElapsedSec = elapsedSec * uiState.tempoScale;

        if (!threejsDrawing.data.sheetMusic) {
            // it takes a few seconds to load the sheet music
            console.warn("No sheet music data found");
            return;
        }
        threejsDrawing.data.sheetMusic.update(scaledElapsedSec);
    },
    'data': {
        'sheetMusic': null,
    }
}

export { musicDrawing };

