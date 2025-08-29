"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there is no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // If loading, show a loading indicator
  if (loading) {
    return <div>Loading...</div>; // Or a more sophisticated spinner
  }

  // If there is a user, render the children components
  if (user) {
    return <>{children}</>;
  }

  // If no user and not loading (should be redirected, but as a fallback)
  return null;
};

export default ProtectedRoute;