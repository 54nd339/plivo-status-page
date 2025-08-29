'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Incident, IncidentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { organizationId } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState<IncidentStatus>('Investigating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !organizationId) {
      if (!organizationId) setLoading(false);
      return;
    };

    const incidentId = Array.isArray(id) ? id[0] : id;
    const incidentDocRef = doc(db, 'organizations', organizationId, 'incidents', incidentId);

    const unsubscribe = onSnapshot(incidentDocRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as Incident;
        setIncident(data);
        setNewStatus(data.status); // Pre-fill status
        setError(null);
      } else {
        setError("Incident not found.");
        setIncident(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching incident:", err);
      setError("Failed to load incident data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, organizationId]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !organizationId) return;

    const incidentId = Array.isArray(id) ? id[0] : id;
    const incidentDocRef = doc(db, 'organizations', organizationId, 'incidents', incidentId);

    const newUpdatePayload = {
      id: crypto.randomUUID(),
      message: newMessage,
      status: newStatus,
      createdAt: Timestamp.now(),
    };

    try {
      await updateDoc(incidentDocRef, {
        updates: arrayUnion(newUpdatePayload),
        status: newStatus,
        updatedAt: Timestamp.now(),
        resolvedAt: newStatus === 'Resolved' ? Timestamp.now() : null,
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error adding update:", err);
      setError("Failed to add update.");
    }
  };

  if (loading) return <div>Loading incident details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!incident) return <div>Incident not found.</div>;

  return (
    <ProtectedRoute>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incidents
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Incident Details</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <h3 className="text-xl font-bold">{incident.title}</h3>
              <p><strong>Status:</strong> {incident.status}</p>
              <p><strong>Affected:</strong> {incident.affectedServices?.map(s => s.name).join(', ') || 'N/A'}</p>
              <p className="text-sm text-gray-500 pt-2">Created: {incident.createdAt.toDate().toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Post an Update</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="update-message">Update Message</Label>
                  <Textarea id="update-message" placeholder="What's the latest?" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} required />
                </div>
                <div>
                  <Label>Update Status</Label>
                  <Select onValueChange={(v: IncidentStatus) => setNewStatus(v)} value={newStatus}>
                    <SelectTrigger><SelectValue placeholder="Update Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Investigating">Investigating</SelectItem>
                      <SelectItem value="Identified">Identified</SelectItem>
                      <SelectItem value="Monitoring">Monitoring</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Add Update</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold mb-4">Timeline</h3>
          <div className="space-y-6 border-l-2 border-gray-200 ml-3">
            {incident.updates?.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((update, index) => (
              <div key={index} className="relative pl-8">
                <div className="absolute -left-3.5 top-1.5 w-6 h-6 bg-blue-500 rounded-full border-4 border-white"></div>
                <p className="font-bold text-lg">{update.status}</p>
                <p>{update.message}</p>
                <p className="text-sm text-gray-500 mt-1">{update.createdAt.toDate().toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

