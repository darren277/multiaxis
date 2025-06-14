import { pixelToWorldUnits, loadDataSource } from './utils.js';
import { FloatType } from 'three';

async function loadThenDraw(scene, func, dataSrc, dataType, camera, threejsDrawing, dataSelected) {
    const data_src = dataSelected || dataSrc;
    console.log(`Loading data source: ${data_src}`);
    threejsDrawing.data.dataSrc = data_src;
    if (dataType === 'svg') {
        const { SVGLoader } = await import('svgloader');
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
        const { GLTFLoader } = import('gltfloader');
        const gltfLoader = new GLTFLoader();
        const gltf = await loader.loadAsync(`./imagery/${data_src}.glb`);
        func(scene, gltf, threejsDrawing);
    } else if (dataType === 'exr') {
        const { EXRLoader } = await import('exrloader');
        const exrLoader = new EXRLoader().setDataType(FloatType);
        const texture = await exrLoader.loadAsync(`./textures/${data_src}.exr`);
        func(scene, texture, threejsDrawing);
    } else {
        console.error(`Unknown data type: ${dataType}`);
    }
}

export { loadThenDraw };
