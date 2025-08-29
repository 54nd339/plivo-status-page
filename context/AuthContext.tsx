"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthContextType, UserProfile } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await handleUserLogin(currentUser);
      } else {
        setUserProfile(null);
        setOrganizationId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUserLogin = async (firebaseUser: User) => {
    setLoading(true);
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User profile exists, load it
      const profile = userSnap.data() as UserProfile;
      setUserProfile(profile);
      setOrganizationId(profile.organizationId);
    } else {
      // First time login: create Organization and UserProfile
      const orgName = `${firebaseUser.displayName?.split(' ')[0]}'s Status Page`;
      const orgsCollection = collection(db, 'organizations');
      const newOrgRef = await addDoc(orgsCollection, {
        name: orgName,
        ownerId: firebaseUser.uid,
        members: [firebaseUser.uid],
      });

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        organizationId: newOrgRef.id,
      };

      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
      setOrganizationId(newProfile.organizationId);
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, loading, userProfile, organizationId, signInWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};