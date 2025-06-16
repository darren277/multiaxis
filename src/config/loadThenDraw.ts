import { pixelToWorldUnits, loadDataSource } from './utils';
import * as THREE from 'three';

async function loadThenDraw(scene: THREE.Scene, func: Function, dataSrc: string, dataType: string, camera: THREE.PerspectiveCamera, threejsDrawing: any, dataSelected: string) {
    const data_src = dataSelected || dataSrc;
    console.log(`Loading data source: ${data_src}`);
    threejsDrawing.data.dataSrc = data_src;
    if (dataType === 'svg') {
        const { SVGLoader } = await import('three/examples/jsm/loaders/SVGLoader.js');
        const svgLoader = new SVGLoader();
        const svgData = await new Promise((res, rej) => {
            svgLoader.load(`./imagery/${data_src}_out_annotated.svg`, res, undefined, rej)
        });
        func(scene, svgData, threejsDrawing);
    } else if (dataType === 'json') {
        threejsDrawing.data.worldWidth = pixelToWorldUnits(480, 5, camera); // 480px at 5 units away
        threejsDrawing.data.worldHeight = pixelToWorldUnits(360, 5, camera);
        const data = await loadDataSource(data_src);
        func(scene, data, threejsDrawing);
    } else if (dataType === 'gltf') {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const gltfLoader = new GLTFLoader();
        const gltf = await gltfLoader.loadAsync(`./imagery/${data_src}.glb`);
        func(scene, gltf, threejsDrawing);
    } else if (dataType === 'exr') {
        const { EXRLoader } = await import('three/examples/jsm/loaders/EXRLoader.js');
        const exrLoader = new EXRLoader().setDataType(THREE.FloatType);
        const texture = await exrLoader.loadAsync(`./textures/${data_src}.exr`);
        func(scene, texture, threejsDrawing);
    } else {
        console.error(`Unknown data type: ${dataType}`);
    }
}

export { loadThenDraw };
