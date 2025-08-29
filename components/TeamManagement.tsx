"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Organization, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

export default function TeamManagement() {
  const { organizationId, userProfile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const orgRef = doc(db, 'organizations', organizationId);
    const unsubscribe = onSnapshot(orgRef, async (docSnap) => {
      if (docSnap.exists()) {
        const orgData = { id: docSnap.id, ...docSnap.data() } as Organization;
        setOrganization(orgData);

        // Fetch member profiles
        const memberProfiles: UserProfile[] = [];
        for (const memberId of orgData.members) {
          const userRef = doc(db, 'users', memberId);
          const userSnap = await onSnapshot(userRef, (userDoc) => {
            if (userDoc.exists()) {
                // This is a bit inefficient for large teams, but fine for this scope.
                // A better approach for production would be a separate members sub-collection.
                const profile = userDoc.data() as UserProfile;
                const existingMemberIndex = memberProfiles.findIndex(m => m.uid === profile.uid);
                if (existingMemberIndex > -1) {
                    memberProfiles[existingMemberIndex] = profile;
                } else {
                    memberProfiles.push(profile);
                }
                setMembers([...memberProfiles]);
            }
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  const getPublicStatusPageUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/status/${organizationId}`;
    }
    return '';
  };

  const handleCopy = () => {
    const url = getPublicStatusPageUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <div>Loading team settings...</div>;
  if (!organization) return <div>Could not load organization details.</div>;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Public Status Page URL</CardTitle>
          <CardDescription>Share this link with your customers to view your service statuses.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={getPublicStatusPageUrl()} readOnly />
          <Button onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>These users have access to manage services and incidents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map(member => (
              <div key={member.uid} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                {organization.ownerId === member.uid && (
                  <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* Invitation UI would go here in a future step */}
        </CardContent>
      </Card>
    </div>
  );
}