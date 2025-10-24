import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/config';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['GLMERP01_profiles']['Row'];
type Company = Database['public']['Tables']['GLMERP01_companies']['Row'];
type Branch = Database['public']['Tables']['GLMERP01_branches']['Row'];
type Location = Database['public']['Tables']['GLMERP01_locations']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  branch: Branch | null;
  location: Location | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  switchCompany: (companyId: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  switchLocation: (locationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('GLMERP01_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profileData);
          
          // Fetch company
          if (profileData?.company_id) {
            const { data: companyData } = await supabase
              .from('GLMERP01_companies')
              .select('*')
              .eq('id', profileData.company_id)
              .single();
            
            setCompany(companyData);
          }
          
          // Fetch branch
          if (profileData?.branch_id) {
            const { data: branchData } = await supabase
              .from('GLMERP01_branches')
              .select('*')
              .eq('id', profileData.branch_id)
              .single();
            
            setBranch(branchData);
          }
          
          // Fetch location
          if (profileData?.location_id) {
            const { data: locationData } = await supabase
              .from('GLMERP01_locations')
              .select('*')
              .eq('id', profileData.location_id)
              .single();
            
            setLocation(locationData);
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('GLMERP01_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profileData);
          
          // Fetch company
          if (profileData?.company_id) {
            const { data: companyData } = await supabase
              .from('GLMERP01_companies')
              .select('*')
              .eq('id', profileData.company_id)
              .single();
            
            setCompany(companyData);
          }
          
          // Fetch branch
          if (profileData?.branch_id) {
            const { data: branchData } = await supabase
              .from('GLMERP01_branches')
              .select('*')
              .eq('id', profileData.branch_id)
              .single();
            
            setBranch(branchData);
          }
          
          // Fetch location
          if (profileData?.location_id) {
            const { data: locationData } = await supabase
              .from('GLMERP01_locations')
              .select('*')
              .eq('id', profileData.location_id)
              .single();
            
            setLocation(locationData);
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setCompany(null);
      setBranch(null);
      setLocation(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    
    const rolePermissions = {
      super_admin: ['*'],
      company_admin: ['companies', 'branches', 'locations', 'users', 'products', 'inventory', 'sales', 'reports'],
      branch_manager: ['branches', 'locations', 'users', 'products', 'inventory', 'sales', 'reports'],
      location_manager: ['locations', 'users', 'products', 'inventory', 'sales'],
      manager: ['users', 'products', 'inventory', 'sales'],
      cashier: ['sales'],
      inventory_clerk: ['products', 'inventory']
    };
    
    const userPermissions = rolePermissions[profile.role as keyof typeof rolePermissions] || [];
    
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const switchCompany = async (companyId: string) => {
    if (!profile) return;
    
    // Update user's current company
    const { error } = await supabase
      .from('GLMERP01_profiles')
      .update({ company_id: companyId })
      .eq('id', profile.id);
    
    if (error) throw error;
    
    // Fetch new company data
    const { data: companyData } = await supabase
      .from('GLMERP01_companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    setCompany(companyData);
    
    // Fetch new branch data
    if (companyData) {
      const { data: branchData } = await supabase
        .from('GLMERP01_branches')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      setBranch(branchData);
    }
  };

  const switchBranch = async (branchId: string) => {
    if (!profile) return;
    
    // Update user's current branch
    const { error } = await supabase
      .from('GLMERP01_profiles')
      .update({ branch_id: branchId })
      .eq('id', profile.id);
    
    if (error) throw error;
    
    // Fetch new branch data
    const { data: branchData } = await supabase
      .from('GLMERP01_branches')
      .select('*')
      .eq('id', branchId)
      .single();
    
    setBranch(branchData);
    
    // Fetch new location data
    if (branchData) {
      const { data: locationData } = await supabase
        .from('GLMERP01_locations')
        .select('*')
        .eq('branch_id', branchId)
        .single();
      
      setLocation(locationData);
    }
  };

  const switchLocation = async (locationId: string) => {
    if (!profile) return;
    
    // Update user's current location
    const { error } = await supabase
      .from('GLMERP01_profiles')
      .update({ location_id: locationId })
      .eq('id', profile.id);
    
    if (error) throw error;
    
    // Fetch new location data
    const { data: locationData } = await supabase
      .from('GLMERP01_locations')
      .select('*')
      .eq('id', locationId)
      .single();
    
    setLocation(locationData);
  };

  const value = {
    user,
    profile,
    company,
    branch,
    location,
    loading,
    signIn,
    signOut,
    hasPermission,
    switchCompany,
    switchBranch,
    switchLocation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};