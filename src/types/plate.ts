export interface Plate {
  id: string;
  size: string;
  totalManaged: number;
  ratePerDay: number;
  available: number;
  onRent: number;
  onMaintenance: number;
  status: 'Available' | 'Not Available';
  photoUrl?: string;
}

export const PLATE_SIZES = [
  "300x300mm",
  "600x300mm",
  "600x600mm",
  "900x600mm",
  "1200x600mm",
  "1200x900mm",
] as const;

export type PlateSize = typeof PLATE_SIZES[number];
