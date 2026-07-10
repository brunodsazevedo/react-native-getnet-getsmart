# Research: Fase 0 — Fundação

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` (ver
[plan.md](./plan.md)); esta fase consolida as decisões técnicas necessárias para a Fase 1
do PRD (Design & Contracts), com base no `PRD.md` e na constituição do projeto.

## Decisão 1 — Biblioteca de implementação do config plugin

**Decision**: usar `@expo/config-plugins` (o mesmo mecanismo de `withAndroidManifest`,
`withGradleProperties`, `withDangerousMod` usado pelo ecossistema Expo) para implementar
`plugin/`.

**Rationale**: é a API padrão para modificar `AndroidManifest.xml`/`build.gradle` no
`prebuild`; qualquer app Expo já a inclui transitivamente, e ela expõe utilitários de merge
de manifest que evitam duplicar `<queries>`/permissões já declaradas pelo app consumidor
(edge case do spec.md).

**Alternatives considered**: manipular XML/Gradle manualmente via regex/string — rejeitado
por ser frágil a mudanças de formatação e não lidar com merge/deduplicação de manifest.

## Decisão 2 — Resolução do `.aar` (Expo vs. bare RN)

**Decision**: no Expo, o plugin lê `posDigitalAarPath` do `app.json` e usa `withDangerousMod`
("android") para copiar/apontar o arquivo para `android/libs/` do projeto gerado, adicionando
a resolução `flatDir` + `implementation files(...)` ao `build.gradle` do app. No bare RN, o
mesmo mecanismo `flatDir`/`files(...)` é documentado para uso manual via
`GETNET_POSDIGITAL_AAR` em `gradle.properties`.

**Rationale**: mantém paridade funcional exata entre os dois caminhos (FR-011), reaproveitando
a mesma estratégia Gradle (`flatDir`) — decisão já travada no PRD (modelo Firebase/
`google-services.json`).

**Alternatives considered**: publicar o `.aar` num Maven local dentro do repo do consumidor —
rejeitado por exigir passo manual adicional e não resolver o caso "app.json aponta direto pro
arquivo".

## Decisão 3 — Falha amigável quando o `.aar` está ausente

**Decision**: um `Exec`/`doFirst` no `build.gradle` (injetado pelo plugin ou documentado para
o bare RN) que verifica a existência do arquivo resolvido e lança
`GradleException` com uma mensagem apontando para o Portal do Desenvolvedor Getnet e o nome
da propriedade a configurar (`posDigitalAarPath` ou `GETNET_POSDIGITAL_AAR`), antes de
qualquer tentativa de resolver a dependência Gradle (que produziria um erro críptico de
classe ausente).

**Rationale**: atende FR-012/B7 diretamente — a mensagem de erro é o requisito de DX mais
citado no PRD (bloco B7, RNF do PRD).

**Alternatives considered**: deixar o Gradle falhar "naturalmente" ao não achar a classe em
tempo de compilação — rejeitado, é exatamente o comportamento proibido pelo requisito.

## Decisão 4 — Guard fail-fast de plataforma não-Android

**Decision**: um check no módulo JS de entrada (`src/index.tsx` ou um util interno chamado
por ele) que lança um erro explícito (`Error` com mensagem clara, não um throw silencioso ou
undefined) quando `Platform.OS !== 'android'`, na primeira tentativa de uso de qualquer API
nativa da lib.

**Rationale**: Princípio V (fail-fast) e VI (Android-only) exigem que o comportamento fora do
Android seja um erro imediato e explícito, não um crash genérico do TurboModule ausente.

**Alternatives considered**: deixar o erro nativo "module not found" surgir naturalmente —
rejeitado por não ser "explícito e imediato" no sentido do Princípio V (mensagem pouco clara
para o consumidor).

## Decisão 5 — Lista de permissões proibidas (guard-rail B8)

**Atualização (2026-07-10)**: o vault ficou acessível durante a implementação. A lista
completa e oficial foi lida em `Docs SDK/01 - Iniciando Integração` §
"Permissões proibidas no AndroidManifest" e passou a ser a fonte de verdade de
`DEFAULT_FORBIDDEN_PERMISSIONS` (`plugin/src/withForbiddenPermissionsGuard.ts`), substituindo
a lista mínima de 3 itens inferida do PRD (que incluía `DEVICE_POWER`, permissão que não
consta da lista oficial — corrigido).

**Decision**: armazenar as permissões pelo **nome local** (sem prefixo de pacote), já que a
doc as lista assim e nem todas pertencem ao namespace `android.permission.*` (ex.:
`INSTALL_SHORTCUT` costuma ser `com.android.launcher.permission.*`). O matching em
`findForbiddenPermissions` compara pelo segmento final do `android:name` declarado no
manifest do consumidor, não pela string inteira — mais robusto a variação de namespace.

**Rationale**: preserva o guard-rail funcional (validado manualmente via `expo prebuild`,
que já sinalizou corretamente `android.permission.SYSTEM_ALERT_WINDOW` presente no manifest
padrão do Expo) sem depender de o consumidor declarar a permissão com o prefixo exato que a
doc lista de forma abreviada.

**Nota de qualidade da fonte**: a doc oficial lista "WRITE_SECURE_SETTIN" (aparente typo);
corrigido para o nome real da permissão Android, `WRITE_SECURE_SETTINGS`.

**Alternatives considered**: bloquear a implementação até obter a lista — rejeitado
originalmente por instrução do usuário (registrar em `blockers.md` e seguir); tornou-se moot
assim que o vault ficou acessível.

## Decisão 6 — Correção pós-vault: nomes dos metadados opt-in e semântica de `result`

**Contexto**: antes de acessar o vault, `withAndroidManifest.ts` usava chaves de meta-data
inventadas (`com.getnet.posdigital.PRIORITY_PAY` etc., valor `"true"`) e `PaymentResult`
discriminava por strings inventadas (`APPROVED`/`DENIED`/`CANCELLED`/`ERROR`) com
`resultDetails` como uma lista de motivos específicos fabricados
(`INSUFFICIENT_FUNDS`/`CARD_ERROR`/...). Ambos foram **bugs reais**, não apenas suposições
razoáveis — divergiam do que o app Pagamento da Getnet realmente espera/retorna.

**Decision**: após ler `Docs SDK/02 - Integração de Pagamento`, corrigido para:
- Metadados usam os nomes **literais exigidos pela Getnet** (`priority_pay`,
  `allow_print_permission`, `kiosk_mode`, minúsculos, sem prefixo de pacote) com
  `android:value="1"`. A prop pública do plugin também passou a usar esses mesmos nomes
  (`priority_pay` em vez de `priorityPay`) — evita um segundo bug de "prop nunca lida" por
  divergência de grafia entre o `app.json` documentado e o código.
- `PaymentResult` discrimina por `PaymentResultCode` (número, 0–5), com `resultDetails`
  como o rótulo textual do mesmo código (`PaymentResultDetail`) — não dois eixos
  independentes de informação.

**Rationale**: validado empiricamente com `npx expo prebuild` real: antes da correção, o
`<meta-data name="priority_pay">` configurado em `app.json` **não aparecia** no manifest
gerado (prop nunca lida); depois da correção, aparece corretamente.

**Alternatives considered**: manter as chaves antigas e documentar o mapeamento — rejeitado,
adicionaria complexidade sem necessidade e continuaria divergindo do formato que o app
Pagamento real da Getnet espera.
