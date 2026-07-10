import { describe, expect, it } from '@jest/globals';
import type { AndroidManifest } from '@expo/config-plugins/build/android/Manifest';
import {
  POSDIGITAL_PERMISSION,
  POSDIGITAL_SERVICE_PACKAGE,
  setPosDigitalManifestEntries,
} from '../withAndroidManifest';

function createManifestFixture(): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  };
}

describe('setPosDigitalManifestEntries', () => {
  it('adds the PosDigital service <queries> package', () => {
    const manifest = setPosDigitalManifestEntries(createManifestFixture());

    expect(manifest.manifest.queries).toEqual([
      { package: [{ $: { 'android:name': POSDIGITAL_SERVICE_PACKAGE } }] },
    ]);
  });

  it('adds the PosDigital <uses-permission>', () => {
    const manifest = setPosDigitalManifestEntries(createManifestFixture());

    expect(manifest.manifest['uses-permission']).toEqual([
      { $: { 'android:name': POSDIGITAL_PERMISSION } },
    ]);
  });

  it('is idempotent when applied twice (no duplicate query/permission)', () => {
    const once = setPosDigitalManifestEntries(createManifestFixture());
    const twice = setPosDigitalManifestEntries(once);

    expect(twice.manifest.queries).toHaveLength(1);
    expect(twice.manifest['uses-permission']).toHaveLength(1);
  });

  it('does not add opt-in meta-data by default', () => {
    const manifest = setPosDigitalManifestEntries(createManifestFixture());
    const [mainApplication] = manifest.manifest.application ?? [];

    expect(mainApplication?.['meta-data']).toBeUndefined();
  });

  it('reflects enabled opt-in props as meta-data on the MainApplication, using the literal names/value expected by the Getnet Payment app', () => {
    const manifest = setPosDigitalManifestEntries(createManifestFixture(), {
      priority_pay: true,
      allow_print_permission: true,
      kiosk_mode: true,
    });
    const [mainApplication] = manifest.manifest.application ?? [];
    const metaData = mainApplication?.['meta-data'] ?? [];
    const metaDataNames = metaData.map((item) => item.$['android:name']);

    // Nomes exatos exigidos pela doc oficial (vault Docs SDK/02) — sem
    // prefixo de pacote, minúsculos.
    expect(metaDataNames).toEqual(
      expect.arrayContaining([
        'priority_pay',
        'allow_print_permission',
        'kiosk_mode',
      ])
    );
    for (const item of metaData) {
      expect(item.$['android:value']).toBe('1');
    }
  });

  it('omits a meta-data entry for a prop left disabled', () => {
    const manifest = setPosDigitalManifestEntries(createManifestFixture(), {
      priority_pay: true,
    });
    const [mainApplication] = manifest.manifest.application ?? [];
    const metaDataNames = (mainApplication?.['meta-data'] ?? []).map(
      (item) => item.$['android:name']
    );

    expect(metaDataNames).not.toContain('kiosk_mode');
  });
});
