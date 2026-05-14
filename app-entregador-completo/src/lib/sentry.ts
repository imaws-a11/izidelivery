import * as Sentry from "@sentry/react";

export const initSentry = () => {
 const dsn = import.meta.env.VITE_SENTRY_DSN;
 
 if (!dsn) {
 console.warn("[SENTRY] DSN não encontrado. O monitoramento de erros está desativado.");
 return;
 }

 Sentry.init({
 dsn,
 integrations: [
 Sentry.browserTracingIntegration(),
 Sentry.replayIntegration(),
 ],
 // Performance Monitoring
 tracesSampleRate: 1.0, 
 // Session Replay
 replaysSessionSampleRate: 0.1,
 replaysOnErrorSampleRate: 1.0,
 environment: import.meta.env.MODE,
 });

 console.log("[SENTRY] Inicializado com sucesso.");
};
