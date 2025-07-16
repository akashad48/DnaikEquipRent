
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
  customerName: string; 
  rentalAddress: string;
  items: RentalItem[];
  startDate: Timestamp;
  endDate?: Timestamp;
  advancePayment: number;
  payments?: PartialPayment[];
  totalCalculatedAmount?: number;
  totalPaidAmount: number;
  status: 'Active' | 'Payment Due' | 'Closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  runningBill?: number;
}
