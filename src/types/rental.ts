
import type { Timestamp } from "firebase/firestore";

export interface RentalItem {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  ratePerDay: number;
}

export interface PartialPayment {
  amount: number;
  date: Timestamp;
  notes?: string;
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
  payments?: PartialPayment[];
  totalCalculatedAmount?: number; // Calculated upon return
  totalPaidAmount: number;
  status: 'Active' | 'Payment Due' | 'Closed'; // 'Closed' means returned and fully paid
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export const RENTAL_COLLECTION = "rentals";
