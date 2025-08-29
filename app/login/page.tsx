"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if user is already logged in
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // The useEffect will handle the redirect on user state change
    } catch (error) {
      console.error("Failed to sign in", error);
      setError("Failed to sign in. Please try again.");
    }
  };

  // Prevent rendering the login button if loading or user is logged in
  if (loading || user) {
    return <Spinner />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="p-8 bg-white rounded-lg shadow-md text-center w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
        <p className="text-gray-600 mb-6">Sign in to manage your services.</p>
        {error && (
          <Alert variant="destructive" className="mb-4 text-left">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleSignIn} className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
