import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export type DateItem = {
  id: string;
  title: string;
  date: Date;
  location: string;
  type: string;
  created_by?: 'angy' | 'bozy';
};

export type PlanItem = {
  id: string;
  title: string;
  location: string;
  completed: boolean;
  category: string;
  created_by?: 'angy' | 'bozy';
};

export type ScheduleItem = {
  id: string;
  user_profile: 'angy' | 'bozy';
  day: string;
  period: string;
  subject: string;
  time?: string;
};

export type Config = {
  key: string;
  value: any;
};

interface DataContextType {
  dates: DateItem[];
  plans: PlanItem[];
  schedules: ScheduleItem[];
  nextMeeting: Date | null;
  loading: boolean;
  addDate: (date: Omit<DateItem, 'id'>) => Promise<void>;
  updateDate: (id: string, updates: Partial<DateItem>) => Promise<void>;
  deleteDate: (id: string) => Promise<void>;
  addPlan: (plan: Omit<PlanItem, 'id'>) => Promise<void>;
  updatePlan: (id: string, updates: Partial<PlanItem>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  updateSchedule: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  updateNextMeeting: (date: Date) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [nextMeeting, setNextMeeting] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [datesRes, plansRes, schedulesRes, configRes] = await Promise.all([
        supabase.from('dates').select('*').order('date', { ascending: true }),
        supabase.from('plans').select('*').order('created_at', { ascending: false }),
        supabase.from('schedules').select('*'),
        supabase.from('config').select('*').eq('key', 'next_meeting').single()
      ]);

      if (datesRes.data) {
        setDates(datesRes.data.map((d: any) => ({ ...d, date: new Date(d.date) })));
      }
      
      if (plansRes.data) {
        setPlans(plansRes.data);
      }

      if (schedulesRes.data) {
        setSchedules(schedulesRes.data);
      }

      if (configRes.data) {
        setNextMeeting(new Date(configRes.data.value.date));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const channel = supabase.channel('public:data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dates' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const addDate = async (date: Omit<DateItem, 'id'>) => {
    const { error } = await supabase.from('dates').insert(date);
    if (error) console.error('Error adding date:', error);
    else fetchData();
  };

  const updateDate = async (id: string, updates: Partial<DateItem>) => {
    const { error } = await supabase.from('dates').update(updates).eq('id', id);
    if (error) console.error('Error updating date:', error);
    else fetchData();
  };

  const deleteDate = async (id: string) => {
    const { error } = await supabase.from('dates').delete().eq('id', id);
    if (error) console.error('Error deleting date:', error);
    else fetchData();
  };

  const addPlan = async (plan: Omit<PlanItem, 'id'>) => {
    const { error } = await supabase.from('plans').insert(plan);
    if (error) console.error('Error adding plan:', error);
    else fetchData();
  };

  const updatePlan = async (id: string, updates: Partial<PlanItem>) => {
    const { error } = await supabase.from('plans').update(updates).eq('id', id);
    if (error) console.error('Error updating plan:', error);
    else fetchData();
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) console.error('Error deleting plan:', error);
    else fetchData();
  };

  const updateSchedule = async (item: Omit<ScheduleItem, 'id'>) => {
    const { error } = await supabase.from('schedules').upsert(item, { onConflict: 'user_profile,day,period' });
    if (error) console.error('Error updating schedule:', error);
    else fetchData();
  };

  const updateNextMeeting = async (date: Date) => {
    const { error } = await supabase.from('config').upsert({ 
      key: 'next_meeting', 
      value: { date: date.toISOString() } 
    });
    if (error) console.error('Error updating next meeting:', error);
    else fetchData();
  };

  return (
    <DataContext.Provider value={{
      dates,
      plans,
      schedules,
      nextMeeting,
      loading,
      addDate,
      updateDate,
      deleteDate,
      addPlan,
      updatePlan,
      deletePlan,
      updateSchedule,
      updateNextMeeting
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
