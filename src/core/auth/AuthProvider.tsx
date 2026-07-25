import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRoleCode } from './types';

interface AuthContextType {
  user: { id: string; username: string } | null;
  profile: UserProfile | null;
  roles: UserRoleCode[];
  permissions: string[];
  isLoading: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
  bypassAuthAsOwner: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy Profile Owner untuk bypass / pengujian awal tanpa barrier login email
const DUMMY_OWNER_PROFILE: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Owner GG Product OS',
  email: 'owner@ggproductos.internal',
  is_active: true,
  job_title: 'Owner & Super Admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; username: string } | null>({
    id: DUMMY_OWNER_PROFILE.id,
    username: 'owner',
  });
  const [profile, setProfile] = useState<UserProfile | null>(DUMMY_OWNER_PROFILE);
  const [roles, setRoles] = useState<UserRoleCode[]>(['owner']);
  const [permissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Mode Bypass Login Aktif: Langsung menganggap sesi sebagai Owner aktif
    setIsLoading(false);
  }, []);

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const bypassAuthAsOwner = () => {
    setUser({ id: DUMMY_OWNER_PROFILE.id, username: 'owner' });
    setProfile(DUMMY_OWNER_PROFILE);
    setRoles(['owner']);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        permissions,
        isLoading,
        isOwner: true,
        signOut,
        bypassAuthAsOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
