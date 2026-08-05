import { useQuery } from '@tanstack/react-query';
import { listProjects } from '../data/launchRepository';

export const launchKeys = {
  projects: (status = 'ALL') => ['launch-projects', status] as const,
};

export function useProjects(status = 'ALL') { return useQuery({ queryKey: launchKeys.projects(status), queryFn: () => listProjects(status) }); }
