"use client";

import { useState } from 'react';

type Props = {
  onCreated: () => void;
};

const roles = ['R', 'A', 'C', 'I'];

export default function UserForm({ onCreated }: Props) {
  const [siteNameOrUrl, setSiteNameOrUrl] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('R');
  const [organization, setOrganization] = useState('');
  const [persona, setPersona] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteNameOrUrl, userName, role, organization, persona }),
    });

    setSiteNameOrUrl('');
    setUserName('');
    setRole('R');
    setOrganization('');
    setPersona('');
    setIsSaving(false);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 16 }}>
      <h2>Add RACI User</h2>

      <label>
        Site Name / URL
        <input value={siteNameOrUrl} onChange={(event) => setSiteNameOrUrl(event.target.value)} required />
      </label>

      <label>
        User Name
        <input value={userName} onChange={(event) => setUserName(event.target.value)} required />
      </label>

      <label>
        Role (RACI)
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {roles.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>

      <label>
        Organization
        <input value={organization} onChange={(event) => setOrganization(event.target.value)} required />
      </label>

      <label>
        Persona
        <input value={persona} onChange={(event) => setPersona(event.target.value)} required />
      </label>

      <button type="submit" disabled={isSaving} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: '#22c55e', color: '#0f172a', fontWeight: 700 }}>
        {isSaving ? 'Saving…' : 'Add User'}
      </button>
    </form>
  );
}
