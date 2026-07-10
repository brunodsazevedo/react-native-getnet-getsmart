# react-native-getnet-getsmart

rn

## Installation


```sh
npm install react-native-getnet-getsmart
```


## Usage


```js
import { multiply } from 'react-native-getnet-getsmart';

// ...

const result = multiply(3, 7);
```


## PosDigital `.aar` (Impressora/Hardware)

A lib **não redistribui** o `libposdigital.aar` — baixe-o no Portal do Desenvolvedor Getnet
e forneça o caminho para a lib (modelo Firebase/`google-services.json`).

### Expo

Configure o config plugin em `app.json`:

```json
{
  "expo": {
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
}
```

`npx expo prebuild` injeta automaticamente no `AndroidManifest.xml` gerado as
`<queries>`/permissão do serviço `PosDigital`, configura a assinatura V1+V2 e resolve o
`.aar`. Se `posDigitalAarPath` estiver ausente ou apontar para um arquivo inexistente, o
prebuild falha com uma mensagem apontando para o Portal do Desenvolvedor Getnet.

### Bare React Native

Defina `GETNET_POSDIGITAL_AAR` em `android/gradle.properties` do seu app, apontando para o
caminho absoluto (ou relativo ao projeto) do `.aar` baixado:

```properties
GETNET_POSDIGITAL_AAR=/caminho/absoluto/para/libposdigital.aar
```

Isso é suficiente para o módulo da lib resolver o `.aar` automaticamente (`android/build.gradle`
da lib lê essa propriedade). Sem a variável, o `.aar` simplesmente não é resolvido pela lib —
apps bare RN ainda precisam declarar manualmente, no `AndroidManifest.xml` do próprio app, as
`<queries>`/permissão do serviço `PosDigital` e a assinatura V1+V2 (não há, hoje, um
mecanismo de config plugin fora do Expo para automatizar essa parte; ver
[`plugin/src/withAndroidManifest.ts`](plugin/src/withAndroidManifest.ts) e
[`plugin/src/withSigningV1V2.ts`](plugin/src/withSigningV1V2.ts) para o snippet equivalente
gerado automaticamente no caminho Expo).

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
