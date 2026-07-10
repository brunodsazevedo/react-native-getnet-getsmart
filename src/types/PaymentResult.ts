import type { PaymentResultCode, PaymentResultDetail } from './enums';

/**
 * Campos comuns à maioria das respostas de deeplink (Pagamento, Pré-autorização,
 * Estorno, Consulta Status, ...). Modelagem completa e específica por endpoint
 * (ex.: `automationPixSlip`, `splitPayloadResponse`) é escopo da Fase 1 — aqui
 * fica apenas o esqueleto exigido pela Fase 0 (FR-002).
 */
interface PaymentResultCommonFields {
  /** Valor formatado retornado pelo deeplink (12 dígitos, últimos 2 decimais). */
  amount?: string;
  resultDetails?: PaymentResultDetail;
  nsu?: string;
  brand?: string;
  automationSlip?: string;
}

export interface PaymentResultSuccess extends PaymentResultCommonFields {
  result: PaymentResultCode.SUCESSO;
}

export interface PaymentResultDenied extends PaymentResultCommonFields {
  result: PaymentResultCode.NEGADA;
}

export interface PaymentResultCancelled extends PaymentResultCommonFields {
  result: PaymentResultCode.CANCELADA;
}

export interface PaymentResultFailed extends PaymentResultCommonFields {
  result: PaymentResultCode.FALHA;
}

export interface PaymentResultUnknown extends PaymentResultCommonFields {
  result: PaymentResultCode.DESCONHECIDO;
}

export interface PaymentResultPending extends PaymentResultCommonFields {
  result: PaymentResultCode.PENDENTE;
}

/**
 * Union discriminada pelo campo `result` (Princípio II) — nunca um objeto
 * genérico com campos opcionais soltos. Os 6 códigos e o rótulo textual
 * espelhado em `resultDetails` vêm da "Tabela de Resultados das
 * Funcionalidades" (vault Docs SDK/00 e /02), fonte de verdade para todo
 * deeplink de pagamento.
 */
export type PaymentResult =
  | PaymentResultSuccess
  | PaymentResultDenied
  | PaymentResultCancelled
  | PaymentResultFailed
  | PaymentResultUnknown
  | PaymentResultPending;
