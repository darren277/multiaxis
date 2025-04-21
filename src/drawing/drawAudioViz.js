import { AudioListener, AudioLoader, Audio, AudioAnalyser, Group, BoxGeometry, Mesh, MeshStandardMaterial } from 'three';

const listener = new AudioListener();
camera.add(listener);

const sound = new Audio(listener);
const audioLoader = new AudioLoader();

audioLoader.load('imagery/Crystal Method - Vapor Trail.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
});

const analyser = new AudioAnalyser(sound, 32); // 32 FFT bins

const bars = [];
const barGroup = new Group();
scene.add(barGroup);

for (let i = 0; i < 32; i++) {
    const geo = new BoxGeometry(0.5, 1, 0.5);
    const mat = new MeshStandardMaterial({ color: 0x00ffff });
    const bar = new Mesh(geo, mat);
    bar.position.x = i - 16;
    barGroup.add(bar);
    bars.push(bar);
}

function animateVisualizer() {
    const data = analyser.getFrequencyData(); // array of values 0–255
    for (let i = 0; i < bars.length; i++) {
        const scaleY = data[i] / 64; // scale factor
        bars[i].scale.y = Math.max(scaleY, 0.1);
        bars[i].position.y = bars[i].scale.y / 2; // keep base at y=0
    }
}



const audioVizDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawAudioViz, 'dataSrc': null, 'dataType': 'json'},
    ],
    'uiState': {},
    // domElement.addEventListener('click', (e) => onMouseClick(e, camera, domElement));
    'eventListeners': {
//        'click': (event, data) => {
//            const { scene, renderer, camera } = data;
//            onMouseClick(event, camera, renderer.domElement);
//        },
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        animateVisualizer();
    },
    'data': {
        'sheetMusic': null,
    }
}

export { audioVizDrawing };
