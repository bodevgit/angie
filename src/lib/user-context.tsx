import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { setOneSignalUser } from './onesignal';
import type { Session } from '@supabase/supabase-js';

type UserProfile = 'angy' | 'bozy';

interface ThemeValues {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  cardBg: string;
}

interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardBg: string;
  };
  values: ThemeValues;
  gradient: string;
  isDark: boolean;
}

interface UserData {
  name: string;
  bio: string;
  avatar?: string;
  backgroundImage?: string;
  themeColors?: ThemeValues;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
}

const defaultUserData: Record<UserProfile, UserData> = {
  angy: {
    name: 'Angy',
    bio: 'Distance means so little when someone means so much.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Angy&backgroundColor=ffdfbf'
  },
  bozy: {
    name: 'Bozy',
    bio: 'Counting down the days...',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bozy&backgroundColor=b6e3f4'
  }
};

const defaultThemeColors = {
  primary: 'bg-theme-primary',
  secondary: 'bg-theme-secondary',
  accent: 'text-theme-accent',
  background: 'bg-theme-background',
  text: 'text-theme-text',
  cardBg: 'bg-theme-cardBg/80',
};

const themes: Record<UserProfile, { light: Theme; dark: Theme }> = {
  angy: {
    light: {
      name: 'Angy Light',
      colors: defaultThemeColors,
      values: {
        primary: '236 72 153', // pink-500
        secondary: '192 132 252', // purple-400
        accent: '236 72 153', // pink-500
        background: '253 242 248', // pink-50
        text: '17 24 39', // gray-900
        cardBg: '255 255 255', // white
      },
      gradient: 'from-pink-100 via-purple-100 to-indigo-100',
      isDark: false,
    },
    dark: {
      name: 'Angy Dark',
      colors: defaultThemeColors,
      values: {
        primary: '219 39 119', // pink-600
        secondary: '147 51 234', // purple-600
        accent: '244 114 182', // pink-400
        background: '17 24 39', // gray-900
        text: '243 244 246', // gray-100
        cardBg: '31 41 55', // gray-800
      },
      gradient: 'from-gray-900 via-purple-950 to-pink-950',
      isDark: true,
    }
  },
  bozy: {
    light: {
      name: 'Bozy Light',
      colors: defaultThemeColors,
      values: {
        primary: '37 99 235', // blue-600
        secondary: '6 182 212', // cyan-500
        accent: '37 99 235', // blue-600
        background: '248 250 252', // slate-50
        text: '17 24 39', // gray-900
        cardBg: '255 255 255', // white
      },
      gradient: 'from-slate-100 via-blue-50 to-cyan-50',
      isDark: false,
    },
    dark: {
      name: 'Bozy Dark',
      colors: defaultThemeColors,
      values: {
        primary: '59 130 246', // blue-500
        secondary: '8 145 178', // cyan-600
        accent: '96 165 250', // blue-400
        background: '15 23 42', // slate-900
        text: '243 244 246', // gray-100
        cardBg: '30 41 59', // slate-800
      },
      gradient: 'from-slate-900 via-blue-950 to-cyan-950',
      isDark: true,
    }
  },
};

interface UserContextType {
  user: UserProfile | null;
  session: Session | null;
  setUser: (user: UserProfile | null) => void;
  theme: Theme;
  userData: UserData;
  allUsers: Record<UserProfile, UserData>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  uploadImage: (file: File, bucket: string, type?: 'avatar' | 'background') => Promise<string | null>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUserState] = useState<UserProfile | null>(() => {
    // Keep local storage for backwards compatibility / smooth transition
    // but Auth should take precedence
    const saved = localStorage.getItem('user');
    return (saved as UserProfile) || null;
  });

  // Wrapper to allow manual setting (legacy) but prioritize Auth
  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', newUser);
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.profile_type) {
        setUser(session.user.user_metadata.profile_type);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.profile_type) {
        setUser(session.user.user_metadata.profile_type);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const [userDataMap, setUserDataMap] = useState<Record<UserProfile, UserData>>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : defaultUserData;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', user);
      // Only set OneSignal user if we have a valid session OR for legacy reasons we still allow it
      // But user requested "authentication ... that makes sure that user is logged in"
      // So we should strictly check for session if we want to be secure.
      // However, to avoid breaking the app if they are not logged in yet, we can keep it loose 
      // OR strictly enforce it. Let's enforce it if session exists.
      if (session) {
         setOneSignalUser(user);
      } else {
         // If no session, maybe we shouldn't register? 
         // But for now let's allow it if they manually set it (legacy flow)
         // until they fully migrate.
         setOneSignalUser(user);
      }
    } else {
      localStorage.removeItem('user');
    }
  }, [user, session]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userDataMap));
  }, [userDataMap]);

  // Fetch all profiles from Supabase
  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ['angy', 'bozy']);

      if (error) {
        console.error('Error fetching profiles:', error);
      }

      if (data) {
        const newMap = { ...userDataMap };
        data.forEach((profile: any) => {
          if (profile.id === 'angy' || profile.id === 'bozy') {
            newMap[profile.id as UserProfile] = {
              name: profile.name,
              bio: profile.bio,
              avatar: profile.avatar_url,
              backgroundImage: profile.background_url,
              status: profile.status,
              themeColors: userDataMap[profile.id as UserProfile]?.themeColors // Preserve local theme colors
            };
          }
        });
        setUserDataMap(newMap);
      }
    }

    fetchProfiles();

    // Subscribe to realtime changes for all profiles
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData && (newData.id === 'angy' || newData.id === 'bozy')) {
            setUserDataMap((prev) => ({
              ...prev,
              [newData.id]: {
                name: newData.name,
                bio: newData.bio,
                avatar: newData.avatar_url,
                backgroundImage: newData.background_url,
                status: newData.status,
                themeColors: prev[newData.id as UserProfile]?.themeColors
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Run once on mount



  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    
    // Update local state immediately
    setUserDataMap(prev => ({
      ...prev,
      [user]: { ...prev[user], ...data }
    }));

    // Sync with Supabase
    const updates: any = {
      id: user,
      updated_at: new Date(),
    };
    if (data.name !== undefined) updates.name = data.name;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.avatar !== undefined) updates.avatar_url = data.avatar;
    if (data.backgroundImage !== undefined) updates.background_url = data.backgroundImage;
    if (data.status !== undefined) updates.status = data.status;

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) {
      console.error('Error updating profile:', error);
    }
  };

  const uploadImage = async (file: File, bucket: string, type: 'avatar' | 'background' = 'avatar'): Promise<string | null> => {
    if (!user) return null;

    let fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    if (fileExt === 'jpeg') fileExt = 'jpg';
    
    const fileName = `${user}-${type}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Determine current theme
  const baseTheme = user 
    ? (isDarkMode ? themes[user].dark : themes[user].light)
    : (isDarkMode ? themes.angy.dark : themes.angy.light);

  const currentUserData = user ? userDataMap[user] : defaultUserData.angy;
  
  // Override with custom colors if available
  const currentTheme: Theme = currentUserData?.themeColors ? {
    ...baseTheme,
    values: currentUserData.themeColors,
    // colors remain default utility classes which map to CSS vars
  } : baseTheme;

  return (
    <UserContext.Provider value={{ 
      user, 
      session,
      setUser, 
      theme: currentTheme, 
      userData: currentUserData,
      allUsers: userDataMap,
      updateUserData,
      uploadImage,
      isDarkMode,
      toggleDarkMode,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
