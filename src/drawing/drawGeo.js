import * as THREE from 'three';

import { drawBasicLights } from './drawLights.js';


/**
 * @param {object} geojson - A GeoJSON FeatureCollection
 * @param {function} projectionFn - A function to convert [lng, lat] to [x, y]
 * @returns {THREE.Group} group containing all polygon meshes/lines
 */
function createGeoJsonMap(scene, geojson, projectionFn, debug = false) {
    const group = new THREE.Group();

    // Iterate over features
    geojson.features.forEach(feature => {
        const geometryType = feature.geometry.type;
        const coords = feature.geometry.coordinates;

        if (geometryType === 'Polygon') {
            // coords is typically [ [ [lng, lat], [lng, lat], ... ] ]
            //const polygonGroup = polygonToMesh(coords, projectionFn);
            const polygonGroup = polygonToMesh3D(scene, coords, projectionFn, debug);
            group.add(polygonGroup);
        } else if (geometryType === 'MultiPolygon') {
            // coords is [ [ [ [lng, lat], ... ] ], [ [lng, lat], ... ] ]
            coords.forEach(polyCoords => {
                //const polygonGroup = polygonToMesh(polyCoords, projectionFn);
                const polygonGroup = polygonToMesh3D(scene, polyCoords, projectionFn, debug);
                group.add(polygonGroup);
            });
        }
        // You can handle 'Point', 'MultiPoint', 'LineString', etc. similarly
    });

    return group;
}

function drawDebugDots(scene, points) {
    points.forEach(p => {
        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        dot.position.copy(p);
        scene.add(dot);
    });
}

/**
 * Convert polygon coordinates to a THREE.Mesh (or line).
 * We’ll do outlines as Lines for simplicity.
 * If you want filled polygons, you’d use THREE.Shape and THREE.ShapeGeometry instead.
 */
function polygonToMesh(scene, polygonCoords, projectionFn, debug = false) {
    // polygonCoords: array of rings (first ring is outer boundary, subsequent rings are holes)
    const polygonGroup = new THREE.Group();

    polygonCoords.forEach(ring => {
        const shape = new THREE.Shape();
        ring.forEach((coord, index) => {
            const [lng, lat] = coord;
            const [x, y] = projectionFn(lng, lat);

            if (index === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        });

        // shape is closed automatically (or you can do shape.closePath())

        // If you want a filled shape:
        /*
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        polygonGroup.add(mesh);
        */

        // If you just want a line outline:
        const points = shape.getPoints();
//        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
//        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
//        const line = new THREE.LineLoop(lineGeometry, lineMaterial);
//        polygonGroup.add(line);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        polygonGroup.add(mesh);

        if (debug) {
            drawDebugDots(scene, points);
        }
    });

    return polygonGroup;
}


function polygonToMesh3D(scene, polygonCoords, projectionFn, debug = false) {
    const polygonGroup = new THREE.Group();

    polygonCoords.forEach(ring => {
        const points = ring.map(([lng, lat]) => {
            const [x, y, z] = projectionFn(lng, lat);
            return new THREE.Vector3(x, y, z);
        });

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00 });
        const line = new THREE.LineLoop(lineGeometry, lineMaterial);
        polygonGroup.add(line);

        if (debug) {
            drawDebugDots(scene, points);
        }
    });

    return polygonGroup;
}



function equirectangularProjection(lng, lat) {
    // lat, lng in degrees
    // Convert degrees to radians
    const x = (lng * Math.PI) / 180;
    const y = (lat * Math.PI) / 180;

    // Then scale them for your 3D scene
    // e.g., multiply by some factor to get them in a visible range
    const scale = 5;
    return [x * scale, y * scale];
}



/* Rendering on a Sphere (Globe) */

function latLngToSphere(lng, lat, radius = 5) {
    // Convert lat, lng (in degrees) to radians
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lng);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    let z = radius * Math.sin(phi) * Math.sin(theta);

    // for z-index competition, add a slightly larger radius...
    const zOffset = 2.0;
    z += zOffset;
    return [x, y, z];
}


// Create lines that wrap around the sphere
//const lineGeometry = new THREE.BufferGeometry().setFromPoints(
//    ringCoords.map(([lng, lat]) => new THREE.Vector3(...latLngToSphere(lng, lat)))
//);
//const line = new THREE.LineLoop(lineGeometry, lineMaterial);
//group.add(line);


const exampleGeoJson = {
    "type": "FeatureCollection",
    "features": [
//        {
//            "type": "Feature",
//            "geometry": {
//                "type": "Polygon",
//                "coordinates": [
//                    [
//                        [-10, 10],
//                        [-10, -10],
//                        [10, -10],
//                        [10, 10],
//                        [-10, 10]
//                    ]
//                ]
//            },
//            "properties": {}
//        },
        {
            "type": "Feature",
            "geometry": {
            "type": "Polygon",
            "coordinates": [[
                    [0, 10],     // Top point
                    [2.9, 3.1],  // Down right
                    [9.5, 3.1],  // Far right
                    [4.7, -1.2], // Bottom right inner
                    [6.0, -8.0], // Bottom point
                    [0, -4],     // Center bottom
                    [-6.0, -8.0], // Bottom left
                    [-4.7, -1.2], // Bottom left inner
                    [-9.5, 3.1],  // Far left
                    [-2.9, 3.1],  // Up left
                    [0, 10]      // Close shape
                ]]
            },
            "properties": {
                "name": "Simple Star"
            }
        }
    ]
};


function drawEarth() {
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('textures/8k_earth_daymap.jpg'); // Use your own image path

    const globe = new THREE.Mesh(
        new THREE.SphereGeometry(5, 64, 64),
        //new THREE.MeshStandardMaterial({color: 0x2266cc, roughness: 1, metalness: 0})
        new THREE.MeshStandardMaterial({map: earthTexture, roughness: 1, metalness: 0})
    );

    globe.rotation.y = Math.PI / 2; // Rotate to face the camera
    globe.castShadow = true;
    globe.receiveShadow = true;
    globe.name = 'Earth';

    return globe;
}


function drawGeo(scene, threejsDrawing) {
    const projectionFn = (lng, lat) => {return equirectangularProjection(lng, lat);};
    const mapGroup = createGeoJsonMap(scene, exampleGeoJson, projectionFn);
    scene.add(mapGroup);
    scene.add(new THREE.AxesHelper(10));
}

function drawGeo3d(scene, threejsDrawing) {
    const DEBUG = true;

    // GLOBE:
    const radius = 5;
    const projectionFn = (lng, lat) => latLngToSphere(lng, lat, radius);

    //const mapGroup = createGeoJsonMap(threejsDrawing.data.geojson, projectionFn);
    const mapGroup = createGeoJsonMap(scene, exampleGeoJson, projectionFn, DEBUG);

    scene.add(mapGroup);

    // 3) Set up any additional rendering logic here
    scene.add(new THREE.AxesHelper(10));

    const globe = drawEarth();
    scene.add(globe);

    // For example, you might want to add lighting or camera controls
    drawBasicLights(scene, threejsDrawing);

    // attach the map group to the globe
    globe.add(mapGroup);

    // Set the map group name for easy access later
    mapGroup.name = 'MapGroup';

    // attach globe and map group threejsDrawing.data
    threejsDrawing.data.globe = globe;
    threejsDrawing.data.mapGroup = mapGroup;
}


const geoDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        //{'func': drawGeo, 'dataSrc': 'geojson'}
        {'func': drawGeo, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
        'geojson': exampleGeoJson,
        'globe': null,
        'mapGroup': null
    }
}


const geoDrawing3d = {
    'sceneElements': [],
    'drawFuncs': [
        //{'func': drawGeo, 'dataSrc': 'geojson'}
        {'func': drawGeo3d, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        // Update the globe rotation
        const globe = threejsDrawing.data.globe;
        if (globe) {
            globe.rotation.y += 0.0005; // Rotate slowly
        }

        // Update the map rotation
        const mapGroup = threejsDrawing.data.mapGroup;
        if (mapGroup) {
            mapGroup.rotation.y += 0.0005; // Rotate slowly
        }
    },
    'data': {
        'geojson': exampleGeoJson,
        'globe': null,
        'mapGroup': null
    }
}


export { geoDrawing, geoDrawing3d };
