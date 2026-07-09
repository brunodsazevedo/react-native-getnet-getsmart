<!--
Sync Impact Report
Version change: [UNSET template] → 0.3.0 (ratificação inicial)
Bump rationale: MINOR — primeira ratificação com conteúdo normativo real (o arquivo
  anterior era o template do spec-kit com placeholders vazios; não havia constituição
  vigente para ser considerada MAJOR/breaking). Alinhado à versão de trabalho 0.3.0 do
  esboço de origem (ESBOCO-CONSTITUICAO.md).
Modified principles: N/A (todos os 8 princípios são novos — template tinha 5 slots vazios)
Added sections:
  - Core Principles I–VIII (New Architecture/TurboModules; TypeScript Strict;
    Test-First/TDD; Clean Code + SOLID por domínio; Device Compatibility & Fail-Fast;
    Android-Only + Lifecycle/Threading do PosDigital; KISS; AAR fornecido pelo consumidor)
  - Regras Transversais (mapeamento de callbacks, convenção de erro, defaults técnicos)
  - Estrutura de Pastas Alvo
  - Governance (procedimento de emenda, versionamento semântico, revisão de conformidade)
Removed sections: N/A (placeholders genéricos do template substituídos, nenhum conteúdo
  normativo anterior removido)
Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — seção "Constitution Check" já é dinâmica
    ("[Gates determined based on constitution file]"), sem referências desatualizadas
  - ✅ .specify/templates/spec-template.md — genérico, sem menção a princípios específicos
  - ✅ .specify/templates/tasks-template.md — genérico, sem menção a princípios específicos
  - ✅ .specify/templates/checklist-template.md — genérico, sem alteração necessária
  - N/A .specify/templates/commands/*.md — diretório não existe neste projeto
  - ✅ CLAUDE.md (raiz) — já reflete a arquitetura TurboModule/Codegen (Princípio I);
    demais princípios (II–VIII) ainda não têm correspondência operacional — ver TODO abaixo
Follow-up TODOs:
  - TODO(CLAUDE_MD_SYNC): atualizar CLAUDE.md para espelhar os Princípios II–VIII
    (TypeScript strict, TDD, estrutura por domínio, fail-fast, Android-only/lifecycle
    PosDigital, KISS, AAR do consumidor) — registrado como próximo passo no
    ESBOCO-CONSTITUICAO.md, item 3.
  - RATIFICATION_DATE fixada em 2026-07-09 (data desta ratificação inicial) por não haver
    data de adoção anterior registrada.
-->

# react-native-getnet-getsmart Constitution

## Contexto que molda esta constituição

A Getnet Get Smart tem duas frentes de integração estruturalmente diferentes, e a lib cobre
ambas (decisão de escopo):

- **Pagamento** — via deeplink/Intent Android (`getnet://pagamento/...`), recebido por
  `onActivityResult`. Não usa SDK/AAR: é `Intent` + `ACTION_VIEW` + `Bundle` de extras.
  Exposto por um módulo nativo fino (`ActivityEventListener`), framework-agnóstico —
  funciona em RN puro e Expo, sem depender de `expo-intent-launcher`. Cobre: pagamento
  (crédito/débito/Pix), pré-autorização, estorno, reimpressão, infos do terminal, consulta
  de subseller, consulta de status (Pix pendente).
- **Hardware** — via SDK nativo `PosDigital` (`libposdigital.aar`), que exige Turbo Module
  próprio. Acesso por ciclo de vida de serviço Android (bind), não chamada direta. Cobre:
  impressora, leitora de cartão (mag/chip/NFC), Mifare, LEDs, beeper, câmera (barcode/QR),
  info do terminal, estatísticas.

Essa dualidade molda toda a constituição — os Princípios I e VI são específicos da
realidade Get Smart.

## Core Principles

### I. New Architecture: TurboModules Only, com duas superfícies nativas (NON-NEGOTIABLE)

Toda superfície nativa MUST ser TurboModule (JSI / New Architecture). Zero Bridge legada. A
Spec `.ts` (`src/Native*.ts`) MUST ser a fonte única de verdade do contrato JS↔Native; a
implementação Kotlin estende a classe gerada pelo Codegen.

As duas superfícies diferem no que fazem por baixo, não na toolchain:

- **Hardware** (`GetnetHardware`) — TurboModule que faz bind do serviço `PosDigital` (AAR).
  Toda capacidade de hardware passa por aqui.
- **Pagamento** (`GetnetPayment`) — módulo nativo fino: TurboModule sem AAR que dispara o
  `Intent`/deeplink e captura o resultado via `ActivityEventListener` (`onActivityResult`),
  devolvendo `Promise` com os extras parseados e tipados. MUST ser framework-agnóstico:
  funciona em RN puro e Expo; `expo-intent-launcher` NÃO é dependência (nem peer).

Toda nova capacidade MUST seguir o fluxo: Spec `.ts` → implementação nativa →
`src/<domínio>/…` (chama o TurboModule) + fallback JS para plataformas sem nativo →
re-export em `src/index.tsx`.

**Rationale**: a New Architecture é o requisito de plataforma do projeto (React Native 0.83);
manter as duas superfícies nativas sob a mesma toolchain de Codegen evita drift de contrato
e mantém a Spec `.ts` como único ponto de verdade auditável.

### II. TypeScript Strict, Zero `any` (NON-NEGOTIABLE)

`strict: true` (+ `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`) MUST permanecer ativo no `tsconfig.json`.

`any` é PROIBIDO. `@ts-ignore`/`@ts-expect-error` só são permitidos com uma linha
`// EXCEPTION: <motivo>` imediatamente acima, justificando tecnicamente a exceção.

APIs públicas MUST expor tipos explícitos; resultados de pagamento e de hardware MUST ser
unions discriminadas — nunca um objeto genérico.

**Rationale**: o contrato JS↔Native é a superfície de maior risco de erro silencioso da
lib; tipos explícitos e unions discriminadas transformam erros de integração em erros de
compilação.

### III. Test-First / TDD (NON-NEGOTIABLE)

Teste MUST ser escrito e confirmado falhando (Red) antes da implementação (Green →
Refactor). Cobertura MUST ser de 100% das funções exportadas da API pública. PR que quebra
teste existente MUST ser bloqueado.

Estratégia de teste por fase (ver Princípio V): começa-se com mock do lado nativo (sem
depender de terminal físico); homologação em dispositivo real vem depois; testes e2e ficam
como meta posterior, quando houver device homologado.

**Rationale**: não há terminal físico disponível na maior parte do ciclo de desenvolvimento;
TDD sobre mocks é o único jeito de garantir que a API pública se comporta como especificado
antes da homologação em hardware real.

### IV. Clean Code + SOLID, estrutura por domínio (NON-NEGOTIABLE)

Um domínio por módulo. Domínios da Get Smart, agrupados pelas duas superfícies:

- `payment` (Intent/deeplink — namespace `GetnetPayment`)
- `hardware/` (PosDigital — namespace `GetnetHardware`): `printer`, `card`, `mifare`,
  `camera`, `led`, `beeper`, `info`, `statistics`

Regras de import entre camadas: a camada JS pública NÃO conhece detalhes do nativo além da
Spec; domínios NÃO importam uns dos outros lateralmente sem necessidade real.

`PosDigital` MUST ser instanciado/acessado exclusivamente dentro do módulo Kotlin — nunca
vaza referência do SDK para o JS.

**Rationale**: os dois namespaces nativos (`GetnetPayment`, `GetnetHardware`) têm ciclos de
vida e modelos de erro diferentes; isolar por domínio evita acoplamento acidental entre
pagamento (stateless, por Intent) e hardware (stateful, por bind de serviço).

### V. Device Compatibility & Fail-Fast (NON-NEGOTIABLE)

Hardware real só existe nos terminais POS homologados. Fora de um POS:

- Em desenvolvimento → mock explícito (comportamento previsível, sem crash).
- Em produção fora de POS → erro explícito e imediato (fail-fast), nunca silencioso.

Roadmap de validação: (1) mock primeiro — baseline atual; (2) homologação em dispositivo
físico depois; (3) e2e como meta futura. Enquanto não há device, mock MUST ser a fonte de
verdade de comportamento nos testes.

**Rationale**: falhar silenciosamente em produção fora de um terminal homologado mascara
bugs de integração que só apareceriam em campo; fail-fast move esse erro para o ponto mais
cedo possível.

### VI. Android-Only + Política de Lifecycle & Threading do PosDigital (NON-NEGOTIABLE)

Escopo exclusivamente Android (terminais POS físicos). `ios/` e `GetnetGetsmart.podspec` do
scaffold MUST ser removidos. Guard de proteção MUST existir para plataformas não-Android.

**Lifecycle do `PosDigital`** — modelo híbrido:

- Auto-gerenciado por padrão: `register()` lazy atrelado ao lifecycle do
  `ReactApplicationContext`, com `ensureConnected()` (`isInitiated()`) antes de cada
  chamada — nenhuma chamada de hardware exige boilerplate prévio do consumidor.
- `connect()` idempotente opcional: permite warm-up explícito antes de uma tela crítica
  (ex.: splash "conectando ao terminal…" antes de liberar venda).
- Eventos `onConnected`/`onDisconnected`/`onError` + hook `useGetnetConnection` MUST existir
  para observabilidade — a política de reconexão (abaixo) tem limite de tentativas e pode
  falhar; sem eventos o app não tem como saber que o terminal caiu.

**Threading Policy**:

- `register()` NUNCA em thread separada. MUST rodar na main thread — regra explícita da
  doc oficial (chamar fora dela causa concorrência de threads, instabilidade e erros).
- Reconexão MUST ser tratada no `onError()` do `bindCallback`, com limite de 3 tentativas.
- Operações que bloqueiam MUST rodar fora da main thread; callbacks AIDL `Stub` MUST ser
  normalizados antes de cruzar para o JS.

**Rationale**: o `PosDigital` é um serviço Android vinculado (bind), não uma chamada
stateless — diferente de libs como `react-native-pagseguro-plugpag` (ativação pontual, sem
reconexão). O modelo híbrido cobre tanto o caso comum (zero boilerplate) quanto o caso
crítico (warm-up antes de venda), com eventos para não deixar o app cego a quedas de
conexão.

### VII. KISS: Simplicidade Deliberada (NON-NEGOTIABLE)

Código simples e direto vence código "esperto". Menos peças móveis é a solução correta;
complexidade adicional MUST ser justificada por requisito real, nunca por "pode ser útil um
dia" (YAGNI). A regra vale para as duas camadas.

**TypeScript (camada JS pública)**:

- Funções pequenas, de responsabilidade única; sem abstração especulativa — só se cria
  camada genérica quando há dois usos reais.
- Fluxo linear: early return em vez de `if/else` aninhado; sem ternários encadeados nem
  one-liners ilegíveis.
- Composição em vez de herança; sem metaprogramação nem factories genéricas.
- Nomes descritivos que dispensam comentário — comente o porquê, nunca o o quê.

**Kotlin / código nativo**:

- Um método faz uma coisa: recebe do JS, delega ao `PosDigital`, normaliza o retorno. Zero
  lógica de negócio no módulo nativo.
- Preferir funções e `data class` a hierarquias de classe; evitar reflexão e `object`
  singletons desnecessários.
- Sem otimização prematura: legibilidade primeiro, otimizar só com medição em mãos.
- Tratamento de erro explícito e local (fail-fast, Princípio V); nada de `try/catch`
  engolindo exceção em silêncio.

**Rationale**: a lib é consumida por terceiros em ambiente crítico (venda em POS);
simplicidade deliberada reduz superfície de bug e facilita auditoria em código que lida
com dinheiro.

### VIII. AAR fornecido pelo consumidor (modelo Firebase) (NON-NEGOTIABLE)

O `libposdigital.aar` não está em Maven público — baixa-se do Portal do Desenvolvedor da
Getnet, sob login e termos.

- A lib NUNCA redistribui o binário da Getnet (nem no npm, nem no repositório). O
  consumidor fornece o `.aar`, no modelo Firebase/`google-services.json`: baixa do Portal,
  coloca num caminho e a lib apenas injeta a dependência.
- Mecanismo: bare RN via `gradle.properties` (ex.: `GETNET_POSDIGITAL_AAR=…`) com resolução
  `flatDir`/`files(...)`; Expo via prop do config plugin (`posDigitalAarPath`) no
  `app.json`.
- O `.aar` é exigido em tempo de compilação (o `android/` da lib compila dentro do build do
  app) — não há caminho "só-pagamento sem AAR" no pacote único, já que a v1 inclui a
  Impressora.
- DX obrigatória: `.aar` ausente MUST falhar com erro de Gradle claro e amigável
  (instruindo a baixar do Portal e configurar o caminho), nunca com erro críptico de classe
  `com.getnet.posdigital.*` não encontrada.
- A versão de AAR suportada MUST ser documentada (deprecados do SDK vivem só 1 versão).

**Rationale**: redistribuir o `.aar` violaria os termos do Portal do Desenvolvedor da
Getnet; o modelo Firebase é o padrão já validado pelo ecossistema RN para dependências
proprietárias sob licença restrita.

## Regras Transversais

### Mapeamento de callbacks nativos → JS (estratégia híbrida)

- Fluxo de desfecho único (impressora, mifare, leitura simples de cartão) → `Promise`
  (`resolve`/`reject`).
- Fluxo com múltiplos desfechos assíncronos que podem chegar fora de ordem — ex.: câmera
  (`onSuccess` / `onTimeout` / `onCancel` / `onError`) → `NativeEventEmitter` + hook (ex.:
  um hook `usePaymentProgress` que assina os eventos e expõe o progresso ao componente).
- Callbacks AIDL `Stub` NÃO são mapeados 1:1 para `resolve/reject` quando têm mais de dois
  desfechos.

### Convenção de erro nativo

- Código namespaced por domínio: `GETSMART_<DOMAIN>_ERROR`.
  - Ex.: `GETSMART_PAYMENT_ERROR`, `GETSMART_PRINTER_ERROR`, `GETSMART_CARD_ERROR`,
    `GETSMART_CAMERA_ERROR`, `GETSMART_INTERNAL_ERROR` (fallback genérico).
- Erros de pagamento (Intent) e de hardware (PosDigital) compartilham a mesma convenção
  para tratamento previsível por domínio no JS.

### Defaults técnicos (normativos)

- Linguagem nativa: Kotlin (zero Java novo).
- `minSdkVersion 24` — terminais exigem suporte até API 25 (Sunmi P2 / Android 7.1).
- Licença: MIT.

## Estrutura de Pastas Alvo

Pacote único com dois namespaces (`GetnetPayment` + `GetnetHardware`):

```text
react-native-getnet-getsmart/
├── src/
│   ├── index.tsx             # barrel — re-exporta a API pública
│   ├── Native*.ts            # Specs TurboModule (fonte de verdade JS↔Native)
│   ├── payment/               # GetnetPayment — módulo nativo fino (Intent/ActivityEventListener)
│   ├── hardware/               # GetnetHardware — PosDigital (AAR)
│   │   ├── printer/          # + receipt builder (acentos via Bitmap)
│   │   ├── card/               # mag/chip/NFC — usa eventos
│   │   ├── mifare/
│   │   ├── camera/           # barcode/QR — usa eventos
│   │   ├── led/
│   │   ├── beeper/
│   │   ├── info/               # serial OFICIAL do terminal (não o do Android)
│   │   └── statistics/
│   ├── types/                # tipos compartilhados (unions discriminadas)
│   └── hooks/                 # hooks de eventos (useGetnetConnection, useCardReader…)
├── android/                   # Kotlin: PaymentModule, módulos de hardware, Package
├── plugin/                    # Expo config plugin (manifest, signing, injeção do AAR)
├── example/                   # demonstração + roteiro de homologação (Rebatedor/Devkit)
└── docs/                      # site de docs (fase posterior)
```

Decisões de roadmap (escopo de versão, fases de entrega, testes de homologação),
notas de planejamento e decisões adiadas ficam fora do corpo normativo desta constituição
e são rastreadas em `ESBOCO-CONSTITUICAO.md` / `RELATORIO-CONSTITUICAO.md` e na nota de
planejamento do vault ("04 - Planejamento da Biblioteca").

## Governance

Esta constituição tem precedência sobre qualquer outra prática, convenção ou preferência
individual registrada no projeto, incluindo o `CLAUDE.md` — que permanece como camada
**operacional** (estado vivo, comandos, arquitetura de referência) e MUST ser mantido
consistente com os princípios aqui fixados, nunca contradizê-los.

**Procedimento de emenda**: qualquer mudança nos Princípios I–VIII ou nas Regras
Transversais MUST ser proposta por escrito (PR editando este arquivo), MUST incluir o Sync
Impact Report atualizado (versão anterior → nova, seções afetadas, templates que precisam
de atualização) e MUST ser revisada antes do merge.

**Política de versionamento semântico** desta constituição:

- **MAJOR**: remoção ou redefinição incompatível de princípio existente (ex.: abandonar
  TDD, permitir `any`, redistribuir o `.aar`).
- **MINOR**: adição de novo princípio ou expansão material de uma regra existente.
- **PATCH**: esclarecimentos de redação, correções de erro de digitação, refinamentos não
  semânticos.

**Revisão de conformidade**: todo PR MUST ser verificado contra os Princípios I–VIII antes
do merge. Complexidade que viole o Princípio VII (KISS) MUST ser justificada explicitamente
na descrição do PR. Testes que violem o Princípio III (Test-First) bloqueiam o merge.

**Version**: 0.3.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
