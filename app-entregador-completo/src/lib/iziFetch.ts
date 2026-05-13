/**
 * IziFetch - API Wrapper Resiliente
 * Implementa Timeout e Exponential Backoff para falhas de rede.
 */

export interface IziFetchOptions extends RequestInit {
    timeoutMs?: number;
    retries?: number;
    baseDelayMs?: number;
}

export class NetworkError extends Error {
    constructor(message: string, public status?: number, public response?: Response) {
        super(message);
        this.name = 'NetworkError';
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const iziFetch = async (url: string, options: IziFetchOptions = {}): Promise<Response> => {
    const {
        timeoutMs = 12000, // 12 segundos de limite
        retries = 2,       // 2 tentativas extras (3 total)
        baseDelayMs = 1000,
        ...fetchOptions
    } = options;

    let attempt = 0;

    while (attempt <= retries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Não aplica retry para erros que são de negócio (400, 401, 403, 404, etc)
            // Somente falhas de infra / servidor (5xx) ou rede (429 - Too Many Requests)
            if (!response.ok && response.status >= 500) {
                throw new NetworkError(`Server error: ${response.status}`, response.status, response);
            }

            return response;

        } catch (error: any) {
            clearTimeout(timeoutId);

            const isAbort = error.name === 'AbortError';
            const isNetworkError = error instanceof NetworkError;
            
            // Verifica se é um erro recuperável ou de conexão perdida
            const isRecoverable = isAbort || isNetworkError || error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('failed to fetch');

            if (attempt < retries && isRecoverable) {
                attempt++;
                // Exponential backoff: 1s, 2s, 4s...
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                console.warn(`[iziFetch] Tentativa ${attempt} falhou. Tentando novamente em ${delay}ms... URL: ${url}`);
                await sleep(delay);
                continue;
            }

            // Se esgotou as tentativas ou o erro não é recuperável, joga para frente
            if (isAbort) {
                throw new NetworkError('A conexão expirou (Timeout). Verifique sua internet.', 408);
            }

            throw new NetworkError(error.message || 'Falha de conexão', undefined, error.response);
        }
    }

    throw new NetworkError('Máximo de tentativas excedido.');
};
