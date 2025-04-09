
function drawTestCube(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
}

function determineLabelCoordinates(p1, p2, p3, radius) {
    let x = p1 + (radius * 2);
    let y = p2;
    let z = p3;
    return [x, y, z];
};


export { drawTestCube, determineLabelCoordinates };
