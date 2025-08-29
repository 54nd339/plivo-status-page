"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service, ServiceStatus, Incident, Organization } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useParams } from 'next/navigation';

export default function PublicStatusPage() {
  const { organizationId } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [resolvedIncidents, setResolvedIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const orgId = Array.isArray(organizationId) ? organizationId[0] : organizationId;

    // Fetch organization details
    const orgRef = doc(db, 'organizations', orgId);
    getDoc(orgRef).then(docSnap => {
      if (docSnap.exists()) {
        setOrganization({ id: docSnap.id, ...docSnap.data() } as Organization);
      }
      setLoading(false);
    });

    // Fetch services, active incidents, and resolved incidents from sub-collections
    const servicesUnsub = onSnapshot(query(collection(db, 'organizations', orgId, 'services'), orderBy('createdAt', 'desc')), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Service));
    });
    const activeIncidentsUnsub = onSnapshot(query(collection(db, 'organizations', orgId, 'incidents'), where('status', '!=', 'Resolved'), orderBy('status'), orderBy('createdAt', 'desc')), (snap) => {
      setActiveIncidents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Incident));
    });
    const resolvedIncidentsUnsub = onSnapshot(query(collection(db, 'organizations', orgId, 'incidents'), where('status', '==', 'Resolved'), orderBy('createdAt', 'desc')), (snap) => {
      setResolvedIncidents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Incident));
    });

    return () => {
      servicesUnsub();
      activeIncidentsUnsub();
      resolvedIncidentsUnsub();
    };
  }, [organizationId]);

  const getStatusColor = (status: ServiceStatus) => `text-${{
    'Operational': 'green-500', 'Degraded Performance': 'yellow-500',
    'Partial Outage': 'orange-500', 'Major Outage': 'red-500'
  }[status] || 'gray-500'}`;

  const getStatusIndicatorColor = (status: ServiceStatus) => `bg-${{
    'Operational': 'green-500', 'Degraded Performance': 'yellow-500',
    'Partial Outage': 'orange-500', 'Major Outage': 'red-500'
  }[status] || 'gray-500'}`;

  const overallStatus = () => {
    if (services.some(s => s.status === 'Major Outage')) return { text: 'Major Outage', color: 'bg-red-500' };
    if (services.some(s => s.status === 'Partial Outage')) return { text: 'Partial Outage', color: 'bg-orange-500' };
    if (services.some(s => s.status === 'Degraded Performance')) return { text: 'Degraded Performance', color: 'bg-yellow-500' };
    if (services.length > 0) return { text: 'All Systems Operational', color: 'bg-green-500' };
    return { text: 'Status Unknown', color: 'bg-gray-500' };
  };

  const statusInfo = overallStatus();

  const renderIncidentTimeline = (incident: Incident) => (
    <AccordionContent>
      <p className="mb-4"><strong>Impact:</strong> {incident.impact}</p>
      <div className="space-y-4">
        {incident.updates.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((update, index) => (
          <div key={index} className="flex space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              {index < incident.updates.length - 1 && <div className="w-px h-full bg-gray-300"></div>}
            </div>
            <div>
              <p className="font-semibold">{update.status}</p>
              <p>{update.message}</p>
              <p className="text-sm text-gray-500">{update.createdAt.toDate().toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </AccordionContent>
  );

  if (loading) return <div>Loading status page...</div>;
  if (!organization) return <div>This status page does not exist.</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold text-center mb-4">{organization.name}</h1>

      <Card className="mb-8"><CardHeader><div className="flex items-center justify-between">
        <CardTitle>Overall Status</CardTitle>
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${statusInfo.color}`}></div>
          <span className="font-semibold">{statusInfo.text}</span>
        </div></div></CardHeader>
      </Card>

      {activeIncidents.length > 0 && <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Incidents</h2>
        <Accordion type="single" collapsible className="w-full">
          {activeIncidents.map(incident => (
            <AccordionItem value={incident.id} key={incident.id}>
              <AccordionTrigger>{incident.title}</AccordionTrigger>
              {renderIncidentTimeline(incident)}
            </AccordionItem>
          ))}
        </Accordion>
      </div>}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">System Status</h2>
        <div className="space-y-4">
          {services.length > 0 ? (services.map((service) => (
            <Card key={service.id}><CardContent className="p-4 flex justify-between items-center">
              <span className="font-bold text-lg">{service.name}</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor(service.status)}`}></div>
                <span className={`font-semibold ${getStatusColor(service.status)}`}>{service.status}</span>
              </div></CardContent></Card>
          ))) : (<p>No services are being monitored currently.</p>)}
        </div>
      </div>

      {resolvedIncidents.length > 0 && <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Incident History</h2>
        <Accordion type="single" collapsible className="w-full">
          {resolvedIncidents.map(incident => (
            <AccordionItem value={incident.id} key={incident.id}>
              <AccordionTrigger>{incident.title} - <span className="font-light ml-2 text-gray-500">Resolved on {incident.resolvedAt?.toDate().toLocaleDateString()}</span></AccordionTrigger>
              {renderIncidentTimeline(incident)}
            </AccordionItem>
          ))}
        </Accordion>
      </div>}
    </div>
  );
}