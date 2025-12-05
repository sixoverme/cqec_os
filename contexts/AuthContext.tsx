
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types';

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: AppUser | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null); // Ensure profile is null on error
      setLoading(false);
      return;
    }

    if (data) {
      const appUser: AppUser = {
        id: data.id,
        name: data.name,
        handle: data.handle,
        email: data.email,
        avatar: data.avatar_url,
        bio: data.bio,
        status: data.status,
        capacity: data.capacity,
        accessNeeds: data.access_needs,
        isRobot: data.is_robot,
        color: data.color
      };

      // Only update profile state if it has truly changed to prevent unnecessary re-renders
      if (!profile || JSON.stringify(profile) !== JSON.stringify(appUser)) {
        setProfile(appUser);
      }
    } else {
        setProfile(null);
    }
    setLoading(false);
  };

  const signIn = async (email: string) => {
    // For dev, we just sign in with password 'password'
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'password',
    });
    if (error) throw error;
  };

  const signUp = async (email: string) => {
    console.log('Attempting to sign up:', email);
    if (!supabase || !supabase.auth) {
      console.error('Supabase client is not initialized correctly', supabase);
      throw new Error('Supabase client not ready');
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password',
        options: {
          data: {
            full_name: email.split('@')[0],
            avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`
          }
        }
      });
      if (error) {
        console.error('Supabase signUp error:', error);
        throw error;
      }
      console.log('Sign up successful:', data);
    } catch (err: any) {
      console.error('Unexpected error during signUp:', err);
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
