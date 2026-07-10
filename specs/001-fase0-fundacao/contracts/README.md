# Contracts: Fase 0 — Fundação

Esta feature não adiciona nenhum novo método `Spec`/TurboModule (o contrato JS↔Native de
`NativeGetnetGetsmart.ts` permanece inalterado — `multiply` continua sendo o único método
nativo até a Fase 1). Os "contratos" desta fase são de dois tipos:

## 1. Contrato de tipos públicos (`src/types/`)

Exportados pelo barrel `src/index.tsx`:

```ts
export type { PaymentRequest } from './types/PaymentRequest';
export type { PaymentResult } from './types/PaymentResult';
export { PaymentType, PaymentResultCode, PaymentResultDetail } from './types/enums';
```

Ver [data-model.md](./../data-model.md) para a forma completa de cada tipo/enum.

## 2. Contrato do Expo config plugin (`app.json`)

```json
{
  "plugins": [
    [
      "react-native-getnet-getsmart",
      {
        "posDigitalAarPath": "./getnet/libposdigital.aar",
        "priority_pay": false,
        "allow_print_permission": false,
        "kiosk_mode": false
      }
    ]
  ]
}
```

**Efeito esperado no `AndroidManifest.xml` gerado** (`npx expo prebuild`):

```xml
<queries>
  <package android:name="com.getnet.posdigital.service" />
</queries>

<uses-permission android:name="com.getnet.posdigital.service.POSDIGITAL" />

<!-- por prop opt-in habilitada (nomes/valor literais exigidos pelo app Pagamento
     da Getnet — vault Docs SDK/02; nunca com prefixo de pacote) -->
<meta-data android:name="priority_pay" android:value="1" />
<meta-data android:name="allow_print_permission" android:value="1" />
<meta-data android:name="kiosk_mode" android:value="1" />
```

**Efeito esperado no `build.gradle` do módulo app** quando `posDigitalAarPath` resolve para um
arquivo existente: dependência `.aar` resolvida via `flatDir`/`files(...)`. Quando o arquivo
não existe (ou a prop está ausente): build falha com `GradleException` cuja mensagem cita o
Portal do Desenvolvedor Getnet e o nome da prop a configurar.

## 3. Contrato bare RN (`gradle.properties`)

```properties
GETNET_POSDIGITAL_AAR=/caminho/absoluto/para/libposdigital.aar
```

Resolução via `flatDir`/`files(...)` idêntica à do caminho Expo, mas implementada
diretamente em `android/build.gradle` da própria lib (não no app), e de forma **opt-in**:
como esse arquivo é compartilhado por todo tipo de consumidor (inclusive Expo, que nunca
define essa propriedade), a ausência de `GETNET_POSDIGITAL_AAR` não falha o build — apenas
significa que a resolução bare RN não se aplica. Quando a propriedade **está** definida mas
aponta para um arquivo inexistente, o build falha com a mesma mensagem amigável (Portal do
Desenvolvedor Getnet). Ver `README.md` § "Bare React Native" para o passo a passo completo,
incluindo a limitação atual de que manifest/assinatura V1+V2 ainda exigem edição manual
nesse caminho (não há config plugin fora do Expo).
