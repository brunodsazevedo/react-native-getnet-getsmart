# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comunicação

Responda ao usuário sempre em **pt-BR** (português do Brasil). Mantenha código, nomes de
identificadores e termos técnicos consagrados em inglês.

## What this is

A React Native **Turbo Module** library (`react-native-getnet-getsmart`) scaffolded with
[create-react-native-library](https://github.com/callstack/react-native-builder-bob).
It's a monorepo of two packages: the library at the root and a consuming Expo app in
[example/](example/). The library currently only ships a placeholder `multiply(a, b)` — the real
native integration still needs to be built out on both platforms.

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
yarn example ios         # build + run on iOS
yarn example web         # run on web (react-native-web)
```

JS changes in `src/` are picked up by the example without a rebuild; **native code changes
require rebuilding** the example app. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml))
runs lint, typecheck, jest, `yarn prepare`, and native builds for Android/iOS/web.

## Architecture

The public API surface is a single `multiply` function, but its definition is split three ways —
this pattern is how you add any new native method:

- [src/NativeGetnetGetsmart.ts](src/NativeGetnetGetsmart.ts) — the **codegen spec**. The
  `Spec extends TurboModule` interface here is the contract. React Native Codegen reads it (see
  `codegenConfig` in [package.json](package.json)) to generate the native base classes
  (`NativeGetnetGetsmartSpec`) that the platform implementations extend.
- [src/multiply.tsx](src/multiply.tsx) vs [src/multiply.native.tsx](src/multiply.native.tsx) —
  Metro resolves `.native.tsx` on iOS/Android (which calls into the TurboModule) and the plain
  `.tsx` on web (a pure-JS fallback). Web has no native module, so every native method needs a
  JS fallback in the non-`.native` file.
- Native implementations extend the generated spec:
  [android/.../GetnetGetsmartModule.kt](android/src/main/java/com/getnetgetsmart/GetnetGetsmartModule.kt)
  (Kotlin) and [ios/GetnetGetsmart.mm](ios/GetnetGetsmart.mm) (Objective-C++). The Android Java
  package is `com.getnetgetsmart`; the registered TurboModule name is `"GetnetGetsmart"`.

[src/index.tsx](src/index.tsx) is the barrel that re-exports the public API.

### Adding a native method

1. Add the method signature to the `Spec` interface in `NativeGetnetGetsmart.ts`.
2. Implement it natively in `GetnetGetsmartModule.kt` and `GetnetGetsmart.mm` (override the
   generated abstract method).
3. Add a `src/<name>.native.tsx` that calls the TurboModule and a `src/<name>.tsx` web fallback.
4. Re-export from `src/index.tsx`.
5. Rebuild the example app so codegen regenerates the native specs.

## Notes

- The example app is Expo (SDK 55). Its [example/AGENTS.md](example/AGENTS.md) warns: read the
  versioned Expo docs at https://docs.expo.dev/versions/v55.0.0/ before writing Expo code.
- `main`/`types` in package.json point at built `lib/` output, but the `react-native-getnet-getsmart-source`
  export condition points consumers at `src/` — that's why the example uses source directly.
- Prettier config lives inline in package.json (single quotes, 2-space, es5 trailing commas).
