
import type { Timestamp } from "firebase/firestore";
import type { PlateSize } from "./plate";

export interface RentalItem {
  plateId: string; // Reference to the specific document in 'plates' collection
  plateSize: PlateSize;
  quantity: number;
  ratePerDay: number; // Rate at the time of rental
}

export interface Rental {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  rentalAddress: string;
  items: RentalItem[];
  startDate: Timestamp;
  endDate?: Timestamp;
  advancePayment: number;
  totalCalculatedAmount?: number; // Calculated upon return
  totalPaidAmount: number;
  status: 'Active' | 'Payment Due' | 'Closed'; // 'Closed' means returned and fully paid
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export const RENTAL_COLLECTION = "rentals";
