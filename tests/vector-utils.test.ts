import { Vector3, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import { drawTown } from '../src/drawing/drawTown';

describe('Vector math', () => {
  it('adds two vectors correctly', () => {
    const a = new Vector3(1, 2, 3);
    const b = new Vector3(4, 5, 6);
    const result = a.add(b);

    expect(result.x).toBe(5);
    expect(result.y).toBe(7);
    expect(result.z).toBe(9);
  });
});

describe('drawTown', () => {
  it('adds expected objects to the scene', () => {
    const scene = new Scene();
    const mockDrawing = { data: {} } as any;

    drawTown(scene, mockDrawing);

    expect(scene.children.length).toBeGreaterThan(0); // or check for specific objects
  });
});
