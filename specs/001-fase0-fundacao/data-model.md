# Data Model: Fase 0 — Fundação

Esta feature não envolve persistência; "dados" aqui são os tipos do contrato JS público
(domínio de pagamento) e os parâmetros de configuração do Expo config plugin.

## PaymentRequest

Esqueleto do tipo de entrada do fluxo de pagamento via deeplink. A Fase 1 expande os campos
concretos por método (`pay`, `refund`, ...); nesta fase apenas a forma base é definida para
permitir que `PaymentResult` já componha com ela sem retrabalho.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `amount` | `number` | sim | valor em centavos (padrão de integrações de pagamento) |
| `paymentType` | enum `PaymentType` | sim | crédito / débito / Pix — enum a definir nesta fase |
| `installments` | `number` | não | default `1` quando ausente |

## PaymentResult (union discriminada por `result`)

Representa o retorno do deeplink `getnet://pagamento/...`, parseado dos extras do
`onActivityResult`. **Union discriminada** (Princípio II) — nunca um objeto genérico com
campos opcionais soltos.

**Correção pós-acesso ao vault (2026-07-10)**: `result` é o código **numérico** (0–5)
retornado por praticamente todo deeplink; `resultDetails` é apenas o **rótulo textual** do
mesmo código (não um motivo específico à parte). Fonte: vault `Docs SDK/00` e `Docs SDK/02`
§ "Tabela de Resultados das Funcionalidades" — confirmada em duas notas independentes do
vault, idêntica nas duas.

```text
type PaymentResult =
  | PaymentResultSuccess    // result = 0
  | PaymentResultDenied     // result = 1
  | PaymentResultCancelled  // result = 2
  | PaymentResultFailed     // result = 3
  | PaymentResultUnknown    // result = 4
  | PaymentResultPending    // result = 5
```

| Variante | `result` (`PaymentResultCode`) | `resultDetails` esperado |
|---|---|---|
| `PaymentResultSuccess` | `0` | `SUCESSO` |
| `PaymentResultDenied` | `1` | `NEGADA` |
| `PaymentResultCancelled` | `2` | `CANCELADA` |
| `PaymentResultFailed` | `3` | `FALHA` |
| `PaymentResultUnknown` | `4` | `DESCONHECIDO` |
| `PaymentResultPending` | `5` | `PENDENTE` (típico de Pix aguardando confirmação — ver Consulta Status) |

Campos comuns a todas as variantes (via interseção): `amount?`, `resultDetails?`, `nsu?`,
`brand?`, `automationSlip?` — modelagem completa e específica por endpoint (ex.:
`automationPixSlip`, `splitPayloadResponse`, `type`, `callerId`) é escopo da Fase 1; aqui
fica apenas o esqueleto exigido pela Fase 0 (FR-002).

## Enums

- **`PaymentType`**: `CREDIT | DEBIT | PIX` (fonte: tabela de métodos do vault `Docs SDK/00`).
- **`PaymentResultCode`** (valor numérico de `result`): `SUCESSO=0 | NEGADA=1 | CANCELADA=2 |
  FALHA=3 | DESCONHECIDO=4 | PENDENTE=5`.
- **`PaymentResultDetail`** (valor textual de `resultDetails`, espelhando `PaymentResultCode`):
  `SUCESSO | NEGADA | CANCELADA | FALHA | DESCONHECIDO | PENDENTE`.

## Config Plugin Props (app.json)

Parâmetros lidos pelo plugin sob a chave `["react-native-getnet-getsmart", { ... }]` em
`app.json`.

| Prop | Tipo | Obrigatório | Efeito |
|---|---|---|---|
| `posDigitalAarPath` | `string` | sim (para builds com hardware) | caminho do `.aar` a ser injetado no build Android |
| `priority_pay` | `boolean` | não (default `false`) | metadado de manifest opt-in |
| `allow_print_permission` | `boolean` | não (default `false`) | metadado de manifest opt-in |
| `kiosk_mode` | `boolean` | não (default `false`) | metadado de manifest opt-in |

## Guard de plataforma (fail-fast)

Não é uma entidade de dado, mas parte do contrato comportamental: qualquer chamada à API
nativa da lib em uma plataforma que não seja `android` MUST lançar um erro síncrono e
explícito antes de qualquer tentativa de acessar o TurboModule nativo.
