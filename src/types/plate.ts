
import type { Timestamp } from "firebase/firestore";

// Note: This file should be renamed to equipment.ts for clarity.
// The types here refer to all types of equipment, not just plates.

export interface Equipment {
  id: string;
  name: string;
  category: string;
  totalManaged: number;
  ratePerDay: number;
  available: number;
  onRent: number;
  onMaintenance: number;
  photoUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const EQUIPMENT_CATEGORIES = [
  "Centering Plate",
  "Compactor",
  "Cutter",
  "Crane",
  "Other",
] as const;

export type EquipmentType = typeof EQUIPMENT_CATEGORIES[number];
