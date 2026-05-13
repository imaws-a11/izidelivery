import { iziFetch, NetworkError } from '../src/lib/iziFetch';

async function simulateNetworkTest() {
    console.log("--- Iniciando Simulação de Resiliência iziFetch ---");

    // Mock global fetch
    const originalFetch = global.fetch;

    // Teste 1: Sucesso na primeira tentativa
    console.log("\n[Teste 1] Sucesso imediato:");
    global.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
    try {
        const res = await iziFetch("https://api.test/success");
        console.log("Resultado Teste 1:", await res.json());
    } catch (e) {
        console.error("Teste 1 falhou!", e);
    }

    // Teste 2: Falha na primeira, sucesso na segunda (Backoff)
    console.log("\n[Teste 2] Falha seguida de sucesso:");
    let attempts = 0;
    global.fetch = async () => {
        attempts++;
        if (attempts === 1) throw new Error("Failed to fetch");
        return new Response(JSON.stringify({ ok: true, attempts }), { status: 200 });
    };
    try {
        const res = await iziFetch("https://api.test/retry", { baseDelayMs: 100 });
        console.log("Resultado Teste 2:", await res.json());
    } catch (e) {
        console.error("Teste 2 falhou!", e);
    }

    // Teste 3: Timeout
    console.log("\n[Teste 3] Simulação de Timeout:");
    global.fetch = async (url, options) => {
        return new Promise((_, reject) => {
            options?.signal?.addEventListener('abort', () => {
                reject(new Error("AbortError"));
            });
        });
    };
    try {
        await iziFetch("https://api.test/timeout", { timeoutMs: 500, retries: 0 });
    } catch (e: any) {
        console.log("Resultado Teste 3 (Esperado Timeout):", e.message);
    }

    // Restaurar fetch
    global.fetch = originalFetch;
    console.log("\n--- Simulação Concluída ---");
}

// Para rodar este script: npx tsx scratch/test_iziFetch.ts
simulateNetworkTest();
