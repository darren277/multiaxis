import { Library, Resource } from './types';

// ────────────────────────────────────────────────────────────────────────────
// Library‑layout helpers
// ────────────────────────────────────────────────────────────────────────────
const SHELVES_PER_CASE = 6;

// Distance between the centres of two neighbouring cases.
export function casePitchX(lib: Library)  {       // centre‑to‑centre distance in X
  return lib.bookcase.width + lib.spaceBetweenCases;
}

// Distance between the centres of two neighbouring rows (z direction).
export function rowPitchZ(lib: Library)   {       // centre‑to‑centre distance in Z
  return lib.bookcase.depth + lib.spaceBetweenRows;
}

export function worldX(row1StartX: number, lib: Library, caseIdx: number) { return row1StartX + caseIdx * casePitchX(lib); }

export function worldZ(row0StartZ: number, lib: Library, rowIdx: number)  { return row0StartZ + rowIdx  * rowPitchZ(lib); }

// Convert  (row, case, shelf)  →  world‑space coordinate that matches the
// positions produced in createBookCases().
function shelfToWorld(row1StartX: number, row0StartZ: number, library: Library, rowIdx: number, caseIdx: number, shelfIdx: number) {
    // ── X  (left ↔ right) ────────────────────────────────────────────────────
    const x = worldX(row1StartX, library, caseIdx);

    // ── Z  (front ↔ back) ────────────────────────────────────────────────────
    // Row 0 is closest to the camera (positive z), successive rows move back.
    const z = worldZ(row0StartZ, library, rowIdx);

    // ── Y  (height) ──────────────────────────────────────────────────────────
    // Book‑case centres sit at y = bookcase.height/2 (you pass y_pos = 5 for a 10‑unit case).
    const shelfHeight = library.bookcase.height / SHELVES_PER_CASE;
    const yBase = shelfHeight / 2;                 // centre of bottom shelf
    const y = yBase + shelfIdx * shelfHeight;

    return { x, y, z };
}

// Map an evenly‑spaced “slot” to  (row, case, shelf). Usable for any #resources.
function slotToAddress(slot: number, library: Library) {
    const casesPerRow = library.numberOfCases;
    const shelvesPerRow = casesPerRow * SHELVES_PER_CASE;

    const rowIdx        = Math.floor(slot / shelvesPerRow);
    const withinRow     = slot % shelvesPerRow;
    const caseIdx       = Math.floor(withinRow / SHELVES_PER_CASE);
    const shelfIdx      = withinRow % SHELVES_PER_CASE;

    return { rowIdx, caseIdx, shelfIdx };
}

/**
 * Even‑spacing algorithm.
 *
 * @param {Object} resource      – the resource object (not used yet, reserved for future smart placement)
 * @param {Object} library       – DATA.library
 * @param {Number} row1StartX    – x coordinate of the first row (leftmost)
 * @param {Number} row0StartZ    – z coordinate of the first row (closest to camera)
 * @param {Number} i             – zero‑based index of this resource in the final, *already sorted* array
 * @param {Number} n             – total number of resources being placed
 * @returns {{x:Number, y:Number, z:Number}}
 */
export function calculatePositionOfResource(resource: Resource, library: Library, row1StartX: number, row0StartZ: number, i: number, n: number) {
    const totalShelves = library.numberOfRows * library.numberOfCases * SHELVES_PER_CASE;

    // Evenly distribute the resources along the shelf indices [0 … totalShelves‑1].
    // With 1 resource go straight to slot 0, with >1 space them linearly.
    const slot = n === 1 ? 0 : Math.round(i * (totalShelves - 1) / (n - 1));

    const { rowIdx, caseIdx, shelfIdx } = slotToAddress(slot, library);
    return shelfToWorld(row1StartX, row0StartZ, library, rowIdx, caseIdx, shelfIdx);
}
