
import type { Timestamp } from "firebase/firestore";

export interface Plate {
  id: string;
  size: string; // Consider making this PlateSize type if strictly controlled
  totalManaged: number;
  ratePerDay: number;
  available: number;
  onRent: number;
  onMaintenance: number;
  status: 'Available' | 'Not Available';
  photoUrl?: string;
  createdAt?: Timestamp; // Added for tracking
  updatedAt?: Timestamp; // Added for tracking
}

export const PLATE_SIZES = [
  "300x300mm",
  "600x300mm",
  "600x600mm",
  "900x600mm",
  "1200x600mm",
  "1200x900mm",
  // Add other common sizes or make this dynamic from DB in future
] as const;

export type PlateSize = typeof PLATE_SIZES[number];
