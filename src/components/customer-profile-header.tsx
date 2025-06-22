
import type { Customer } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Home } from 'lucide-react';
import Image from 'next/image';

interface CustomerProfileHeaderProps {
  customer: Customer;
}

export default function CustomerProfileHeader({ customer }: CustomerProfileHeaderProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={customer.customerPhotoUrl} alt={customer.name} data-ai-hint="person face" />
            <AvatarFallback className="text-3xl">
              {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center md:text-left">
            <CardTitle className="text-3xl font-bold text-primary mb-2">{customer.name}</CardTitle>
            <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2 text-muted-foreground">
              <div className="flex items-center justify-center md:justify-start">
                <Phone className="mr-2 h-4 w-4" />
                <span>{customer.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start">
                <Home className="mr-2 h-4 w-4" />
                <span className="max-w-xs truncate">{customer.address}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {(customer.idProofUrl || customer.mediatorName) && (
        <CardContent className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {customer.idProofUrl && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">ID Proof</h4>
                <Image
                  src={customer.idProofUrl}
                  alt="ID Proof"
                  width={200}
                  height={125}
                  className="rounded-lg border object-cover"
                  data-ai-hint="document id"
                />
              </div>
            )}

            {customer.mediatorName && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Mediator Details</h4>
                <div className="flex items-center gap-4">
                  {customer.mediatorPhotoUrl && (
                       <Avatar className="h-16 w-16">
                          <AvatarImage src={customer.mediatorPhotoUrl} alt={customer.mediatorName} data-ai-hint="person face" />
                          <AvatarFallback>{customer.mediatorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                  )}
                  <div>
                      <p className="font-medium">{customer.mediatorName}</p>
                      <p className="text-sm text-muted-foreground">Mediator</p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </CardContent>
      )}
    </Card>
  );
}
