import * as THREE from 'three';
import { ThreeJSDrawing } from '../threejsDrawing';
import { loadThenDraw } from '../config/loadThenDraw';

type DrawFunc = (scene: THREE.Scene, drawing: ThreeJSDrawing) => Promise<void> | void;
type DrawFuncObj = {
    func: DrawFunc;
    dataSrc?: string;
    dataType?: string;
}

type DrawOptions = {
    scene: THREE.Scene;
    camera: THREE.Camera;
    drawing: ThreeJSDrawing;
    dataSelected?: string;
}

export async function runDrawFuncs(
    funcs: DrawFuncObj[],
    opts: DrawOptions
) {
    const { scene, camera, drawing, dataSelected } = opts;

    await Promise.all(funcs.map(f => f.dataSrc ? loadThenDraw(scene, f.func, f.dataSrc, f.dataType ? undefined : camera, drawing, dataSelected) : f.func(scene, drawing)));
}
