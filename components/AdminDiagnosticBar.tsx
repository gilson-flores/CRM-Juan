'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Terminal, Trash2, X, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { logger, type SystemLog } from '@/lib/logger';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function AdminDiagnosticBar({ userEmail }: { userEmail?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'checking' | 'error'>('checking');
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Check if current user is admin/owner
  const isAdmin = userEmail && (
    userEmail.toLowerCase().includes('admin') ||
    userEmail.toLowerCase().includes('adm') ||
    userEmail.toLowerCase().includes('gilson') ||
    userEmail.toLowerCase().includes('suporte')
  );

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to real-time diagnostic logs
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // Test Firestore Latency & Connection
    const testLatency = async () => {
      setDbStatus('checking');
      const start = performance.now();
      try {
        await getDoc(doc(db, 'company_settings', 'main'));
        const end = performance.now();
        const ping = Math.round(end - start);
        setLatency(ping);
        setDbStatus('online');
        logger.info('Firestore', `Conexão ativa. Latência: ${ping}ms`);
      } catch (err: any) {
        setDbStatus('error');
        logger.error('Firestore', 'Falha ao conectar no Firestore', err?.message || err);
      }
    };

    testLatency();
    const interval = setInterval(testLatency, 30000); // ping every 30s

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <>
      {/* Floating Mini Badge */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121216]/95 border border-[#3b82f6]/40 text-blue-400 hover:text-white shadow-2xl backdrop-blur-md transition-all text-xs font-mono font-medium hover:border-blue-500 cursor-pointer"
          title="Painel de Diagnóstico & Status Master (Admin)"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus === 'online' ? 'bg-emerald-400' : dbStatus === 'error' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus === 'online' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
          </span>
          <ShieldCheck size={14} className="text-blue-400" />
          <span className="font-bold tracking-wider text-[11px]">ADMIN DIAG</span>
          {latency !== null && (
            <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
              {latency}ms
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded-full font-bold">
              {errorCount} err
            </span>
          )}
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Expanded Diagnostic Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-[92vw] max-w-[480px] max-h-[500px] bg-[#0c0c10] border border-[#262630] rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#121218] border-b border-[#22222a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Console de Diagnóstico Master</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => logger.clearLogs()}
                className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Limpar Logs"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#0a0a0d] border-b border-[#1c1c24] text-center">
            <div className="bg-[#14141c] p-2 rounded-xl border border-[#20202a]">
              <span className="block text-[10px] text-zinc-400 uppercase font-semibold">Firestore</span>
              <span className={`text-xs font-bold font-mono ${dbStatus === 'online' ? 'text-emerald-400' : dbStatus === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                {dbStatus === 'online' ? 'CONECTADO' : dbStatus === 'error' ? 'FALHA' : 'TESTANDO...'}
              </span>
            </div>
            <div className="bg-[#14141c] p-2 rounded-xl border border-[#20202a]">
              <span className="block text-[10px] text-zinc-400 uppercase font-semibold">Ping Latência</span>
              <span className="text-xs font-bold font-mono text-blue-400">
                {latency !== null ? `${latency} ms` : '--'}
              </span>
            </div>
            <div className="bg-[#14141c] p-2 rounded-xl border border-[#20202a]">
              <span className="block text-[10px] text-zinc-400 uppercase font-semibold">Erros / Alertas</span>
              <span className="text-xs font-bold font-mono text-zinc-300">
                <span className={errorCount > 0 ? 'text-red-400' : 'text-zinc-500'}>{errorCount}</span> / <span className={warnCount > 0 ? 'text-amber-400' : 'text-zinc-500'}>{warnCount}</span>
              </span>
            </div>
          </div>

          {/* Log Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] font-mono text-[11px] select-text">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                Nenhum erro ou evento registrado no momento. Sistema operando perfeitamente.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border text-left flex flex-col gap-1 ${
                    log.level === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : log.level === 'warn'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-[#14141a] border-[#22222c] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75">
                    <span className="flex items-center gap-1 font-bold">
                      {log.level === 'error' && <AlertCircle size={11} className="text-red-400" />}
                      {log.level === 'warn' && <AlertTriangle size={11} className="text-amber-400" />}
                      {log.level === 'info' && <CheckCircle2 size={11} className="text-blue-400" />}
                      [{log.source}]
                    </span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="font-semibold break-words leading-tight">{log.message}</div>
                  {log.details && (
                    <div className="text-[10px] text-zinc-400 bg-black/40 p-1.5 rounded break-all whitespace-pre-wrap">
                      {log.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-[#09090c] border-t border-[#1a1a22] text-[10px] text-zinc-400 flex items-center justify-between px-3">
            <span>Sessão Admin: <strong className="text-white">{userEmail}</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Activity size={12} /> Live Telemetry
            </span>
          </div>
        </div>
      )}
    </>
  );
}
