/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SessionConfig } from '../interfaces/session.interface';

export function sessionConfig(): SessionConfig {
  return {
    session: {
      maxSessionsPerUser: parseInt(
        process.env.MAX_SESSIONS_PER_USER || '5',
        10,
      ),
      sessionExpiryHours: parseInt(
        process.env.SESSION_EXPIRY_HOURS || '24',
        10,
      ),
      maxSessionExpiryDays: parseInt(
        process.env.MAX_SESSION_EXPIRY_DAYS || '90',
        10,
      ),
      enforceSessionLimits: process.env.ENFORCE_SESSION_LIMITS !== 'false',
      terminateOldestOnLimit: process.env.TERMINATE_OLDEST_ON_LIMIT !== 'false',
    },
  };
}
