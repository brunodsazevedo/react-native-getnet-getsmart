---
description: "Task list for Fase 0 — Fundação (react-native-getnet-getsmart)"
---

# Tasks: Fase 0 — Fundação (react-native-getnet-getsmart)

**Input**: Design documents from `/specs/001-fase0-fundacao/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos e OBRIGATÓRIOS — o Princípio III (Test-First/TDD) da constituição é
NON-NEGOTIABLE: todo teste MUST ser escrito e confirmado falhando (Red) antes da
implementação (Green → Refactor).

**Organization**: Tasks agrupadas por user story (spec.md), permitindo implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: US1 (domínio de pagamento), US2 (Android-only/remoção iOS), US3 (Expo config
  plugin), US4 (paridade bare RN)

## Path Conventions

Projeto único (biblioteca RN) — caminhos relativos à raiz do repositório, conforme a árvore
de `plan.md` § Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar diretórios e dependências que as user stories vão usar.

- [X] T001 [P] Criar `src/types/` com barrel vazio em `src/types/index.ts`
- [X] T002 [P] Criar `src/payment/` com barrel vazio em `src/payment/index.ts`
- [X] T003 [P] Adicionar `android/libs/` ao `.gitignore` (destino local do `.aar` em dev/teste — nenhum binário Getnet é commitado, Princípio VIII)
- [X] T004 [P] Criar `plugin/src/` e `plugin/tsconfig.json` (estende `tsconfig.json` raiz, `outDir` para `plugin/build`, `strict: true` herdado — zero `any`, Princípio II)
- [X] T005 Adicionar `@expo/config-plugins` como devDependency em `package.json` (implementação do Expo config plugin, decisão registrada em `research.md` § Decisão 1)

**Checkpoint**: estrutura mínima pronta; nenhuma pasta além das listadas em `plan.md` foi criada (Princípio VII).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura que bloqueia todas as user stories.

**⚠️ CRITICAL**: nenhuma user story pode começar antes desta fase.

- [X] T006 Criar util de guard de plataforma em `src/utils/assertAndroidPlatform.ts` — lança `Error` explícito e imediato quando `Platform.OS !== 'android'` (Princípio V/VI; consumido por US1 e US2)
- [X] T007 [P] Escrever teste do guard em `src/__tests__/assertAndroidPlatform.test.ts` cobrindo Android (não lança) e não-Android (lança com mensagem clara) — MUST falhar antes de T006 existir

**Checkpoint**: guard fail-fast testado e pronto para ser chamado pelas user stories.

---

## Phase 3: User Story 1 - Domínio de pagamento tipado e estrutura registrada (Priority: P1) 🎯 MVP

**Goal**: expor `PaymentRequest`, `PaymentResult` (union discriminada) e enums de
`result`/`resultDetails` pelo barrel público, e documentar o padrão de estrutura por domínio
no `CLAUDE.md`.

**Independent Test**: `yarn typecheck` passa; `import { PaymentResult } from
'react-native-getnet-getsmart'` resolve a union discriminada; `CLAUDE.md` descreve a
estrutura por domínio.

### Tests for User Story 1 ⚠️

- [X] T008 [P] [US1] Teste de tipos/runtime para cada variante de `PaymentResult`
      (`APPROVED`/`DENIED`/`CANCELLED`/`ERROR`) em `src/__tests__/PaymentResult.test.ts` —
      MUST falhar antes dos tipos existirem (arquivo importa de `src/types` e testa
      narrowing via `switch (result.result)`)

### Implementation for User Story 1

- [X] T009 [P] [US1] Criar enums `PaymentType`, `PaymentResultStatus`, `PaymentResultDetail`
      em `src/types/enums.ts` (conforme `data-model.md` § Enums)
- [X] T010 [P] [US1] Criar `PaymentRequest` em `src/types/PaymentRequest.ts` (campos
      `amount`, `paymentType`, `installments?`)
- [X] T011 [US1] Criar `PaymentResult` como union discriminada em
      `src/types/PaymentResult.ts` (depende de T009)
- [X] T012 [US1] Exportar `PaymentRequest`, `PaymentResult` e os enums em `src/types/index.ts`
      (depende de T009, T010, T011)
- [X] T013 [US1] Re-exportar `src/types` e `src/payment` (esqueleto) em `src/index.tsx`
      (depende de T012, T002)
- [X] T014 [US1] Atualizar `CLAUDE.md` com a seção de estrutura por domínio (`payment/`,
      `hardware/<serviço>/`, `types/`, `hooks/`) espelhando a "Estrutura de Pastas Alvo" da
      constituição e a regra de não criar pastas antecipadamente — fecha o
      `TODO(CLAUDE_MD_SYNC)` do Sync Impact Report da constituição

**Checkpoint**: User Story 1 funcional e testável de forma independente (`yarn typecheck` +
`yarn test src/__tests__/PaymentResult.test.ts`).

---

## Phase 4: User Story 2 - Projeto Android-only, sem scaffold iOS (Priority: P1)

**Goal**: remover completamente o scaffold iOS e garantir fail-fast em plataformas
não-Android.

**Independent Test**: `ios/` e `GetnetGetsmart.podspec` não existem; `package.json` sem
referências a iOS/podspec/objc; CI sem `build-ios`; guard fail-fast em uso real.

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] Teste de integração do guard aplicado ao entrypoint da lib em
      `src/__tests__/index.test.tsx` (atualizar teste existente) — simula `Platform.OS`
      não-Android e confirma erro explícito ao acessar API nativa; MUST falhar antes de T017

### Implementation for User Story 2

- [X] T016 [US2] Remover `ios/GetnetGetsmart.mm`, `ios/GetnetGetsmart.h`, o diretório `ios/` e
      `GetnetGetsmart.podspec`
- [X] T017 [US2] Aplicar o guard `assertAndroidPlatform` (T006) no ponto de entrada nativo da
      lib (`src/NativeGetnetGetsmart.ts`, antes do `getEnforcing`), garantindo fail-fast antes
      de qualquer acesso ao TurboModule
- [X] T018 [US2] Atualizar `package.json`: remover `"ios"`/`"cpp"`/`"*.podspec"` de `files`,
      remover `"ios"` de `keywords`, trocar
      `"create-react-native-library".languages` de `"kotlin-objc"` para `"kotlin"`
- [X] T019 [US2] Remover o job `build-ios` de `.github/workflows/ci.yml` (prebuild Expo +
      build iOS) — consequência direta da ausência de `ios/`, não expansão de escopo (RNF-01)
- [X] T020 [US2] Remover a menção a `ios/GetnetGetsmart.mm` da arquitetura descrita em
      `CLAUDE.md` (seção "Architecture") e demais referências a iOS como plataforma suportada

**Checkpoint**: Android-only garantido; User Stories 1 e 2 funcionam juntas
independentemente.

---

## Phase 5: User Story 3 - Expo config plugin aplica manifest Android automaticamente (Priority: P2)

**Goal**: `plugin/` injeta queries/permissão do `PosDigital`, props opt-in, assinatura V1+V2
e resolução do `.aar` via `posDigitalAarPath`, com erro amigável quando ausente.

**Independent Test**: `npx expo prebuild` no `example/` com o plugin ativo gera o manifest
esperado (ver `quickstart.md` § 4); build sem `.aar` falha com mensagem amigável.

### Tests for User Story 3 ⚠️

- [X] T021 [P] [US3] Teste do plugin com fixture Expo em `plugin/src/__tests__/withAndroidManifest.test.ts`
      — roda o plugin sobre um manifest de fixture e verifica presença de `<queries>` +
      permissão `POSDIGITAL`; MUST falhar antes de T024
- [X] T022 [P] [US3] Teste do plugin para props opt-in (incluído em
      `plugin/src/__tests__/withAndroidManifest.test.ts`, onde a lógica de props opt-in
      efetivamente vive) — verifica que `priorityPay`, `allowPrintPermission`, `kioskMode`
      refletem como metadados no manifest quando habilitadas, e que ficam ausentes quando
      desabilitadas
- [X] T023 [P] [US3] Teste de resolução do `.aar` em
      `plugin/src/__tests__/withAarResolution.test.ts` — cobre caso com `.aar` de teste
      presente (resolve/copia) e mensagem amigável quando ausente, sem depender do `.aar`
      real (RNF-02)

### Implementation for User Story 3

- [X] T024 [P] [US3] Implementar `withAndroidManifest.ts` em `plugin/src/withAndroidManifest.ts`
      injetando `<queries><package android:name="com.getnet.posdigital.service"/></queries>`
      e a permissão `com.getnet.posdigital.service.POSDIGITAL`, com merge/dedup (research.md
      § Decisão 1)
- [X] T025 [P] [US3] Implementar props opt-in (`priority_pay`, `allow_print_permission`,
      `kiosk_mode`) como metadados de manifest em `plugin/src/withAndroidManifest.ts`
      (depende de T024)
- [X] T026 [P] [US3] Implementar `withSigningV1V2.ts` em `plugin/src/withSigningV1V2.ts`
      configurando assinatura V1+V2 no build gerado (exigência do Sunmi P2)
- [X] T027 [US3] Implementar `withAarResolution.ts` em `plugin/src/withAarResolution.ts` lendo
      `posDigitalAarPath` de `app.json`, copiando/apontando o `.aar` via
      `withDangerousMod('android', ...)` e adicionando resolução `flatDir`/`files(...)` ao
      `build.gradle` gerado (research.md § Decisão 2)
- [X] T028 [US3] Implementar a falha amigável (via T027) quando o `.aar` resolvido não existe
      — `Error` claro apontando para o Portal do Desenvolvedor Getnet e a prop
      `posDigitalAarPath`, disparado no `withDangerousMod` do prebuild (research.md §
      Decisão 3 / FR-012) — validado manualmente (ver notas de US3 abaixo)
- [X] T029 [P] [US3] Implementar `withForbiddenPermissionsGuard.ts` em
      `plugin/src/withForbiddenPermissionsGuard.ts` — guard-rail que avisa sobre permissões
      proibidas no manifest do app consumidor via `WarningAggregator`, usando a lista mínima
      conhecida do PRD (gap documentado em `blockers.md`, research.md § Decisão 5)
- [X] T030 [US3] Compor todos os `withX` em `plugin/src/withGetnetGetsmart.ts` (depende de
      T024–T029) e expor via `app.plugin.js` na raiz (`module.exports =
      require('./plugin/build/withGetnetGetsmart').default`)
- [X] T031 [US3] Atualizar `package.json`: adicionar `"app.plugin.js"` e `"plugin/build"` a
      `files`, `"./app.plugin.js"` a `exports` (necessário para a resolução do plugin pelo
      Expo CLI) e um script `build:plugin` (`tsc -p plugin/tsconfig.json`) chamado a partir
      de `prepare`
- [X] T032 [US3] Configurar `example/app.json` com o plugin e `posDigitalAarPath` apontando
      para um `.aar` de teste (`example/getnet/libposdigital.aar`, fixture local); adicionar
      `react-native-getnet-getsmart` como dependência de `example/package.json` (necessário
      para a resolução do plugin via node_modules); validado com `npx expo prebuild
      --platform android` (quickstart.md § 4): manifest gerado com `<queries>` + permissão
      POSDIGITAL, `build.gradle` com assinatura V1+V2 e dependência do `.aar` injetadas, e o
      caminho de erro amigável confirmado apontando `posDigitalAarPath` para um arquivo
      inexistente

**Checkpoint**: plugin funcional e testável sem terminal físico; User Stories 1–3 íntegras.

---

## Phase 6: User Story 4 - Paridade bare RN para resolução do AAR (Priority: P3)

**Goal**: caminho bare RN resolve o `.aar` via `gradle.properties`
(`GETNET_POSDIGITAL_AAR`), com paridade funcional e mesma mensagem de erro amigável do
caminho Expo.

**Independent Test**: projeto bare RN de teste com `GETNET_POSDIGITAL_AAR` configurado
resolve o `.aar`; sem a variável, falha com a mesma mensagem amigável de US3.

### Tests for User Story 4 ⚠️

- [X] T033 [P] [US4] Teste/roteiro de verificação do template Gradle bare RN em
      `android/__tests__/build.gradle.test.ts` (asserções de conteúdo sobre o
      `android/build.gradle`, já que Groovy não é executável via Jest) — cobre
      presença/ausência de `GETNET_POSDIGITAL_AAR`; MUST falhar antes de T034

### Implementation for User Story 4

- [X] T034 [US4] Atualizar `android/build.gradle` da lib para resolver o `.aar` via
      `GETNET_POSDIGITAL_AAR` de `gradle.properties`, com `flatDir`/`files(...)` e a mesma
      mensagem de erro amigável de T028 — **decisão tomada durante a implementação**: a
      resolução é opt-in (só age quando a propriedade está definida) porque
      `android/build.gradle` da lib é compartilhado por todo consumidor, inclusive Expo, que
      nunca define essa propriedade (resolve via o config plugin, no app, não aqui); forçar a
      falha incondicionalmente aqui quebraria o build Expo já validado em US3. Validado
      rodando `./gradlew :react-native-getnet-getsmart:tasks --offline` no `example/android`
      gerado (build bem-sucedido, bloco opt-in ignorado como esperado)
- [X] T035 [US4] Documentar o caminho bare RN (variável, passos, exemplo de
      `gradle.properties`, e a limitação de que manifest/assinatura V1+V2 ainda exigem edição
      manual nesse caminho) em `README.md` da lib e em `contracts/README.md` § 3

**Checkpoint**: todas as 4 user stories funcionam de forma independente e conjunta.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: fechar os critérios de aceite da Fase 0 que cruzam todas as stories.

- [X] T036 Rodar `yarn lint` e corrigir todos os erros/warnings introduzidos pelas tasks
      acima (incluiu adicionar `plugin/build/` e `coverage/` aos ignores do ESLint)
- [X] T037 Rodar `yarn typecheck` e `yarn test` na raiz — 9 suítes/37 testes verdes;
      cobertura 100% em `src/utils`, `src/NativeGetnetGetsmart.ts` e alta em
      `plugin/src/*`; gap conhecido documentado em `blockers.md` (Istanbul reporta 0% em
      `src/types/enums.ts` apesar de todas as variantes serem exercitadas)
- [X] T038 Rodar `yarn prepare` — `lib/module` e `lib/typescript` (bob) e `plugin/build`
      (tsc) buildam sem erros
- [X] T039 Executar `quickstart.md` de ponta a ponta — seções 1–4 e 6 validadas
      manualmente (typecheck, testes, remoção iOS, guard fail-fast, prebuild Expo real com
      `.aar` fixture, caminho de erro amigável, lint/typecheck/test/prepare); quickstart.md
      atualizado com os nomes reais de teste e uma nova seção 5 (bare RN)
- [X] T040 Criado `blockers.md` na raiz com as pendências externas (permissões proibidas e
      tabela de `resultDetails` não confirmadas no vault; `.aar` real indisponível; C1–C3 do
      PRD; limitação do caminho bare RN sem config plugin equivalente ao Expo)
- [X] T041 Revisão de conformidade com `.specify/memory/constitution.md` (Princípios I–VIII)
      — ver notas abaixo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende do Setup — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: depende de Foundational; independente de US2/US3/US4
- **US2 (Phase 4)**: depende de Foundational e do guard criado em T006 (Phase 2); usa T013
  (barrel) de US1 apenas para consistência do `src/index.tsx`, mas é testável de forma
  isolada
- **US3 (Phase 5)**: depende de Foundational e do Setup do plugin (T004, T005); não depende
  de US1/US2 para funcionar, mas assume o scaffold iOS já removido (US2) para o CI ficar
  verde
- **US4 (Phase 6)**: depende de US3 (reaproveita a mensagem de erro amigável de T028)
- **Polish (Phase 7)**: depende de todas as user stories desejadas estarem completas

### Parallel Opportunities

- T001–T005 (Setup) podem rodar em paralelo entre si
- T007 (teste do guard) pode ser escrito em paralelo a outras tasks de Setup, mas antes de
  T006 estar "verde"
- Dentro de US1: T008 (teste) antes de T009–T011; T009 e T010 em paralelo
- Dentro de US3: T021–T023 (testes) em paralelo entre si; T024–T026 e T029 em paralelo entre
  si (arquivos distintos), T027/T028/T030 sequenciais (mesmo arquivo/composição)
- US1 e US2 podem ser trabalhadas em paralelo por pessoas diferentes após a Foundational
  phase; US3 pode começar em paralelo também, desde que o merge final espere US2 (CI verde)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1 (Setup) e Phase 2 (Foundational)
2. Completar Phase 3 (US1 — domínio de pagamento tipado)
3. **PARAR e VALIDAR**: `yarn typecheck` + teste de `PaymentResult`
4. Prosseguir para US2 (Android-only) — também P1, portanto parte do MVP da Fase 0

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → validar independentemente (tipos)
3. US2 → validar independentemente (sem iOS, guard fail-fast) — **MVP da Fase 0 fecha aqui**
   para o domínio de pagamento e a limpeza de plataforma
4. US3 → validar independentemente (`expo prebuild`) — desbloqueia a Fase 2 (Impressora)
5. US4 → validar independentemente (bare RN) — paridade final
6. Polish → lint, typecheck, prepare, blockers.md, revisão de constituição

---

## Notes

- [P] = arquivos diferentes, sem dependência entre si
- [Story] mapeia a task à user story correspondente para rastreabilidade
- Testes MUST ser escritos e confirmados falhando antes da implementação (Princípio III,
  NON-NEGOTIABLE) — não é opcional nesta feature
- Nenhuma pasta além de `src/payment/`, `src/types/`, `plugin/`, `android/libs/` deve ser
  criada (Princípio VII); `src/hardware/`, `src/hooks/` ficam fora de escopo
- Commit após cada task ou grupo lógico
- Parar em cada checkpoint para validar a story de forma independente antes de prosseguir

---

## T041 — Revisão de conformidade com a constituição (v0.3.0)

| Princípio | Conformidade |
|---|---|
| I. TurboModules only | ✅ Nenhuma nova superfície nativa; Spec `.ts` (`NativeGetnetGetsmart.ts`) continua a única fonte de verdade JS↔Native |
| II. TypeScript strict, zero `any` | ✅ `grep -rn "\bany\b" src plugin/src` sem ocorrências; nenhum `@ts-ignore`/`@ts-expect-error`; `PaymentResult` é union discriminada |
| III. Test-First/TDD | ✅ Red confirmado antes da implementação em cada task de teste (guard, tipos, plugin, Gradle); 100% de cobertura nos arquivos-chave; gap de instrumentação documentado em `blockers.md` |
| IV. Estrutura por domínio | ✅ `src/payment/` e `src/types/` isolados; `src/hardware/`/`src/hooks/` não criados (não são desta fase) |
| V. Fail-fast | ✅ `assertAndroidPlatform` lança erro explícito e imediato antes do `TurboModuleRegistry.getEnforcing` |
| VI. Android-only | ✅ `ios/`, `GetnetGetsmart.podspec` removidos; `package.json`/CI/CLAUDE.md sem referências a iOS; guard fail-fast aplicado |
| VII. KISS/YAGNI | ✅ Nenhuma pasta antecipada; resolução do `.aar` em bare RN feita opt-in (mais simples que forçar automação sem config plugin equivalente ao Expo) |
| VIII. AAR do consumidor | ✅ Nenhum binário real da Getnet commitado; `android/libs/` no `.gitignore`; fixture de teste é claramente fake (`example/getnet/README.md`) |

Nenhuma violação NON-NEGOTIABLE identificada. Decisões que se afastaram do desenho original
do `plan.md`/`research.md` (bare RN opt-in) estão registradas como amendment em `spec.md` e
detalhadas em `blockers.md`.

## Pós-T041 — Correções após acesso ao vault Obsidian (2026-07-10)

O vault (`Docs SDK/00`, `01`, `02`, `05`) ficou acessível após a conclusão inicial das 41
tasks acima. Cross-checando a implementação contra as notas reais, dois **bugs de
correção** (não apenas lacunas de completude) foram encontrados e corrigidos:

1. **Meta-data das props opt-in com nomes/valor errados** — `withAndroidManifest.ts` usava
   chaves inventadas (`com.getnet.posdigital.PRIORITY_PAY`, valor `"true"`) e a prop pública
   estava em camelCase (`priorityPay`) enquanto toda a documentação (`app.json`) usa
   snake_case (`priority_pay`) — a prop **nunca era lida**. Confirmado empiricamente com
   `expo prebuild` antes/depois. Corrigido para os nomes literais exigidos pela Getnet
   (`priority_pay`/`allow_print_permission`/`kiosk_mode`, valor `"1"`).
2. **Semântica errada de `result`/`resultDetails`** — `PaymentResult` modelava `result` como
   string inventada (`APPROVED`/`DENIED`/...) e `resultDetails` como motivos fabricados
   (`INSUFFICIENT_FUNDS`, ...). A doc real mostra `result` numérico (0–5) e `resultDetails`
   como o rótulo textual do mesmo código — uma dimensão, não duas. `PaymentResultCode`/
   `PaymentResultDetail`/`PaymentResult` redesenhados; testes atualizados.

Também substituída a lista de permissões proibidas (3 itens inferidos, um deles
inexistente) pela lista oficial completa (30 itens) do vault. Todas as correções
revalidadas: `yarn lint`/`typecheck`/`test`/`prepare` verdes, e `npx expo prebuild` real
confirmando o manifest gerado com os nomes corretos. Detalhes completos em `blockers.md` e
`research.md` § Decisão 6. A nota `05 - Plano de Tasks de Desenvolvimento` do vault foi
atualizada manualmente para refletir o progresso real da Fase 0.
