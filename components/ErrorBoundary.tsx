'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Could not clear storage:', e);
      }
      window.location.href = window.location.pathname;
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#080808] flex items-center justify-center p-4">
          <div className="w-full max-w-[500px] bg-[#0e0e11] border border-[#27272e] rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} />
            </div>

            <h2 className="text-lg font-bold text-white mb-1.5">
              Ocorreu uma instabilidade na aplicação
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              O sistema detectou uma exceção durante o carregamento dos componentes. Você pode tentar recarregar ou reiniciar a sessão.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3.5 rounded-xl bg-black/50 border border-[#222228] text-left overflow-x-auto">
                <p className="text-xs font-mono text-red-400 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw size={15} />
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-[#18181e] hover:bg-[#22222a] border border-[#2d2d38] text-zinc-300 hover:text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Limpar Cache e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
