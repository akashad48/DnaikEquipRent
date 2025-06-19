"use client";

import type { Plate } from '@/types/plate';
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

interface PlateDetailsTableProps {
  plates: Plate[];
  onEditPlate: (plateId: string) => void;
  onDeletePlate: (plateId: string) => void;
  onToggleStatus: (plateId: string) => void;
}

export default function PlateDetailsTable({
  plates,
  onEditPlate,
  onDeletePlate,
  onToggleStatus,
}: PlateDetailsTableProps) {
  if (plates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed rounded-lg">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Plates Found</h3>
        <p className="text-muted-foreground">Add a new plate to see it listed here.</p>
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
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Rate/Day (₹)</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">On Rent</TableHead>
              <TableHead className="text-right">Maintenance</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plates.map((plate) => (
              <TableRow key={plate.id}>
                <TableCell>
                  {plate.photoUrl ? (
                    <Image
                      src={plate.photoUrl}
                      alt={plate.size}
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
                <TableCell className="font-medium">{plate.size}</TableCell>
                <TableCell className="text-right">{plate.totalManaged}</TableCell>
                <TableCell className="text-right">{plate.ratePerDay.toFixed(2)}</TableCell>
                <TableCell className="text-right text-green-600 font-semibold">{plate.available}</TableCell>
                <TableCell className="text-right text-orange-600 font-semibold">{plate.onRent}</TableCell>
                <TableCell className="text-right text-red-600 font-semibold">{plate.onMaintenance}</TableCell>
                <TableCell className="text-center">
                   <Badge variant={plate.status === 'Available' ? 'default' : 'destructive'} className={plate.status === 'Available' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                    {plate.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Switch
                      checked={plate.status === 'Available'}
                      onCheckedChange={() => onToggleStatus(plate.id)}
                      aria-label={`Toggle status for ${plate.size}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditPlate(plate.id)}
                      aria-label={`Edit ${plate.size}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeletePlate(plate.id)}
                      aria-label={`Delete ${plate.size}`}
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

// Need to add Card and CardContent to imports if not already there
import { Card, CardContent } from '@/components/ui/card';
