import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const unitSectors = { garment: 'Garment', fnb: 'F&B', other: 'Lainnya' };
export type WorkspaceUnit = {
  id: string; code: string; name: string; description: string;
  sector: keyof typeof unitSectors; is_active: boolean;
};
export const unitKey = ['workspace-business-units'];

export function useWorkspaceUnits() {
  return useQuery({ queryKey: unitKey, staleTime: 300_000, queryFn: async ({ signal }) => {
    const { data, error } = await supabase.from('business_units')
      .select('id,code,name,description,sector,is_active').order('name').abortSignal(signal);
    if (error) throw error;
    return data as WorkspaceUnit[];
  } });
}

export async function saveWorkspaceUnit(unit: Pick<WorkspaceUnit, 'name' | 'code' | 'description' | 'sector'>, id?: string) {
  const table = supabase.from('business_units');
  const { error } = await (id ? table.update({ ...unit, short_name: unit.name }).eq('id', id)
    : table.insert({ ...unit, short_name: unit.name }));
  if (error) throw error;
}

export async function setWorkspaceUnitActive(id: string, isActive: boolean) {
  const { error } = await supabase.from('business_units').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export type UnitOverview = {
  unit_id: string | null; article_count: number; article_overdue: number;
  creative_target: number; creative_closed: number; creative_overdue: number;
};
export async function businessOverview(today: string, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('business_execution_overview', { p_today: today }).abortSignal(signal);
  if (error) throw error;
  return data as UnitOverview[];
}
