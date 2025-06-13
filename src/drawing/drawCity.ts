import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { drawSun } from './reusables/drawLights.js';
import { onKeyDownWalking, onKeyUpWalking, addObstacle, updateObstacleBoxes, walkingAnimationCallback } from '../config/walking.js';
import { mergeGeometries } from 'buffer-geometry-utils';
import { instantiateCollision } from '../config/instantiateCollision.js';
import { extractPerTriangle, spatialHashStaticBoxes, checkCollisionSpatialHashes } from '../config/collisionManager.js';
import { ThreeJSDrawing } from "../types.js";

const gltfLoader = new GLTFLoader();

async function loadGltfModel(data_src: string) {
    const gltf = await gltfLoader.loadAsync(`./imagery/${data_src}.gltf`);
    return gltf;
}

// data_src = 'city/scene.gltf'

const STREETS = [
    'Object_4',
    'Object_5',
    'Object_6',
    'Object_7',
]

const SIDEWALKS = [
    'Object_58',
    'Object_81',
    'Object_227',
    'Object_231',
    'Object_232',
]

const OBSTACLES = [
    'Object_59',
    'Object_124',
    'Object_205',
]

function drawCity(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    threejsDrawing.data.cityReady = false;

    const controls = threejsDrawing.data.controls;

    loadGltfModel('city/scene').then((gltf) => {
        const model = gltf.scene;

        let groundMin = Infinity;

        model.updateMatrixWorld(true);

        const cityBox = new THREE.Box3().setFromObject(model);         // whole model
        const groundY = cityBox.min.y;                           // lowest vertex
        const centerXZ = cityBox.getCenter(new THREE.Vector3());       // horizontal centre

        // Shift the model so streets sit at y=0
        model.position.y -= groundY;            // lift city up
        model.position.x -= centerXZ.x;         // centre on X
        model.position.z -= centerXZ.z;         // centre on Z
        model.updateMatrixWorld(true);          // bake transforms

        model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (STREETS.includes(child.name) || SIDEWALKS.includes(child.name)) {
                    child.geometry.computeBoundingBox();
                    const worldBox = new THREE.Box3().setFromObject(child);
                    groundMin  = Math.min(groundMin, worldBox.min.y);
                }
            }
        });

        STREETS.forEach(street => {
            const child = model.getObjectByName(street);
            if (child) cityBox.expandByObject(child);
        });

        SIDEWALKS.forEach(sidewalk => {
            const child = model.getObjectByName(sidewalk);
            if (child) cityBox.expandByObject(child);
        });

        model.position.y -= groundMin;

        const roadGeoms: THREE.BufferGeometry[] = [];

        model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && (STREETS.includes(child.name) || SIDEWALKS.includes(child.name))) {
                //threejsDrawing.data.worldMeshes.push(child);
                //addObstacle(threejsDrawing.data.staticBoxes, child);
                const g = child.geometry.clone();
                ['tangent','uv1','uv2','uv3'].forEach(a => g.deleteAttribute(a));
                g.translate(0, -0.01, 0);    // sink 1cm
                roadGeoms.push(g);

                console.log(child.name, Object.keys(child.geometry.attributes));

                child.userData.isGround = true;
                threejsDrawing.data.worldMeshes.push(child);

                console.log('child', child);
                console.log('child.geometry', child.geometry);
            }
            if (child instanceof THREE.Mesh && OBSTACLES.includes(child.name)) {
                extractPerTriangle(threejsDrawing.data.staticBoxes, child);
            }
        });

        const width  = cityBox.max.x - cityBox.min.x;
        const depth  = cityBox.max.z - cityBox.min.z;
        const height = 0.02;  // 2 cm thick so your ray always sees it

        const floorGeo = new THREE.BoxGeometry(width, height, depth);
        floorGeo.translate(
          (cityBox.min.x + cityBox.max.x) / 2,   // centre X
          cityBox.min.y + height / 2,            // just above the street
          (cityBox.min.z + cityBox.max.z) / 2    // centre Z
        );

        const floorMat = new THREE.MeshBasicMaterial({visible: false});
        const cityFloorCollider = new THREE.Mesh(floorGeo, floorMat);
        scene.add(cityFloorCollider);
        //cityFloorCollider.userData.isGround = true;
        cityFloorCollider.name = 'cityFloorCollider';

        // now register it exactly like any other obstacle:
        //threejsDrawing.data.worldMeshes.push(cityFloorCollider);



        const merged = mergeGeometries(roadGeoms, false);
        const collider = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({visible: false}));

        scene.add(collider);
        //collider.userData.isGround = true;
        collider.name = 'cityCollider';
        //threejsDrawing.data.worldMeshes.push(collider);



        scene.add(model);
        console.log('groundMin world Y', groundMin);
        model.updateMatrixWorld(true);
        threejsDrawing.data.cityReady = true;

        //threejsDrawing.data.spawnCoords = cityBox.getCenter(new Vector3());
        threejsDrawing.data.spawnCoords = new THREE.Vector3(0, 2, 0);
        //threejsDrawing.data.spawnCoords.y = cityBox.min.y + 2;        // soles ≈1m above ground
        //threejsDrawing.data.spawnCoords.x = 0;
        //threejsDrawing.data.spawnCoords.z = 0;
        //threejsDrawing.data.spawnCoords.y = 2;        // soles ≈1m above ground

        console.log('cityBox after shift', cityBox.setFromObject(model));

        console.log('streets found:', threejsDrawing.data.worldMeshes.length);
    });

    // Draw the sun
    const sun = drawSun(scene, threejsDrawing);

    (scene as THREE.Scene).updateMatrixWorld(true);

    instantiateCollision(threejsDrawing);
}

let lastTime = 0;

const cityDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawCity, 'dataSrc': null, 'dataType': 'gltf'}
    ],
    'eventListeners': {
        'click': (event: MouseEvent, data: any) => {
            const renderer = data.renderer;
            const threejsDrawing = data.threejsDrawing;
            const camera = data.camera;
        },
        'keydown': (event: KeyboardEvent, stuff: any) => {
            const keyManager = stuff.data.keyManager;
            onKeyDownWalking(event, keyManager);
        },
        'keyup': (event: KeyboardEvent, stuff: any) => {
            const keyManager = stuff.data.keyManager;
            onKeyUpWalking(event, keyManager);
        },
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        //const delta = clock.getDelta();
        const scene = threejsDrawing.data.scene;
        const controls = threejsDrawing.data.controls;
        if (!controls) {
            console.warn('No controls found.');
            return;
        }

        if (!threejsDrawing.data.cityReady) return;

        if (!threejsDrawing.data.spawned) {
            console.log('teleporting to (for realsies):', threejsDrawing.data.spawnCoords);
            (controls.getObject?.() || controls.object || controls).position.copy(threejsDrawing.data.spawnCoords);
            threejsDrawing.data.spawned = true;
        }

        const player   = controls.object;

        const elapsed = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        scene.updateMatrixWorld(true);

        updateObstacleBoxes(threejsDrawing.data.staticBoxes, threejsDrawing.data.movingMeshes, threejsDrawing.data.obstacleBoxes);

        walkingAnimationCallback(scene as THREE.Scene, controls, threejsDrawing.data.collision, elapsed, true);
    },
    'data': {
        'staticBoxes': [],
        'movingMeshes': [],
        'obstacleBoxes': [],
        'worldMeshes': [],
        'collision': null,
        'keyManager': null,
    },
    'sceneConfig': {
        'startPosition': {
            'x': 0,
            // height above ground
            'y': 2,
            // groundHeight/2 + 5 // a little past the top edge
            'z': 0
        },
        'lookAt': {
            'x': 0,
            'y': 0.5,
            'z': 0
        },
        'speed': 10,
        'jumpVelocity': 25,
        'checkCollisionFunc': checkCollisionSpatialHashes
    }
}

export { cityDrawing };
