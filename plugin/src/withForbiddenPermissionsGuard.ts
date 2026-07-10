import { WarningAggregator, withAndroidManifest } from '@expo/config-plugins';
import type { AndroidManifest } from '@expo/config-plugins/build/android/Manifest';
import type { ConfigPlugin } from '@expo/config-plugins';

/**
 * Lista oficial de permissões cuja presença no `AndroidManifest.xml` bloqueia
 * o upload do app no Portal do Desenvolvedor Getnet.
 * Fonte: vault Docs SDK/01 § "Permissões proibidas no AndroidManifest".
 *
 * Armazenada pelo nome local (sem prefixo de pacote) porque a doc lista as
 * permissões assim e nem todas pertencem ao namespace `android.permission.*`
 * (ex.: `INSTALL_SHORTCUT` é `com.android.launcher.permission.*` em muitos
 * fabricantes) — o matching em `findForbiddenPermissions` compara pelo
 * segmento final do `android:name` declarado, não pela string inteira.
 *
 * Nota: a doc de origem lista "WRITE_SECURE_SETTIN" — corrigido aqui para o
 * nome real da permissão Android, `WRITE_SECURE_SETTINGS` (typo aparente na
 * documentação oficial da Getnet).
 */
export const DEFAULT_FORBIDDEN_PERMISSIONS: readonly string[] = [
  'ACCESS_INSTANT_APPS',
  'ACCESS_WEBVIEW',
  'BROADCAST_STICKY',
  'CHANGE_NETWORK_STATE',
  'CHANGE_WIFI_STATE',
  'DELETE_PACKAGES',
  'DISABLE_KEYGUARD',
  'DOWNLOAD_WITHOUT_NOTIFICATION',
  'DUMP',
  'INSTALL_PACKAGES',
  'INSTALL_SHORTCUT',
  'INTERACT_ACROSS_USERS_FULL',
  'KILL_BACKGROUND_PROCESSES',
  'MOUNT_UNMOUNT_FILESYSTEMS',
  'QUERY_ALL_PACKAGES',
  'REQUEST_DELETE_PACKAGES',
  'REQUEST_INSTALL_PACKAGES',
  'SET_TIME',
  'SET_TIME_ZONE',
  'SET_WALLPAPER',
  'SET_WALLPAPER_HINTS',
  'SYSTEM_ALERT_WINDOW',
  'USB_PERMISSION',
  'USB_SET',
  'USE_PERIPHERAL_IO',
  'WAKE_LOCK',
  'WHITE_CALENDAR',
  'WRITE_APN_SETTINGS',
  'WRITE_OWNER_DATA',
  'WRITE_SECURE_SETTINGS',
  'WRITE_SETTINGS',
];

function localPermissionName(androidName: string): string {
  const segments = androidName.split('.');
  return segments[segments.length - 1] ?? androidName;
}

export function findForbiddenPermissions(
  androidManifest: AndroidManifest,
  forbiddenPermissions: readonly string[] = DEFAULT_FORBIDDEN_PERMISSIONS
): string[] {
  const declared = androidManifest.manifest['uses-permission'] ?? [];
  const declaredNames = declared.map((entry) => entry.$['android:name']);

  return declaredNames.filter((name) =>
    forbiddenPermissions.includes(localPermissionName(name))
  );
}

export const withForbiddenPermissionsGuard: ConfigPlugin<
  readonly string[] | undefined
> = (config, forbiddenPermissions = DEFAULT_FORBIDDEN_PERMISSIONS) => {
  return withAndroidManifest(config, (modConfig) => {
    const found = findForbiddenPermissions(
      modConfig.modResults,
      forbiddenPermissions
    );

    for (const permission of found) {
      WarningAggregator.addWarningAndroid(
        'react-native-getnet-getsmart',
        `Permissão "${permission}" é proibida pelo Portal do Desenvolvedor Getnet e pode bloquear o upload do app. Remova-a do AndroidManifest.`
      );
    }

    return modConfig;
  });
};
