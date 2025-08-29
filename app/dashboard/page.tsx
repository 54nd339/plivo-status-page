"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import ServiceManagement from '@/components/ServiceManagement';
import IncidentManagement from '@/components/IncidentManagement';
import TeamManagement from '@/components/TeamManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm sm:text-base truncate">
                Welcome, {user.displayName || user.email}
              </span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>
          <TabsContent value="incidents">
            <IncidentManagement />
          </TabsContent>
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>
        </Tabs>

      </div>
    </ProtectedRoute>
  );
}