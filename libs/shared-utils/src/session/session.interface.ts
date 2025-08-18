export interface SessionConfig {
  session: {
    maxSessionsPerUser: number;
    maxSessionsPerDevice: number;
    enforceSessionLimits: boolean;
    terminateOldestOnLimit: boolean;
  };
}
