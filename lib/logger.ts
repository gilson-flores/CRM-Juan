// Logger and diagnostic telemetry utility for CRM JC Eletricista
export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details?: any;
}

const LOG_STORAGE_KEY = '@jc-eletricista:system_logs';
const MAX_LOGS = 50;

class DiagnosticLogger {
  private logs: SystemLog[] = [];
  private listeners: ((logs: SystemLog[]) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOG_STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        // ignore fallback
      }
    }
  }

  private addLog(level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) {
    const entry: SystemLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      source,
      message,
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : undefined,
    };

    this.logs = [entry, ...this.logs].slice(0, MAX_LOGS);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
      } catch (e) {
        // ignore
      }
    }

    this.notify();

    // Print with distinctive tag to console
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
    console.log(`${color}[JC-CRM-DIAG][${source}][${level.toUpperCase()}]\x1b[0m ${message}`, details || '');
  }

  info(source: string, message: string, details?: any) {
    this.addLog('info', source, message, details);
  }

  warn(source: string, message: string, details?: any) {
    this.addLog('warn', source, message, details);
  }

  error(source: string, message: string, details?: any) {
    this.addLog('error', source, message, details);
  }

  getLogs(): SystemLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOG_STORAGE_KEY);
    }
    this.notify();
  }

  subscribe(listener: (logs: SystemLog[]) => void) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.logs));
  }
}

export const logger = new DiagnosticLogger();
