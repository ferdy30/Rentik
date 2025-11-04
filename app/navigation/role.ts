export type AppRole = 'arrendador' | 'arrendatario' | string | null | undefined;

export type AppRouteName = 'HomeArrendador' | 'HomeArrendatario' | 'Splash';

export function getHomeRouteByRole(role: AppRole): 'HomeArrendador' | 'HomeArrendatario' {
  return role === 'arrendador' ? 'HomeArrendador' : 'HomeArrendatario';
}

export function getInitialRouteByRoleAndProfile(
  role: AppRole,
  profileComplete: boolean
): AppRouteName {
  if (!profileComplete) return 'Splash';
  return getHomeRouteByRole(role);
}

export function isArrendador(role: AppRole): boolean {
  return role === 'arrendador';
}
