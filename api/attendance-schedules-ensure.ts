import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MANAGER_ROLES = new Set(['OWNER', 'BUSINESS_UNIT_ADMIN']);

type EmployeeRow = {
  id: string;
  user_id: string | null;
  organization_id: string;
  employee_no: string;
};

type AssignmentRow = {
  id: string;
  employee_id: string;
  business_unit_id: string;
  location_id: string;
  primary_work_area_id: string | null;
  is_primary: boolean;
};

type TemplateRow = {
  id: string;
  business_unit_id: string;
  code: string;
};

function selectTemplate(employeeNo: string, templates: TemplateRow[]): TemplateRow | undefined {
  const preferredCode = employeeNo === 'UJO-001'
    ? 'SHIFT_PROD_DINI'
    : employeeNo === 'UJO-002'
      ? 'SHIFT_PROD_PAGI_A'
      : employeeNo === 'UJO-003'
        ? 'SHIFT_PREP_SERVICE'
        : employeeNo === 'UJO-004' || employeeNo === 'UJO-005'
          ? 'SHIFT_OUTLET_CLOSE'
          : null;
  return (preferredCode ? templates.find((template) => template.code === preferredCode) : undefined)
    ?? templates[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan.' });

  const date = String(req.body?.date ?? '').trim();
  if (!DATE_PATTERN.test(date)) return res.status(400).json({ error: 'Tanggal jadwal tidak valid.' });

  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await caller.auth.getUser();
  if (callerError || !callerData.user) return res.status(401).json({ error: 'Sesi tidak valid.' });

  const { data: memberships, error: membershipError } = await caller
    .from('attendance_memberships')
    .select('role, organization_id, business_unit_id')
    .eq('user_id', callerData.user.id)
    .eq('is_active', true);
  if (membershipError) return res.status(500).json({ error: 'Keanggotaan gagal diperiksa.' });
  if (!memberships?.length) return res.status(403).json({ error: 'Akses Attendance tidak aktif.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const managing = memberships.filter((membership) => MANAGER_ROLES.has(String(membership.role)));
  const organizationIds = [...new Set((managing.length ? managing : memberships)
    .map((membership) => String(membership.organization_id)))];

  let employeeQuery = admin
    .from('attendance_employees')
    .select('id, user_id, organization_id, employee_no')
    .in('organization_id', organizationIds)
    .eq('is_active', true);
  if (!managing.length) employeeQuery = employeeQuery.eq('user_id', callerData.user.id);
  const { data: employeeData, error: employeeError } = await employeeQuery;
  if (employeeError) return res.status(500).json({ error: employeeError.message });

  const employees = (employeeData ?? []) as EmployeeRow[];
  if (!employees.length) return res.status(200).json({ schedules_created: 0, days_created: 0 });
  const employeeIds = employees.map((employee) => employee.id);

  let assignmentQuery = admin
    .from('attendance_employee_assignments')
    .select('id, employee_id, business_unit_id, location_id, primary_work_area_id, is_primary')
    .in('employee_id', employeeIds)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  const adminUnitIds = [...new Set(managing
    .filter((membership) => membership.role === 'BUSINESS_UNIT_ADMIN' && membership.business_unit_id)
    .map((membership) => String(membership.business_unit_id)))];
  const isOwner = managing.some((membership) => membership.role === 'OWNER');
  if (managing.length && !isOwner && adminUnitIds.length) {
    assignmentQuery = assignmentQuery.in('business_unit_id', adminUnitIds);
  }
  const { data: assignmentData, error: assignmentError } = await assignmentQuery;
  if (assignmentError) return res.status(500).json({ error: assignmentError.message });

  const assignments = (assignmentData ?? []) as AssignmentRow[];
  const assignmentsByEmployee = new Map<string, AssignmentRow>();
  for (const assignment of assignments) {
    if (!assignmentsByEmployee.has(assignment.employee_id)) {
      assignmentsByEmployee.set(assignment.employee_id, assignment);
    }
  }
  const primaryAssignments = [...assignmentsByEmployee.values()];
  if (!primaryAssignments.length) return res.status(200).json({ schedules_created: 0, days_created: 0 });
  const unitIds = [...new Set(primaryAssignments.map((assignment) => assignment.business_unit_id))];
  const { data: templateData, error: templateError } = await admin
    .from('attendance_shift_templates')
    .select('id, business_unit_id, code')
    .in('business_unit_id', unitIds)
    .eq('is_active', true)
    .order('start_time');
  if (templateError) return res.status(500).json({ error: templateError.message });

  const templates = (templateData ?? []) as TemplateRow[];
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const scheduleRows = primaryAssignments.flatMap((assignment) => {
    const employee = employeeById.get(assignment.employee_id);
    if (!employee) return [];
    const unitTemplates = templates.filter((template) => template.business_unit_id === assignment.business_unit_id);
    const template = selectTemplate(employee.employee_no, unitTemplates);
    if (!template) return [];
    return [{
      employee_id: assignment.employee_id,
      assignment_id: assignment.id,
      business_unit_id: assignment.business_unit_id,
      location_id: assignment.location_id,
      work_area_id: assignment.primary_work_area_id,
      shift_template_id: template.id,
      schedule_date: date,
      is_off: false,
    }];
  });

  if (scheduleRows.length) {
    const { error: scheduleError } = await admin
      .from('attendance_schedules')
      .upsert(scheduleRows, { onConflict: 'employee_id,schedule_date', ignoreDuplicates: true });
    if (scheduleError) return res.status(500).json({ error: scheduleError.message });
  }

  const { data: schedules, error: scheduleReadError } = await admin
    .from('attendance_schedules')
    .select('id, employee_id')
    .in('employee_id', primaryAssignments.map((assignment) => assignment.employee_id))
    .eq('schedule_date', date);
  if (scheduleReadError) return res.status(500).json({ error: scheduleReadError.message });
  const scheduleByEmployee = new Map((schedules ?? []).map((schedule) => [schedule.employee_id, schedule.id]));

  const dayRows = primaryAssignments.flatMap((assignment) => {
    const employee = employeeById.get(assignment.employee_id);
    const scheduleId = scheduleByEmployee.get(assignment.employee_id);
    if (!employee || !scheduleId) return [];
    return [{
      organization_id: employee.organization_id,
      business_unit_id: assignment.business_unit_id,
      location_id: assignment.location_id,
      employee_id: assignment.employee_id,
      schedule_id: scheduleId,
      work_date: date,
      status: 'ABSENT',
    }];
  });
  if (dayRows.length) {
    const { error: dayError } = await admin
      .from('attendance_days')
      .upsert(dayRows, { onConflict: 'employee_id,work_date', ignoreDuplicates: true });
    if (dayError) return res.status(500).json({ error: dayError.message });
  }

  return res.status(200).json({
    schedules_ready: scheduleRows.length,
    days_ready: dayRows.length,
  });
}
