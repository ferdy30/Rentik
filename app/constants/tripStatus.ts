/**
 * Constantes y configuración de estados de viajes/reservas
 */

export type TripStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'denied';

export type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export interface StatusConfig {
  label: string;
  color: string;
  textColor: string;
  icon: string;
}

/**
 * Configuración visual para cada estado de viaje
 */
export const TRIP_STATUS_CONFIG: Record<TripStatus, StatusConfig> = {
  pending: {
    label: 'Pendiente',
    color: '#FEF9C3',
    textColor: '#854D0E',
    icon: 'time-outline'
  },
  confirmed: {
    label: 'Confirmado',
    color: '#DBEAFE',
    textColor: '#1E40AF',
    icon: 'checkmark-circle'
  },
  completed: {
    label: 'Completado',
    color: '#DCFCE7',
    textColor: '#166534',
    icon: 'checkmark-done-circle'
  },
  cancelled: {
    label: 'Cancelado',
    color: '#FEE2E2',
    textColor: '#991B1B',
    icon: 'close-circle'
  },
  denied: {
    label: 'Rechazado',
    color: '#FEE2E2',
    textColor: '#991B1B',
    icon: 'ban'
  }
};

/**
 * Configuración por defecto para estados desconocidos
 */
export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Desconocido',
  color: '#F3F4F6',
  textColor: '#374151',
  icon: 'help-circle'
};

/**
 * Obtiene la configuración de un estado
 */
export function getStatusConfig(status: string): StatusConfig {
  return TRIP_STATUS_CONFIG[status as TripStatus] || DEFAULT_STATUS_CONFIG;
}

/**
 * Verifica si un estado permite eliminar/archivar
 */
export function canDeleteTrip(status: TripStatus): boolean {
  return status === 'cancelled' || status === 'denied';
}

/**
 * Verifica si un estado debe mostrar el motivo
 */
export function shouldShowReason(status: TripStatus): boolean {
  return status === 'cancelled' || status === 'denied';
}

/**
 * Obtiene los estados que corresponden a cada filtro
 */
export function getStatusesForFilter(filter: FilterType): TripStatus[] | null {
  switch (filter) {
    case 'all':
      return null; // null significa todos
    case 'active':
      return ['pending', 'confirmed'];
    case 'completed':
      return ['completed'];
    case 'cancelled':
      return ['cancelled', 'denied'];
    default:
      return null;
  }
}
