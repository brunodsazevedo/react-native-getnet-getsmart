# Quickstart: validar a Fase 0 — Fundação

Pré-requisitos: `yarn` instalado na raiz (`yarn` já rodado), Node na versão do `.nvmrc`.

## 1. Tipos do domínio de pagamento

```sh
yarn typecheck
```

Esperado: sem erros; `PaymentRequest`/`PaymentResult`/enums exportados de
`src/index.tsx` e resolvidos por qualquer consumidor via
`import { PaymentResult } from 'react-native-getnet-getsmart'`.

```sh
yarn test src/__tests__
```

Esperado: testes de `PaymentResult` cobrindo cada variante da union (approved/denied/
cancelled/error) passam.

## 2. Scaffold iOS removido

```sh
test ! -e ios && test ! -f GetnetGetsmart.podspec && echo "OK: iOS removido"
grep -L "ios" package.json  # não deve haver "ios"/"podspec"/"objc" nas seções relevantes
```

Esperado: `ios/` e o `.podspec` não existem; `package.json` sem referências a iOS.

## 3. Guard fail-fast de plataforma

```sh
yarn test -t "fail-fast"
```

Esperado: teste simula `Platform.OS = 'ios'` e confirma que `NativeGetnetGetsmart.ts` lança
um erro explícito ("... suporta apenas Android ...") antes mesmo de tentar resolver o
TurboModule via `TurboModuleRegistry`.

## 4. Config plugin — prebuild do example

```sh
cd example
npx expo prebuild --platform android --no-install
```

Com `posDigitalAarPath` configurado no `example/app.json` apontando para
`example/getnet/libposdigital.aar` (fixture local, criada manualmente para validação —
**validado em 2026-07-09**):

- ✅ `android/app/src/main/AndroidManifest.xml` gerado contém `<queries><package
  android:name="com.getnet.posdigital.service"/></queries>` e a permissão
  `com.getnet.posdigital.service.POSDIGITAL`.
- ✅ `android/app/build.gradle` gerado contém o snippet de assinatura V1+V2 e a resolução
  `flatDir`/`files("libs/libposdigital.aar")`; o arquivo foi copiado para
  `android/app/libs/libposdigital.aar`.
- ✅ `cd android && ./gradlew :react-native-getnet-getsmart:tasks --offline` roda sem erros
  de parsing/avaliação do Gradle (confirma que o Groovy injetado é válido).
- ✅ O guard-rail de permissões proibidas disparou um aviso real durante o prebuild
  (`android.permission.SYSTEM_ALERT_WINDOW`, injetada por outro módulo Expo padrão),
  confirmando que `withForbiddenPermissionsGuard` funciona fim a fim.

Apontando `posDigitalAarPath` para um arquivo inexistente (**validado**): o `expo prebuild`
falha imediatamente com `Error: [android.dangerous]: ... libposdigital.aar não encontrado
... Baixe o .aar no Portal do Desenvolvedor Getnet ...` — nunca um erro de classe
`com.getnet.posdigital.*` não encontrada.

## 5. Bare RN — resolução opt-in do `.aar`

```sh
yarn jest android/__tests__
```

Esperado: confirma que `android/build.gradle` da lib lê `GETNET_POSDIGITAL_AAR`, resolve via
`flatDir`, falha com mensagem amigável quando definida mas inválida, e não força o build
quando a propriedade está ausente (para não quebrar consumidores Expo). Ver `README.md` §
"Bare React Native" para o passo a passo do consumidor.

## 6. CI

```sh
yarn lint && yarn typecheck && yarn test && yarn prepare
```

Esperado: todos verdes; o workflow `.github/workflows/ci.yml` não possui mais o job
`build-ios`.
