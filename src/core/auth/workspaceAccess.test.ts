import { describe, expect, it } from 'vitest';
import { workspaceAccess } from './workspaceAccess';

describe('workspace permissions', () => {
  it('routes launching-only staff straight to Launching and keeps Creative closed', () => {
    expect(workspaceAccess(['launch.view','launch.edit'])).toMatchObject({
      entry: '/launch/app/today', creative: false, creativeEdit: false, both: false,
    });
  });
  it('routes creative-only staff straight to Creative with separate view and edit access', () => {
    expect(workspaceAccess(['creative.view'])).toMatchObject({ entry: '/launch/app/creative', launch: false, creativeEdit: false });
    expect(workspaceAccess(['creative.view','creative.edit'])).toMatchObject({ entry: '/launch/app/creative', launch: false, creativeEdit: true });
  });
  it('opens the picker only for combined access, including admins', () => {
    expect(workspaceAccess(['launch.view','creative.view'])).toMatchObject({ entry: '/launch/app', both: true, admin: false });
    expect(workspaceAccess(['launch.admin'])).toMatchObject({ entry: '/launch/app', both: true, admin: true });
    expect(workspaceAccess(['creative.edit']).entry).toBeNull();
    expect(workspaceAccess([]).entry).toBeNull();
  });
});
