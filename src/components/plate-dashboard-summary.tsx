import type { Plate } from '@/types/plate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, PackageCheck, Construction } from 'lucide-react'; // PackageCheck for on rent, Construction for total

interface PlateDashboardSummaryProps {
  plates: Plate[];
}

export default function PlateDashboardSummary({ plates }: PlateDashboardSummaryProps) {
  const totalAvailablePlates = plates.reduce((sum, plate) => sum + plate.available, 0);
  const platesOnRent = plates.reduce((sum, plate) => sum + plate.onRent, 0);
  const totalManagedPlates = plates.reduce((sum, plate) => sum + plate.totalManaged, 0);


  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Managed Plates</CardTitle>
          <Construction className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalManagedPlates}</div>
          <p className="text-xs text-muted-foreground">All plates in inventory</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available at Warehouse</CardTitle>
          <Layers className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalAvailablePlates}</div>
          <p className="text-xs text-muted-foreground">Currently in stock and ready</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Plates on Rent</CardTitle>
          <PackageCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{platesOnRent}</div>
          <p className="text-xs text-muted-foreground">Currently rented out to clients</p>
        </CardContent>
      </Card>
    </div>
  );
}
