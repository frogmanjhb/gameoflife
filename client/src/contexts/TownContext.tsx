import React, { createContext, useContext, useState, useEffect } from 'react';
import { TownSettings, Announcement } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface TownContextType {
  currentTown: TownSettings | null;
  currentTownClass: '6A' | '6B' | '6C' | null;
  announcements: Announcement[];
  allTowns: TownSettings[];
  loading: boolean;
  setCurrentTownClass: (townClass: '6A' | '6B' | '6C' | null) => void;
  refreshTown: () => Promise<void>;
  refreshAnnouncements: () => Promise<void>;
}

const TownContext = createContext<TownContextType | undefined>(undefined);

export const useTown = () => {
  const context = useContext(TownContext);
  if (context === undefined) {
    throw new Error('useTown must be used within a TownProvider');
  }
  return context;
};

interface TownProviderProps {
  children: React.ReactNode;
}

export const TownProvider: React.FC<TownProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentTown, setCurrentTown] = useState<TownSettings | null>(null);
  const [currentTownClass, setCurrentTownClassState] = useState<'6A' | '6B' | '6C' | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allTowns, setAllTowns] = useState<TownSettings[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-select town based on user's class
  useEffect(() => {
    if (user?.class && ['6A', '6B', '6C'].includes(user.class)) {
      setCurrentTownClassState(user.class as '6A' | '6B' | '6C');
    } else if (user?.role === 'teacher' && allTowns.length > 0 && !currentTownClass) {
      // Default to first town for teachers if no class assigned
      setCurrentTownClassState(allTowns[0].class);
    }
  }, [user, allTowns, currentTownClass]);

  // Fetch town settings when town class changes
  useEffect(() => {
    if (currentTownClass) {
      fetchTownSettings();
      fetchAnnouncements();
    }
  }, [currentTownClass]);

  // Fetch all towns for teachers
  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchAllTowns();
    }
  }, [user]);

  const fetchTownSettings = async () => {
    if (!currentTownClass) return;
    
    try {
      const response = await api.get(`/town/settings?class=${currentTownClass}`);
      setCurrentTown(response.data);
    } catch (error) {
      console.error('Failed to fetch town settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTowns = async () => {
    try {
      const response = await api.get('/town/settings?all=true');
      setAllTowns(response.data);
    } catch (error) {
      console.error('Failed to fetch all towns:', error);
    }
  };

  const fetchAnnouncements = async () => {
    if (!currentTownClass) return;
    
    try {
      const response = await api.get(`/announcements?town_class=${currentTownClass}`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const setCurrentTownClass = (townClass: '6A' | '6B' | '6C' | null) => {
    setCurrentTownClassState(townClass);
    setLoading(true);
  };

  const value: TownContextType = {
    currentTown,
    currentTownClass,
    announcements,
    allTowns,
    loading,
    setCurrentTownClass,
    refreshTown: fetchTownSettings,
    refreshAnnouncements: fetchAnnouncements
  };

  return (
    <TownContext.Provider value={value}>
      {children}
    </TownContext.Provider>
  );
};

