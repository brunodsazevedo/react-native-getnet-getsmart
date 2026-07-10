import { describe, expect, it } from '@jest/globals';
import type { ExpoConfig } from '@expo/config-types';
import type { ExportedConfig } from '@expo/config-plugins';
import { withAarResolution } from '../withAarResolution';
import { withGetnetAndroidManifest } from '../withAndroidManifest';
import { withForbiddenPermissionsGuard } from '../withForbiddenPermissionsGuard';
import { withSigningV1V2 } from '../withSigningV1V2';
import withGetnetGetsmart from '../withGetnetGetsmart';

function createExpoConfigFixture(): ExpoConfig {
  return { name: 'GetSmart Example', slug: 'getsmart-example' };
}

describe('plugin wrappers registration (smoke)', () => {
  it('withGetnetAndroidManifest registers an android manifest mod without throwing', () => {
    const config = withGetnetAndroidManifest(
      createExpoConfigFixture(),
      {}
    ) as ExportedConfig;

    expect(config.mods?.android?.manifest).toBeDefined();
  });

  it('withAarResolution registers a dangerous mod and an app build.gradle mod', () => {
    const config = withAarResolution(
      createExpoConfigFixture(),
      {}
    ) as ExportedConfig;

    expect(config.mods?.android?.dangerous).toBeDefined();
    expect(config.mods?.android?.appBuildGradle).toBeDefined();
  });

  it('withSigningV1V2 registers an app build.gradle mod', () => {
    const config = withSigningV1V2(createExpoConfigFixture()) as ExportedConfig;

    expect(config.mods?.android?.appBuildGradle).toBeDefined();
  });

  it('withForbiddenPermissionsGuard registers an android manifest mod', () => {
    const config = withForbiddenPermissionsGuard(
      createExpoConfigFixture(),
      undefined
    ) as ExportedConfig;

    expect(config.mods?.android?.manifest).toBeDefined();
  });

  it('the composed withGetnetGetsmart plugin registers every underlying mod', () => {
    const config = withGetnetGetsmart(createExpoConfigFixture(), {
      posDigitalAarPath: './getnet/libposdigital.aar',
    }) as ExportedConfig;

    expect(config.mods?.android?.manifest).toBeDefined();
    expect(config.mods?.android?.dangerous).toBeDefined();
    expect(config.mods?.android?.appBuildGradle).toBeDefined();
  });
});
