"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Organization } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Spinner from '@/components/Spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HomePage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "organizations"));
        const orgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization));
        setOrganizations(orgs);
      } catch (error) {
        console.error("Error fetching organizations: ", error);
        setError("Could not fetch public status pages. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner />
        <p className="mt-4 text-gray-600">Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          Welcome to Plivo Status
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Monitor the status of all your services in one place.
        </p>
        <Link href="/login">
          <Button size="lg">Organization Login</Button>
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Public Status Pages</h2>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link href={`/status/${org.id}`} key={org.id}>
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">View status page</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
