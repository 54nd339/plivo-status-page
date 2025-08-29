"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EditServiceDialogProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditServiceDialog({ service, isOpen, onClose }: EditServiceDialogProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Operational');
  const { organizationId } = useAuth();

  useEffect(() => {
    if (service) {
      setName(service.name);
      setStatus(service.status);
    }
  }, [service]);

  const handleUpdate = async () => {
    // Ensure we have the necessary data before proceeding
    if (!service || !organizationId) {
      console.error("Service or Organization ID is missing.");
      // Optionally, we can show an error message to the user
      return;
    }

    const serviceRef = doc(db, 'organizations', organizationId, 'services', service.id);

    try {
      await updateDoc(serviceRef, {
        name,
        status,
        updatedAt: Timestamp.now(),
      });
      onClose();
    } catch (error) {
      console.error("Error updating service: ", error);
      // Optionally, we can show an error message to the user
    }
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Degraded Performance">Degraded Performance</SelectItem>
                <SelectItem value="Partial Outage">Partial Outage</SelectItem>
                <SelectItem value="Major Outage">Major Outage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleUpdate}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}