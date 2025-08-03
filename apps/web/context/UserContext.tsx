'use client';

import React, { useState, useMemo, createContext, ReactNode } from 'react';

interface UserContextType {
  username: string;
  setUsername: (username: string) => void;
}

// Creates the context with a default value
export const UserContext = createContext<UserContextType>({
  username: 'user00001',
  setUsername: () => {},
});

// Defines the provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState('user00001'); // Default user

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({ username, setUsername }), [username]);

  // The return statement was missing, causing the syntax error. It has been restored.
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
