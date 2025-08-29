import { User as FirebaseUser } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

// --- Authentication & Users ---
export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  userProfile: UserProfile | null;
  organizationId: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
}

// --- Organization ---
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
}

// --- Services ---
export type ServiceStatus = "Operational" | "Degraded Performance" | "Partial Outage" | "Major Outage";

export interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- Incidents ---
export type IncidentStatus = "Investigating" | "Identified" | "Monitoring" | "Resolved";
export type IncidentImpact = "Critical" | "Major" | "Minor" | "None";

export interface IncidentUpdate {
  id: string;
  message: string;
  status: IncidentStatus;
  createdAt: Timestamp;
}

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  affectedServices: { id: string; name: string }[];
  updates: IncidentUpdate[];
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}
