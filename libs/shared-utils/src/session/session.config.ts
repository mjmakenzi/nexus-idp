/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SessionConfig } from './session.interface';

export function sessionConfig(): SessionConfig {
  return {
    session: {
      maxSessionsPerUser: parseInt(
        process.env.MAX_SESSIONS_PER_USER || '5',
        10,
      ),
      maxSessionsPerDevice: parseInt(
        process.env.MAX_SESSIONS_PER_DEVICE || '3',
        10,
      ),
      enforceSessionLimits: process.env.ENFORCE_SESSION_LIMITS !== 'false',
      terminateOldestOnLimit: process.env.TERMINATE_OLDEST_ON_LIMIT !== 'false',
    },
  };
}
