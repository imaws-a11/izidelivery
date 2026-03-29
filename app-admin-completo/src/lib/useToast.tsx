import React, { useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

let globalShowToast: ((msg: string, type?: ToastType) => void) | null = null;
let globalShowConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;
let globalShowPrompt: ((msg: string, placeholder?: string) => Promise<string | null>) | null = null;

// Funções globais que substituem alert(), confirm() e prompt()
export const toast = (message: string, type: ToastType = 'info') => {
  globalShowToast?.(message, type);
};
export const toastSuccess = (message: string) => toast(message, 'success');
export const toastError = (message: string) => toast(message, 'error');
export const toastWarning = (message: string) => toast(message, 'warning');
export const toastInfo = (message: string) => toast(message, 'info');

export const showConfirm = (opts: ConfirmOptions): Promise<boolean> =>
  globalShowConfirm ? globalShowConfirm(opts) : Promise.resolve(window.confirm(opts.message));

export const showPrompt = (message: string, placeholder?: string): Promise<string | null> =>
  globalShowPrompt ? globalShowPrompt(message, placeholder) : Promise.resolve(window.prompt(message));

const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#EAF3DE', border: '#C0DD97', icon: 'check_circle', text: '#27500A' },
  error:   { bg: '#FCEBEB', border: '#F7C1C1', icon: 'error',        text: '#791F1F' },
  warning: { bg: '#FAEEDA', border: '#FAC775', icon: 'warning',       text: '#633806' },
  info:    { bg: '#E6F1FB', border: '#B5D4F4', icon: 'info',          text: '#0C447C' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const [promptState, setPromptState] = useState<{
    message: string;
    placeholder?: string;
    resolve: (v: string | null) => void;
  } | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const openConfirm = useCallback((opts: ConfirmOptions) =>
    new Promise<boolean>(resolve => setConfirm({ opts, resolve })), []);

  const openPrompt = useCallback((message: string, placeholder?: string) =>
    new Promise<string | null>(resolve => {
      setPromptValue('');
      setPromptState({ message, placeholder, resolve });
    }), []);

  globalShowToast = addToast;
  globalShowConfirm = openConfirm;
  globalShowPrompt = openPrompt;

  return (
    <>
      {children}

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', animation: 'slideIn 0.2s ease' }}>
              <span className="material-symbols-outlined" style={{ color: c.text, fontSize: 20 }}>{c.icon}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.text, margin: 0, lineHeight: 1.4 }}>{t.message}</p>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6, padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {confirm.opts.title && <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>{confirm.opts.title}</h3>}
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 24 }}>{confirm.opts.message}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { confirm.resolve(false); setConfirm(null); }} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #ddd', background: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#555' }}>
                {confirm.opts.cancelLabel ?? 'Cancelar'}
              </button>
              <button onClick={() => { confirm.resolve(true); setConfirm(null); }} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: confirm.opts.danger ? '#E24B4A' : '#ffd900', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: confirm.opts.danger ? 'white' : '#111' }}>
                {confirm.opts.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Dialog */}
      {promptState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 16 }}>{promptState.message}</p>
            <input
              autoFocus
              value={promptValue}
              onChange={e => setPromptValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { promptState.resolve(promptValue || null); setPromptState(null); } if (e.key === 'Escape') { promptState.resolve(null); setPromptState(null); } }}
              placeholder={promptState.placeholder ?? ''}
              style={{ width: '100%', border: '1px solid #ddd', borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { promptState.resolve(null); setPromptState(null); }} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #ddd', background: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={() => { promptState.resolve(promptValue || null); setPromptState(null); }} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#ffd900', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#111' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </>
  );
}
