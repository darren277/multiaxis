declare module 'd3-force-3d' {
    export function forceSimulation<Node, Link>(): any
    export function forceManyBody<Node>(): any
    export function forceLink<Node, Link>(): any
    export function forceCenter(): any
    export function Simulation<Node, Link>(): any
    export function forceSimulation<Node, Link>(
        nodes: Node[],
        links?: Link[],
    ): Simulation<Node, Link>
    export function forceManyBody<Node>(options?: {
        strength?: number
        theta?: number
        distanceMin?: number
        distanceMax?: number
    }): any
    export function forceLink<Node, Link>(links?: Link[]): any
    export function forceCenter(x?: number, y?: number, z?: number): any
    export function forceX(x: number): any
    export function forceY(y: number): any
    export function forceZ(z: number): any
}
