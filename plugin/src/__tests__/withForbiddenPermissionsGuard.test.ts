import { describe, expect, it } from '@jest/globals';
import type { AndroidManifest } from '@expo/config-plugins/build/android/Manifest';
import {
  DEFAULT_FORBIDDEN_PERMISSIONS,
  findForbiddenPermissions,
} from '../withForbiddenPermissionsGuard';

function createManifestFixture(permissionNames: string[]): AndroidManifest {
  return {
    manifest: {
      '$': { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      'queries': [],
      'uses-permission': permissionNames.map((name) => ({
        $: { 'android:name': name },
      })),
    },
  };
}

describe('findForbiddenPermissions', () => {
  it('flags a fully-qualified android.permission.* entry by its local name', () => {
    const manifest = createManifestFixture([
      'android.permission.INTERNET',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ]);

    expect(findForbiddenPermissions(manifest)).toEqual([
      'android.permission.SYSTEM_ALERT_WINDOW',
    ]);
  });

  it('flags a bare (unprefixed) forbidden permission name', () => {
    const manifest = createManifestFixture(['WAKE_LOCK']);

    expect(findForbiddenPermissions(manifest)).toEqual(['WAKE_LOCK']);
  });

  it('flags a forbidden permission from a non-android.permission namespace by local name (e.g. launcher shortcuts)', () => {
    const manifest = createManifestFixture([
      'com.android.launcher.permission.INSTALL_SHORTCUT',
    ]);

    expect(findForbiddenPermissions(manifest)).toEqual([
      'com.android.launcher.permission.INSTALL_SHORTCUT',
    ]);
  });

  it('returns an empty list when no forbidden permission is declared', () => {
    const manifest = createManifestFixture(['android.permission.INTERNET']);

    expect(findForbiddenPermissions(manifest)).toEqual([]);
  });

  it('accepts a custom forbidden list', () => {
    const manifest = createManifestFixture(['android.permission.CAMERA']);

    expect(findForbiddenPermissions(manifest, ['CAMERA'])).toEqual([
      'android.permission.CAMERA',
    ]);
  });

  it('the default list matches the official Getnet portal table (spot checks)', () => {
    expect(DEFAULT_FORBIDDEN_PERMISSIONS).toEqual(
      expect.arrayContaining([
        'SYSTEM_ALERT_WINDOW',
        'QUERY_ALL_PACKAGES',
        'WRITE_SECURE_SETTINGS',
        'INSTALL_SHORTCUT',
      ])
    );
  });
});
