export const ORDER_STATUS = {
  NOVO: 'novo',
  PREPARANDO: 'preparando',
  PENDENTE: 'pendente',
  PENDENTE_PAGAMENTO: 'pendente_pagamento',
  A_CAMINHO: 'a_caminho',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  novo: 'Novo Pedido',
  preparando: 'Preparando',
  pendente: 'Aguardando Motoboy',
  pendente_pagamento: 'Aguardando Pagamento',
  a_caminho: 'A Caminho',
  concluido: 'Entregue',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  novo: 'bg-blue-100 text-blue-600 border-blue-200',
  preparando: 'bg-orange-100 text-orange-600 border-orange-200',
  pendente: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  pendente_pagamento: 'bg-purple-100 text-purple-600 border-purple-200',
  a_caminho: 'bg-primary/20 text-primary border-primary/30',
  concluido: 'bg-green-100 text-green-600 border-green-200',
  cancelado: 'bg-red-100 text-red-600 border-red-200',
};
