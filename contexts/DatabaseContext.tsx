'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DatabaseInfo = {
  name: string;
  type: string;
};

type DatabaseContextType = {
  activeDatabase: DatabaseInfo | null;
  setActiveDatabase: (db: DatabaseInfo) => void;
  databases: DatabaseInfo[];
  loading: boolean;
  isSwitching: boolean;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [activeDatabase, setActiveDatabase] = useState<DatabaseInfo | null>(null);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/databases', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.databases.length > 0) {
          setDatabases(data.databases);
          const savedDbName = localStorage.getItem('activeDatabaseName');
          const found = data.databases.find((db: DatabaseInfo) => db.name === savedDbName);
          if (found) {
            setActiveDatabase(found);
          } else {
            setActiveDatabase(data.databases[0]);
          }
        }
      })
      .catch(err => console.error("Failed to load databases", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSetActive = (db: DatabaseInfo) => {
    if (activeDatabase && db.name === activeDatabase.name) return;
    setIsSwitching(true);
    // Simulate connection time to the new database
    setTimeout(() => {
      setActiveDatabase(db);
      localStorage.setItem('activeDatabaseName', db.name);
      setIsSwitching(false);
    }, 1200);
  };

  return (
    <DatabaseContext.Provider value={{ activeDatabase, setActiveDatabase: handleSetActive, databases, loading, isSwitching }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
