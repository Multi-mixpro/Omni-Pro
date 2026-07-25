import { supabase } from '@/integrations/supabase/client';
import { WorkOrder, StageRun, LaunchBrand } from '../domain/types';

export const workOrderRepository = {
  async getBrands(): Promise<LaunchBrand[]> {
    const { data, error } = await supabase
      .from('launch_brands')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getWorkOrders(): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('launch_work_orders')
      .select(`
        *,
        launch_brands (id, code, name),
        profiles:primary_pic_user_id (full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('launch_work_orders')
      .select(`
        *,
        launch_brands (id, code, name),
        profiles:primary_pic_user_id (full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getStageRuns(workOrderId: string): Promise<StageRun[]> {
    const { data, error } = await supabase
      .from('launch_stage_runs')
      .select(`
        *,
        launch_stage_definitions (name, sequence_no, weight)
      `)
      .eq('work_order_id', workOrderId)
      .order('launch_stage_definitions(sequence_no)', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createWorkOrder(payload: Partial<WorkOrder>, userId: string): Promise<WorkOrder> {
    // 1. Insert Work Order
    const { data: wo, error: woError } = await supabase
      .from('launch_work_orders')
      .insert({
        ...payload,
        created_by: userId,
        overall_status: 'ACTIVE',
        current_stage_code: 'BRIEF',
        progress_percent: 0,
      })
      .select()
      .single();

    if (woError) throw woError;

    // 2. Fetch Stage Definitions
    const { data: definitions } = await supabase
      .from('launch_stage_definitions')
      .select('id, code')
      .eq('is_active', true)
      .order('sequence_no');

    if (definitions && definitions.length > 0) {
      // 3. Create initial 8 Stage Runs automatically
      const stageRunsPayload = definitions.map((def, idx) => ({
        work_order_id: wo.id,
        stage_definition_id: def.id,
        stage_code: def.code,
        status: idx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        started_at: idx === 0 ? new Date().toISOString() : null,
      }));

      await supabase.from('launch_stage_runs').insert(stageRunsPayload);
    }

    return wo;
  },
};
