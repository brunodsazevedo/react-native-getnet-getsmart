import { describe, expect, it } from '@jest/globals';
import { PaymentResultCode, PaymentResultDetail } from '../types/enums';
import type { PaymentResult } from '../types/PaymentResult';

// Exhaustive switch (sem `default`) — se uma variante do union for esquecida,
// o compilador falha aqui antes de qualquer teste rodar.
function describeResult(result: PaymentResult): string {
  switch (result.result) {
    case PaymentResultCode.SUCESSO:
      return `sucesso:${result.nsu ?? ''}`;
    case PaymentResultCode.NEGADA:
      return `negada:${result.resultDetails ?? ''}`;
    case PaymentResultCode.CANCELADA:
      return `cancelada:${result.resultDetails ?? ''}`;
    case PaymentResultCode.FALHA:
      return `falha:${result.resultDetails ?? ''}`;
    case PaymentResultCode.DESCONHECIDO:
      return `desconhecido:${result.resultDetails ?? ''}`;
    case PaymentResultCode.PENDENTE:
      return `pendente:${result.resultDetails ?? ''}`;
  }
}

describe('PaymentResult', () => {
  it('narrows the SUCESSO variant (result=0) to its fields', () => {
    const result: PaymentResult = {
      result: PaymentResultCode.SUCESSO,
      resultDetails: PaymentResultDetail.SUCESSO,
      nsu: '000000443',
      brand: 'MASTERCARD',
      amount: '000000001234',
      automationSlip: '{}',
    };

    expect(describeResult(result)).toBe('sucesso:000000443');
  });

  it('narrows the NEGADA variant (result=1)', () => {
    const result: PaymentResult = {
      result: PaymentResultCode.NEGADA,
      resultDetails: PaymentResultDetail.NEGADA,
    };

    expect(describeResult(result)).toBe('negada:NEGADA');
  });

  it('narrows the CANCELADA variant (result=2), tolerating an absent resultDetails', () => {
    const result: PaymentResult = { result: PaymentResultCode.CANCELADA };

    expect(describeResult(result)).toBe('cancelada:');
  });

  it('narrows the FALHA variant (result=3)', () => {
    const result: PaymentResult = {
      result: PaymentResultCode.FALHA,
      resultDetails: PaymentResultDetail.FALHA,
    };

    expect(describeResult(result)).toBe('falha:FALHA');
  });

  it('narrows the DESCONHECIDO variant (result=4)', () => {
    const result: PaymentResult = {
      result: PaymentResultCode.DESCONHECIDO,
      resultDetails: PaymentResultDetail.DESCONHECIDO,
    };

    expect(describeResult(result)).toBe('desconhecido:DESCONHECIDO');
  });

  it('narrows the PENDENTE variant (result=5) — status típico de Pix aguardando confirmação', () => {
    const result: PaymentResult = {
      result: PaymentResultCode.PENDENTE,
      resultDetails: PaymentResultDetail.PENDENTE,
    };

    expect(describeResult(result)).toBe('pendente:PENDENTE');
  });

  it('mantém o valor numérico real de result conforme a doc da Getnet (0–5)', () => {
    expect(PaymentResultCode.SUCESSO).toBe(0);
    expect(PaymentResultCode.NEGADA).toBe(1);
    expect(PaymentResultCode.CANCELADA).toBe(2);
    expect(PaymentResultCode.FALHA).toBe(3);
    expect(PaymentResultCode.DESCONHECIDO).toBe(4);
    expect(PaymentResultCode.PENDENTE).toBe(5);
  });
});
