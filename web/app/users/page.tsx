'use client';

import { useEffect, useState } from 'react';
import UserForm from '@/components/UserForm';
import UserTable from '@/components/UserTable';

type UserAssignment = {
  id: string;
  siteNameOrUrl: string;
  userName: string;
  role: string;
  organization: string;
  persona: string;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserAssignment[]>([]);

  async function loadUsers() {
    const res = await fetch('/api/users', { cache: 'no-store' });
    if (res.ok) {
      setUsers(await res.json());
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <div className="card">
          <h1>User Management</h1>
          <p style={{ marginTop: 8, color: '#94a3b8' }}>Add users into RACI groups and assign organization and persona metadata.</p>
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <UserForm onCreated={loadUsers} />
          <UserTable users={users} />
        </div>
      </div>
    </main>
  );
}
