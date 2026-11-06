export function workspaceAccess(permissions: readonly string[]) {
  const admin = permissions.includes('launch.admin');
  const launch = admin || permissions.includes('launch.view');
  const creative = admin || permissions.includes('creative.view');
  const both = launch && creative;
  return {
    admin, launch, creative, both,
    creativeEdit: creative && (admin || permissions.includes('creative.edit')),
    entry: both ? '/launch/app' : launch ? '/launch/app/today' : creative ? '/launch/app/creative' : null,
  };
}
