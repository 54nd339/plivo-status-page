"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Service, ServiceStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EditServiceDialog from './EditServiceDialog';

export default function ServiceManagement() {
  const { organizationId } = useAuth(); // Get organizationId from context
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceStatus, setNewServiceStatus] = useState<ServiceStatus>('Operational');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    };

    const servicesCollection = collection(db, 'organizations', organizationId, 'services');
    const q = query(servicesCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(servicesData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching services: ", err);
      setError("Failed to load services.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newServiceName.trim() || !organizationId) return;
    try {
      const servicesCollection = collection(db, 'organizations', organizationId, 'services');
      await addDoc(servicesCollection, {
        name: newServiceName,
        status: newServiceStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      setNewServiceName('');
      setNewServiceStatus('Operational');
    } catch (error) {
      console.error("Error adding service: ", error);
      setError("Could not add the new service.");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setError(null);
    if (!organizationId) return;

    // Using a custom modal/dialog for confirmation is better than window.confirm
    // but for simplicity, we'll keep it. In a real app, build a confirmation dialog component.
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const serviceDoc = doc(db, 'organizations', organizationId, 'services', serviceId);
      await deleteDoc(serviceDoc);
    } catch (error) {
      console.error("Error deleting service: ", error);
      setError("Could not delete the service.");
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'Operational': return 'bg-green-500';
      case 'Degraded Performance': return 'bg-yellow-500';
      case 'Partial Outage': return 'bg-orange-500';
      case 'Major Outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <div>Loading services...</div>;
  if (!organizationId) return <div>Loading organization details...</div>;

  return (
    <>
      <div className="space-y-8">
        {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        <Card>
          <CardHeader><CardTitle>Add New Service</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddService} className="flex flex-col sm:flex-row gap-4">
              <Input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="e.g., Website, API" className="flex-grow" />
              <Select onValueChange={(value: ServiceStatus) => setNewServiceStatus(value)} defaultValue={newServiceStatus}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Degraded Performance">Degraded Performance</SelectItem>
                  <SelectItem value="Partial Outage">Partial Outage</SelectItem>
                  <SelectItem value="Major Outage">Major Outage</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">Add Service</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{service.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditingService(service)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteService(service.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className={`h-3 w-3 rounded-full ${getStatusColor(service.status)}`}></span>
                  <span className="font-semibold">{service.status}</span>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Last updated: {service.updatedAt?.toDate().toLocaleString()}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
        {services.length === 0 && !loading && <p>No services added yet.</p>}
      </div>

      {editingService && (
        <EditServiceDialog
          service={editingService}
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
        />
      )}
    </>
  );
}
