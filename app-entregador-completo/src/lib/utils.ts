/**
 * Utilitários compartilhados do Izi Pilot
 */

// Normaliza aliases variados de service_type que vêm do banco de dados para os tipos canônicos
export const normalizeServiceType = (raw: string | undefined | null): string => {
    if (!raw) return 'delivery';
    try {
        const t = String(raw).toLowerCase().trim();
        // Tipos de comida / restaurante
        if (['restaurant', 'restaurante', 'food', 'hamburguer', 'hamburger', 'burger',
             'lanchonete', 'lanche', 'pizzaria', 'pizza', 'sushi', 'japanese',
             'churrasco', 'grill', 'culinaria', 'culinária', 'refeicao', 'refeição'].includes(t)) return 'restaurant';
        // Mercado / supermercado
        if (['market', 'mercado', 'supermercado', 'hortifruti'].includes(t)) return 'market';
        // Farmácia / saúde
        if (['pharmacy', 'farmacia', 'farmácia', 'saude', 'saúde', 'health'].includes(t)) return 'pharmacy';
        if (['beverages', 'bebidas', 'drinks', 'bar'].includes(t)) return 'beverages';
        // Mobilidade
        if (['mototaxi', 'moto_taxi', 'motortaxi'].includes(t)) return 'mototaxi';
        if (['car_ride', 'carro', 'taxi', 'car', 'ride'].includes(t)) return 'car_ride';
        if (['motorista_particular', 'motorista particular', 'chauffeur'].includes(t)) return 'motorista_particular';
        // Logística
        if (['van'].includes(t)) return 'van';
        if (['utilitario', 'utilitario leve', 'utility'].includes(t)) return 'utilitario';
        if (['logistica', 'logistics'].includes(t)) return 'logistica';
        if (['frete', 'carreto', 'freight', 'mudanca', 'mudança'].includes(t)) return 'frete';
        if (['motoboy', 'courier', 'moto', 'motoboy_express', 'entrega_avulsa'].includes(t)) return 'motoboy';
        if (['package', 'pacote', 'encomenda', 'express', 'delivery'].includes(t)) return 'package';
        return t;
    } catch (e) {
        return 'delivery';
    }
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
