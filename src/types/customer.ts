
import type { Timestamp } from "firebase/firestore";

export interface Customer {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  idProofUrl: string;
  customerPhotoUrl: string;
  mediatorName?: string;
  mediatorPhotoUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
