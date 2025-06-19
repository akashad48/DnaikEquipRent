
import type { Timestamp } from "firebase/firestore";

export interface Customer {
  id: string;
  name: string;
  address: string;
  phoneNumber: string; // Added phone number as it's common
  idProofUrl: string; // URL to the ID proof image
  customerPhotoUrl: string; // URL to the customer's photo
  mediatorName?: string;
  mediatorPhotoUrl?: string; // URL to the mediator's photo
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // lastRentalStatus?: 'Active' | 'Closed' | 'Payment Due' | 'N/A'; // For future use
}

export const CUSTOMER_COLLECTION = "customers";
