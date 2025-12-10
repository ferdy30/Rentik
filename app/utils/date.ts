/**
 * Utilidades para cálculos y formateo de fechas
 */

// Constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = MS_PER_SECOND * 60;
export const MS_PER_HOUR = MS_PER_MINUTE * 60;
export const MS_PER_DAY = MS_PER_HOUR * 24;

/**
 * Calcula el número de días entre dos fechas
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin
 * @returns Número de días (mínimo 1)
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / MS_PER_DAY);
  return Math.max(diffDays, 1);
}

/**
 * Calcula el tiempo restante hasta una fecha
 * @param targetDate Fecha objetivo
 * @returns Objeto con días, horas, minutos y segundos restantes
 */
export function calculateTimeUntil(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);

  return { days, hours, minutes, seconds, totalMs: diff };
}

/**
 * Formatea un tiempo restante de manera legible
 * @param targetDate Fecha objetivo
 * @returns String formateado (ej: "2 días 3 horas")
 */
export function formatTimeUntil(targetDate: Date): string {
  const { days, hours, minutes } = calculateTimeUntil(targetDate);

  if (days > 0) {
    return `${days} ${days === 1 ? 'día' : 'días'}${hours > 0 ? ` ${hours}h` : ''}`;
  }
  
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}${minutes > 0 ? ` ${minutes}m` : ''}`;
  }
  
  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  return 'Menos de 1 minuto';
}

/**
 * Formatea una fecha en español
 * @param date Fecha a formatear
 * @param format Formato deseado ('short', 'medium', 'long')
 * @returns String formateado
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    case 'long':
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    case 'medium':
    default:
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
  }
}

/**
 * Formatea una hora
 * @param date Fecha con la hora a formatear
 * @returns String formateado (ej: "14:30")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Formatea fecha y hora juntos
 * @param date Fecha a formatear
 * @returns String formateado (ej: "lun, 15 ene a las 14:30")
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} a las ${formatTime(date)}`;
}

/**
 * Verifica si una fecha está en el pasado
 * @param date Fecha a verificar
 * @returns true si la fecha ya pasó
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Verifica si una fecha está en el futuro
 * @param date Fecha a verificar
 * @returns true si la fecha aún no llega
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Verifica si una fecha es hoy
 * @param date Fecha a verificar
 * @returns true si la fecha es hoy
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Crea una fecha con hora específica
 * @param hour Hora (0-23)
 * @param minute Minuto (0-59)
 * @returns Nueva fecha con la hora especificada
 */
export function createDateWithTime(hour: number, minute: number = 0): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Agrega días a una fecha
 * @param date Fecha base
 * @param days Días a agregar (puede ser negativo)
 * @returns Nueva fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Obtiene el inicio del día (00:00:00)
 * @param date Fecha base
 * @returns Nueva fecha al inicio del día
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtiene el fin del día (23:59:59)
 * @param date Fecha base
 * @returns Nueva fecha al fin del día
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
