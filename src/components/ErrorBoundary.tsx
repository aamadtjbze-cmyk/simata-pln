import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import PLNLogo from './PLNLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SIMATA PLN Uncaught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.removeItem('simata_visitors');
      localStorage.removeItem('simata_notifications');
      localStorage.removeItem('simata_dark_mode');
      localStorage.removeItem('simata_theme');
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#111c30] border-2 border-[#005DA6] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
              <PLNLogo showText={false} size="sm" />
              <div>
                <span className="text-[10px] font-mono font-bold text-[#FFD500] uppercase tracking-widest block">
                  SIMATA v2 PLN UIK TJB
                </span>
                <h3 className="text-base font-black text-white uppercase">
                  Pemulihan Sistem Otomatis
                </h3>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-800 text-xs text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert size={16} />
                <span>Terjadi kendala saat memuat antarmuka</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono break-words">
                {this.state.error?.message || 'Error tidak diketahui saat inisialisasi'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 bg-[#005DA6] hover:bg-[#004070] text-white font-bold text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                Muat Ulang Halaman
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} className="text-amber-400" />
                Bersihkan Cache & Buka Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
