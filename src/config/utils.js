import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';

function drawTestCube(scene) {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);
}

function determineLabelCoordinates(p1, p2, p3, radius) {
    let x = p1 + (radius * 2);
    let y = p2;
    let z = p3;
    return [x, y, z];
};


export { drawTestCube, determineLabelCoordinates };
