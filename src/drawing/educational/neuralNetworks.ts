import * as THREE from 'three'

export abstract class Cell {
    cellType: string = 'Cell'
    color: string = '#ffffff'
    shape: THREE.Object3D | null = null
}

export interface ICell {
    new (): Cell

    cellType: string
    color: string
    shape: THREE.Object3D | null
}

export class InputCell extends Cell {
    cellType = 'InputCell'
    constructor() {
        super()
        this.color = '#ffff00'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class BackfedInputCell extends Cell {
    cellType = 'BackfedInputCell'
    constructor() {
        super()
        this.color = '#ffff00'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class NoisyInputCell extends Cell {
    cellType = 'NoisyInputCell'
    constructor() {
        super()
        this.color = '#ffff00'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class HiddenCell extends Cell {
    cellType = 'HiddenCell'
    constructor() {
        super()
        this.color = '#00ff00'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class ProbabilisticHiddenCell extends Cell {
    cellType = 'ProbabilisticHiddenCell'
    constructor() {
        super()
        this.color = '#00ff00'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class SpikingHiddenCell extends Cell {
    cellType = 'SpikingHiddenCell'
    constructor() {
        super()
        this.color = '#00ff00'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class CapsuleCell extends Cell {
    cellType = 'CapsuleCell'
    constructor() {
        super()
        this.color = '#00ff00'
        this.shape = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.5, 1, 16, 8),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class OutputCell extends Cell {
    cellType = 'OutputCell'
    constructor() {
        super()
        this.color = '#ff0000'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class MatchInputOutputCell extends Cell {
    cellType = 'MatchInputOutputCell'
    constructor() {
        super()
        this.color = '#ff0000'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class RecurrentCell extends Cell {
    cellType = 'RecurrentCell'
    constructor() {
        super()
        this.color = '#0000ff'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class MemoryCell extends Cell {
    cellType = 'MemoryCell'
    constructor() {
        super()
        this.color = '#0000ff'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class GatedMemoryCell extends Cell {
    cellType = 'GatedMemoryCell'
    constructor() {
        super()
        this.color = '#0000ff'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class Kernel extends Cell {
    cellType = 'Kernel'
    constructor() {
        super()
        this.color = '#800080'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export class Convolution extends Cell {
    cellType = 'Convolution'
    constructor() {
        super()
        this.color = '#800080'
        this.shape = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: this.color }),
        )
    }
}

export const CELL_MAP: { [key: string]: typeof Cell } = {
    input: InputCell,
    backfedInput: BackfedInputCell,
    noisyInput: NoisyInputCell,
    hidden: HiddenCell,
    probabilisticHidden: ProbabilisticHiddenCell,
    spikingHidden: SpikingHiddenCell,
    capsule: CapsuleCell,
    output: OutputCell,
    matchInputOutput: MatchInputOutputCell,
    recurrent: RecurrentCell,
    memory: MemoryCell,
    gatedMemory: GatedMemoryCell,
    kernel: Kernel,
    convolution: Convolution,
}
