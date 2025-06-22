
import type { Timestamp } from "firebase/firestore";

export interface Equipment {
  id: string;
  name: string;
  category: string;
  totalManaged: number;
  ratePerDay: number;
  available: number;
  onRent: number;
  onMaintenance: number;
  status: 'Available' | 'Not Available';
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
