import type { PaymentType } from './enums';

/**
 * Esqueleto do pedido de pagamento via deeplink. Campos específicos por
 * método (`pay`, `refund`, ...) chegam na Fase 1 do roadmap.
 */
export interface PaymentRequest {
  /** Valor em centavos. */
  amount: number;
  paymentType: PaymentType;
  /** Número de parcelas; ausente equivale a 1 (à vista). */
  installments?: number;
}
