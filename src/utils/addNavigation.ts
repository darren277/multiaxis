import { drawNavCubes, ALL_CUBE_DEFS} from '../config/navigation';
import { ThreeJSDrawing } from '../threejsDrawing';

export function addNavigation(threejsDrawing: ThreeJSDrawing) {
    const scene = threejsDrawing.data.scene;

    // NAV CUBE //
    //drawNavCubes(scene, threejsDrawing, CUBE_DEFS);
    const allCubeDefs = ALL_CUBE_DEFS;
    const cubeDefs = allCubeDefs[threejsDrawing.name] || allCubeDefs['default'];
    drawNavCubes(scene, threejsDrawing, cubeDefs);
}