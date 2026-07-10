import { AndroidConfig, withAndroidManifest } from '@expo/config-plugins';
import type { AndroidManifest } from '@expo/config-plugins/build/android/Manifest';
import type { ConfigPlugin } from '@expo/config-plugins';

export const POSDIGITAL_SERVICE_PACKAGE = 'com.getnet.posdigital.service';
export const POSDIGITAL_PERMISSION = 'com.getnet.posdigital.service.POSDIGITAL';

// Nomes e valor ("1") exigidos literalmente pelo app Pagamento da Getnet —
// vault Docs SDK/02 §§ "Prioridade de Pagamento", "Responsabilidade de
// impressão", "Modo Quiosque". Não são namespaced (nada de prefixo de
// pacote); por isso a prop pública usa o mesmo nome literal (snake_case,
// igual ao documentado em app.json) em vez de camelCase — reaproveitando o
// nome também evita um bug de "prop nunca lida" por divergência de grafia.
const META_DATA_ENABLED_VALUE = '1';

export interface GetnetManifestProps {
  priority_pay?: boolean;
  allow_print_permission?: boolean;
  kiosk_mode?: boolean;
}

/**
 * Mutação pura do `AndroidManifest.xml` parseado — injeta a query/permissão do
 * serviço PosDigital e os metadados das props opt-in. Separada do
 * `ConfigPlugin` para ser testável sem um projeto Expo completo (RNF-02).
 */
export function setPosDigitalManifestEntries(
  androidManifest: AndroidManifest,
  props: GetnetManifestProps = {}
): AndroidManifest {
  addPosDigitalQuery(androidManifest);
  addPosDigitalPermission(androidManifest);

  const mainApplication =
    AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

  if (props.priority_pay) {
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'priority_pay',
      META_DATA_ENABLED_VALUE
    );
  }
  if (props.allow_print_permission) {
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'allow_print_permission',
      META_DATA_ENABLED_VALUE
    );
  }
  if (props.kiosk_mode) {
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'kiosk_mode',
      META_DATA_ENABLED_VALUE
    );
  }

  return androidManifest;
}

function addPosDigitalQuery(androidManifest: AndroidManifest): void {
  const { manifest } = androidManifest;
  if (!manifest.queries) {
    manifest.queries = [];
  }

  const alreadyDeclared = manifest.queries.some((query) =>
    query.package?.some(
      (pkg) => pkg.$['android:name'] === POSDIGITAL_SERVICE_PACKAGE
    )
  );
  if (alreadyDeclared) {
    return;
  }

  manifest.queries.push({
    package: [{ $: { 'android:name': POSDIGITAL_SERVICE_PACKAGE } }],
  });
}

function addPosDigitalPermission(androidManifest: AndroidManifest): void {
  const permissions = androidManifest.manifest['uses-permission'] ?? [];
  if (
    AndroidConfig.Permissions.isPermissionAlreadyRequested(
      POSDIGITAL_PERMISSION,
      permissions
    )
  ) {
    return;
  }

  AndroidConfig.Permissions.addPermission(
    androidManifest,
    POSDIGITAL_PERMISSION
  );
}

export const withGetnetAndroidManifest: ConfigPlugin<GetnetManifestProps> = (
  config,
  props
) => {
  return withAndroidManifest(config, (modConfig) => {
    modConfig.modResults = setPosDigitalManifestEntries(
      modConfig.modResults,
      props
    );
    return modConfig;
  });
};
