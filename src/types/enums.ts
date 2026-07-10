/** Forma de pagamento do deeplink `getnet://pagamento/...`. */
export enum PaymentType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  PIX = 'PIX',
}

/**
 * Código numérico de `result`, retornado por praticamente todo deeplink de
 * pagamento (Pagamento, Pré-autorização, Estorno, Consulta Status, ...).
 * Fonte: vault Docs SDK/00 e /02 § "Tabela de Resultados das Funcionalidades".
 */
export enum PaymentResultCode {
  SUCESSO = 0,
  NEGADA = 1,
  CANCELADA = 2,
  FALHA = 3,
  DESCONHECIDO = 4,
  PENDENTE = 5,
}

/**
 * Label textual de `resultDetails` — mesma informação de `PaymentResultCode`,
 * apenas codificada como string pelo deeplink (não é um motivo específico
 * separado; é a contraparte textual do código numérico).
 * Fonte: vault Docs SDK/00 e /02 § "Tabela de Resultados das Funcionalidades".
 */
export enum PaymentResultDetail {
  SUCESSO = 'SUCESSO',
  NEGADA = 'NEGADA',
  CANCELADA = 'CANCELADA',
  FALHA = 'FALHA',
  DESCONHECIDO = 'DESCONHECIDO',
  PENDENTE = 'PENDENTE',
}
