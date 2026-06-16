type LogLevel = 'info' | 'warn' | 'error' | 'llm' | 'phase' | 'score' | 'fallback';

const EMOJI: Record<LogLevel, string> = {
  info: '📋', warn: '⚠️', error: '❌', llm: '🤖', phase: '🔄', score: '📊', fallback: '🛟',
};

export function log(level: LogLevel, module: string, message: string, data?: unknown) {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = `${EMOJI[level]} [${ts}] [${module}]`;
  if (data !== undefined) {
    console.log(prefix, message, typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : data);
  } else {
    console.log(prefix, message);
  }
}

// Store mutation logs
export function logPhase(from: string, to: string) {
  log('phase', 'Store', `${from} → ${to}`);
}

export function logScore(questionId: string, dims: Record<string, number>) {
  log('score', 'Engine', `Q:${questionId}`, dims);
}

export function logLLM(task: string, status: 'start' | 'ok' | 'fail', detail?: string) {
  log('llm', 'DeepSeek', `${task}: ${status}${detail ? ` (${detail})` : ''}`);
}

export function logFallback(reason: string) {
  log('fallback', 'System', reason);
}

export function logError(module: string, error: unknown) {
  log('error', module, (error as Error).message || String(error));
}
