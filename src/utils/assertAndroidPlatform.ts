import { Platform } from 'react-native';

/**
 * Guard fail-fast (Princípio V/VI): react-native-getnet-getsmart só suporta Android.
 * Chamado antes de qualquer acesso ao TurboModule nativo — nunca falha silenciosamente.
 */
export function assertAndroidPlatform(): void {
  if (Platform.OS !== 'android') {
    throw new Error(
      `react-native-getnet-getsmart suporta apenas Android. Plataforma atual: "${Platform.OS}".`
    );
  }
}
