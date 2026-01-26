// ============================================================
// INTERFACES - Data structure definitions
// ============================================================

/** Represents a single pole on the map */
export interface Pole {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  rotation: number; // Rotation angle in degrees (0 = north)
  createdAt: string;
}

/** Represents a canton (polyline connecting poles) */
export interface Canton {
  id: string;
  poleIds: string[]; // Array of pole IDs forming the polyline
  createdAt: string;
}

/** Application state for persistence */
export interface Project {
  poles: Pole[];
  cantons: Canton[];
}
