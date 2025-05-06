import {
    Group, SphereGeometry, Mesh, MeshStandardMaterial, MeshBasicMaterial, MeshLambertMaterial, Shape, Vector3, BufferGeometry,
    MathUtils, LineLoop, LineBasicMaterial, TextureLoader, AxesHelper, DirectionalLight, ExtrudeGeometry, PlaneGeometry, Box3
} from 'three';

import { drawBasicLights } from './drawLights.js';

const HOUSE_TO_HIGHLIGHT = '<REPLACE_WITH_BUILDING_ID>';
const DEFAULT_HOUSE_COLOR = 0xf0f0f0;

async function loadAndRenderGeoJSON(scene, buildingGroupParams) {
    const { buildingGroupPosX, buildingGroupPosZ, buildingGroupScaleX, buildingGroupScaleZ } = buildingGroupParams;

    const response = await fetch('./data/buildings.geojson');
    const geojson = await response.json();

    // Approximate meters per degree at given latitude
    const R = 6378137; // Earth radius in meters
    const latScale = Math.PI * R / 180;
    const lonScale = (lat) => latScale * Math.cos(lat * Math.PI / 180);

    // STEP 1: Pick a shared geographic center (first polygon’s first point)
    let centerLon = null;
    let centerLat = null;

    for (const feature of geojson.features) {
        if (feature.geometry.type === "Polygon") {
            const coords = feature.geometry.coordinates[0];
            centerLon = coords[0][0];
            centerLat = coords[0][1];
            break;
        }
    }

    if (centerLon === null || centerLat === null) {
        console.error("No valid polygon found for computing center.");
        return;
    }

    const buildingGroup = new Group();
    // add each building mesh to `buildingGroup`

    // STEP 2: Loop through each polygon
    geojson.features.forEach(feature => {
        if (feature.geometry.type === "Polygon") {
            const coords = feature.geometry.coordinates[0]; // Outer ring

            const properties = feature.properties;
            const tags = properties.tags || {};
            const isBuilding = tags.building && (tags.building === "yes" || tags.building === "house");

            if (isBuilding) {
                const shape = new Shape();
                coords.forEach(([lon, lat], i) => {
                    const x = (lon - centerLon) * lonScale(centerLat);
                    const y = (lat - centerLat) * latScale;
                    if (i === 0) {
                        shape.moveTo(x, y);
                    } else {
                        shape.lineTo(x, y);
                    }
                });

                const extrudeSettings = {
                    //depth: Math.random() * 100 + 20,
                    // two storey house height by default...
                    depth: 20,
                    bevelEnabled: false
                };


                const wayId = properties.id;
                let houseColor = DEFAULT_HOUSE_COLOR;
                if (wayId === HOUSE_TO_HIGHLIGHT) {
                    houseColor = 0xff0000; // red
                }

                const geometry = new ExtrudeGeometry(shape, extrudeSettings);
                const material = new MeshStandardMaterial({ color: houseColor, roughness: 0.5, metalness: 0.5 });
                const mesh = new Mesh(geometry, material);

                mesh.rotation.x = -Math.PI / 2;
                buildingGroup.add(mesh);
            }
        }
    });

    scene.add(buildingGroup);

    // Once done loading all buildings...
    // Compute bounding box of all buildings:
    const box = new Box3().setFromObject(buildingGroup);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    buildingGroup.position.sub(center);

    // shift the whole group up along the y-axis
    // and to the right along the x-axis
    buildingGroup.position.x += buildingGroupPosX;

    buildingGroup.position.z -= buildingGroupPosZ;

    // scale on the Z axis...
    //buildingGroup.scale.set(1, 1, 1.45);
    // and compress a bit along the X axis...
    buildingGroup.scale.set(buildingGroupScaleX, 1, buildingGroupScaleZ);

    // Use `size.x` and `size.z` for ground plane size
    // Then use size.x and size.z for your PlaneGeometry(width, height) and position it at mesh.position.set(center.x, -0.1, center.z).

    // You can also use size.y for the height of the buildings
}

const textureLoader = new TextureLoader();

async function drawMap(scene, threejsDrawing) {
    textureLoader.load('./textures/neighbourhood.png', (texture) => {
        const planeWidth = 750; // meters
        const planeHeight = 750;

        const geometry = new PlaneGeometry(planeWidth, planeHeight);
        const material = new MeshBasicMaterial({ map: texture });
        const mapPlane = new Mesh(geometry, material);

        mapPlane.rotation.x = -Math.PI / 2; // make horizontal

        //mapPlane.position.y = -0.1; // slightly below buildings to avoid z-fighting
        mapPlane.scale.set(0.9, 0.9, 1); // stretch slightly if it's close
        //mapPlane.position.set(10, -0.1, -20); // nudge into alignment
        // upper right quadrant only...
        mapPlane.position.set(0, -0.1, 0); // nudge into alignment

        scene.add(mapPlane);
    });
}

function drawBuildings(scene, threejsDrawing) {
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(100, 200, 100).normalize();
    scene.add(light);

    const buildingGroupParams = {
        buildingGroupPosX: threejsDrawing.data.buildingGroupPosX,
        buildingGroupPosZ: threejsDrawing.data.buildingGroupPosZ,
        buildingGroupScaleX: threejsDrawing.data.buildingGroupScaleX,
        buildingGroupScaleZ: threejsDrawing.data.buildingGroupScaleZ
    }

    drawMap(scene).then(() => {
        loadAndRenderGeoJSON(scene, buildingGroupParams).then(() => {
            console.log("Buildings loaded and rendered.");
        }).catch((error) => {
            console.error("Error loading buildings:", error);
        });
    }).catch((error) => {
        console.error("Error loading map:", error);
    });

    drawBasicLights(scene, threejsDrawing);

    // draw some test cubes...
    const cubeGeo = new SphereGeometry(0.5, 32, 32);
    const cubeMat = new MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0, 0); // place it somewhere visible
    scene.add(cube);
}


/**
 * @param {object} geojson - A GeoJSON FeatureCollection
 * @param {function} projectionFn - A function to convert [lng, lat] to [x, y]
 * @returns {THREE.Group} group containing all polygon meshes/lines
 */
function createGeoJsonMap(scene, geojson, projectionFn, debug = false) {
    const group = new Group();

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
        const dot = new Mesh(
            new SphereGeometry(0.05),
            new MeshBasicMaterial({ color: 0xff0000 })
        );
        dot.position.copy(p);
        scene.add(dot);
    });
}

/**
 * Convert polygon coordinates to a Mesh (or line).
 * We’ll do outlines as Lines for simplicity.
 * If you want filled polygons, you’d use Shape and ShapeGeometry instead.
 */
function polygonToMesh(scene, polygonCoords, projectionFn, debug = false) {
    // polygonCoords: array of rings (first ring is outer boundary, subsequent rings are holes)
    const polygonGroup = new Group();

    polygonCoords.forEach(ring => {
        const shape = new Shape();
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
        const geometry = new ShapeGeometry(shape);
        const material = new MeshBasicMaterial({
            color: 0x00ff00,
            side: DoubleSide
        });
        const mesh = new Mesh(geometry, material);
        polygonGroup.add(mesh);
        */

        // If you just want a line outline:
        const points = shape.getPoints();
//        const lineGeometry = new BufferGeometry().setFromPoints(points);
//        const lineMaterial = new LineBasicMaterial({ color: 0x000000 });
//        const line = new LineLoop(lineGeometry, lineMaterial);
//        polygonGroup.add(line);
        const geometry = new ShapeGeometry(shape);
        const material = new MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const mesh = new Mesh(geometry, material);
        polygonGroup.add(mesh);

        if (debug) {
            drawDebugDots(scene, points);
        }
    });

    return polygonGroup;
}


function polygonToMesh3D(scene, polygonCoords, projectionFn, debug = false) {
    const polygonGroup = new Group();

    polygonCoords.forEach(ring => {
        const points = ring.map(([lng, lat]) => {
            const [x, y, z] = projectionFn(lng, lat);
            return new Vector3(x, y, z);
        });

        const lineGeometry = new BufferGeometry().setFromPoints(points);
        const lineMaterial = new LineBasicMaterial({ color: 0xffaa00 });
        const line = new LineLoop(lineGeometry, lineMaterial);
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
    const phi = MathUtils.degToRad(90 - lat);
    const theta = MathUtils.degToRad(lng);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    let z = radius * Math.sin(phi) * Math.sin(theta);

    // for z-index competition, add a slightly larger radius...
    const zOffset = 2.0;
    z += zOffset;
    return [x, y, z];
}


// Create lines that wrap around the sphere
//const lineGeometry = new BufferGeometry().setFromPoints(
//    ringCoords.map(([lng, lat]) => new Vector3(...latLngToSphere(lng, lat)))
//);
//const line = new LineLoop(lineGeometry, lineMaterial);
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
    const textureLoader = new TextureLoader();
    const earthTexture = textureLoader.load('textures/8k_earth_daymap.jpg'); // Use your own image path

    const globe = new Mesh(
        new SphereGeometry(5, 64, 64),
        //new MeshStandardMaterial({color: 0x2266cc, roughness: 1, metalness: 0})
        new MeshStandardMaterial({map: earthTexture, roughness: 1, metalness: 0})
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
    scene.add(new AxesHelper(10));
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
    scene.add(new AxesHelper(10));

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
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
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
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
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


const buildingsDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawBuildings, 'dataSrc': null}
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
        'geojson': exampleGeoJson,
        'globe': null,
        'mapGroup': null,
        'buildingGroupPosX': 290,
        'buildingGroupPosZ': 80,
        'buildingGroupScaleX': 0.8,
        'buildingGroupScaleZ': 1.2,
    },
    'sceneConfig': {
        //'startPosition': camera.position.set(0, 500, 1000);
        'startPosition': { x: 0, y: 50, z: 100 },
        'clippingPlane': 10000,
        //'background': 0xf0f0f0
    }
}

export { geoDrawing, geoDrawing3d, buildingsDrawing };
