import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
    CollisionSystem,
    PhysicsConfig,
    InputManager,          // only to satisfy ts-intellisense
} from '../src/config/collisionManager';   // ← adjust path

/* ------------------------------------------------------------------ */
/*  Shared test fixtures                                              */
/* ------------------------------------------------------------------ */
let cs: CollisionSystem;
let dummyScene: THREE.Scene;

beforeEach(() => {
    dummyScene = new THREE.Scene();
    cs = new CollisionSystem(PhysicsConfig); // no dbg arrow
});

/* ------------------------------------------------------------------ */
/*  _boxOf()                                                          */
/* ------------------------------------------------------------------ */
describe('_boxOf', () => {
    it('re-uses the same Box3 instance for the same mesh', () => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
        const b1   = (cs as any)._boxOf(mesh);
        const b2   = (cs as any)._boxOf(mesh);
        expect(b1).toBe(b2);                 // same reference
    });

    it('Box3 tightly fits the mesh world-space bounds', () => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
        mesh.position.set(5, 0, 0);
        mesh.updateMatrixWorld();            // important!
        const box = (cs as any)._boxOf(mesh);
        expect(box.min.x).toBeCloseTo(4.5);
        expect(box.max.x).toBeCloseTo(5.5);
    });
});

/* ------------------------------------------------------------------ */
/*  _nextPos()                                                        */
/* ------------------------------------------------------------------ */
describe('_nextPos', () => {
    it('returns the player position advanced by v*dt', () => {
        const p = new THREE.Object3D();
        p.position.set(0, 0, 0);
        const out = (cs as any)._nextPos(p, 1, 2, 0.5); // dx=1, dz=2
        expect(out.x).toBeCloseTo(0.5);  // 1 * 0.5
        expect(out.z).toBeCloseTo(1.0);  // 2 * 0.5
    });
});

/* ------------------------------------------------------------------ */
/*  _collides()                                                       */
/* ------------------------------------------------------------------ */
describe('_collides', () => {
    it('detects whether a point is inside any obstacle box', () => {
        const box = new THREE.Box3(
            new THREE.Vector3(-1, -1, -1),
            new THREE.Vector3( 1,  1,  1)
        );
        (cs as any).obstacleBoxes.push(box);

        expect((cs as any)._collides(new THREE.Vector3(0, 0, 0))).toBe(true);
        expect((cs as any)._collides(new THREE.Vector3(2, 0, 0))).toBe(false);
    });
});

/* ------------------------------------------------------------------ */
/*  _integrateY()                                                     */
/* ------------------------------------------------------------------ */
describe('_integrateY', () => {
    it('adds v.y*dt to position and subtracts gravity', () => {
        const cs = new CollisionSystem(PhysicsConfig);
        const p = new THREE.Object3D();
        const v = new THREE.Vector3(0, 1, 0); // Start with velocity +1

        (cs as any)._integrateY(p, v, 1); // dt = 1s

        expect(p.position.y).toBeCloseTo(-8.81); // 0 + (-8.81)
        expect(v.y).toBeCloseTo(-8.81);          // 1 - 9.81
    });
});

/* ------------------------------------------------------------------ */
/*  _setRayFromFeet() + _showDebugRay()                               */
/* ------------------------------------------------------------------ */
describe('_setRayFromFeet', () => {
    it('places ray origin just below player center', () => {
        const p = new THREE.Object3D();
        p.position.set(0, 2, 0);
        const origin = (cs as any)._setRayFromFeet(p);
        expect(origin.y).toBeCloseTo(2 - PhysicsConfig.PLAYER_SIZE + 0.01);
    });
});

/* ------------------------------------------------------------------ */
/*  _firstWalkableHit() (happy-path)                                  */
/* ------------------------------------------------------------------ */
describe('_firstWalkableHit', () => {
    it('returns the ground hit when player stands on a plane', () => {
        // Create a visible ground mesh with face normals pointing up
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial());
        ground.rotateX(-Math.PI / 2);         // Make it horizontal
        ground.userData.isGround = true;
        ground.name = 'test_ground';
        ground.updateMatrixWorld(true);       // <- Required for accurate raycasting
        dummyScene.add(ground);

        const player = new THREE.Object3D();
        player.position.set(0, 1.1, 0);        // Stand 1.1 above ground (PLAYER_SIZE assumed to be ~1)

        const rayOrigin = (cs as any)._setRayFromFeet(player);
        (cs as any).ray.far = 2;               // Ensure it's long enough to intersect ground
        const hit = (cs as any)._firstWalkableHit(player, [ground]);

        expect(hit).toBeDefined();
        expect(hit!.object.name).toBe('test_ground');
    });
});
