
import type { Equipment } from '@/types/plate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, PackageCheck, Construction, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'maintenance';

interface EquipmentDashboardSummaryProps {
  plates: Equipment[];
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

const SummaryCard = ({ title, value, caption, icon: Icon, onClick, isActive }: {
  title: string;
  value: number | string;
  caption: string;
  icon: React.ElementType;
  onClick?: () => void;
  isActive?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={cn(
      "w-full text-left rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
      isActive && "ring-2 ring-primary",
      onClick && "hover:bg-accent/80"
    )}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </CardContent>
  </button>
);


export default function PlateDashboardSummary({ 
  plates: equipment,
  activeFilter = 'all',
  onFilterChange 
}: EquipmentDashboardSummaryProps) {
  const totalAvailable = equipment.reduce((sum, item) => sum + item.available, 0);
  const onRent = equipment.reduce((sum, item) => sum + item.onRent, 0);
  const totalManaged = equipment.reduce((sum, item) => sum + item.totalManaged, 0);
  const onMaintenance = equipment.reduce((sum, item) => sum + item.onMaintenance, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <SummaryCard
        title="Total Managed Equipment"
        value={totalManaged}
        caption="All items in inventory"
        icon={Construction}
        onClick={() => onFilterChange?.('all')}
        isActive={activeFilter === 'all'}
      />
       <SummaryCard
        title="Available at Warehouse"
        value={totalAvailable}
        caption="Currently in stock and ready"
        icon={Layers}
         onClick={() => onFilterChange?.('all')}
        isActive={activeFilter === 'all'}
      />
      <SummaryCard
        title="Equipment on Rent"
        value={onRent}
        caption="Currently rented out to clients"
        icon={PackageCheck}
      />
      <SummaryCard
        title="On Maintenance"
        value={onMaintenance}
        caption="Equipment being serviced"
        icon={Wrench}
        onClick={() => onFilterChange?.('maintenance')}
        isActive={activeFilter === 'maintenance'}
      />
    </div>
  );
}
