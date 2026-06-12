'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function DbConfigPage() {
  const [dbType, setDbType] = useState('mssql');
  const [server, setServer] = useState('');
  const [port, setPort] = useState('1433');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('');

  const [availableDatabases, setAvailableDatabases] = useState<{ name: string, type: string }[]>([]);
  const [isNewDatabase, setIsNewDatabase] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialConfig, setInitialConfig] = useState<any>(null);
  const [allConfigs, setAllConfigs] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        // Fetch saved credentials to see if edit mode
        const configRes = await fetch('/api/db-config', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Fetch globally available databases to populate the dropdown
        const dbRes = await fetch('/api/databases', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData.success && dbData.databases) {
            setAvailableDatabases(dbData.databases);
          }
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.configurations && configData.configurations.length > 0) {
            setAllConfigs(configData.configurations);
            const currentConfig = configData.configurations[0]; // Most recent config
            setInitialConfig(currentConfig);
            setDbType(currentConfig.db_type || 'mssql');
            setServer(currentConfig.server || '');
            setPort(currentConfig.port ? currentConfig.port.toString() : '1433');
            setDbUsername(currentConfig.db_username || '');
            setDbPassword('********'); // Masked password
            setDbName(currentConfig.db_name || '');
            setIsEditMode(true);
            setIsNewDatabase(false); // Default to dropdown since they have an existing DB
          } else {
            setIsEditMode(false);
            setIsNewDatabase(true); // Default to manual input for new users
          }
        }
      } catch (err) {
        console.error("Failed to load setup data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const clearForm = () => {
    if (isEditMode) return;
    setDbType('mssql');
    setServer('');
    setPort('1433');
    setDbUsername('');
    setDbPassword('');
    setDbName('');
    setIsNewDatabase(true);
    toast.success('Form cleared');
  };

  const validateForm = () => {
    const missing = [];
    if (!server) missing.push('Server');
    if (!port) missing.push('Port');
    if (!dbName) missing.push('Database Name');
    if (!dbUsername) missing.push('Username');
    if (!dbPassword) missing.push('Password');

    if (missing.length > 0) {
      toast.error(`Missing fields: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const loadingToast = toast.loading('Saving configuration and fetching schema...');

    try {
      const res = await fetch('/api/db-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ db_type: dbType, server, port, db_username: dbUsername, db_password: dbPassword, db_name: dbName }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('activeDatabaseName', dbName);
        toast.success('Configuration saved successfully!', { id: loadingToast });
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to save', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred.', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  // As requested: once saved and chosen to edit, ONLY username and password remain read only.
  // If they change the Database Type to something different than their saved config, unlock the fields!
  const isCredentialsReadonly = !isNewDatabase && isEditMode && (!initialConfig || initialConfig.db_type === dbType);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">Loading...</div>;
  }

  // Filter the available databases dropdown based on the selected Database Type!
  const filteredDatabases = availableDatabases.filter(db => db.type?.toLowerCase() === dbType.toLowerCase());

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col relative">
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 py-20 flex flex-col items-center">
        <Toaster position="top-right" />

        <div className="mb-8 text-center w-full">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] rounded-xl mx-auto mb-5 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">
            {isEditMode ? 'Edit Database Configuration' : 'Database Configuration'}
          </h1>
          <p className="text-[#6B7280] text-[16px] mt-2 max-w-sm mx-auto leading-relaxed">
            {isEditMode ? 'Update your database connection details.' : 'Connect your enterprise database.'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[550px] bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm"
        >
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-[#111827] text-[14px] font-medium mb-1.5">Database Type</label>
              <select
                value={dbType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setDbType(newType);
                  setDbName(''); // Clear the selected DB when switching types
                  setIsNewDatabase(true); // Default to manual until they check the list
                  if (newType === 'mssql') setPort('1433');
                  else if (newType === 'postgres') setPort('5432');

                  // If they switch back to the type they originally saved, restore their masked credentials
                  // Otherwise, clear the username and password fields so they can enter the new ones!
                  if (initialConfig && newType === initialConfig.db_type) {
                    setDbUsername(initialConfig.db_username || '');
                    setDbPassword('********');
                  } else {
                    setDbUsername('');
                    setDbPassword('');
                  }
                }}
                className="w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors appearance-none"
              >
                <option value="mssql">SQL Server (MSSQL)</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>

            <div>
              <label className="block text-[#111827] text-[14px] font-medium mb-1.5">
                Server / Host
              </label>
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="e.g. localhost, db.example.com"
                className="w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
                required
              />
            </div>

            <div>
              <label className="block text-[#111827] text-[14px] font-medium mb-1.5 flex justify-between">
                <span>Database Name</span>
                <button type="button" onClick={() => {
                  if (!isNewDatabase) {
                    setIsNewDatabase(true);
                    setDbName('');
                    setServer('');
                    setDbUsername('');
                    setDbPassword('');
                    setInitialConfig(null);
                    setIsEditMode(false);
                  } else {
                    setIsNewDatabase(false);
                    if (allConfigs.length > 0) {
                      const currentConfig = allConfigs[0];
                      setInitialConfig(currentConfig);
                      setDbType(currentConfig.db_type || 'mssql');
                      setServer(currentConfig.server || '');
                      setPort(currentConfig.port ? currentConfig.port.toString() : '1433');
                      setDbUsername(currentConfig.db_username || '');
                      setDbPassword('********');
                      setDbName(currentConfig.db_name || '');
                      setIsEditMode(true);
                    }
                  }
                }} className="text-[#2563EB] text-xs font-semibold hover:underline">
                  {isNewDatabase ? 'Select Existing' : '+ Add New'}
                </button>
              </label>

              {!isNewDatabase ? (
                <select
                  value={dbName}
                  onChange={(e) => {
                    const selectedDb = e.target.value;
                    setDbName(selectedDb);
                    const config = allConfigs.find(c => c.db_name === selectedDb);
                    if (config) {
                      setDbType(config.db_type || 'mssql');
                      setServer(config.server || '');
                      setPort(config.port ? config.port.toString() : '1433');
                      setDbUsername(config.db_username || '');
                      setDbPassword('********');
                      setInitialConfig(config);
                      setIsEditMode(true);
                    }
                  }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors appearance-none"
                  required
                >
                  <option value="" disabled>Select a database</option>
                  {filteredDatabases.map(db => (
                    <option key={db.name} value={db.name}>{db.name}</option>
                  ))}
                  {filteredDatabases.length === 0 && (
                    <option value="" disabled>No databases found for this type</option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="Enter new database name..."
                  className="w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-[#111827] text-[14px] font-medium mb-1.5">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
                required
              />
            </div>

            <div>
              <label className="block text-[#111827] text-[14px] font-medium mb-1.5">Username</label>
              <input
                type="text"
                value={dbUsername}
                onChange={(e) => setDbUsername(e.target.value)}
                disabled={isCredentialsReadonly}
                className={`w-full border rounded-[10px] px-3.5 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors ${isCredentialsReadonly ? 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed' : 'bg-white border-[#E5E7EB] placeholder-[#9CA3AF]'}`}
                required
              />
            </div>

            <div>
              <label className="block text-[#111827] text-[14px] font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isCredentialsReadonly}
                  className={`w-full border rounded-[10px] pl-3.5 pr-10 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors ${isCredentialsReadonly ? 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed' : 'bg-white border-[#E5E7EB] placeholder-[#9CA3AF]'}`}
                  required
                />
                {!isCredentialsReadonly && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex-1 bg-white border border-[#E5E7EB] text-[#4B5563] font-medium text-[15px] rounded-[10px] h-[44px] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Clear
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !dbName}
                className={`${isEditMode ? 'w-full' : 'flex-[2]'} bg-[#2563EB] text-white font-medium text-[15px] rounded-[10px] h-[44px] hover:bg-[#1D4ED8] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm relative`}
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditMode ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
