
import type { Equipment } from '@/types/plate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, PackageCheck, Construction } from 'lucide-react';

interface EquipmentDashboardSummaryProps {
  plates: Equipment[];
}

export default function PlateDashboardSummary({ plates: equipment }: EquipmentDashboardSummaryProps) {
  const totalAvailable = equipment.reduce((sum, item) => sum + item.available, 0);
  const onRent = equipment.reduce((sum, item) => sum + item.onRent, 0);
  const totalManaged = equipment.reduce((sum, item) => sum + item.totalManaged, 0);


  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Managed Equipment</CardTitle>
          <Construction className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalManaged}</div>
          <p className="text-xs text-muted-foreground">All items in inventory</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available at Warehouse</CardTitle>
          <Layers className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalAvailable}</div>
          <p className="text-xs text-muted-foreground">Currently in stock and ready</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipment on Rent</CardTitle>
          <PackageCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{onRent}</div>
          <p className="text-xs text-muted-foreground">Currently rented out to clients</p>
        </CardContent>
      </Card>
    </div>
  );
}
