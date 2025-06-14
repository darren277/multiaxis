import * as THREE from 'three';

export async function runDrawFuncs(
    funcs: DrawFuncObj[],
    opts: {
        scene: THREE.Scene;
        camera: THREE.Camera;
        drawing: ThreeJSDrawing;
        dataSelected?: string;
    }
) {
    const { scene, camera, drawing, dataSelected } = opts;

    await Promise.all(funcs.map(f => f.dataSrc ? loadThenDraw(scene, f.func, f.dataSrc, f.dataType ?? undefined, camera, drawing, dataSelected) : f.func(scene, drawing)));
}
