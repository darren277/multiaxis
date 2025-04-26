import {
    Mesh, MeshPhongMaterial, AxesHelper, Vector3, Line, LineBasicMaterial, LineSegments, SphereGeometry, AmbientLight,
    DirectionalLight, Group, PointLight, PointLightHelper, DoubleSide, BufferGeometry
} from 'three';
import { TextGeometry} from 'textgeometry';
import { FontLoader } from 'fontloader';

function loadFont(url, callback) {
    const loader = new FontLoader();
    let font;

    loader.load(url, (font) => {
        callback(font);
    });
}

function draw_letter(font, letter, x, y, z) {
    var geometry = new TextGeometry( letter, {
            font: font,
            size: 3,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 5
        } );

    var textMaterial = new MeshPhongMaterial( { color: 0xdddddd } );
    var mesh = new Mesh( geometry, textMaterial );
    mesh.position.set(x, y, z);

    return mesh;
};

function drawQuantumCallback(scene, threejsDrawing, font) {
    const twoPi = Math.PI * 2;

    const data = {
        radius: 15,
        widthSegments: 24,
        heightSegments: 24,
        phiStart: 0,
        phiLength: twoPi,
        thetaStart: 0,
        thetaLength: Math.PI
    };

    const data2 = {
        radius: 15,
        widthSegments: 24,
        heightSegments: 24,
        phiStart: 0,
        phiLength: twoPi,
        thetaStart: 0,
        thetaLength: Math.PI
    };

    function generateGeometry() {
        // updateGroupGeometry( mesh,
            var sphere = new SphereGeometry(
                data.radius, data.widthSegments, data.heightSegments, data.phiStart, data.phiLength, data.thetaStart, data.thetaLength
            )
        // );
        return sphere;
    }

    //scene.add(new AmbientLight(0xffffff, 1));
    scene.add(new AmbientLight(0x404040));

    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    const lights = [];
    lights[ 0 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( 0, 200, 0 );
    lights[ 1 ].position.set( 100, 200, 100 );
    lights[ 2 ].position.set( - 100, - 200, - 100 );

    const helper = new PointLightHelper(lights[0], 5);
    scene.add(helper);

    scene.add( lights[ 0 ] );
    scene.add( lights[ 1 ] );
    scene.add( lights[ 2 ] );

    const group = new Group();

    const geometry = generateGeometry();
    // geometry.setAttribute( 'position', new Float32BufferAttribute( [], 3 ) );

    const lineMaterial = new LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.1 } );
    const meshMaterial = new MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, emissiveIntensity: 0.1, side: DoubleSide, flatShading: true, transparent: true, opacity: 0.1 } );

    group.add( new LineSegments( geometry, lineMaterial ) );
    group.add( new Mesh( geometry, meshMaterial ) );

    /* LINE */
    function draw_line(x1, y1, z1, x2, y2, z2, color=0x0000ff) {
        const line_material = new LineBasicMaterial( { color: color } );
        const points = [];
        points.push( new Vector3( x1, y1, z1 ) );
        points.push( new Vector3( x2, y2, z2 ) );

        const line_geometry = new BufferGeometry().setFromPoints( points );
        const line = new Line( line_geometry, line_material );

        return line
    };

    var arrow1 = draw_line(-20, 0, 0, 0, 0, 0);
    scene.add( arrow1 );

    // Arrow head
    scene.add( draw_line(-20, 0, 0, -18, -2, 0) );
    scene.add( draw_line(-20, 0, 0, -18, 2, 0) );

    // scene.add( draw_line(-20, 0, 0, -18, 0, -2) );
    // scene.add( draw_line(-20, 0, 0, -18, 0, 2) );

    var arrow2 = draw_line(0, 0, 0, 0, 20, 0);
    scene.add( arrow2 );

    scene.add( draw_line(0, 20, 0, -2, 18, 0) );
    scene.add( draw_line(0, 20, 0, 2, 18, 0) );


    var arrow2 = draw_line(0, 0, 0, 0, 0, -20);
    scene.add( arrow2 );

    scene.add( draw_line(0, 0, -20, 0, -2, -18) );
    scene.add( draw_line(0, 0, -20, 0, 2, -18) );

    scene.add(draw_letter(font, "X", -22, 2, 2));

    const axesHelper = new AxesHelper( 100 );

    scene.add( group );
    //scene.add( axesHelper );

    threejsDrawing.data.group = group;
};


function drawQuantum(scene, threejsDrawing) {
    const fontUrl = 'scripts/helvetiker_regular.typeface.json';
    loadFont(fontUrl, (font) => {
        drawQuantumCallback(scene, threejsDrawing, font);
    });
}

const quantumDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawQuantum, 'dataSrc': null}
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        if (!threejsDrawing.data.group) {
            return;
        }
        threejsDrawing.data.group.rotation.y += 0.005;
    },
    'data': {
        'group': null,
    }
}

export { quantumDrawing };
