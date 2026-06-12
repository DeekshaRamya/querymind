'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, LogOut, Users, ShieldAlert } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserCredential {
  uc_id: number;
  user_id: number;
  db_username: string;
}

interface DatabaseSchema {
  schema_id: number;
  database_name: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'config' | 'schemas'>('users');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setCredentials(data.credentials || []);
        setSchemas(data.schemas || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setUsers(users.filter(u => u.email !== email));
        setCredentials(credentials.filter(c => users.find(u => u.email === email)?.id !== c.user_id));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error occurred while deleting user');
    }
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <nav className="h-16 border-b border-[#E5E7EB] bg-white sticky top-0 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#DC2626] to-[#EF4444] flex items-center justify-center shadow-md shadow-red-500/20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-[#111827]">Admin Portal</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto py-10 px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">System Management</h1>
            <p className="text-[15px] text-[#6B7280] mt-1">View and manage system users, configurations, and database schemas.</p>
          </div>
          <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-[14px] font-medium rounded-lg transition-all ${activeTab === 'users' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 text-[14px] font-medium rounded-lg transition-all ${activeTab === 'config' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              User Configs
            </button>
            <button
              onClick={() => setActiveTab('schemas')}
              className={`px-4 py-2 text-[14px] font-medium rounded-lg transition-all ${activeTab === 'schemas' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              DB Schemas
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#6B7280] text-[14px]">Loading data...</div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'users' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">ID</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">Name</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">Email</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">Role</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-[#6B7280]">No users found.</td></tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-4 px-6 text-[14px] text-[#6B7280]">#{user.id}</td>
                          <td className="py-4 px-6 text-[14px] font-medium text-[#111827]">{user.name}</td>
                          <td className="py-4 px-6 text-[14px] text-[#4B5563]">{user.email}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full ${user.role === 'admin'
                                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                                : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.email)}
                              disabled={user.role === 'admin'}
                              className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${user.role === 'admin'
                                  ? 'text-[#D1D5DB] cursor-not-allowed'
                                  : 'text-[#EF4444] hover:bg-[#FEF2F2]'
                                }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'config' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">Config ID</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">User ID</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">DB Username</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {credentials.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-[#6B7280]">No user configurations found.</td></tr>
                    ) : (
                      credentials.map((config) => (
                        <tr key={config.uc_id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-4 px-6 text-[14px] text-[#6B7280]">#{config.uc_id}</td>
                          <td className="py-4 px-6 text-[14px] font-medium text-[#111827]">#{config.user_id}</td>
                          <td className="py-4 px-6 text-[14px] text-[#4B5563]">{config.db_username}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'schemas' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">Schema ID</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider">Database Name</th>
                      <th className="py-4 px-6 text-[13px] font-semibold text-[#4B5563] uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {schemas.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-[#6B7280]">No database schemas found.</td></tr>
                    ) : (
                      schemas.map((schema) => (
                        <tr key={schema.schema_id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-4 px-6 text-[14px] text-[#6B7280]">#{schema.schema_id}</td>
                          <td className="py-4 px-6 text-[14px] font-medium text-[#111827]">{schema.database_name}</td>
                          <td className="py-4 px-6 text-right">
                            <span className="px-2.5 py-1 text-[12px] font-medium rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
