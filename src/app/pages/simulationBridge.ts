import { supabase } from '@/integrations/supabase/client';

export interface SimulationStateData {
  current: string;
  users: Array<{
    id: string;
    name: string;
    ini: string;
    role: string;
    title: string;
    active: boolean;
    p: Record<string, boolean>;
  }>;
  orders: Array<{
    id: string;
    code: string;
    brand: string;
    name: string;
    colors: string[];
    photo: string;
    ref: string;
    priority: string;
    due: string;
    created: string;
    by: string;
    pic: string;
    support: string[];
    brief: string;
    stages: Array<{ id: string; status: string; who: string; note: string }>;
    hpp: Record<string, any>;
    samples: Array<{ v: string; date: string; status: string; note: string }>;
    size: Array<{ s: string; chest: number; length: number; sleeve: number; shoulder: number }>;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    cat: string;
    mat: string;
    price: number;
    moq: string;
    lead: string;
    spec: string;
    status: string;
  }>;
  evals: Array<{ date: string; type: string; title: string; note: string }>;
  activity: Array<{ at: string; user: string; text: string }>;
}

const STATE_ID = 'global_workspace_v2';

export async function loadSimulationState(): Promise<unknown> {
  try {
    const { data, error } = await supabase
      .from('workspace_simulation_states')
      .select('state')
      .eq('id', STATE_ID)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase Bridge] Fetch error:', error.message);
    }

    if (data?.state) {
      console.log('[Supabase Bridge] Successfully loaded state from Supabase DB');
      localStorage.setItem('ggWorkspaceV2', JSON.stringify(data.state));
      return data.state;
    }

    const local = localStorage.getItem('ggWorkspaceV2');
    return local ? JSON.parse(local) : null;
  } catch (err) {
    console.warn('[Supabase Bridge] Fetch exception:', err);
    const local = localStorage.getItem('ggWorkspaceV2');
    return local ? JSON.parse(local) : null;
  }
}

export async function saveSimulationState(state: unknown): Promise<boolean> {
  try {
    localStorage.setItem('ggWorkspaceV2', JSON.stringify(state));

    const { error } = await supabase.from('workspace_simulation_states').upsert({
      id: STATE_ID,
      state: state as any,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase Bridge] Save error:', error.message);
      return false;
    }

    console.log('[Supabase Bridge] Successfully saved state to Supabase DB');
    return true;
  } catch (err) {
    console.warn('[Supabase Bridge] Save exception:', err);
    return false;
  }
}
