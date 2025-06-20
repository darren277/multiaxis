declare module 'noisejs' {
    export class Noise {
        constructor(seed: number)
        perlin2(x: number, y: number): number
        simplex2(x: number, y: number): number
    }
    export class Perlin {
        constructor(seed: number)
        noise(x: number, y: number): number
        noise3D(x: number, y: number, z: number): number
    }
    export class Simplex {
        constructor(seed: number)
        noise(x: number, y: number): number
        noise3D(x: number, y: number, z: number): number
    }
    export class Fbm {
        constructor(seed: number, octaves: number)
        noise(x: number, y: number): number
        noise3D(x: number, y: number, z: number): number
    }
}
