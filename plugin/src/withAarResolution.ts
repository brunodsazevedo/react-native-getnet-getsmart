import * as fs from 'fs';
import * as path from 'path';
import { withAppBuildGradle, withDangerousMod } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';

export const AAR_LIBS_DIR = 'libs';
export const AAR_FILE_NAME = 'libposdigital.aar';

export interface AarResolutionProps {
  posDigitalAarPath?: string;
}

/**
 * Mensagem amigável exigida por FR-012/B7 — nunca o erro críptico padrão do
 * Gradle de classe `com.getnet.posdigital.*` não encontrada.
 */
export function buildMissingAarMessage(posDigitalAarPath?: string): string {
  return [
    'react-native-getnet-getsmart: libposdigital.aar não encontrado.',
    posDigitalAarPath
      ? `Caminho configurado (posDigitalAarPath): "${posDigitalAarPath}".`
      : 'Nenhum "posDigitalAarPath" configurado em app.json.',
    'Baixe o .aar no Portal do Desenvolvedor Getnet e aponte "posDigitalAarPath" para o arquivo em app.json.',
  ].join(' ');
}

export function resolveAarPath(
  projectRoot: string,
  posDigitalAarPath: string
): string {
  return path.isAbsolute(posDigitalAarPath)
    ? posDigitalAarPath
    : path.join(projectRoot, posDigitalAarPath);
}

/** Copia o `.aar` resolvido para `<platformProjectRoot>/app/libs/`. */
export function copyAarIntoAndroidProject(
  platformProjectRoot: string,
  resolvedAarPath: string
): void {
  const libsDir = path.join(platformProjectRoot, 'app', AAR_LIBS_DIR);
  fs.mkdirSync(libsDir, { recursive: true });
  fs.copyFileSync(resolvedAarPath, path.join(libsDir, AAR_FILE_NAME));
}

const DEPENDENCY_MARKER = '// react-native-getnet-getsmart: libposdigital.aar';

/** Injeta a resolução `flatDir`/`files(...)` no `app/build.gradle` gerado. */
export function addAarDependency(contents: string): string {
  if (contents.includes(DEPENDENCY_MARKER)) {
    return contents;
  }

  return `${contents}\n${DEPENDENCY_MARKER}\nrepositories {\n    flatDir { dirs "libs" }\n}\n\ndependencies {\n    implementation files("libs/${AAR_FILE_NAME}")\n}\n`;
}

export const withAarResolution: ConfigPlugin<AarResolutionProps> = (
  config,
  props
) => {
  const withCopiedAar = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const { posDigitalAarPath } = props;
      if (!posDigitalAarPath) {
        throw new Error(buildMissingAarMessage());
      }

      const resolvedPath = resolveAarPath(
        modConfig.modRequest.projectRoot,
        posDigitalAarPath
      );
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(buildMissingAarMessage(posDigitalAarPath));
      }

      copyAarIntoAndroidProject(
        modConfig.modRequest.platformProjectRoot,
        resolvedPath
      );

      return modConfig;
    },
  ]);

  return withAppBuildGradle(withCopiedAar, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error(
        'react-native-getnet-getsmart: withAarResolution só suporta build.gradle em Groovy.'
      );
    }
    modConfig.modResults.contents = addAarDependency(
      modConfig.modResults.contents
    );
    return modConfig;
  });
};
