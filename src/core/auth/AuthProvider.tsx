import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRoleCode } from './types';

export interface UserPermissions {
  create: boolean;
  monitor: boolean;
  brief: boolean;
  supplier: boolean;
  hpp: boolean;
  sample: boolean;
  size: boolean;
  approve: boolean;
  access: boolean;
}

export interface UserSimulated {
  id: string;
  name: string;
  ini: string;
  role: string;
  title: string;
  active: boolean;
  p: UserPermissions;
}

interface AuthContextType {
  user: { id: string; username: string } | null;
  currentUser: UserSimulated;
  users: UserSimulated[];
  profile: UserProfile | null;
  roles: UserRoleCode[];
  permissions: string[];
  isLoading: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
  bypassAuthAsOwner: () => void;
  switchUser: (userId: string) => void;
  updateUserPermissions: (userId: string, permissionKey: keyof UserPermissions, value: boolean) => void;
  updateUserActive: (userId: string, active: boolean) => void;
  addUser: (name: string, role: string) => void;
}

const DEFAULT_USERS: UserSimulated[] = [
  {
    id: 'u1',
    name: 'Gugun Gunawan',
    ini: 'GG',
    role: 'Owner',
    title: 'Strategi, Sistem & Pengembangan Bisnis',
    active: true,
    p: { create: true, monitor: true, brief: true, supplier: true, hpp: true, sample: true, size: true, approve: true, access: true },
  },
  {
    id: 'u2',
    name: 'Dodi Awaludin',
    ini: 'DA',
    role: 'Product Lead',
    title: 'Finalisasi Artikel & Relasi Mitra',
    active: true,
    p: { create: true, monitor: false, brief: true, supplier: true, hpp: true, sample: true, size: false, approve: false, access: false },
  },
  {
    id: 'u3',
    name: 'Yadi',
    ini: 'YD',
    role: 'Production Lead',
    title: 'Sampling, Pola & Standardisasi',
    active: true,
    p: { create: false, monitor: false, brief: false, supplier: false, hpp: true, sample: true, size: true, approve: false, access: false },
  },
  {
    id: 'u4',
    name: 'Syaikhu',
    ini: 'SY',
    role: 'Sourcing & Admin',
    title: 'Supplier, Finishing & Dokumentasi',
    active: true,
    p: { create: false, monitor: false, brief: false, supplier: true, hpp: true, sample: true, size: true, approve: false, access: false },
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserSimulated[]>(() => {
    const saved = localStorage.getItem('gg_workspace_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('gg_workspace_current_user') || 'u1';
  });

  const [isLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('gg_workspace_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gg_workspace_current_user', currentUserId);
  }, [currentUserId]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const isOwner = currentUser.p.monitor || currentUser.role.toLowerCase() === 'owner';

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  const updateUserPermissions = (userId: string, permissionKey: keyof UserPermissions, value: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, p: { ...u.p, [permissionKey]: value } } : u
      )
    );
  };

  const updateUserActive = (userId: string, active: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active } : u))
    );
  };

  const addUser = (name: string, role: string) => {
    const ini = name
      .split(' ')
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newUser: UserSimulated = {
      id: `u${Date.now()}`,
      name,
      ini,
      role,
      title: role,
      active: true,
      p: { create: false, monitor: false, brief: false, supplier: false, hpp: false, sample: false, size: false, approve: false, access: false },
    };

    setUsers((prev) => [...prev, newUser]);
  };

  const signOut = async () => {
    setCurrentUserId('u1');
  };

  const bypassAuthAsOwner = () => {
    setCurrentUserId('u1');
  };

  const profile: UserProfile = {
    id: currentUser.id,
    full_name: currentUser.name,
    email: `${currentUser.ini.toLowerCase()}@ggproductos.internal`,
    is_active: currentUser.active,
    job_title: currentUser.title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const roles: UserRoleCode[] = isOwner ? ['owner'] : ['product_lead'];

  return (
    <AuthContext.Provider
      value={{
        user: { id: currentUser.id, username: currentUser.ini.toLowerCase() },
        currentUser,
        users,
        profile,
        roles,
        permissions: [],
        isLoading,
        isOwner,
        signOut,
        bypassAuthAsOwner,
        switchUser,
        updateUserPermissions,
        updateUserActive,
        addUser,
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
