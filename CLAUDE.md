# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comunicação

Responda ao usuário sempre em **pt-BR** (português do Brasil). Mantenha código, nomes de
identificadores e termos técnicos consagrados em inglês.

## ⚠️ Nota temporária (remover ao iniciar a task de documentação)

Enquanto o projeto estiver na fase de MVP (Fase 0/1 do [PRD.md](PRD.md)), **não crie nem
atualize o [README.md](README.md)** como parte de outras tasks — é trabalho desnecessário
nesta fase e será feito de uma vez em uma task dedicada de documentação, quando o escopo
estabilizar. Focar em código, testes e specs; documentação pública fica para depois. Remova
esta seção do CLAUDE.md quando essa task de documentação for iniciada.

## What this is

A React Native **Turbo Module** library (`react-native-getnet-getsmart`) scaffolded with
[create-react-native-library](https://github.com/callstack/react-native-builder-bob).
It's a monorepo of two packages: the library at the root and a consuming Expo app in
[example/](example/). The library is **Android-only** (Princípio VI da constituição — ver
seção abaixo); the placeholder `multiply(a, b)` is still the only native method, and the real
payment/hardware integration still needs to be built out.

Uses the **New Architecture** (Fabric/TurboModules). React 19, React Native 0.83, Yarn 4
(Berry) workspaces, and Turborepo. Node version is pinned in [.nvmrc](.nvmrc).

## Commands

Run these from the **root** directory. The package manager is Yarn 4 — do not use npm (it will
break the workspace symlinks).

```sh
yarn                     # install all workspace deps
yarn typecheck           # tsc, no emit
yarn lint                # eslint over **/*.{js,ts,tsx}
yarn test                # jest
yarn test path/to/file.test.tsx           # single file
yarn test -t "multiply"                    # single test by name
yarn prepare             # build the library into lib/ via bob (module + typescript targets)
yarn clean               # remove lib/
```

Running the example app (each proxies into the `example` workspace):

```sh
yarn example start       # Metro bundler (dev client)
yarn example android     # build + run on Android
yarn example web         # run on web (react-native-web)
```

There is no `yarn example ios` — the library is Android-only (Princípio VI); the fail-fast
guard throws immediately if the native module is reached from any other platform.

`app.plugin.js` (repo root) requires the **compiled** `plugin/build/` at runtime — that's how
Expo resolves the config plugin during `prebuild`/`yarn example android`. `plugin/build/` is
generated (`yarn build:plugin`, also run by `yarn prepare`) and gitignored, so after `git
clean`, deleting it, or a fresh checkout, `yarn example android` fails with `Cannot find
module './plugin/build/withGetnetGetsmart'` until you rebuild it.

JS changes in `src/` are picked up by the example without a rebuild; **native code changes
require rebuilding** the example app. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml))
runs lint, typecheck, jest, `yarn prepare`, and native builds for Android/web.

## Architecture

The public API surface is a single `multiply` function, but its definition is split three ways —
this pattern is how you add any new native method:

- [src/NativeGetnetGetsmart.ts](src/NativeGetnetGetsmart.ts) — the **codegen spec**. The
  `Spec extends TurboModule` interface here is the contract. React Native Codegen reads it (see
  `codegenConfig` in [package.json](package.json)) to generate the native base classes
  (`NativeGetnetGetsmartSpec`) that the platform implementations extend.
- [src/multiply.tsx](src/multiply.tsx) vs [src/multiply.native.tsx](src/multiply.native.tsx) —
  Metro resolves `.native.tsx` on Android (which calls into the TurboModule, guarded by
  `assertAndroidPlatform`) and the plain `.tsx` on web (a pure-JS fallback). Web has no native
  module, so every native method needs a JS fallback in the non-`.native` file.
- The native implementation extends the generated spec:
  [android/.../GetnetGetsmartModule.kt](android/src/main/java/com/getnetgetsmart/GetnetGetsmartModule.kt)
  (Kotlin). The Android Java package is `com.getnetgetsmart`; the registered TurboModule name
  is `"GetnetGetsmart"`. The library is **Android-only** (Princípio VI) — there is no iOS
  implementation and none is planned.

[src/index.tsx](src/index.tsx) is the barrel that re-exports the public API.

### Adding a native method

1. Add the method signature to the `Spec` interface in `NativeGetnetGetsmart.ts`.
2. Implement it natively in `GetnetGetsmartModule.kt` (override the generated abstract method).
3. Add a `src/<name>.native.tsx` that calls the TurboModule and a `src/<name>.tsx` web fallback.
4. Re-export from `src/index.tsx`.
5. Rebuild the example app so codegen regenerates the native specs.

## Constituição e estrutura alvo

A constituição do projeto ([.specify/memory/constitution.md](.specify/memory/constitution.md),
v0.3.0) **tem precedência sobre este arquivo** e fixa 8 princípios NON-NEGOTIABLE. Os mais
operacionais no dia a dia:

- **TurboModules only** (Princípio I) — Spec `.ts` é a fonte única do contrato JS↔Native.
- **TypeScript strict, zero `any`** (II) — resultados de pagamento/hardware são unions
  discriminadas; `@ts-expect-error` só com `// EXCEPTION: <motivo>`.
- **TDD** (III) — teste Red antes da implementação; 100% das funções exportadas cobertas.
- **Estrutura por domínio** (IV) — dois namespaces: `GetnetPayment` (`src/payment/`,
  Intent/deeplink, sem AAR) e `GetnetHardware` (`src/hardware/<serviço>/`, SDK PosDigital);
  tipos compartilhados em `src/types/`, hooks de eventos em `src/hooks/`.
- **Android-only** (VI) — sem scaffold iOS; guard fail-fast
  ([src/utils/assertAndroidPlatform.ts](src/utils/assertAndroidPlatform.ts)) para
  plataformas não-Android.
- **KISS/YAGNI** (VII) — **não criar pastas/abstrações antecipadamente**: cada pasta da
  estrutura alvo nasce apenas quando a fase do roadmap a implementa.
- **AAR fornecido pelo consumidor** (VIII) — nunca commitar/redistribuir `libposdigital.aar`.
- Erros nativos seguem `GETSMART_<DOMAIN>_ERROR` (ex.: `GETSMART_PAYMENT_ERROR`).

### Estrutura de pastas (estado atual vs. alvo)

Espelha a seção "Estrutura de Pastas Alvo" da constituição. Pastas marcadas `(ainda não
existe)` só nascem quando a fase do roadmap que as implementa começar (Princípio VII) — não
as crie antecipadamente.

```text
react-native-getnet-getsmart/
├── src/
│   ├── index.tsx             # barrel — re-exporta a API pública
│   ├── Native*.ts            # Specs TurboModule (fonte de verdade JS↔Native)
│   ├── utils/                 # guards internos (ex.: assertAndroidPlatform)
│   ├── payment/                # GetnetPayment — esqueleto (Fase 0); métodos na Fase 1
│   ├── hardware/               # (ainda não existe) GetnetHardware — PosDigital, Fase 2+
│   ├── types/                # tipos compartilhados (unions discriminadas) — PaymentRequest,
│   │                          # PaymentResult, enums de result/resultDetails
│   └── hooks/                 # (ainda não existe) hooks de eventos, Fase 2+
├── android/                   # Kotlin: módulo nativo + Package
├── plugin/                    # Expo config plugin (manifest, signing, injeção do AAR)
├── example/                   # demonstração + roteiro de homologação
└── docs/                      # (ainda não existe) site de docs, fase posterior
```

Fases e escopo atual: ver [PRD.md](PRD.md) (Fase 0) e o tracker no vault Obsidian
(`Docs SDK/05 - Plano de Tasks de Desenvolvimento`).

## Notes

- The example app is Expo (SDK 55). Its [example/AGENTS.md](example/AGENTS.md) warns: read the
  versioned Expo docs at https://docs.expo.dev/versions/v55.0.0/ before writing Expo code.
- `main`/`types` in package.json point at built `lib/` output, but the `react-native-getnet-getsmart-source`
  export condition points consumers at `src/` — that's why the example uses source directly.
- Prettier config lives inline in package.json (single quotes, 2-space, es5 trailing commas).
