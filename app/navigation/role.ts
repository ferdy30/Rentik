export type AppRole = 'arrendador' | 'arrendatario' | string | null | undefined;

export type AppRouteName = 'ArrendadorStack' | 'HomeArrendatario' | 'Splash';

export function getHomeRouteByRole(role: AppRole): 'ArrendadorStack' | 'HomeArrendatario' {
  return role === 'arrendador' ? 'ArrendadorStack' : 'HomeArrendatario';
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
