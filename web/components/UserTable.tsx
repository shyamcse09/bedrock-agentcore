type UserAssignment = {
  id: string;
  siteNameOrUrl: string;
  userName: string;
  role: string;
  organization: string;
  persona: string;
  createdAt: string;
};

type Props = {
  users: UserAssignment[];
};

export default function UserTable({ users }: Props) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h2>User Assignments</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#cbd5e1' }}>
            <th style={{ padding: '12px 10px' }}>Site</th>
            <th style={{ padding: '12px 10px' }}>User</th>
            <th style={{ padding: '12px 10px' }}>Role</th>
            <th style={{ padding: '12px 10px' }}>Organization</th>
            <th style={{ padding: '12px 10px' }}>Persona</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <td style={{ padding: '12px 10px' }}>{user.siteNameOrUrl}</td>
              <td style={{ padding: '12px 10px' }}>{user.userName}</td>
              <td style={{ padding: '12px 10px' }}>{user.role}</td>
              <td style={{ padding: '12px 10px' }}>{user.organization}</td>
              <td style={{ padding: '12px 10px' }}>{user.persona}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
