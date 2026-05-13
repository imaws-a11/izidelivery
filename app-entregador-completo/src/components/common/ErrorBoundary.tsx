import React from 'react';
import { iziTelemetry } from '../../lib/telemetry';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        iziTelemetry.captureException(error, { 
            severity: 'fatal', 
            context: { componentStack: errorInfo.componentStack } 
        });
    }

    handleReset = () => {
        // Limpa caches que podem estar corrompidos e causando o crash
        const keysToKeep = ['izi_driver_online', 'pref_sound', 'pref_vibration', 'izi_driver_uid', 'izi_secure_token'];
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        window.location.href = '/';
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center overflow-auto font-sans">
                    <div className="size-20 rounded-[32px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-8 shadow-2xl">
                        <span className="material-symbols-outlined text-4xl text-rose-500">heart_broken</span>
                    </div>
                    
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Algo deu errado</h1>
                    <p className="text-zinc-500 text-[10px] font-bold mb-8 leading-relaxed uppercase tracking-[0.2em] px-4 max-w-xs">
                        A interface encontrou um erro inesperado. Tente reiniciar o aplicativo abaixo.
                    </p>
                    
                    <div className="w-full max-w-sm bg-zinc-900/50 border border-white/5 rounded-[32px] p-6 mb-10 text-left backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="size-2 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Detalhes do Erro</p>
                        </div>
                        <p className="text-rose-400 text-[11px] font-mono break-all leading-tight mb-3">
                            {this.state.error?.toString() || 'Erro desconhecido'}
                        </p>
                    </div>

                    <div className="w-full max-w-xs flex flex-col gap-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="h-16 bg-yellow-400 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] shadow-[0_20px_40px_rgba(250,204,21,0.2)] active:scale-95 transition-all border-t border-white/40"
                        >
                            Tentar Novamente
                        </button>
                        
                        <button 
                            onClick={this.handleReset}
                            className="h-14 bg-zinc-900 text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-[24px] border border-white/5 active:scale-95 transition-all"
                        >
                            Resetar Cache e Reiniciar
                        </button>
                    </div>

                    <p className="mt-12 text-[9px] font-black text-zinc-700 uppercase tracking-widest">Izi Delivery v0.1.0-alpha</p>
                </div>
            );
        }

        return this.props.children;
    }
}
