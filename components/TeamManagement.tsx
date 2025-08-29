"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Organization, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TeamManagement() {
  const { organizationId, userProfile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          onSnapshot(userRef, (userDoc) => {
            if (userDoc.exists()) {
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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!inviteEmail || !organizationId || !organization) {
      setError("Please enter a valid email.");
      return;
    }

    // Check if user is already a member
    const isAlreadyMember = members.some(member => member.email === inviteEmail);
    if (isAlreadyMember) {
        setError("User is already a member of this organization.");
        return;
    }

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", inviteEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setError("User with this email does not exist.");
      return;
    }

    const userToInviteDoc = querySnapshot.docs[0];
    const userToInvite = userToInviteDoc.data() as UserProfile;
    
    const orgRef = doc(db, 'organizations', organizationId);
    const userRef = doc(db, 'users', userToInvite.uid);

    try {
      // Add user to the organization's members array
      await updateDoc(orgRef, {
        members: arrayUnion(userToInvite.uid)
      });
      
      // Update the user's organizationId
      await updateDoc(userRef, {
        organizationId: organizationId
      });

      setSuccess(`${userToInvite.displayName} has been added to the team.`);
      setInviteEmail('');
    } catch (err) {
      setError("Failed to add user to the team.");
      console.error(err);
    }
  };


  if (loading) return <div>Loading team settings...</div>;
  if (!organization) return <div>Could not load organization details.</div>;

  return (
    <div className="space-y-8">
       {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertTitle>Success</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
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
              <CardTitle>Invite New Member</CardTitle>
              <CardDescription>Enter the email of the user you want to invite to your organization.</CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleInviteMember} className="flex gap-2">
                  <Input
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                  />
                  <Button type="submit">Invite User</Button>
              </form>
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
        </CardContent>
      </Card>
    </div>
  );
}