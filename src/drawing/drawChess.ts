import * as THREE from "three";
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { ThreeJSDrawing } from "../types";

interface ChessBoardOptions {
    squareSize?: number;
    boardHeight?: number;
    darkColor?: number;
    lightColor?: number;
}

export function drawChessBoard(scene: THREE.Scene, options: ChessBoardOptions = {}) {
    const {
        squareSize = 1,
        boardHeight = 0.2,
        darkColor = 0x000000,
        lightColor = 0xffffff
    } = options;

    const boardGroup = new THREE.Group();

    const whiteMaterial = new THREE.MeshStandardMaterial({ color: lightColor });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: darkColor });

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isDark = (row + col) % 2 === 1;
            const material = isDark ? blackMaterial : whiteMaterial;

            const squareGeo = new THREE.BoxGeometry(squareSize, boardHeight, squareSize);
            const square = new THREE.Mesh(squareGeo, material);

            square.position.x = col * squareSize - (4 * squareSize) + squareSize / 2;
            square.position.z = row * squareSize - (4 * squareSize) + squareSize / 2;
            square.position.y = -boardHeight / 2; // So the top is flush with y=0

            boardGroup.add(square);
        }
    }

    scene.add(boardGroup);
}


const fontLoader = new FontLoader();

function createPlaceholderPiece(scene: THREE.Scene, type: string, color = 0xeeeeee, font: Font | null = null) {
    const group = new THREE.Group();
    let mesh;

    switch (type) {
        case 'pawn':
            mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 0.6, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            break;
        case 'rook':
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.7, 0.5),
                new THREE.MeshStandardMaterial({ color })
            );
            break;
        case 'knight':
            mesh = new THREE.Mesh(
                new THREE.ConeGeometry(0.4, 0.8, 16),
                new THREE.MeshStandardMaterial({ color })
            );
            break;
        case 'bishop':
            mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 32, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            mesh.position.y = 0.3;
            const baseBishop = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            baseBishop.position.y = 0.15;
            group.add(baseBishop);
            break;
        case 'queen':
            mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 32, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            mesh.position.y = 0.4;
            const baseQueen = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            baseQueen.position.y = 0.2;
            group.add(baseQueen);
            break;
        case 'king':
            mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 32, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            mesh.position.y = 0.4;
            const baseKing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32),
                new THREE.MeshStandardMaterial({ color })
            );
            baseKing.position.y = 0.2;
            const cross = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.1),
                new THREE.MeshStandardMaterial({ color })
            );
            cross.position.y = 0.9;
            group.add(baseKing, cross);
            break;
        default:
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshStandardMaterial({ color: 0xff0000 })
            );
    }

    if (mesh) group.add(mesh);

    // Add text label
    if (font) {
        const textGeo = new TextGeometry(type[0].toUpperCase(), {
            font: font,
            size: 0.15,
            depth: 0.05,
        });
        const textMesh = new THREE.Mesh(
            textGeo,
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        textMesh.position.set(-0.1, 0.7, -0.1);
        group.add(textMesh);
    }

    return group;
}


const pieceMap: { [key: number]: string[] } = {
    0: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
    1: Array(8).fill('pawn'),
    6: Array(8).fill('pawn'),
    7: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
};



function drawChessCallback(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing, font: Font) {
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 2);
    scene.add(ambientLight, dirLight);

    // Draw Chessboard
    drawChessBoard(scene);

    for (let rowNum of Object.keys(pieceMap).map(Number)) {
        for (let col = 0; col < 8; col++) {
            const type = pieceMap[rowNum][col];
            const isWhite = rowNum < 2;
            const color = isWhite ? 0xffffff : 0x222222;
            const piece = createPlaceholderPiece(scene, type, color, font);
            piece.position.set(col - 3.5, 0.1, rowNum - 3.5);
            scene.add(piece);
        }
    }
}


function drawChess(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    const fontLoader = new FontLoader();
    fontLoader.load('scripts/threejs/helvetiker_regular.typeface.json', (font) => {
        drawChessCallback(scene, threejsDrawing, font);
    });
}



const chessDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawChess, 'dataSrc': null}
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
    },
    'data': {
    }
}


export { chessDrawing };
