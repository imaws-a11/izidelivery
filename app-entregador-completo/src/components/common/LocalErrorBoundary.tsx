import React from 'react';
import { iziTelemetry } from '../../lib/telemetry';
import Icon from './Icon';

interface Props {
    children: React.ReactNode;
    featureName: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class LocalErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        iziTelemetry.captureException(error, { 
            severity: 'error', 
            context: { 
                feature: this.props.featureName,
                componentStack: errorInfo.componentStack 
            } 
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 rounded-[32px] m-4 border-2 border-dashed border-zinc-200">
                    <div className="size-16 rounded-3xl bg-rose-50 flex items-center justify-center mb-6 shadow-sm">
                        <Icon name="error" className="text-rose-500" size={32} />
                    </div>
                    
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight leading-tight mb-2">
                        Falha no {this.props.featureName}
                    </h3>
                    
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-8 max-w-[200px]">
                        Não foi possível carregar esta aba. Tente recarregar apenas este módulo.
                    </p>
                    
                    <button 
                        onClick={this.handleRetry}
                        className="px-8 h-12 bg-zinc-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                    >
                        Tentar Recarregar
                    </button>
                    
                    <p className="mt-6 text-[8px] font-mono text-zinc-300 break-all px-4">
                        {this.state.error?.message}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
