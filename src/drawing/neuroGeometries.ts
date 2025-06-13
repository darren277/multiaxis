import {
    SphereGeometry,
    BoxGeometry,
    CylinderGeometry,
    MeshStandardMaterial
} from 'three';

// Geometries for neurotransmitters (can later be replaced with molecule models)
const neurotransmitterGeometries = {
    glutamate: new SphereGeometry(0.25, 12, 12),
    dopamine: new SphereGeometry(0.3, 10, 10),
    serotonin: new CylinderGeometry(0.2, 0.2, 0.4, 12),
    gaba: new BoxGeometry(0.3, 0.3, 0.3)
};

// Corresponding materials
const neurotransmitterMaterials = {
    glutamate: new MeshStandardMaterial({ color: 0xff6600 }),
    dopamine: new MeshStandardMaterial({ color: 0x3366ff }),
    serotonin: new MeshStandardMaterial({ color: 0xff99cc }),
    gaba: new MeshStandardMaterial({ color: 0x999999 })
};

// Geometries for receptor types
const receptorGeometries = {
    AMPA: new CylinderGeometry(0.3, 0.3, 0.6, 16),
    NMDA: new CylinderGeometry(0.4, 0.4, 0.5, 16),
    GABA_A: new BoxGeometry(0.5, 0.2, 0.2)
};

const receptorMaterials = {
    AMPA: new MeshStandardMaterial({ color: 0x33ff33 }),
    NMDA: new MeshStandardMaterial({ color: 0x00cccc }),
    GABA_A: new MeshStandardMaterial({ color: 0xffffff })
};

export const modelRegistry = {
    neurotransmitters: {
        geometries: neurotransmitterGeometries,
        materials: neurotransmitterMaterials
    },
    receptors: {
        geometries: receptorGeometries,
        materials: receptorMaterials
    }
};
