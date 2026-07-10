import { withAppBuildGradle } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';

const MARKER = '// react-native-getnet-getsmart: assinatura V1+V2 (Sunmi P2)';

/**
 * Força `v1SigningEnabled`/`v2SigningEnabled` em todos os `signingConfigs` do
 * `app/build.gradle` gerado — exigência do Sunmi P2 (PRD B4).
 */
export function addSigningV1V2(contents: string): string {
  if (contents.includes(MARKER)) {
    return contents;
  }

  return `${contents}\n${MARKER}\nandroid.signingConfigs.all { config ->\n    config.v1SigningEnabled = true\n    config.v2SigningEnabled = true\n}\n`;
}

export const withSigningV1V2: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error(
        'react-native-getnet-getsmart: withSigningV1V2 só suporta build.gradle em Groovy.'
      );
    }
    modConfig.modResults.contents = addSigningV1V2(
      modConfig.modResults.contents
    );
    return modConfig;
  });
};
