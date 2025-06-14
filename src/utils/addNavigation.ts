import { drawNavCubes, onClickNav, ALL_CUBE_DEFS } from './config/navigation';

export function addNavigation(threejsDrawing: ThreeJSDrawing) {
    const scene = threejsDrawing.data.scene;

    // NAV CUBE //
    //drawNavCubes(scene, threejsDrawing, CUBE_DEFS);
    const allCubeDefs = ALL_CUBE_DEFS as ALL_CUBE_DEFS_TYPE
    const cubeDefs = allCubeDefs[drawingName];
    drawNavCubes(scene, threejsDrawing, cubeDefs, debugMode);
}