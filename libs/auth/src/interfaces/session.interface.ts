export interface SessionConfig {
  session: {
    maxSessionsPerUser: number;
    sessionExpiryHours: number;
    maxSessionExpiryDays: number;
    enforceSessionLimits: boolean;
    terminateOldestOnLimit: boolean;
  };
}
