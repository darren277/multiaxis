import * as THREE from "three";
import { GLTFLoader } from 'gltfloader';
import { drawBasicLights } from './drawLights.js';
import { Tween, Easing } from 'tween';

import { AudioListener, Audio, AudioLoader } from 'three';
import { ThreeJSDrawing } from "../types.js";

const listener = new AudioListener();


const KEY_SOUND_PATH = 'imagery/piano/piano-mp3/';

const audioLoader = new AudioLoader();

// create a helper function to verify these mappings from the browser console as they are played...

const NOTE_MAPPING = {
    'Box001_Solid_Glass_0': 'C1',
    'Box008_Solid_Glass2_0': 'Db1',
    'Object006_Solid_Glass_0': 'D1',
    'Box009_Solid_Glass2_0': 'Eb1',
    'Object005_Solid_Glass_0': 'E1',
    'Object004_Solid_Glass_0': 'F1',
    'Box010_Solid_Glass2_0': 'Gb1',
    'Object003_Solid_Glass_0': 'G1',
    'Box011_Solid_Glass2_0': 'Ab1',
    'Object002_Solid_Glass_0': 'A2',
    'Box012_Solid_Glass2_0': 'Bb1',
    'Object001_Solid_Glass_0': 'B2',

    'Box013_Solid_Glass2_0': 'C2',
    'Box014_Solid_Glass2_0': 'Db2',
    'Object012_Solid_Glass_0': 'D2',
    'Box015_Solid_Glass2_0': 'Eb2',
    'Object011_Solid_Glass_0': 'E2',
    'Object010_Solid_Glass_0': 'F2',
    'Box016_Solid_Glass2_0': 'Gb2',
    'Object009_Solid_Glass_0': 'G2',
    'Box017_Solid_Glass2_0': 'Ab2',
    'Object008_Solid_Glass_0': 'A3',
    'Box018_Solid_Glass2_0': 'Bb2',
    'Object007_Solid_Glass_0': 'B3',

    'Box019_Solid_Glass2_0': 'C3',
    'Box020_Solid_Glass2_0': 'Db3',
    'Object018_Solid_Glass_0': 'D3',
    'Box021_Solid_Glass2_0': 'Eb3',
    'Object017_Solid_Glass_0': 'E3',
    'Object016_Solid_Glass_0': 'F3',
    'Box022_Solid_Glass2_0': 'Gb3',
    'Object015_Solid_Glass_0': 'G3',
    'Box023_Solid_Glass2_0': 'Ab3',
    'Object014_Solid_Glass_0': 'A4',
    'Box024_Solid_Glass2_0': 'Bb3',
    'Object013_Solid_Glass_0': 'B4',

    'Box025_Solid_Glass2_0': 'C4',
    'Box026_Solid_Glass2_0': 'Db4',
    'Object024_Solid_Glass_0': 'D4',
    'Box027_Solid_Glass2_0': 'Eb4',
    'Object023_Solid_Glass_0': 'E4',
    'Object024_Solid_Glass_0': 'F4',
    'Box028_Solid_Glass2_0': 'Gb4',
    'Object023_Solid_Glass_0': 'G4',
    'Box029_Solid_Glass2_0': 'Ab4',
    'Object022_Solid_Glass_0': 'A5',
    'Box030_Solid_Glass2_0': 'Bb4',
    'Object021_Solid_Glass_0': 'B5',

    'Box031_Solid_Glass2_0': 'C5',
    'Box032_Solid_Glass2_0': 'Db5',
    'Object030_Solid_Glass_0': 'D5',

}

const noteSounds = {}; // e.g., { 'C4': AudioObject, ... }


let startTime: number | null = null;

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
function drawSheetMusic(scene: THREE.Scene, data: any) {
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
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 5; i++) {
        const lineGeom = new THREE.BoxGeometry(100, 0.02, 0.01);
        const lineMesh = new THREE.Mesh(lineGeom, lineMaterial);
        // place lines from x=0..100, spaced in y
        lineMesh.position.set(50, i * 0.5, 0);
        scene.add(lineMesh);
    }

    // 4) Parse note events
    //    We accumulate delta times into a running "currentTick"
    let currentTick = 0;
    const noteOnMap = {};  // key: pitch => the tick at which it started
    const noteObjects: { mesh: THREE.Mesh; startSec: number; endSec: number; durationSec: number; }[] = [];

    notesRaw.forEach((msg: { type: string; note: number; velocity: number; time: number; }) => {
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
                const geometry = new THREE.SphereGeometry(0.1, 16, 16);
                const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const noteMesh = new THREE.Mesh(geometry, material);

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
        update(currentTimeSec: number) {
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

async function loadGltfModel(data_src: string) {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync(`./imagery/${data_src}.gltf`);
    return gltf;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickableKeys: THREE.Mesh[] = [];

const keyZdelta = 5.0;

function onKeyClick(keyMesh: THREE.Mesh) {
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

    console.log('keyMesh', keyMesh);
    //let note = keyMesh.userData.note;
    //console.log('note', note);
    console.log('noteSounds', noteSounds);
    //console.log(`Playing sound for note: ${note}`);

//    if (keyMesh.name === 'Object024_Solid_Glass_0') {
//        note = 'D4';
//    }
    let note: string = NOTE_MAPPING[keyMesh.name];
    const sound = noteSounds[note];

    if (sound && sound.isPlaying) {
        sound.stop(); // stop previous playback to allow replay
    }
    if (sound) sound.play();
}

function onMouseClick(event: MouseEvent, camera: THREE.Camera, domElement: HTMLElement) {
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
function drawMusic(scene: THREE.Scene, data: any, state: any) {
    state.data.sheetMusic = drawSheetMusic(scene, data);

    const camera = state.data.camera;
    camera.add(listener);

    loadGltfModel('piano/scene').then((gltf) => {
        const piano = gltf.scene;
        piano.position.set(0, 5, 5);
        piano.scale.set(0.1, 0.1, 0.1);
        scene.add(piano);

        // iterate over all children of the gltf scene
        piano.traverse((child: THREE.Object3D) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
            console.log(`Child: ${child.name}`);

            // Detect key names — adjust if different!
            if (/^Object\d+$/.test(child.name)) {
                console.log(`Clickable key: ${child.name}`);

                console.log('child', child);
                const glass = child.children[0].children[0];

                // Simple mapping for now
                let note: string = NOTE_MAPPING[glass.name];
                console.log(`Note mapping: ${glass.name} => ${note}`);

                // Load sound only once per note
                if (!noteSounds[note]) {
                    const sound = new Audio(listener);
                    console.log(`Loading sound for note: ${note}`);
                    audioLoader.load(`${KEY_SOUND_PATH}${note}.mp3`, (buffer) => {
                        console.log(`Loaded sound for note: ${note}`);
                        sound.setBuffer(buffer);
                        sound.setVolume(0.7);
                        noteSounds[note] = sound;
                    });
                }

                console.log(`Adding note: ${note}`);
                if (!child.userData) {
                    child.userData = {};
                }
                child.userData.note = note;
                console.log(`Child userData: ${child.userdata}`);

                clickableKeys.push(child);
            } else {
                console.log(`Non-clickable child: ${child.name}`);
                console.log('------ child', child);

                if (child.children && child.children.length >= 1 && child.children[0].children.length >= 1) {
                    const glass = child.children[0].children[0];
                    console.log('glass', glass);
                    if (glass) {
                        // Simple mapping for now
                        let note: string = NOTE_MAPPING[glass.name];
                        console.log(`Note mapping: ${glass.name} => ${note}`);

                        // Load sound only once per note
                        if (!noteSounds[note]) {
                            const sound = new Audio(listener);
                            console.log(`Loading sound for note: ${note}`);
                            audioLoader.load(`${KEY_SOUND_PATH}${note}.mp3`, (buffer) => {
                                console.log(`Loaded sound for note: ${note}`);
                                sound.setBuffer(buffer);
                                sound.setVolume(0.7);
                                noteSounds[note] = sound;
                            });
                        }

                        console.log(`Adding note: ${note}`);
                        if (!child.userData) {
                            child.userData = {};
                        }
                        child.userData.note = note;
                        console.log(`Child userData: ${child.userdata}`);

                        clickableKeys.push(child);
                    }
                }
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
    // domElement.addEventListener('click', (e) => onMouseClick(e, camera, domElement));
    'eventListeners': {
        'click': (event: MouseEvent, data: any) => {
            const { scene, renderer, camera } = data;
            onMouseClick(event, camera, renderer.domElement);
        },
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        if (!startTime) startTime = timestamp;
        const elapsedMs = timestamp - startTime;
        const elapsedSec = elapsedMs / 1000;

        const tempoScale = threejsDrawing.data.tempoScale;

        const scaledElapsedSec = elapsedSec * tempoScale;

        if (!threejsDrawing.data.sheetMusic) {
            // it takes a few seconds to load the sheet music
            console.warn("No sheet music data found");
            return;
        }
        threejsDrawing.data.sheetMusic.update(scaledElapsedSec);
    },
    'data': {
        'sheetMusic': null,
        'tempoScale': 1.0
    }
}

export { musicDrawing };

