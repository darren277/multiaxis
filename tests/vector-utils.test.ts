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
