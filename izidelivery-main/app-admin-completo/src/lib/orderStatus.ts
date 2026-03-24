export const ORDER_STATUS = {
  NOVO: 'novo',
  WAITING_MERCHANT: 'waiting_merchant',
  AGENDADO: 'agendado',
  PREPARANDO: 'preparando',
  PRONTO: 'pronto',
  PENDENTE: 'pendente',
  PENDENTE_PAGAMENTO: 'pendente_pagamento',
  A_CAMINHO: 'a_caminho',
  SAIU_PARA_ENTREGA: 'saiu_para_entrega',
  NO_LOCAL: 'no_local',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  novo: 'Novo Pedido',
  waiting_merchant: 'Aguardando Lojista',
  agendado: 'Agendado',
  preparando: 'Preparando',
  pronto: 'Pronto para Coleta',
  pendente: 'Aguardando Motoboy',
  pendente_pagamento: 'Aguardando Pagamento',
  a_caminho: 'A Caminho',
  saiu_para_entrega: 'Saiu para Entrega',
  no_local: 'No Local',
  concluido: 'Entregue',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  novo: 'bg-blue-100 text-blue-600 border-blue-200',
  waiting_merchant: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  agendado: 'bg-sky-100 text-sky-600 border-sky-200',
  preparando: 'bg-orange-100 text-orange-600 border-orange-200',
  pronto: 'bg-amber-100 text-amber-600 border-amber-200',
  pendente: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  pendente_pagamento: 'bg-purple-100 text-purple-600 border-purple-200',
  a_caminho: 'bg-primary/20 text-primary border-primary/30',
  saiu_para_entrega: 'bg-teal-100 text-teal-600 border-teal-200',
  no_local: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  concluido: 'bg-green-100 text-green-600 border-green-200',
  cancelado: 'bg-red-100 text-red-600 border-red-200',
};

