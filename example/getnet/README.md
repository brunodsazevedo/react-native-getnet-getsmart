`libposdigital.aar` neste diretório é um **fixture fake** (bytes arbitrários), usado apenas
para validar o Expo config plugin (`npx expo prebuild`) e o build do Gradle sem depender do
binário real da Getnet (RNF-02 do PRD). Nunca é o SDK oficial `PosDigital` — ver
`blockers.md` na raiz do repositório.

Para testar com o `.aar` real, baixe-o no Portal do Desenvolvedor Getnet e substitua este
arquivo localmente (sem commitar o binário oficial).
