import { AudioListener, AudioLoader, Audio, AudioAnalyser, Group, BoxGeometry, Mesh, MeshStandardMaterial, AmbientLight } from 'three';


function animateVisualizer(analyser, bars) {
    const data = analyser.getFrequencyData(); // array of values 0–255
    for (let i = 0; i < bars.length; i++) {
        const scaleY = data[i] / 64; // scale factor
        bars[i].scale.y = Math.max(scaleY, 0.1);
        bars[i].position.y = bars[i].scale.y / 2; // keep base at y=0
    }
}

function drawAudioViz(scene, threejsDrawing) {
    const camera = threejsDrawing.data.camera;

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

    threejsDrawing.data.analyser = analyser;

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

    threejsDrawing.data.bars = bars;

    // add play/pause button
    const button = document.createElement('button');
    button.innerText = 'Play/Pause';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.zIndex = '10';
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
        if (sound.isPlaying) {
            sound.pause();
        } else {
            sound.play();
        }
    });

    document.body.appendChild(button);


    // draw ambient light...
    const light = new AmbientLight(0xffffff, 0.5);
    scene.add(light);
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
        const { analyser, bars } = threejsDrawing.data;
        animateVisualizer(analyser, bars);
    },
    'data': {
        'sheetMusic': null,
    }
}

export { audioVizDrawing };
