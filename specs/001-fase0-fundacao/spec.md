# Feature Specification: Fase 0 — Fundação (react-native-getnet-getsmart)

**Feature Branch**: `feature/001-fase0-fundacao`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Fechar a Fase 0 (Fundação) da lib react-native-getnet-getsmart, conforme PRD.md: (Bloco A) registrar o padrão de estrutura por domínio no CLAUDE.md espelhando a constituição; criar o domínio base de pagamento em src/payment/ e src/types/ com PaymentRequest, PaymentResult (union discriminada) e enums de result/resultDetails, exportados pelo barrel; remover completamente o scaffold iOS e adicionar guard para plataformas não-Android. (Bloco B) Criar o Expo config plugin que injeta no manifest Android as queries/permissão do serviço com.getnet.posdigital.service, expõe props opt-in, configura assinatura V1+V2, resolve o .aar via posDigitalAarPath (Expo) e via GETNET_POSDIGITAL_AAR (bare RN), falha com mensagem amigável quando o .aar estiver ausente, e bloqueia/avisa sobre permissões proibidas no manifest do app consumidor. Critérios de aceite completos na seção 4 do PRD.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Domínio de pagamento tipado e estrutura registrada (Priority: P1)

Como desenvolvedor consumidor da lib, quero que o pacote já exponha o esqueleto do domínio de
pagamento (`PaymentRequest`, `PaymentResult` como union discriminada, enums de `result` e
`resultDetails`) e que o `CLAUDE.md` documente o padrão de estrutura por domínio, para que eu
possa começar a integrar o fluxo de pagamento com tipagem completa e entender onde cada nova
capacidade deve ser colocada.

**Why this priority**: é a base sobre a qual a Fase 1 (métodos de pagamento) é construída; sem
os tipos e a estrutura registrada, qualquer trabalho posterior de pagamento fica bloqueado ou
precisa ser refeito.

**Independent Test**: `yarn typecheck` passa com os novos tipos; `src/index.tsx` exporta
`PaymentRequest`/`PaymentResult`/enums; `CLAUDE.md` contém a seção de estrutura por domínio
espelhando a constituição.

**Acceptance Scenarios**:

1. **Given** o pacote publicado, **When** um consumidor importa `PaymentResult` da lib, **Then**
   o tipo é uma union discriminada pelo campo `result` (nunca um objeto genérico com campos
   opcionais soltos).
2. **Given** o `CLAUDE.md` atual (que só descreve o scaffold `multiply`), **When** a Fase 0 é
   concluída, **Then** o arquivo passa a descrever a estrutura por domínio (`payment/`,
   `hardware/<serviço>/`, `types/`, `hooks/`) e a regra de não criar pastas antecipadamente.

---

### User Story 2 - Projeto Android-only, sem scaffold iOS (Priority: P1)

Como mantenedor da lib, quero que todo o scaffold iOS herdado do `create-react-native-library`
seja removido (arquivos nativos, podspec, referências em `package.json`, CI e documentação) e
que exista uma proteção explícita para plataformas não-Android, para que o projeto reflita o
Princípio VI (NON-NEGOTIABLE) da constituição e não engane consumidores sobre suporte a iOS.

**Why this priority**: é uma regra NON-NEGOTIABLE da constituição; manter arquivos iOS mortos ou
job de CI quebrado por ausência de `ios/` é um estado inconsistente que bloqueia releases.

**Independent Test**: `ios/`, `GetnetGetsmart.podspec` não existem mais; `package.json` sem
`ios`/`podspec`/`objc` nas seções relevantes; CI sem o job `build-ios`; import da lib em
plataforma não-Android lança erro explícito e imediato (fail-fast).

**Acceptance Scenarios**:

1. **Given** o repositório após a Fase 0, **When** se procura por `ios/GetnetGetsmart.mm` ou
   `GetnetGetsmart.podspec`, **Then** nenhum dos dois existe mais.
2. **Given** um app consumidor rodando em uma plataforma não suportada, **When** a lib é
   inicializada, **Then** um erro claro e imediato é lançado (nunca um comportamento silencioso
   ou crash genérico).

---

### User Story 3 - Expo config plugin aplica manifest Android automaticamente (Priority: P2)

Como desenvolvedor de um app Expo consumidor da lib, quero que o config plugin injete
automaticamente, no `prebuild`, as `<queries>`/permissão do serviço `PosDigital`, as props
opt-in e a assinatura V1+V2, e resolva o caminho do `.aar` via `app.json`, para que eu não
precise editar manualmente `AndroidManifest.xml`/`build.gradle` nem lidar com erros crípticos de
classe ausente.

**Why this priority**: é pré-requisito direto da Fase 2 (Impressora) e da certificação; sem o
plugin, todo consumidor Expo precisa de eject ou patch manual, o que é inaceitável para a
experiência de instalação da lib.

**Independent Test**: `npx expo prebuild` no `example/` com o plugin ativo gera um
`AndroidManifest.xml` com `<queries><package android:name="com.getnet.posdigital.service"/></queries>`
e a permissão `com.getnet.posdigital.service.POSDIGITAL`; com `posDigitalAarPath` configurado, o
Gradle resolve a dependência; sem ele, o build falha com mensagem amigável apontando para o
Portal do Desenvolvedor Getnet.

**Acceptance Scenarios**:

1. **Given** um `app.json` com `posDigitalAarPath` apontando para um `.aar` de teste, **When**
   `npx expo prebuild` roda, **Then** o manifest gerado contém as queries e a permissão do
   serviço, e o Gradle resolve o `.aar` sem erro.
2. **Given** um `app.json` sem `posDigitalAarPath` configurado, **When** o build Android roda,
   **Then** o Gradle falha com uma mensagem clara instruindo a configurar
   `posDigitalAarPath`/`GETNET_POSDIGITAL_AAR`, nunca com um erro críptico de classe
   `com.getnet.posdigital.*` não encontrada.
3. **Given** props opt-in (`priority_pay`, `allow_print_permission`, `kiosk_mode`) habilitadas no
   `app.json`, **When** o prebuild roda, **Then** os metadados correspondentes aparecem no
   manifest gerado.
4. **Given** o app consumidor com uma permissão proibida declarada no manifest, **When** o
   plugin roda, **Then** um aviso ou bloqueio é emitido (guard-rail), evitando rejeição no
   portal de upload.

---

### User Story 4 - Paridade bare RN para resolução do AAR (Priority: P3)

Como desenvolvedor de um app React Native bare (sem Expo), quero resolver o `.aar` do
`PosDigital` via `gradle.properties` (`GETNET_POSDIGITAL_AAR`), com o mesmo comportamento de
erro amigável do caminho Expo, para que eu tenha paridade funcional independentemente do
framework usado.

**Why this priority**: garante que a lib seja framework-agnóstica (RN puro + Expo), conforme
decisão de arquitetura travada no PRD; prioridade menor que o plugin Expo pois o caminho Expo é
o mais usado atualmente pelo `example/`.

**Independent Test**: um projeto bare RN de teste com `GETNET_POSDIGITAL_AAR` configurado em
`gradle.properties` resolve o `.aar` via `flatDir`/`files(...)`; sem a variável, falha com a
mesma mensagem amigável do caminho Expo.

**Acceptance Scenarios**:

1. **Given** `gradle.properties` com `GETNET_POSDIGITAL_AAR=/caminho/para/libposdigital.aar`,
   **When** o Gradle builda o módulo Android, **Then** o `.aar` é resolvido corretamente.
2. **Given** a variável ausente, **When** o build roda, **Then** a mesma mensagem de erro
   amigável do caminho Expo (B7) é exibida.

---

### Edge Cases

- O que acontece se o `.aar` fornecido pelo consumidor tiver uma assinatura incompatível
  (V1 apenas, sem V2)? → o guard de assinatura (B4) deve reportar a incompatibilidade, não
  silenciar.
- Como o sistema se comporta se o app consumidor já declarar manualmente as `<queries>`/
  permissão do `PosDigital` no seu próprio manifest antes do plugin rodar? → o merge do
  Android manifest (padrão do Expo Config Plugin/AndroidManifest merger) deve deduplicar sem
  gerar conflito.
- O que acontece se `posDigitalAarPath` apontar para um arquivo inexistente? → mesmo
  comportamento de erro amigável do caso "AAR ausente" (B7), não um erro genérico de I/O.
- Como o guard-rail de permissões proibidas (B8) se comporta quando a lista de permissões
  proibidas não está disponível/documentada no momento do build? → ver premissa em
  Assumptions: usa-se a lista mínima conhecida do PRD e o gap é registrado em `blockers.md`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O `CLAUDE.md` MUST documentar o padrão de estrutura por domínio (namespaces
  `GetnetPayment`/`GetnetHardware`, pastas `src/payment/`, `src/hardware/<serviço>/`,
  `src/types/`, `src/hooks/`), espelhando a "Estrutura de Pastas Alvo" da constituição, e
  registrar explicitamente a regra de não criar pastas antecipadamente (KISS/YAGNI).
- **FR-002**: O pacote MUST expor, em `src/types/`, os tipos `PaymentRequest` e `PaymentResult`
  (union discriminada pelo campo `result`) e os enums de `result`/`resultDetails` cobrindo os
  campos de resposta do deeplink de pagamento (result, nsu, brand, automationSlip, entre
  outros conforme a tabela de resultados do vault), todos exportados pelo barrel
  `src/index.tsx`.
- **FR-003**: `src/payment/` MUST existir como esqueleto do domínio de pagamento (mesmo sem
  métodos de pagamento implementados — isso é escopo da Fase 1).
- **FR-004**: Nenhuma pasta além das exigidas por este spec (`src/payment/`, `src/types/`,
  `plugin/`, `android/libs/`) MUST ser criada antecipadamente; `src/hardware/` e `src/hooks/`
  ficam fora de escopo desta feature.
- **FR-005**: O scaffold iOS MUST ser completamente removido: `ios/GetnetGetsmart.mm`,
  `ios/GetnetGetsmart.h`, `GetnetGetsmart.podspec`; `package.json` sem referências a
  `ios`/`podspec`/`objc` nos campos relevantes (`files`, `keywords`,
  `create-react-native-library.languages` passa de `"kotlin-objc"` para `"kotlin"`); CI sem o
  job `build-ios`; `CLAUDE.md` sem menção a `ios/GetnetGetsmart.mm`.
- **FR-006**: O módulo MUST expor um guard fail-fast que lança erro explícito e imediato quando
  usado em uma plataforma não-Android (nunca comportamento silencioso).
- **FR-007**: O pacote MUST fornecer um Expo config plugin (`plugin/`) que, no prebuild,
  injeta no `AndroidManifest.xml` do app consumidor: `<queries><package
  android:name="com.getnet.posdigital.service"/></queries>` e a permissão
  `com.getnet.posdigital.service.POSDIGITAL`.
- **FR-008**: O plugin MUST expor as props opt-in `priority_pay`, `allow_print_permission` e
  `kiosk_mode`, refletindo-as como metadados no manifest gerado quando habilitadas.
- **FR-009**: O plugin MUST configurar a assinatura V1+V2 no build gerado (exigência do
  Sunmi P2).
- **FR-010**: O plugin MUST resolver o `.aar` do `PosDigital` a partir de `posDigitalAarPath`
  em `app.json`, copiando/apontando para o binário no prebuild (o binário nunca é commitado ou
  redistribuído pela lib).
- **FR-011**: Em projetos bare RN, o build Android MUST resolver o `.aar` via
  `gradle.properties` (`GETNET_POSDIGITAL_AAR`), com paridade funcional ao caminho Expo
  (`flatDir`/`files(...)`).
- **FR-012**: Na ausência do `.aar` (caminho Expo ou bare), o build MUST falhar com mensagem
  clara instruindo o download no Portal do Desenvolvedor Getnet e a configuração de
  `posDigitalAarPath`/`GETNET_POSDIGITAL_AAR` — nunca com erro críptico de classe
  `com.getnet.posdigital.*` não encontrada.
- **FR-013**: O plugin MUST implementar um guard-rail que avise ou bloqueie permissões
  proibidas presentes no manifest do app consumidor.
- **FR-014**: `android/libs/` (destino local do `.aar` durante desenvolvimento/teste do
  plugin) MUST estar no `.gitignore`; nenhum binário da Getnet MUST ser commitado no
  repositório.
- **FR-015**: O plugin MUST ser testável sem terminal físico (prebuild + inspeção do manifest
  gerado), sem depender do `.aar` real para os testes do plugin em si.
- **FR-016**: O CI atual (lint, typecheck, jest, `yarn prepare`, builds Android/web do
  example) MUST continuar verde após cada entrega desta feature, sem expansão de escopo do
  pipeline além da remoção do job `build-ios` (consequência direta do FR-005, não uma
  expansão).

### Key Entities *(include if feature involves data)*

- **PaymentRequest**: parâmetros de entrada do fluxo de pagamento via deeplink (valor,
  forma de pagamento, etc.) — tipagem completa fica a cargo da Fase 1; nesta fase apenas o
  esqueleto do tipo é definido.
- **PaymentResult**: union discriminada pelo campo `result`, representando os ~20 campos de
  resposta do deeplink (nsu, brand, automationSlip, resultDetails, entre outros).
- **Config Plugin Props**: `posDigitalAarPath`, `priority_pay`, `allow_print_permission`,
  `kiosk_mode` — parâmetros declarados pelo consumidor em `app.json` sob a chave da lib.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um desenvolvedor consegue rodar `npx expo prebuild` no `example/` com o plugin
  ativo e obter, no manifest gerado, as queries e permissão do `PosDigital` sem nenhuma edição
  manual.
- **SC-002**: 100% das funções exportadas da API pública desta feature (tipos e plugin) têm
  cobertura de teste antes de serem consideradas concluídas (TDD, Princípio III).
- **SC-003**: Um build Android sem `.aar` configurado falha em menos de 1 minuto com uma
  mensagem de erro compreensível (não um stack trace genérico), reduzindo o tempo de
  diagnóstico de um consumidor de horas para minutos.
- **SC-004**: `yarn typecheck`, `yarn lint`, `yarn test` e `yarn prepare` completam sem erros
  após a conclusão da feature.
- **SC-005**: Nenhuma referência a iOS (arquivos, dependências, jobs de CI, documentação)
  permanece no repositório após a conclusão.

## Assumptions

- ~~A lista de "permissões proibidas" (FR-013)... se o vault não estiver acessível~~ —
  **resolvida em 2026-07-10**: o vault Obsidian ficou acessível durante a implementação; a
  lista oficial completa foi lida em `Docs SDK/01 - Iniciando Integração` e passou a ser a
  fonte de verdade de `DEFAULT_FORBIDDEN_PERMISSIONS` (ver `research.md` § Decisão 5).
- O `.aar` real (`libposdigital.aar`) não está disponível neste ambiente de desenvolvimento;
  testes do plugin e do build usam um `.aar` de teste/mock ou stub, conforme RNF-02 do PRD
  (nenhuma dependência do binário real para os testes do plugin em si). Esta premissa
  **permanece válida** mesmo após o acesso ao vault (o vault documenta a API, não distribui
  o binário).
- ~~O acesso ao vault Obsidian... pode não estar disponível~~ — **resolvida em 2026-07-10**:
  vault acessado e consultado (`Docs SDK/00`, `01`, `02`, `05`). Isso revelou e corrigiu dois
  bugs reais introduzidos quando a implementação inicial dependia apenas do `PRD.md`: (1) os
  nomes de meta-data das props opt-in estavam incorretos (usavam prefixo de pacote inventado
  em vez dos nomes literais `priority_pay`/`allow_print_permission`/`kiosk_mode` exigidos
  pelo app Pagamento da Getnet, com valor `"1"` em vez de `"true"`); (2) `PaymentResult`
  modelava `result`/`resultDetails` como dois eixos independentes de informação com motivos
  fabricados, quando na realidade são a mesma informação codificada duas vezes (número 0–5 +
  rótulo textual). Ambos corrigidos — ver `research.md` § Decisão 6.
- Fora de escopo desta feature (conforme seção 5 do PRD): qualquer método de pagamento
  (`pay`, `refund`, ...), conexão `PosDigital`/impressora/receipt builder, demais hardware,
  split, Premmia, quiosque, docs site, certificação/homologação, e desenho do CI/CD definitivo
  (fica para o fechamento da Fase 1).
- **Amendment (decisão tomada durante a implementação de US4)**: `android/build.gradle` da
  lib é compartilhado por todo tipo de consumidor (Expo e bare RN). Por isso, a resolução de
  `GETNET_POSDIGITAL_AAR` ali é **opt-in**: quando a propriedade não está definida (caso de
  qualquer app Expo, que resolve o `.aar` via o config plugin no app, não aqui), nada
  acontece — o build não falha. FR-012 ("falha na ausência do `.aar`") permanece totalmente
  válido para o caminho Expo (validado); para bare RN puro, a falha amigável só é garantida
  quando `GETNET_POSDIGITAL_AAR` está definida mas aponta para um caminho inexistente. A
  edição manual de manifest/assinatura V1+V2 para bare RN puro (sem Expo) permanece
  documentada, não automatizada — não há hoje um mecanismo de config plugin fora do Expo.
