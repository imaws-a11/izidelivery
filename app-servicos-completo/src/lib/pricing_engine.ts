/**
 * Izi Pricing Engine - Core Logistics Algorithms
 * Responsável pelo cálculo dinâmico de fretes, fretamentos e split de pagamentos.
 * 
 * @author Izi Mobility Engineering
 * @version 1.0.0
 */

// --- Interfaces de Contrato ---

export interface PricingSplit {
  totalPrice: number;      // Valor final pago pelo cliente
  driverNetPay: number;    // Valor líquido para o motorista/prestador
  platformFee: number;     // Taxa de intermediação da plataforma (15%)
  breakdown: {
    serviceAmount: number; // Base + Distância + Paradas (sujeito à taxa)
    extrasAmount: number;  // Ajudantes, Escadas (100% repasse, sem taxa)
  };
}

export interface FreightParams {
  baseFare: number;        // Tarifa fixa do veículo (Fiorino, Caminhão, etc)
  distanceInKm: number;    // Distância total
  distanceRate: number;    // Valor por Km
  helperCount: number;     // Qtd ajudantes (0, 1 ou 2)
  helperRate: number;      // Fixo por ajudante
  hasStairs: boolean;      // Taxa de dificuldade (escada)
  stairsFee?: number;      // Valor opcional da taxa de escada (default: 30)
}

export interface VanParams {
  baseFare: number;        // Base pela capacidade (12, 15, 20 lug)
  distanceInKm: number;    // Distância (ignorado se for diária)
  distanceRate: number;    // Valor por Km
  stopCount: number;       // Paradas extras
  stopRate: number;        // Valor por parada
  isDaily: boolean;        // Modo Fretamento/Diária
  hours?: number;          // Horas contratadas na diária
  hourlyRate?: number;     // Valor da hora na diária
}

// --- Constantes de Negócio ---
const PLATFORM_FEE_PERCENT = 0.15; // 15% Izi Fee
const STAIRS_EXTRA_FEE = 30.00;    // Taxa padrão de escada

// --- Funções Auxiliares ---
const roundCurrency = (val: number): number => Math.round(val * 100) / 100;

/**
 * 1. CÁLCULO DE FRETE (Mudanças e Entregas Pesadas)
 * Matemática: Base + (Km * TaxaKm) + (Ajudantes * TaxaAjudante) + Escada
 */
export const calculateFreightPrice = (params: FreightParams): PricingSplit => {
  const { baseFare, distanceInKm, distanceRate, helperCount, helperRate, hasStairs, stairsFee = STAIRS_EXTRA_FEE } = params;

  // Parte 1: Valor de Serviço (Sujeito à Taxa da Plataforma)
  const serviceAmount = baseFare + (distanceInKm * distanceRate);
  
  // Parte 2: Valores de Repasse Direto (Mão de Obra Fixa, 100% Motorista)
  const helperCost = helperCount * helperRate;
  const stairsCost = hasStairs ? stairsFee : 0;
  const extrasAmount = helperCost + stairsCost;

  // Split Logic
  const platformFee = roundCurrency(serviceAmount * PLATFORM_FEE_PERCENT);
  const driverServiceShare = serviceAmount - platformFee;
  
  const totalPrice = roundCurrency(serviceAmount + extrasAmount);
  const driverNetPay = roundCurrency(driverServiceShare + extrasAmount);

  return {
    totalPrice,
    driverNetPay,
    platformFee,
    breakdown: {
      serviceAmount: roundCurrency(serviceAmount),
      extrasAmount: roundCurrency(extrasAmount)
    }
  };
};

/**
 * 2. CÁLCULO DE VAN (Transporte de Passageiros e Fretamento)
 * Matemática: Base + (Km * TaxaKm) + (Paradas * TaxaParada)
 * Se Diária: Horas * TaxaHora
 */
export const calculateVanPrice = (params: VanParams): PricingSplit => {
  const { baseFare, distanceInKm, distanceRate, stopCount, stopRate, isDaily, hours = 1, hourlyRate = 0 } = params;

  let serviceAmount = 0;

  if (isDaily) {
    // Lógica de Diária: Valor fixo por tempo + Base
    serviceAmount = baseFare + (hours * hourlyRate);
  } else {
    // Lógica de Viagem: Base + Distância + Paradas
    serviceAmount = baseFare + (distanceInKm * distanceRate) + (stopCount * stopRate);
  }

  // Na Van, geralmente 100% do valor entra no split padrão
  const platformFee = roundCurrency(serviceAmount * PLATFORM_FEE_PERCENT);
  const driverNetPay = roundCurrency(serviceAmount - platformFee);
  
  return {
    totalPrice: roundCurrency(serviceAmount),
    driverNetPay,
    platformFee,
    breakdown: {
      serviceAmount: roundCurrency(serviceAmount),
      extrasAmount: 0 // Vans raramente têm taxas de repasse direto estilo helper
    }
  };
};
