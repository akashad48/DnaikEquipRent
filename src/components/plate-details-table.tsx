
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
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface EquipmentDetailsTableProps {
  plates: Equipment[];
  onEditPlate: (equipmentId: string) => void;
  onDeletePlate: (equipmentId: string) => void;
  onToggleStatus: (equipmentId: string) => void;
}

export default function PlateDetailsTable({
  plates: equipment,
  onEditPlate: onEditEquipment,
  onDeletePlate: onDeleteEquipment,
  onToggleStatus,
}: EquipmentDetailsTableProps) {
  if (equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed rounded-lg">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Equipment Found</h3>
        <p className="text-muted-foreground">Add new equipment to see it listed here.</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Photo</TableHead>
              <TableHead>Name / Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Rate/Day (₹)</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">On Rent</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right w-[200px]">Actions</TableHead>
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
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">{item.totalManaged}</TableCell>
                <TableCell className="text-right">{item.ratePerDay.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{item.available}</TableCell>
                <TableCell className="text-right font-semibold">{item.onRent}</TableCell>
                <TableCell className="text-center">
                   <Badge variant={item.status === 'Available' ? 'default' : 'destructive'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Switch
                      checked={item.status === 'Available'}
                      onCheckedChange={() => onToggleStatus(item.id)}
                      aria-label={`Toggle status for ${item.name}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditEquipment(item.id)}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeleteEquipment(item.id)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
