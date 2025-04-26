import { BoxGeometry, MeshStandardMaterial, Mesh, Raycaster, Vector2 } from 'three';

function drawNavCube(cubeDef, scene, threejsDrawing) {
    // Add a clickable object
    const boxGeo = new BoxGeometry(0.5, 0.5, 0.5);
    //const boxMat = new MeshStandardMaterial({ color: 0x00ff00 });
    const boxMat = new MeshStandardMaterial({ color: cubeDef.color, transparent: true, opacity: 0.5 });
    const navCube = new Mesh(boxGeo, boxMat);
    //navCube.position.set(1, 0.25, -2); // place it somewhere visible
    navCube.position.set(cubeDef.position[0], cubeDef.position[1], cubeDef.position[2]); // place it somewhere visible
    //navCube.userData.targetScene = 'library'; // <-- match a key in THREEJS_DRAWINGS
    navCube.userData.targetScene = cubeDef.targetScene; // <-- match a key in THREEJS_DRAWINGS
    scene.add(navCube);

    // Save it for later if needed
    threejsDrawing.data.navCube = navCube;
}


function drawNavCubes(scene, threejsDrawing, cubeDefs) {
    cubeDefs.forEach(cubeDef => {
        drawNavCube(cubeDef, scene, threejsDrawing);
    });
}

const raycaster = new Raycaster();
const mouse = new Vector2();

function onClickNav(event, scene, renderer, camera) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.targetScene) {
            const target = obj.userData.targetScene;
            console.log(`Navigating to scene: ${target}`);
            window.location.href = `/threejs/${target}`;
            break;
        }
    }
}

const CUBE_DEFS = [
    { targetScene: 'library', position: [1, 0.25, -2], color: 0x00ff00 },
    { targetScene: 'farm', position: [2, 0.25, -2], color: 0x0000ff },
    { targetScene: 'room', position: [3, 0.25, -2], color: 0xff0000 },
    { targetScene: 'kitchen', position: [4, 0.25, -2], color: 0xffff00 },
    { targetScene: 'bathroom', position: [5, 0.25, -2], color: 0xff00ff },
    { targetScene: 'livingroom', position: [6, 0.25, -2], color: 0x00ffff }
]


export { drawNavCubes, onClickNav, CUBE_DEFS };
