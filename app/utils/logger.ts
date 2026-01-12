/**
 * Conditional Logger Utility
 * 
 * Eliminates console.log in production to prevent memory issues
 * and performance degradation on Android devices.
 * 
 * Usage:
 * - logger.log() - Development only
 * - logger.warn() - Development only  
 * - logger.error() - Always (production needs error tracking)
 * - logger.info() - Development only
 */

// @ts-ignore
const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log informational messages (dev only)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (dev only)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always - needed for crash reporting)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log info messages (dev only)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Group logs for better organization (dev only)
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * End log group (dev only)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Performance timing (dev only)
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * End performance timing (dev only)
   */
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

/**
 * Debug helper - always disabled in production
 */
export const debug = {
  enabled: isDevelopment,
  
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
};

export default logger;
