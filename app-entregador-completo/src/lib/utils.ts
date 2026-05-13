/**
 * Utilitários compartilhados do Izi Pilot
 */

export const normalizeServiceType = (type: string): string => {
    const t = String(type || '').toLowerCase();
    if (t.includes('moto') || t.includes('delivery')) return 'delivery';
    if (t.includes('car') || t.includes('ride') || t.includes('particular')) return 'car_ride';
    if (t.includes('freight') || t.includes('frete') || t.includes('truck')) return 'freight';
    return 'generic';
};

export const cleanAddressText = (value: string | undefined | null): string => {
    let raw = String(value || '').trim();
    if (raw.startsWith('{')) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.address) raw = parsed.address;
        } catch (e) {}
    }
    return raw.split('|')[0].trim();
};

export const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
};
