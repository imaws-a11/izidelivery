import * as Sentry from "@sentry/react";

/**
 * IziTelemetry - Central de Monitoramento e Logs
 * Integrado com Sentry para reporte de crashes em produção.
 */

type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

interface LogOptions {
    severity?: ErrorSeverity;
    context?: Record<string, any>;
}

const severityToSentryLevel = (severity: ErrorSeverity): Sentry.SeverityLevel => {
    switch (severity) {
        case 'fatal': return 'fatal';
        case 'error': return 'error';
        case 'warning': return 'warning';
        case 'info': return 'info';
        default: return 'error';
    }
};

export const iziTelemetry = {
    /**
     * Captura uma exceção e envia para o Sentry.
     */
    captureException: (error: any, options: LogOptions = {}) => {
        const { severity = 'error', context = {} } = options;
        
        console.group(`[TELEMETRY] ${severity.toUpperCase()}: ${error.message || error}`);
        console.error('Error Object:', error);
        if (Object.keys(context).length > 0) {
            console.table(context);
        }
        console.groupEnd();

        // Envia para o Sentry
        Sentry.captureException(error, { 
            level: severityToSentryLevel(severity), 
            extra: context 
        });
    },

    /**
     * Loga um evento ou mensagem importante como Breadcrumb no Sentry.
     */
    log: (message: string, options: LogOptions = {}) => {
        const { severity = 'info', context = {} } = options;
        
        console.log(`[TELEMETRY] ${severity.toUpperCase()}: ${message}`, context);
        
        // Adiciona um breadcrumb no Sentry para facilitar o debug de crashes
        Sentry.addBreadcrumb({
            category: 'app',
            message: message,
            level: severityToSentryLevel(severity),
            data: context
        });
    }
};

