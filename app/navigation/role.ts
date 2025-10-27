export type AppRole = 'arrendador' | 'arrendatario' | string | null | undefined;

export type AppRouteName =
  | 'HomeArrendador'
  | 'HomeArrendatario'
  | 'LicenseUpload'
  | 'PerfilVehiculo';

export function getHomeRouteByRole(role: AppRole): 'HomeArrendador' | 'HomeArrendatario' {
  return role === 'arrendador' ? 'HomeArrendador' : 'HomeArrendatario';
}

export function getInitialRouteByRoleAndProfile(
  role: AppRole,
  hasLicense: boolean,
  vehicleProfileComplete: boolean
): AppRouteName {
  if (role === 'arrendador') {
    if (!hasLicense) return 'LicenseUpload';
    if (!vehicleProfileComplete) return 'PerfilVehiculo';
    return 'HomeArrendador';
  }
  return 'HomeArrendatario';
}

export function isArrendador(role: AppRole): boolean {
  return role === 'arrendador';
}
