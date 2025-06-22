
import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import type { Equipment } from '@/types/plate';
import { subDays, subMonths } from 'date-fns';

export const mockTimestamp = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});


// MOCK EQUIPMENT
export const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: 'plate1',
    category: 'Centering Plate',
    name: '600x300mm',
    totalManaged: 500,
    ratePerDay: 10,
    available: 0, onRent: 0, onMaintenance: 0, // Will be calculated
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png',
    createdAt: mockTimestamp(new Date('2023-01-10T10:00:00Z')) as any, 
    updatedAt: mockTimestamp(new Date('2023-01-15T11:00:00Z')) as any,
  },
  {
    id: 'plate2',
    category: 'Centering Plate',
    name: '1200x600mm',
    totalManaged: 250,
    ratePerDay: 20,
    available: 0, onRent: 0, onMaintenance: 0,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png',
    createdAt: mockTimestamp(new Date('2023-02-05T09:30:00Z')) as any,
    updatedAt: mockTimestamp(new Date('2023-02-20T14:00:00Z')) as any,
  },
   {
    id: 'plate3',
    category: 'Centering Plate',
    name: '900x600mm',
    totalManaged: 350,
    ratePerDay: 15,
    available: 0, onRent: 0, onMaintenance: 0,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png',
    createdAt: mockTimestamp(new Date('2023-03-01T12:00:00Z')) as any,
    updatedAt: mockTimestamp(new Date('2023-03-10T16:45:00Z')) as any,
  },
  {
    id: 'compactor1',
    category: 'Compactor',
    name: 'Soil Compactor',
    totalManaged: 15,
    ratePerDay: 1500,
    available: 0, onRent: 0, onMaintenance: 0,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png',
    createdAt: mockTimestamp(new Date('2023-04-01T12:00:00Z')) as any,
    updatedAt: mockTimestamp(new Date('2023-04-10T16:45:00Z')) as any,
  },
  {
    id: 'crane1',
    category: 'Crane',
    name: 'Hoist Crane',
    totalManaged: 5,
    ratePerDay: 3000,
    available: 0, onRent: 0, onMaintenance: 0,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png',
    createdAt: mockTimestamp(new Date('2023-05-01T12:00:00Z')) as any,
    updatedAt: mockTimestamp(new Date('2023-05-10T16:45:00Z')) as any,
  },
];


// MOCK CUSTOMERS
export const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 35 }, (_, i) => {
    const creationDate = subDays(new Date(), Math.floor(Math.random() * 365));
    return {
        id: `cust${i + 1}`,
        name: `Customer ${i + 1}`,
        address: `${i + 1} Analytics Ave`,
        phoneNumber: `555-01${String(i).padStart(2, '0')}`,
        idProofUrl: 'https://placehold.co/300x200.png',
        customerPhotoUrl: `https://placehold.co/150x150.png?text=C${i + 1}`,
        createdAt: mockTimestamp(creationDate),
        updatedAt: mockTimestamp(new Date()),
    };
});

// MOCK RENTALS
export const MOCK_RENTALS: Rental[] = [];

// Generate more realistic rentals
MOCK_CUSTOMERS.forEach(customer => {
    const numRentals = Math.ceil(Math.random() * 5); // Each customer has 1 to 5 rentals
    for (let i = 0; i < numRentals; i++) {
        const equipmentSelection = MOCK_EQUIPMENT.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(Math.random() * 2));
        const startDate = subDays(new Date(), Math.floor(Math.random() * 365));
        const rentalDuration = Math.ceil(Math.random() * 45) + 5; // 5 to 50 days
        
        let endDate: Date | undefined = subDays(startDate, -rentalDuration);
        if (Math.random() < 0.2) { // 20% are active
            endDate = undefined;
        }

        const items = equipmentSelection.map(item => ({
            equipmentId: item.id,
            equipmentName: item.name,
            quantity: Math.ceil(Math.random() * (item.totalManaged / 20)),
            ratePerDay: item.ratePerDay,
        }));
        
        const totalCalculatedAmount = endDate ? items.reduce((sum, item) => sum + item.quantity * item.ratePerDay * rentalDuration, 0) : undefined;
        const advancePayment = totalCalculatedAmount ? totalCalculatedAmount * (Math.random() * 0.3) : 500;
        
        let paymentMade = advancePayment;
        if (totalCalculatedAmount) {
             paymentMade += totalCalculatedAmount * (0.3 + Math.random() * 0.6);
        }

        const totalPaidAmount = Math.min(totalCalculatedAmount || Infinity, paymentMade);

        let status: Rental['status'] = 'Active';
        if (endDate) {
            status = (totalCalculatedAmount || 0) > totalPaidAmount ? 'Payment Due' : 'Closed';
        }

        MOCK_RENTALS.push({
            id: `rental${MOCK_RENTALS.length + 1}`,
            customerId: customer.id,
            customerName: customer.name,
            rentalAddress: `Site ${MOCK_RENTALS.length + 1}`,
            items,
            startDate: mockTimestamp(startDate),
            endDate: endDate ? mockTimestamp(endDate) : undefined,
            advancePayment,
            payments: [{ amount: advancePayment, date: mockTimestamp(startDate), notes: 'Advance' }],
            totalCalculatedAmount,
            totalPaidAmount: Math.round(totalPaidAmount),
            status,
            createdAt: mockTimestamp(startDate),
            updatedAt: mockTimestamp(endDate || new Date()),
        });
    }
});


// Calculate available/onRent for equipment based on rentals
const equipmentUsage = MOCK_RENTALS.filter(r => r.status === 'Active').flatMap(r => r.items).reduce((acc, item) => {
    acc[item.equipmentId] = (acc[item.equipmentId] || 0) + item.quantity;
    return acc;
}, {} as Record<string, number>);

MOCK_EQUIPMENT.forEach(item => {
    const onRent = equipmentUsage[item.id] || 0;
    item.onRent = onRent;
    item.available = item.totalManaged - onRent - item.onMaintenance;
    if (item.available < 0) item.available = 0; // cannot be negative
});

// Single customer for profile/invoice pages to ensure data exists
export const MOCK_SINGLE_CUSTOMER = MOCK_CUSTOMERS[0];
export const MOCK_SINGLE_CUSTOMER_RENTALS = MOCK_RENTALS.filter(r => r.customerId === MOCK_SINGLE_CUSTOMER.id);
if (MOCK_SINGLE_CUSTOMER_RENTALS.length > 0) {
    if (MOCK_SINGLE_CUSTOMER_RENTALS.find(r => r.status === 'Active')) {
        MOCK_SINGLE_CUSTOMER_RENTALS.find(r => r.status === 'Active')!.status = 'Active';
    }
    if (MOCK_SINGLE_CUSTOMER_RENTALS.find(r => r.status !== 'Active' && r.status !== 'Payment Due')) {
       const rentalToChange = MOCK_SINGLE_CUSTOMER_RENTALS.find(r => r.status === 'Closed');
       if (rentalToChange) {
           rentalToChange.status = 'Payment Due';
           rentalToChange.totalPaidAmount = rentalToChange.totalCalculatedAmount! / 2;
       }
    }
}
