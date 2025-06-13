import { BoxGeometry, MeshBasicMaterial, SphereGeometry } from 'three';

/**
 * Each section of this config can be swapped with a different config if you want a different "look" or different geometry types, fonts, etc.
 */

export default {
    fontUrl: '/threejs/drawing/helvetiker_regular.typeface.json',

    surroundingBox: {
        geometry: (xSize: number | undefined, ySize: number | undefined, zSize: number | undefined) => new BoxGeometry(xSize, ySize, zSize),
        material: () => new MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.1,
        }),
    },

    axis: {
        // Optionally store geometry “factory” functions by axis label
        geometry: (axisLabel: string, axisLength: number | undefined) => {
            if (axisLabel === 'x') {
                return new BoxGeometry(axisLength, 0.1, 0.1);
            } else if (axisLabel === 'y') {
                return new BoxGeometry(0.1, axisLength, 0.1);
            } else {
                return new BoxGeometry(0.1, 0.1, axisLength);
            }
        },
        material: () => new MeshBasicMaterial({ color: 0x00ff00 }),
    },

    axisLabels: {
        // For textual labels on the axes
        size: 1,
        depth: 0.01,
        material: (label: any) => new MeshBasicMaterial({ color: 0x00ff00 }),
        // If you wanted different colors for x, y, z labels, you might define a function
        // material: (axisLabel) => new MeshBasicMaterial({
        //   color: (axisLabel === 'x' ? 0xff0000 : 0x00ff00)
        // }),
    },

    axisTicks: {
        geometry: () => new BoxGeometry(0.1, 0.1, 0.1),
        material: () => new MeshBasicMaterial({ color: 0x00ffff }),
    },

    points: {
        geometry: (pointData: { size: number; }[]) => {
            // If you want to pick geometry by some attribute in the point data, do so here.
            // By default, just always use a sphere:
            const size = pointData[4]?.size ?? 0.1;
            return new SphereGeometry(size);
        },
        material: (pointData: any[]) => {
            // Color from the point data
            const color = pointData[3];
            return new MeshBasicMaterial({ color });
        },
    },

    pointLabels: {
        size: (pointData: { size: any; }[]) => (pointData[4]?.size ?? 1), // maybe the label text size depends on the point size
        depth: 0.01,
        material: (pointData: any[]) => {
            // Reuse the point’s color or pick something else
            return new MeshBasicMaterial({ color: pointData[3] });
        },
    },
};
