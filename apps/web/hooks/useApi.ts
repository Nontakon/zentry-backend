'use client';

import { useState, useEffect, useRef } from 'react';

// In a real app, this would be removed and you would fetch from your live API.
const MOCK_API_ENABLED = false; // Set to false to use real API calls

const mockApi = (path: string): Promise<any> => {
    console.log(`[MOCK API] Fetching ${path}`);
    // Add mock responses here if needed...
    return Promise.resolve({});
};

export const useApi = (path: string | null, refreshInterval: number = 0) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track if it's the initial load
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Only show the main loading spinner on the first load
      if (isInitialLoad.current) {
        setLoading(true);
      }
      setError(null);

      try {
        if (MOCK_API_ENABLED) {
            const result = await mockApi(path);
            setData(result);
        } else {
            const API_BASE_URL = 'http://localhost:4000';

            const response = await fetch(`${API_BASE_URL}${path}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        }
      } catch (e: any) {
        console.log("API Fetch Error:", e);
        setError(e.message);
      } finally {
        if (isInitialLoad.current) {
            setLoading(false);
            isInitialLoad.current = false;
        }
      }
    };

    fetchData(); // Fetch immediately on mount/path change

    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, [path, refreshInterval]);

  return { data, loading, error };
};
