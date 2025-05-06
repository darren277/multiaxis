import { pixelToWorldUnits, loadDataSource } from './utils.js';
import { FloatType } from 'three';

function loadThenDraw(scene, func, dataSrc, dataType, camera, threejsDrawing, dataSelected) {
    const data_src = dataSelected ? dataSelected : dataSrc;
    console.log(`Loading data source: ${data_src}`);
    threejsDrawing.data.dataSrc = data_src;
    if (dataType === 'svg') {
        import('svgloader').then(m => {
            const svgLoader = new m.SVGLoader();
            svgLoader.load(`./imagery/${data_src}_out_annotated.svg`, (data) => {
                func(scene, data, threejsDrawing);
            });
        });
    } else if (dataType === 'json') {
        const worldWidth = pixelToWorldUnits(480, 5, camera); // 480px at 5 units away
        const worldHeight = pixelToWorldUnits(360, 5, camera);
        threejsDrawing.data.worldWidth = worldWidth;
        threejsDrawing.data.worldHeight = worldHeight;
        loadDataSource(scene, data_src, func, threejsDrawing);
    } else if (dataType === 'gltf') {
        import('gltfloader').then(m => {
            const GLTFLoader = m.GLTFLoader;
            const gltfLoader = new GLTFLoader();
            gltfLoader.load(`./imagery/${data_src}.glb`, (gltf) => {
                console.log(`Loaded GLTF model: ${data_src}`, gltf);
                func(scene, gltf, threejsDrawing);
            });
        });
    } else if (dataType === 'exr') {
        import('exrloader').then(m => {
            const EXRLoader = m.EXRLoader;
            const exrLoader = new EXRLoader();
            exrLoader.setDataType(FloatType).load(`./textures/${data_src}.exr`, (texture) => {
                console.log(`Loaded EXR texture: ${data_src}`, texture);
                func(scene, texture, threejsDrawing);
            });
        });
    } else {
        console.error(`Unknown data type: ${dataType}`);
    }
}

export { loadThenDraw };
