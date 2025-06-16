
declare module "perlin-noise" {
    export type PerlinNoiseOptions = {
        octaveCount?: number;
        amplitude?: number;
        persistence?: number;
    };
    export function generatePerlinNoise(width: number, height: number, options?: PerlinNoiseOptions): number[];
    export function generateWhiteNoise(width: number, height: number): number[];
}