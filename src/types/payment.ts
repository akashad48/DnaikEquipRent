
import type { Timestamp } from "firebase/firestore";

export interface Payment {
  id: string;
  rentalId: string;
  customerId: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMethod?: 'Cash' | 'Online' | 'Cheque';
  notes?: string;
  createdAt: Timestamp;
}

export const PAYMENT_COLLECTION = "payments";
