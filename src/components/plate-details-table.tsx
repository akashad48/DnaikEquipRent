
"use client";

import type { Equipment } from '@/types/plate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Image as ImageIcon, AlertTriangle, Wrench } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface EquipmentDetailsTableProps {
  plates: Equipment[];
  activeFilter?: 'all' | 'maintenance';
  onEditPlate: (equipmentId: string) => void;
  onDeletePlate: (equipmentId: string) => void;
  onManageMaintenance: (equipment: Equipment) => void;
}

export default function PlateDetailsTable({
  plates: equipment,
  activeFilter = 'all',
  onEditPlate: onEditEquipment,
  onDeletePlate: onDeleteEquipment,
  onManageMaintenance,
}: EquipmentDetailsTableProps) {
  if (equipment.length === 0) {
    const isMaintenanceFilter = activeFilter === 'maintenance';
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed rounded-lg">
        {isMaintenanceFilter 
            ? <Wrench className="w-16 h-16 text-muted-foreground mb-4" /> 
            : <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        }
        <h3 className="text-xl font-semibold mb-2">
            {isMaintenanceFilter ? "No Equipment Under Maintenance" : "No Equipment Found"}
        </h3>
        <p className="text-muted-foreground">
            {isMaintenanceFilter ? "All equipment is currently operational." : "Add new equipment to see it listed here."}
        </p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Name / Model</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-right hidden md:table-cell">Total</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Rate/Day</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right hidden md:table-cell">On Rent</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right w-auto">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {equipment.map((item) => (
                <TableRow key={item.id}>
                    <TableCell>
                    {item.photoUrl ? (
                        <Image
                        src={item.photoUrl}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint="construction equipment"
                        />
                    ) : (
                        <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.category}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{item.totalManaged}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{item.ratePerDay.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">{item.available}</TableCell>
                    <TableCell className="text-right font-semibold hidden md:table-cell">{item.onRent}</TableCell>
                    <TableCell className="text-center">
                    <Badge variant={item.available > 0 ? 'default' : 'destructive'}>
                        {item.available > 0 ? "Available" : "Unavailable"}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onManageMaintenance(item)}
                        title="Manage Maintenance"
                        >
                        <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditEquipment(item.id)}
                        title="Edit"
                        >
                        <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteEquipment(item.id)}
                        title="Delete"
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
