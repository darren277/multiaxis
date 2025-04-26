import { Group, Mesh, MeshStandardMaterial, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, AmbientLight, DirectionalLight } from 'three';
import { FontLoader } from 'fontloader';
import { TextGeometry } from 'textgeometry';

export function drawChessBoard(scene, options = {}) {
    const {
        squareSize = 1,
        boardHeight = 0.2,
        darkColor = 0x000000,
        lightColor = 0xffffff
    } = options;

    const boardGroup = new Group();

    const whiteMaterial = new MeshStandardMaterial({ color: lightColor });
    const blackMaterial = new MeshStandardMaterial({ color: darkColor });

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isDark = (row + col) % 2 === 1;
            const material = isDark ? blackMaterial : whiteMaterial;

            const squareGeo = new BoxGeometry(squareSize, boardHeight, squareSize);
            const square = new Mesh(squareGeo, material);

            square.position.x = col * squareSize - (4 * squareSize) + squareSize / 2;
            square.position.z = row * squareSize - (4 * squareSize) + squareSize / 2;
            square.position.y = -boardHeight / 2; // So the top is flush with y=0

            boardGroup.add(square);
        }
    }

    scene.add(boardGroup);
}


const fontLoader = new FontLoader();

function createPlaceholderPiece(scene, type, color = 0xeeeeee, font = null) {
    const group = new Group();
    let mesh;

    switch (type) {
        case 'pawn':
            mesh = new Mesh(
                new CylinderGeometry(0.3, 0.3, 0.6, 32),
                new MeshStandardMaterial({ color })
            );
            break;
        case 'rook':
            mesh = new Mesh(
                new BoxGeometry(0.5, 0.7, 0.5),
                new MeshStandardMaterial({ color })
            );
            break;
        case 'knight':
            mesh = new Mesh(
                new ConeGeometry(0.4, 0.8, 16),
                new MeshStandardMaterial({ color })
            );
            break;
        case 'bishop':
            mesh = new Mesh(
                new SphereGeometry(0.3, 32, 32),
                new MeshStandardMaterial({ color })
            );
            mesh.position.y = 0.3;
            const baseBishop = new Mesh(
                new CylinderGeometry(0.2, 0.2, 0.3, 32),
                new MeshStandardMaterial({ color })
            );
            baseBishop.position.y = 0.15;
            group.add(baseBishop);
            break;
        case 'queen':
            mesh = new Mesh(
                new SphereGeometry(0.4, 32, 32),
                new MeshStandardMaterial({ color })
            );
            mesh.position.y = 0.4;
            const baseQueen = new Mesh(
                new CylinderGeometry(0.3, 0.3, 0.4, 32),
                new MeshStandardMaterial({ color })
            );
            baseQueen.position.y = 0.2;
            group.add(baseQueen);
            break;
        case 'king':
            mesh = new Mesh(
                new SphereGeometry(0.4, 32, 32),
                new MeshStandardMaterial({ color })
            );
            mesh.position.y = 0.4;
            const baseKing = new Mesh(
                new CylinderGeometry(0.3, 0.3, 0.4, 32),
                new MeshStandardMaterial({ color })
            );
            baseKing.position.y = 0.2;
            const cross = new Mesh(
                new BoxGeometry(0.1, 0.1, 0.1),
                new MeshStandardMaterial({ color })
            );
            cross.position.y = 0.9;
            group.add(baseKing, cross);
            break;
        default:
            mesh = new Mesh(
                new BoxGeometry(0.5, 0.5, 0.5),
                new MeshStandardMaterial({ color: 0xff0000 })
            );
    }

    if (mesh) group.add(mesh);

    // Add text label
    if (font) {
        const textGeo = new TextGeometry(type[0].toUpperCase(), {
            font: font,
            size: 0.15,
            height: 0.05,
        });
        const textMesh = new Mesh(
            textGeo,
            new MeshStandardMaterial({ color: 0x000000 })
        );
        textMesh.position.set(-0.1, 0.7, -0.1);
        group.add(textMesh);
    }

    return group;
}


const pieceMap = {
    0: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
    1: Array(8).fill('pawn'),
    6: Array(8).fill('pawn'),
    7: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
};



function drawChessCallback(scene, threejsDrawing, font) {
    // Lights
    const ambientLight = new AmbientLight(0xffffff, 0.4);
    const dirLight = new DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 2);
    scene.add(ambientLight, dirLight);

    // Draw Chessboard
    drawChessBoard(scene);

    for (let row in pieceMap) {
        for (let col = 0; col < 8; col++) {
            const type = pieceMap[row][col];
            const isWhite = row < 2;
            const color = isWhite ? 0xffffff : 0x222222;
            const piece = createPlaceholderPiece(scene, type, color, font);
            piece.position.set(col - 3.5, 0.1, row - 3.5);
            scene.add(piece);
        }
    }
}


function drawChess(scene, threejsDrawing) {
    const fontLoader = new FontLoader();
    fontLoader.load('scripts/helvetiker_regular.typeface.json', (font) => {
        drawChessCallback(scene, threejsDrawing, font);
    });
}



const chessDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawChess, 'dataSrc': null}
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
    }
}


export { chessDrawing };
