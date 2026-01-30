export interface DiagnosticsPayload {
  event: string;
  level?: 'info' | 'warn' | 'error';
  source?: string;
  data?: Record<string, unknown>;
}

export interface DiagnosticsResult {
  status: 'pushed' | 'skipped';
  path?: string;
  reason?: string;
}
