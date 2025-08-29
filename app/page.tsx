"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Automatically redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show a loading state while checking authentication status
  if (loading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner />
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)] px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
        Welcome to Your Status Page
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600">
        A simple, powerful platform to monitor your services, manage incidents, and keep your users informed.
      </p>
      <div className="mt-8">
        <Link href="/dashboard">
          <Button size="lg">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}