# Implementation Plan: Fase 0 — Fundação (react-native-getnet-getsmart)

**Branch**: `feature/001-fase0-fundacao` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fase0-fundacao/spec.md`

## Summary

Fechar a Fase 0 do roadmap: (1) registrar o padrão de estrutura por domínio no `CLAUDE.md`,
criar o esqueleto do domínio de pagamento (`src/payment/`, `src/types/` com
`PaymentRequest`/`PaymentResult` como union discriminada) e remover completamente o scaffold
iOS herdado do `create-react-native-library`, com guard fail-fast para plataformas
não-Android; (2) construir o Expo config plugin (`plugin/`) que injeta no
`AndroidManifest.xml` do app consumidor as queries/permissão do serviço `PosDigital`, props
opt-in, assinatura V1+V2 e a resolução do `.aar` (via `posDigitalAarPath` no Expo e
`GETNET_POSDIGITAL_AAR` em `gradle.properties` no bare RN), falhando com mensagem amigável
quando o `.aar` estiver ausente.

## Technical Context

**Language/Version**: TypeScript 6 (strict) para a camada JS pública e o config plugin;
Kotlin para o guard nativo Android (zero Java novo, Princípio VII da constituição). Node
pinado em `.nvmrc`.

**Primary Dependencies**: React Native 0.83.6 (New Architecture/TurboModules + Codegen),
`react-native-builder-bob` 0.43 (build da lib), `@expo/config-plugins` (implementação do
plugin — dependência padrão do ecossistema Expo para este tipo de integração), Jest +
`@react-native/jest-preset` (testes), ESLint (`@react-native/eslint-config`).

**Storage**: N/A — não há persistência; o único "dado" externo é o `.aar` fornecido pelo
consumidor (arquivo binário resolvido via caminho de build, nunca commitado).

**Testing**: Jest com mocks (Princípio III/V — sem terminal físico disponível). Tipos
(`PaymentResult`) verificados por `yarn typecheck`. O config plugin é testado via
`npx expo prebuild` num fixture de app Expo e inspeção do `AndroidManifest.xml`/`build.gradle`
gerados (sem depender do `.aar` real, RNF-02 do PRD).

**Target Platform**: Android-only (Princípio VI). `minSdkVersion 24`. Consumidores Expo
(SDK 55, via config plugin) e bare RN (via `gradle.properties`), com paridade funcional entre
os dois caminhos.

**Project Type**: Biblioteca React Native (Turbo Module) + Expo config plugin — não é
aplicação web/mobile própria; o `example/` é o harness de validação.

**Performance Goals**: N/A no sentido de runtime (esta feature não tem hot path de execução);
o critério relevante é tempo de build/feedback — falha por `.aar` ausente MUST ser reportada
em menos de 1 minuto de build Gradle (SC-003).

**Constraints**: Zero `any` (Princípio II); 100% de cobertura das funções exportadas
(Princípio III); nenhum binário da Getnet commitado (Princípio VIII / FR-014); CI atual
MUST permanecer verde, exceto a remoção do job `build-ios` (RNF-01 do PRD / FR-016); nenhuma
pasta além de `src/payment/`, `src/types/`, `plugin/`, `android/libs/` criada nesta fase
(Princípio VII / FR-004).

**Scale/Scope**: Uma feature fechando toda a Fase 0 (Blocos A e B do PRD): 4 itens de
estrutura/domínio/iOS + 8 itens do config plugin. Sem métodos de pagamento reais, sem
conexão `PosDigital`/impressora (Fase 1/2).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Gate | Status |
|---|---|---|
| I. TurboModules only | Esta feature não adiciona novo método nativo à Spec `.ts`; o guard de plataforma é um check em JS/nativo existente, não um novo TurboModule. Nenhuma superfície Bridge legada introduzida. | PASS |
| II. TypeScript strict, zero `any` | `PaymentResult`/`PaymentRequest` MUST ser unions discriminadas; nenhum `any` introduzido; exceções só com `// EXCEPTION: <motivo>`. | PASS (gate a verificar no code review) |
| III. TDD | Testes de tipos (`typecheck`) e do config plugin (fixture + inspeção de manifest) MUST ser escritos antes da implementação, cobrindo 100% das funções exportadas desta feature. | PASS (a aplicar na fase de tasks) |
| IV. Estrutura por domínio | `src/payment/` isolado; nenhuma referência lateral a `hardware/` (que não existe ainda). | PASS |
| V. Fail-fast | Guard de plataforma não-Android lança erro explícito e imediato — não mock silencioso em produção. | PASS |
| VI. Android-only | Remoção completa do scaffold iOS é o próprio escopo desta feature (FR-005/FR-006). | PASS (é o objeto da feature) |
| VII. KISS/YAGNI | Nenhuma pasta antecipada (`hardware/`, `hooks/`) é criada; plugin implementado com escopo mínimo do PRD, sem generalização especulativa. | PASS |
| VIII. AAR do consumidor | Plugin e caminho bare RN apenas injetam/apontam para o `.aar`; nunca o commitam ou redistribuem; `android/libs/` no `.gitignore`. | PASS |

Nenhuma violação identificada — **Complexity Tracking não se aplica** a este plano.

## Project Structure

### Documentation (this feature)

```text
specs/001-fase0-fundacao/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
react-native-getnet-getsmart/
├── src/
│   ├── index.tsx                  # barrel — passa a re-exportar payment/ e types/
│   ├── NativeGetnetGetsmart.ts    # Spec existente (multiply) — inalterada nesta feature
│   ├── payment/                   # NOVO — esqueleto GetnetPayment (sem métodos ainda, Fase 1)
│   │   └── index.ts
│   └── types/                     # NOVO — tipos compartilhados
│       ├── PaymentRequest.ts
│       ├── PaymentResult.ts
│       └── index.ts
├── android/
│   ├── src/main/java/com/getnetgetsmart/   # guard de plataforma incremental (fail-fast)
│   └── libs/                       # NOVO — destino local do .aar em dev/teste (.gitignore)
├── plugin/                         # NOVO — Expo config plugin
│   ├── src/
│   │   ├── withGetnetGetsmart.ts   # entrypoint do plugin (compõe os withX abaixo)
│   │   ├── withAndroidManifest.ts  # queries + permissão POSDIGITAL + props opt-in
│   │   ├── withAarResolution.ts    # injeção do posDigitalAarPath / erro amigável
│   │   ├── withSigningV1V2.ts      # assinatura V1+V2
│   │   └── withForbiddenPermissionsGuard.ts  # guard-rail B8
│   └── build/                      # saída compilada do plugin (gerado, não versionado à mão)
├── example/                        # harness de validação (prebuild do plugin)
└── ios/, GetnetGetsmart.podspec     # REMOVIDOS nesta feature (Princípio VI)
```

**Structure Decision**: opção única de projeto (biblioteca RN), sem separação
frontend/backend. `src/payment/` e `src/types/` nascem agora porque são exigidos por esta
feature (FR-002/FR-003); `src/hardware/` e `src/hooks/` continuam fora da árvore até a fase
que os implementar (Princípio VII). O plugin ganha seu próprio subdiretório `plugin/` por ser
um artefato de build-time (Node/config-plugins), distinto da API pública `src/`.

## Complexity Tracking

*Sem violações da Constitution Check — seção não aplicável.*
