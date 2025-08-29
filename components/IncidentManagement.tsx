"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Incident, IncidentImpact, IncidentStatus, Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function IncidentManagement() {
  const { organizationId } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState<IncidentImpact>('Minor');
  const [message, setMessage] = useState('');
  const [affectedServices, setAffectedServices] = useState<string[]>([]);
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>('Investigating');

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    };

    // Fetch services for the multi-select from the nested collection
    const servicesUnsub = onSnapshot(collection(db, 'organizations', organizationId, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
    }, (err) => {
      console.error("Error fetching services:", err);
      setError("Failed to load services for selection.");
    });

    // Fetch incidents from the nested collection
    const incidentsCollection = collection(db, 'organizations', organizationId, 'incidents');
    const q = query(incidentsCollection, orderBy('createdAt', 'desc'));
    const incidentsUnsub = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Incident[]);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching incidents:", err);
      setError("Failed to load incidents.");
      setLoading(false);
    });

    return () => {
      servicesUnsub();
      incidentsUnsub();
    };
  }, [organizationId]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !message.trim() || !organizationId) return;

    const selectedServices = services.filter(s => affectedServices.includes(s.id)).map(s => ({ id: s.id, name: s.name }));
    const incidentsCollection = collection(db, 'organizations', organizationId, 'incidents');

    try {
      await addDoc(incidentsCollection, {
        title, impact, status: incidentStatus,
        affectedServices: selectedServices,
        createdAt: Timestamp.now(),
        updates: [{
          id: crypto.randomUUID(), message, status: incidentStatus, createdAt: Timestamp.now()
        }]
      });
      // Reset form
      setTitle(''); setImpact('Minor'); setMessage('');
      setAffectedServices([]); setIncidentStatus('Investigating');
    } catch (error) {
      console.error("Error creating incident:", error);
      setError("Failed to create incident. Please try again.");
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setAffectedServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  if (loading) return <div>Loading incidents...</div>;
  if (!organizationId) return <div>Loading organization details...</div>;

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader><CardTitle>Create New Incident</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <Input placeholder="Incident Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select onValueChange={(v: IncidentImpact) => setImpact(v)} defaultValue={impact}><SelectTrigger><SelectValue placeholder="Select Impact" /></SelectTrigger><SelectContent>
                <SelectItem value="Critical">Critical</SelectItem><SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Minor">Minor</SelectItem><SelectItem value="None">None</SelectItem>
              </SelectContent></Select>
              <Select onValueChange={(v: IncidentStatus) => setIncidentStatus(v)} defaultValue={incidentStatus}><SelectTrigger><SelectValue placeholder="Set Status" /></SelectTrigger><SelectContent>
                <SelectItem value="Investigating">Investigating</SelectItem><SelectItem value="Identified">Identified</SelectItem>
                <SelectItem value="Monitoring">Monitoring</SelectItem><SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent></Select>
            </div>
            <div>
              <Label>Affected Services</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 p-4 border rounded-md">
                {services.map(service => (<div key={service.id} className="flex items-center space-x-2">
                  <Checkbox id={service.id} checked={affectedServices.includes(service.id)} onCheckedChange={() => handleServiceToggle(service.id)} />
                  <Label htmlFor={service.id}>{service.name}</Label>
                </div>))}
              </div>
            </div>
            <Textarea placeholder="Update message..." value={message} onChange={e => setMessage(e.target.value)} required />
            <Button type="submit">Create Incident</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-2xl font-bold mb-4">Incidents</h3>
        {incidents.map(incident => (
          <Link href={`/dashboard/incidents/${incident.id}`} key={incident.id}>
            <Card className="mb-4 hover:bg-gray-50 transition-colors">
              <CardHeader><CardTitle>{incident.title}</CardTitle></CardHeader>
              <CardContent>
                <p><strong>Status:</strong> {incident.status}</p>
                <p><strong>Impact:</strong> {incident.impact}</p>
                <p><strong>Affected:</strong> {incident.affectedServices.map(s => s.name).join(', ')}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
